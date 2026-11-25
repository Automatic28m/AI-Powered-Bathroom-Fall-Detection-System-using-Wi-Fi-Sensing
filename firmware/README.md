# firmware

ESP32-S3 firmware for the CSI link in the bathroom, plus host tools to check it.

| Folder | What it is |
|---|---|
| `csi_tx/` | Transmitter. Soft AP that sends a unicast UDP ping to the receiver at 100 Hz. |
| `csi_rx/` | Receiver. Joins the paired transmitter, collects CSI from each ping, streams binary frames over serial (921600 baud) to the gateway. |
| `tools/` | Python tools on the host: `csi_check.py` measures the link, `csi_live.py` shows the CSI live. |

Owner: ศักดา. Started from the pre-project's `exp7` sketches.

## How the link works, and why

- **Unicast, PHY rate pinned to MCS0.** Broadcast frames go out at the 1 Mbps DSSS basic rate, which has no OFDM long training field, so the receiver gets no CSI at all. Unicast to an associated station at MCS0 is always OFDM/HT.
- **The CSI callback only queues.** It runs in the Wi-Fi driver task. Anything that blocks there (printing to serial) makes the driver drop the next frames.
- **Binary serial frames.** ASCII CSI tops out below 100 Hz at 921600 baud; binary has more than 5x headroom.
- **Only the paired transmitter's frames are kept**, and promiscuous mode is off, so neighbours' Wi-Fi never ends up in the data.
- **L-LTF only:** 64 subcarriers, 128 bytes per frame, as in DapFall.

## Pairing

Each transmitter names its AP `CSI_TX_<last 3 bytes of its MAC>`. On first boot the receiver scans, joins the strongest `CSI_TX_*` AP, and saves its SSID, BSSID and channel in flash. From then on it only joins that BSSID, so a receiver can't drift to the transmitter of another bathroom in the same house.

To pair again (new transmitter, or the wrong one was picked): power both boards with only the right transmitter nearby, then send `PAIR` followed by a newline to the receiver's serial port. It forgets the old pairing, restarts and pairs again.

## Serial output of the receiver

Binary frames (version 2) and text lines starting with `#`. The frame layout is at the top of `csi_rx/csi_rx.ino`. The fields that matter most:

| Field | Use |
|---|---|
| `rx_seq` | 802.11 sequence number, +1 per ping. Gaps are frames lost over the air. Same number twice is a retransmission. |
| `uart_seq` | Receiver's own counter. Gaps are frames lost in its queue or on the serial line. |
| `flags` bit 0 | `first_word_invalid`: the first 4 CSI bytes can't be used (hardware limitation). |
| `t_us`, `rssi`, `channel` | Receiver time at the callback, signal strength, Wi-Fi channel. |

Every 10 s the receiver prints `#INFO,...,rx_mac=...,tx_ssid=...,tx_bssid=...,ch=...`. The gateway reads `rx_mac` from it for the UDP header (`docs/Design.md` §6.1). Once a second it prints `#STAT,uptime_s,cb/s,kept/s,sent/s,qdrop/s,rssi`.

The transmitter prints `STAT,uptime_s,sent/s,fail/s,sta,rx_ip` once a second and `#INFO` every 10 s, at 115200 baud.

## Build and flash

Arduino core for ESP32 **3.3.x** (ESP-IDF 5.x underneath). Boards: ESP32-S3 with 16 MB flash and octal PSRAM (N16R8 or N16R16).

```bash
arduino-cli compile -b esp32:esp32:esp32s3:FlashSize=16M,PSRAM=opi,PartitionScheme=app3M_fat9M_16MB \
  --build-path build/csi_rx csi_rx
esptool --chip esp32s3 --port COM10 --baud 921600 write-flash -z 0x0 build/csi_rx/csi_rx.ino.merged.bin
```

The Arduino IDE 2 ships `arduino-cli`, and the ESP32 core ships `esptool`.

**If the board won't enter download mode by itself** ("Wrong boot mode detected"): hold BOOT, tap RST, release BOOT, then flash with `--before no-reset`. Without `--before no-reset`, the tool resets the chip out of download mode again.

Flash the transmitter before the receiver. A receiver pairs with whatever `CSI_TX_*` name it sees first, so an old transmitter name would get saved.

## Tools

```bash
cd tools
pip install -e .[dev]
python csi_check.py --rx COM10 --tx COM6 --seconds 30   # --tx none if the Tx runs on a power bank
python csi_live.py --rx COM10
pytest
```

Both open the ports without toggling DTR/RTS, so they don't reset the boards. Only one program can hold a port at a time.

## Measured results

ESP32-S3 Tx and Rx, PCB antennas, channel 6 (busy: two strong neighbour APs), 30 s per test.

| Test | Rate | Air loss | RSSI median | Max gap |
|---|---|---|---|---|
| 1 m (exp7 firmware) | 99.7 Hz | not measurable | -45 dBm | 41 ms |
| 1.7 m (exp7) | 99.4 Hz | not measurable | -44 dBm | 37 ms |
| 2.5 m (exp7) | 99.9 Hz | not measurable | -42 dBm | 28 ms |
| 4 m (exp7) | 99.5 Hz | not measurable | -37 dBm | 36 ms |
| 4 m, person standing between (exp7) | 99.2 Hz | not measurable | -44 dBm | 45 ms |
| 4 m (this firmware) | 99.4 Hz | 0.67 % (20 frames) | -37 dBm | 54 ms |
| 3 m, Tx on power bank, run 1 / 2 | 98.3 / 99.9 Hz | 2.02 % / 0.00 % | -36 / -37 dBm | 45 / 47 ms |
| 3 m, power bank, person between, run 1 / 2 | 98.1 / 100.1 Hz | 2.09 % / 0.00 % | -43 / -44 dBm | 49 / 49 ms |

In every test, no frames were lost on the receiver's queue or serial line, and no frame had a bad checksum.

- **Tx reboot:** the receiver is back to 100 Hz 5.6 s after the transmitter resets, with no one touching it.
- **`PAIR`:** the receiver re-paired and was streaming 9 s after the command.
- **The pre-project's rate problem was a faulty board.** The old ESP32 transmitter read -89 dBm at 1 m and gave 0–20 Hz. Distance was not the cause.

## Open points

- `docs/Design.md` and `docs/CONVENTIONS.md` §2 say ESP-IDF (C) with `menuconfig`. This firmware is Arduino core 3.x on top of ESP-IDF 5.x, carried over from the pre-project. The team needs to decide whether to keep it or port it.
- Pick the Wi-Fi channel on site. Channels 1, 6 and 11 all have strong neighbours where this was tested.
- **Recovery after the Tx loses power is slower than it needs to be.** Measured: Tx unpowered for 12.9 s, Rx back to ≥ 90 Hz 6.9 s after the Tx got power again (17.1 s with no data in total). The receiver retries the join only every `RECONNECT_RETRY_S` (10 s), so the worst case is about 10 s longer. It also only notices the link is up at its once-a-second check, after DHCP. Possible fixes, not done yet: retry every 3 s, and send HELLO on the `GOT_IP` event instead of polling.
