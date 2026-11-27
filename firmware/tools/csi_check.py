"""Measures the CSI link for a fixed time and prints a report.

Read-only: listens to the receiver (and optionally the transmitter) without
resetting either board.

    python csi_check.py --rx COM10 --tx COM6 --seconds 30
    python csi_check.py --rx COM10 --tx none          # Tx on a power bank
"""

from __future__ import annotations

import argparse
import itertools
import statistics
import threading
import time

from csi_serial import FrameReader, LinkStats, open_quiet

RX_BAUD = 921600
TX_BAUD = 115200


def read_tx(port: str, seconds: float, out: list[str]) -> None:
    s = open_quiet(port, TX_BAUD)
    buf = b""
    end = time.time() + seconds
    while time.time() < end:
        buf += s.read(4096)
        while b"\n" in buf:
            line, buf = buf.split(b"\n", 1)
            out.append(line.decode("utf-8", "replace").strip())
    s.close()


def read_rx(port: str, seconds: float, frames: list, lines: list[str], reader: FrameReader) -> None:
    s = open_quiet(port, RX_BAUD)
    end = time.time() + seconds
    while time.time() < end:
        got, text = reader.feed(s.read(8192))
        frames.extend(got)
        lines.extend(text)
    s.close()


def pct(values: list[float], p: float) -> float:
    return sorted(values)[min(len(values) - 1, int(len(values) * p))]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("--rx", default="COM10")
    ap.add_argument("--tx", default="none", help="Tx port, or 'none'")
    ap.add_argument("--seconds", type=float, default=30)
    args = ap.parse_args()

    reader = FrameReader()
    frames: list = []
    rx_lines: list[str] = []
    tx_lines: list[str] = []
    threads = [
        threading.Thread(target=read_rx, args=(args.rx, args.seconds, frames, rx_lines, reader))
    ]
    if args.tx.lower() != "none":
        threads.append(threading.Thread(target=read_tx, args=(args.tx, args.seconds, tx_lines)))
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    if tx_lines:
        stat = [ln.split(",") for ln in tx_lines if ln.startswith("STAT,")]
        if stat:
            sent = [int(r[2]) for r in stat]
            fail = [int(r[3]) for r in stat]
            print(
                f"TX  {args.tx}: sent/s mean {statistics.mean(sent):.1f}  "
                f"fail/s mean {statistics.mean(fail):.1f}  ({len(stat)} s)"
            )
        for ln in tx_lines:
            if ln.startswith("#"):
                print(f"    {ln}")

    print(f"RX  {args.rx}: text lines other than #STAT:")
    for ln in rx_lines:
        if not ln.startswith("#STAT"):
            print(f"    {ln}")

    if len(frames) < 3:
        print(f"RX  frames: {len(frames)}  (not enough to report)")
        return

    stats = LinkStats()
    kept = [f for f in frames if stats.add(f)]
    span_s = (frames[-1].t_us - frames[0].t_us) / 1e6
    gaps_ms = [(b.t_us - a.t_us) / 1000 for a, b in itertools.pairwise(kept)]
    rssi = [f.rssi for f in kept]
    lens: dict[int, int] = {}
    for f in kept:
        lens[len(f.csi)] = lens.get(len(f.csi), 0) + 1

    print(
        f"RX  frames {len(frames)} over {span_s:.2f} s -> {len(kept) / span_s:.1f} Hz unique "
        f"({len(frames) / span_s:.1f} Hz incl. retries)"
    )
    print(
        f"    air loss {stats.air_lost} ({stats.air_loss_pct:.2f} %)   "
        f"retries/duplicates {stats.duplicates}   uart loss {stats.uart_lost}   "
        f"checksum errors {reader.checksum_errors}"
    )
    print(
        f"    gap ms: median {statistics.median(gaps_ms):.2f}  p95 {pct(gaps_ms, 0.95):.2f}  "
        f"p99 {pct(gaps_ms, 0.99):.2f}  max {max(gaps_ms):.2f}   "
        f">20 ms {sum(g > 20 for g in gaps_ms)}  >50 ms {sum(g > 50 for g in gaps_ms)}  "
        f">100 ms {sum(g > 100 for g in gaps_ms)}"
    )
    print(
        f"    rssi dBm: min {min(rssi)}  median {statistics.median(rssi):.0f}  max {max(rssi)}   "
        f"csi len {lens}   first_word_invalid {stats.first_word_invalid}   "
        f"channel {sorted({f.channel for f in kept})}"
    )
    rx_seqs = [f.rx_seq for f in frames[:12]]
    print(f"    first rx_seq values: {rx_seqs}")

    t0 = kept[0].t_us
    per_s: dict[int, list[int]] = {}
    for f in kept:
        per_s.setdefault(int((f.t_us - t0) / 1e6), []).append(f.rssi)
    print(
        "    per second (frames/mean rssi): "
        + "  ".join(f"{k}:{len(v)}/{statistics.mean(v):.0f}" for k, v in sorted(per_s.items()))
    )


if __name__ == "__main__":
    main()
