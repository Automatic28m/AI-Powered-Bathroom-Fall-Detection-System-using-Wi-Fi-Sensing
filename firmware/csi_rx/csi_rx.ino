/*
 * csi_rx.ino - CSI receiver (ESP32-S3, Arduino core 3.x)
 *
 * Joins the paired transmitter's soft AP, collects CSI from its unicast pings
 * and streams binary frames over serial to the gateway.
 *
 * Rules kept from the pre-project (see firmware/README.md for why):
 *   - The CSI callback runs in the Wi-Fi driver task: it only copies into a
 *     queue and never blocks. loop() writes to serial.
 *   - Binary output, not ASCII, so 921600 baud has plenty of headroom.
 *   - Only frames from the paired transmitter are kept; promiscuous is off.
 *   - L-LTF only (64 subcarriers, 128 bytes), as DapFall uses.
 *
 * Changes from the pre-project exp7 sketch:
 *   - Frame format v2 carries the 802.11 sequence number of the received
 *     frame (rx_seq), so the host can count frames lost over the air. The old
 *     counter only showed loss between the queue and the UART.
 *   - Pairing: on first boot the receiver joins the strongest CSI_TX_* access
 *     point and stores its SSID, BSSID and channel in flash. After that it
 *     only joins that BSSID, so it can't drift to another bathroom's
 *     transmitter. Send "PAIR" over serial to forget it and pair again.
 *   - A '#INFO' line every INFO_EVERY_S seconds with this board's MAC, which
 *     the gateway puts in the UDP header (Design.md 6.1), and the paired Tx.
 *
 * Serial frame v2 (little-endian):
 *    0    0xA5          sync 1
 *    1    0x5A          sync 2
 *    2    version       uint8, = 2
 *    3    flags         bit0 first_word_invalid (first 4 CSI bytes unusable)
 *                       bit1 retry (802.11 retransmission of an earlier frame)
 *    4-5  uart_seq      uint16, +1 per frame written; gaps = queue/UART loss
 *    6-7  rx_seq        uint16, 802.11 sequence number; gaps = air loss
 *    8-11 t_us          uint32, micros() on the receiver at the callback
 *    12   rssi          int8, dBm
 *    13   channel       uint8
 *    14-15 len          uint16, CSI bytes that follow
 *    16   checksum      XOR of bytes 2..15 and the payload
 *    17+  payload       int8 x len, (imag, real) per subcarrier
 * Every other output line starts with '#'.
 */

#include <Preferences.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <esp_wifi.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <string.h>
#include <atomic>

// ------------------------------------------------------------------ config
#define SSID_PREFIX         "CSI_TX_"
#define WIFI_PASS           "12345678"
#define SERIAL_BAUD         921600
#define HELLO_PORT          4445
#define HELLO_EVERY_MS      2000
#define INFO_EVERY_S        10

#define NO_CSI_RECONNECT_S  5    // connected but no CSI from the Tx for this long -> rejoin
#define RECONNECT_RETRY_S   10   // still not connected after this long -> try again
#define PAIR_RETRY_MS       5000

#define CSI_MAX_LEN         384
#define QUEUE_DEPTH         32

#define FRAME_VERSION       2
#define SYNC1               0xA5
#define SYNC2               0x5A
#define HDR_LEN             17
#define FLAG_FIRST_WORD_INVALID 0x01
#define FLAG_RETRY              0x02

typedef struct {
  uint16_t rx_seq;
  uint32_t t_us;
  int8_t   rssi;
  uint8_t  channel;
  uint8_t  flags;
  uint16_t len;
  int8_t   buf[CSI_MAX_LEN];
} csi_item_t;

typedef struct {
  char    ssid[33];
  uint8_t bssid[6];
  uint8_t channel;
  bool    valid;
} pairing_t;

static QueueHandle_t csi_q = NULL;
static WiFiUDP       udp_hello;
static Preferences   prefs;
static pairing_t     pair_cfg;
static uint8_t       rx_mac[6];

// Shared with the callback, which runs in the Wi-Fi driver task
static std::atomic<bool>     filter_ready{false};
static uint8_t               filter_bssid[6];
static std::atomic<uint32_t> cb_total{0}, cb_kept{0}, q_drops{0};

static uint16_t uart_seq = 0;
static uint32_t sent_frames = 0, t_stat_ms = 0, t_hello_ms = 0, uptime_s = 0;
static bool     linked = false;
static uint32_t no_csi_s = 0, t_reconnect_ms = 0;
static char     cmd_buf[16];
static uint8_t  cmd_len = 0;

// ------------------------------------------------------------------ callback
// Runs in the Wi-Fi driver task: no Serial, nothing that blocks.
static void csi_cb(void *ctx, wifi_csi_info_t *info) {
  if (!info || !csi_q) return;
  cb_total++;
  if (!filter_ready || memcmp(info->mac, filter_bssid, 6) != 0) return;

  csi_item_t it;
  it.rx_seq  = info->rx_seq;
  it.t_us    = micros();
  it.rssi    = info->rx_ctrl.rssi;
  it.channel = info->rx_ctrl.channel;
  it.flags   = info->first_word_invalid ? FLAG_FIRST_WORD_INVALID : 0;
  // 802.11 frame control byte 1, bit 3 = retry
  if (info->hdr && (info->hdr[1] & 0x08)) it.flags |= FLAG_RETRY;
  it.len = (info->len > CSI_MAX_LEN) ? CSI_MAX_LEN : info->len;
  memcpy(it.buf, info->buf, it.len);

  if (xQueueSend(csi_q, &it, 0) == pdTRUE) cb_kept++;
  else q_drops++;   // never block the driver task
}

// ------------------------------------------------------------------ pairing
static void load_pairing() {
  memset(&pair_cfg, 0, sizeof(pair_cfg));
  prefs.begin("csi_rx", true);
  if (prefs.isKey("bssid") && prefs.getBytes("bssid", pair_cfg.bssid, 6) == 6) {
    prefs.getString("ssid", pair_cfg.ssid, sizeof(pair_cfg.ssid));
    pair_cfg.channel = prefs.getUChar("ch", 0);
    pair_cfg.valid   = pair_cfg.ssid[0] != 0;
  }
  prefs.end();
}

static void save_pairing() {
  prefs.begin("csi_rx", false);
  prefs.putString("ssid", pair_cfg.ssid);
  prefs.putBytes("bssid", pair_cfg.bssid, 6);
  prefs.putUChar("ch", pair_cfg.channel);
  prefs.end();
}

static void forget_pairing() {
  prefs.begin("csi_rx", false);
  prefs.clear();
  prefs.end();
}

// Joins the strongest CSI_TX_* access point in range. Blocks until one is found.
static void pair_with_strongest() {
  while (true) {
    Serial.println("# pairing: scanning for " SSID_PREFIX "*");
    int n = WiFi.scanNetworks(false, false, false, 300);
    int best = -1;
    for (int i = 0; i < n; i++) {
      if (WiFi.SSID(i).startsWith(SSID_PREFIX) && (best < 0 || WiFi.RSSI(i) > WiFi.RSSI(best))) {
        best = i;
      }
    }
    if (best >= 0) {
      strncpy(pair_cfg.ssid, WiFi.SSID(best).c_str(), sizeof(pair_cfg.ssid) - 1);
      memcpy(pair_cfg.bssid, WiFi.BSSID(best), 6);
      pair_cfg.channel = WiFi.channel(best);
      pair_cfg.valid   = true;
      Serial.printf("# pairing: chose %s (%d dBm, ch %d) out of %d network(s)\n",
                    pair_cfg.ssid, (int)WiFi.RSSI(best), pair_cfg.channel, n);
      WiFi.scanDelete();
      save_pairing();
      return;
    }
    WiFi.scanDelete();
    Serial.println("# pairing: none found, retrying");
    delay(PAIR_RETRY_MS);
  }
}

// ------------------------------------------------------------------ wifi link
static void begin_join() {
  WiFi.begin(pair_cfg.ssid, WIFI_PASS, pair_cfg.channel, pair_cfg.bssid);
  t_reconnect_ms = millis();
}

// Called every time the link comes up, at boot and after a rejoin
static void on_connected() {
  memcpy(filter_bssid, WiFi.BSSID(), 6);
  filter_ready = true;
  linked       = true;
  no_csi_s     = 0;
  Serial.printf("# connected ip=%s tx_bssid=%02x:%02x:%02x:%02x:%02x:%02x\n",
                WiFi.localIP().toString().c_str(),
                filter_bssid[0], filter_bssid[1], filter_bssid[2],
                filter_bssid[3], filter_bssid[4], filter_bssid[5]);

  udp_hello.stop();                        // fresh socket after a rejoin
  udp_hello.begin(HELLO_PORT);
  t_hello_ms = millis() - HELLO_EVERY_MS;  // send HELLO on the next loop
}

static void start_reconnect(const char *why) {
  Serial.printf("# %s -> reconnecting\n", why);
  linked = false;
  WiFi.disconnect();
  delay(100);
  begin_join();
}

static void print_info() {
  Serial.printf("#INFO,fw=csi_rx,frame_ver=%d,rx_mac=%02x:%02x:%02x:%02x:%02x:%02x,"
                "tx_ssid=%s,tx_bssid=%02x:%02x:%02x:%02x:%02x:%02x,ch=%d\n",
                FRAME_VERSION, rx_mac[0], rx_mac[1], rx_mac[2], rx_mac[3], rx_mac[4], rx_mac[5],
                pair_cfg.ssid, pair_cfg.bssid[0], pair_cfg.bssid[1], pair_cfg.bssid[2],
                pair_cfg.bssid[3], pair_cfg.bssid[4], pair_cfg.bssid[5], pair_cfg.channel);
}

// "PAIR" on serial: forget the paired Tx and restart into pairing
static void poll_serial_commands() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\r') continue;
    if (c != '\n') {
      if (cmd_len < sizeof(cmd_buf) - 1) cmd_buf[cmd_len++] = c;
      continue;
    }
    cmd_buf[cmd_len] = 0;
    cmd_len = 0;
    if (strcmp(cmd_buf, "PAIR") == 0) {
      Serial.println("# PAIR: forgetting the paired transmitter, restarting");
      Serial.flush();
      forget_pairing();
      ESP.restart();
    }
  }
}

static void write_frame(const csi_item_t &it) {
  uint8_t hdr[HDR_LEN];
  hdr[0]  = SYNC1;
  hdr[1]  = SYNC2;
  hdr[2]  = FRAME_VERSION;
  hdr[3]  = it.flags;
  hdr[4]  = uart_seq & 0xFF;
  hdr[5]  = (uart_seq >> 8) & 0xFF;
  hdr[6]  = it.rx_seq & 0xFF;
  hdr[7]  = (it.rx_seq >> 8) & 0xFF;
  hdr[8]  = it.t_us & 0xFF;
  hdr[9]  = (it.t_us >> 8) & 0xFF;
  hdr[10] = (it.t_us >> 16) & 0xFF;
  hdr[11] = (it.t_us >> 24) & 0xFF;
  hdr[12] = (uint8_t)it.rssi;
  hdr[13] = it.channel;
  hdr[14] = it.len & 0xFF;
  hdr[15] = (it.len >> 8) & 0xFF;

  uint8_t ck = 0;
  for (int i = 2; i < HDR_LEN - 1; i++) ck ^= hdr[i];
  for (uint16_t i = 0; i < it.len; i++) ck ^= (uint8_t)it.buf[i];
  hdr[16] = ck;

  Serial.write(hdr, HDR_LEN);
  Serial.write((const uint8_t *)it.buf, it.len);
  uart_seq++;
  sent_frames++;
}

// ------------------------------------------------------------------ setup
void setup() {
  Serial.setTxBufferSize(4096);   // must come before begin()
  Serial.begin(SERIAL_BAUD);
  delay(300);
  Serial.println();
  Serial.println("# csi_rx");

  csi_q = xQueueCreate(QUEUE_DEPTH, sizeof(csi_item_t));
  if (!csi_q) {
    Serial.println("# FATAL: queue alloc failed");
    while (1) delay(1000);
  }

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(false);   // loop() handles rejoining
  esp_wifi_get_mac(WIFI_IF_STA, rx_mac);

  load_pairing();
  if (pair_cfg.valid) {
    Serial.printf("# paired with %s\n", pair_cfg.ssid);
  } else {
    pair_with_strongest();
  }
  print_info();

  begin_join();
  Serial.print("# connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
    poll_serial_commands();
    if (millis() - t_reconnect_ms >= RECONNECT_RETRY_S * 1000UL) {   // Tx not up yet
      WiFi.disconnect();
      delay(100);
      begin_join();
    }
  }
  Serial.println();
  on_connected();

  esp_wifi_set_ps(WIFI_PS_NONE);

  wifi_csi_config_t cfg = {};
  cfg.lltf_en           = true;
  cfg.htltf_en          = false;
  cfg.stbc_htltf2_en    = false;
  cfg.ltf_merge_en      = false;
  cfg.channel_filter_en = true;
  cfg.manu_scale        = false;
  cfg.shift             = 0;
  esp_wifi_set_csi_config(&cfg);
  esp_wifi_set_csi_rx_cb(&csi_cb, NULL);
  esp_wifi_set_csi(true);

  Serial.println("# STAT,uptime_s,cb/s,kept/s,sent/s,qdrop/s,rssi");
  Serial.println("# streaming");
  t_stat_ms = t_hello_ms = millis();
}

// ------------------------------------------------------------------ loop
void loop() {
  poll_serial_commands();

  uint32_t now = millis();
  if (linked && now - t_hello_ms >= HELLO_EVERY_MS) {
    t_hello_ms = now;
    if (udp_hello.beginPacket(WiFi.gatewayIP(), HELLO_PORT)) {
      udp_hello.write((const uint8_t *)"HELLO", 5);
      udp_hello.endPacket();
    }
  }

  csi_item_t it;
  while (xQueueReceive(csi_q, &it, 0) == pdTRUE) write_frame(it);

  if (now - t_stat_ms >= 1000) {
    t_stat_ms += 1000;
    uptime_s++;
    uint32_t a = cb_total.exchange(0);
    uint32_t k = cb_kept.exchange(0);
    uint32_t d = q_drops.exchange(0);
    uint32_t s = sent_frames; sent_frames = 0;
    Serial.printf("#STAT,%lu,%lu,%lu,%lu,%lu,%d\n",
                  (unsigned long)uptime_s, (unsigned long)a, (unsigned long)k,
                  (unsigned long)s, (unsigned long)d, (int)WiFi.RSSI());
    if (uptime_s % INFO_EVERY_S == 0) print_info();

    // Dropped -> rejoin. Connected but silent too long -> rejoin, because a
    // rebooted Tx no longer knows our IP until it sees a HELLO.
    if (WiFi.status() == WL_CONNECTED) {
      if (!linked) on_connected();
      else if (k > 0) no_csi_s = 0;
      else if (++no_csi_s >= NO_CSI_RECONNECT_S) start_reconnect("no csi from tx");
    } else if (linked) {
      start_reconnect("wifi lost");
    } else if (millis() - t_reconnect_ms >= RECONNECT_RETRY_S * 1000UL) {
      start_reconnect("still not connected");
    }
  }
}
