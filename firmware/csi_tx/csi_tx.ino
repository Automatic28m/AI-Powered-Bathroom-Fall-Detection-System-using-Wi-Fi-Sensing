/*
 * csi_tx.ino - CSI transmitter (ESP32 / ESP32-S3, Arduino core 3.x)
 *
 * Runs a soft AP and sends a small unicast UDP packet to the paired receiver
 * at TARGET_HZ. The receiver measures CSI on each of those frames.
 *
 * Why unicast with a forced PHY rate: broadcast frames go out at the 1 Mbps
 * DSSS basic rate, which has no OFDM training field, so the receiver gets no
 * CSI at all. Unicast to an associated station, with the rate pinned to MCS0,
 * is always OFDM/HT. (Found in the pre-project, see firmware/README.md.)
 *
 * Changes from the pre-project exp7 sketch:
 *   - The SSID is unique per board: CSI_TX_<last 3 bytes of the AP MAC>.
 *     With one shared SSID, a receiver in one bathroom could join the
 *     transmitter of another bathroom and record the wrong room.
 *   - The receiver's address is forgotten when no station is associated,
 *     so the transmitter stops sending into the void after a receiver drops.
 *   - A '#INFO' line every INFO_EVERY_S seconds with the MAC, SSID and channel.
 *
 * Serial (115200): lines starting with '#' are info; 'STAT,...' once a second.
 */

#include <WiFi.h>
#include <WiFiUdp.h>
#include <esp_wifi.h>

// ------------------------------------------------------------------ config
#define SSID_PREFIX     "CSI_TX_"
#define AP_PASS         "12345678"
#define WIFI_CHANNEL    6
#define PING_PORT       4444
#define HELLO_PORT      4445
#define TARGET_HZ       100
#define SERIAL_BAUD     115200
#define INFO_EVERY_S    10

static const uint32_t PERIOD_US = 1000000UL / TARGET_HZ;

static WiFiUDP udp_ping;
static WiFiUDP udp_hello;

static char      ap_ssid[20];
static uint8_t   ap_mac[6];
static IPAddress rx_addr;
static bool      have_rx = false;

static uint32_t sent_ok = 0, sent_fail = 0, hello_rx = 0;
static uint32_t next_due_us = 0, t_stat_ms = 0, uptime_s = 0;

static void print_info() {
  Serial.printf("#INFO,fw=csi_tx,tx_mac=%02x:%02x:%02x:%02x:%02x:%02x,ssid=%s,ch=%d,hz=%d\n",
                ap_mac[0], ap_mac[1], ap_mac[2], ap_mac[3], ap_mac[4], ap_mac[5],
                ap_ssid, WIFI_CHANNEL, TARGET_HZ);
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(300);
  Serial.println();

  WiFi.mode(WIFI_AP);
  esp_wifi_get_mac(WIFI_IF_AP, ap_mac);
  snprintf(ap_ssid, sizeof(ap_ssid), SSID_PREFIX "%02X%02X%02X", ap_mac[3], ap_mac[4], ap_mac[5]);

  WiFi.softAP(ap_ssid, AP_PASS, WIFI_CHANNEL, 0);
  esp_wifi_set_bandwidth(WIFI_IF_AP, WIFI_BW_HT20);
  esp_wifi_set_ps(WIFI_PS_NONE);

  // Pin the PHY rate to MCS0 so every frame is OFDM/HT and carries an LTF
  esp_err_t r = esp_wifi_config_80211_tx_rate(WIFI_IF_AP, WIFI_PHY_RATE_MCS0_LGI);
  Serial.printf("# force tx rate MCS0_LGI -> %s\n", r == ESP_OK ? "ok" : "FAILED");
  if (r != ESP_OK) Serial.println("# WARNING: rate not forced, CSI may not be generated");

  udp_ping.begin(PING_PORT);
  udp_hello.begin(HELLO_PORT);

  print_info();
  Serial.printf("# ap ip = %s, waiting for HELLO from the receiver\n",
                WiFi.softAPIP().toString().c_str());
  Serial.println("# STAT,uptime_s,sent/s,fail/s,sta,rx_ip");

  t_stat_ms   = millis();
  next_due_us = micros();
}

void loop() {
  // HELLO tells us the receiver's IP, so we can unicast to it
  int sz = udp_hello.parsePacket();
  if (sz > 0) {
    char b[32];
    int n = udp_hello.read(b, sizeof(b) - 1);
    b[n > 0 ? n : 0] = 0;
    IPAddress from = udp_hello.remoteIP();
    if (!have_rx || from != rx_addr) {
      rx_addr = from;
      have_rx = true;
      Serial.printf("# receiver found at %s\n", rx_addr.toString().c_str());
    }
    hello_rx++;
  }

  // Fixed-rate ping; resync instead of bursting if we fall behind
  uint32_t now_us = micros();
  if ((int32_t)(now_us - next_due_us) >= 0) {
    next_due_us += PERIOD_US;
    if ((int32_t)(micros() - next_due_us) > (int32_t)PERIOD_US) {
      next_due_us = micros() + PERIOD_US;
    }
    if (have_rx) {
      if (udp_ping.beginPacket(rx_addr, PING_PORT)) {
        udp_ping.write((const uint8_t *)"CSI_PING", 8);
        if (udp_ping.endPacket()) sent_ok++; else sent_fail++;
      } else {
        sent_fail++;
      }
    }
  }

  uint32_t now_ms = millis();
  if (now_ms - t_stat_ms >= 1000) {
    t_stat_ms += 1000;
    uptime_s++;

    int sta = WiFi.softAPgetStationNum();
    // A receiver that left will rejoin and send HELLO again; until then don't send
    if (sta == 0 && have_rx) {
      have_rx = false;
      Serial.println("# receiver left, waiting for HELLO");
    }

    uint32_t s = sent_ok;   sent_ok   = 0;
    uint32_t f = sent_fail; sent_fail = 0;
    Serial.printf("STAT,%lu,%lu,%lu,%d,%s\n",
                  (unsigned long)uptime_s, (unsigned long)s, (unsigned long)f, sta,
                  have_rx ? rx_addr.toString().c_str() : "none");

    if (uptime_s % INFO_EVERY_S == 0) print_info();
  }

  vTaskDelay(1);
}
