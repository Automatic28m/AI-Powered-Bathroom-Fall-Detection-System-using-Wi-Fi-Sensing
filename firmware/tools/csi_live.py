"""Live CSI viewer for the csi_rx firmware.

    python csi_live.py [--rx COM10] [--window 10]

Panels
  1. Amplitude waterfall: subcarrier (-32..31) x time; frames lost show as gaps
  2. Motion: mean amplitude across subcarriers and its 1 s rolling std
  3. Spectrum: amplitude per subcarrier, latest frame and 1 s mean
  4. Link: unique frames per second and RSSI, last 60 s

The port is opened without toggling DTR/RTS, so the board is not reset.
Close the window or press q to quit.
"""

from __future__ import annotations

import argparse
import collections
import threading

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation

from csi_serial import FrameReader, LinkStats, open_quiet

RX_BAUD = 921600
RATE_HZ = 100
N_SC = 64
# L-LTF subcarriers arrive as 0..31 then -32..-1; show them as -32..31
SC_ORDER = np.r_[32:64, 0:32]
SC_LABELS = np.arange(-32, 32)
# Guard bands and DC carry no signal; leave them out of scaling and the motion trace
DATA_SC = np.r_[6:32, 33:59]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("--rx", default="COM10")
    ap.add_argument("--window", type=float, default=10.0, help="seconds shown")
    args = ap.parse_args()
    window_s = args.window

    lock = threading.Lock()
    frames: collections.deque = collections.deque(maxlen=int(60 * RATE_HZ * 1.2))
    reader = FrameReader()
    stats = LinkStats()
    running = True

    def read_loop() -> None:
        s = open_quiet(args.rx, RX_BAUD)
        while running:
            got, _ = reader.feed(s.read(8192))
            for f in got:
                with lock:
                    if not stats.add(f) or len(f.csi) < 2 * N_SC:
                        continue
                iq = np.frombuffer(f.csi[: 2 * N_SC], dtype=np.int8).astype(np.float32)
                amp = np.hypot(iq[0::2], iq[1::2])  # (imag, real) order doesn't matter here
                if f.first_word_invalid:
                    amp[:2] = 0.0
                with lock:
                    frames.append((f.t_us / 1e6, f.rssi, amp[SC_ORDER]))
        s.close()

    threading.Thread(target=read_loop, daemon=True).start()

    plt.rcParams["toolbar"] = "None"
    fig = plt.figure(figsize=(13, 8))
    fig.canvas.manager.set_window_title(f"CSI live - {args.rx}")
    gs = fig.add_gridspec(
        3, 2, height_ratios=[2.2, 1, 1], width_ratios=[3, 1], hspace=0.45, wspace=0.18
    )
    ax_wf = fig.add_subplot(gs[0, :])
    ax_mo = fig.add_subplot(gs[1, 0])
    ax_sp = fig.add_subplot(gs[1, 1])
    ax_lk = fig.add_subplot(gs[2, :])

    img = ax_wf.imshow(
        np.zeros((N_SC, 10)),
        aspect="auto",
        origin="lower",
        cmap="viridis",
        extent=[-window_s, 0, -32.5, 31.5],
        interpolation="nearest",
    )
    ax_wf.set_title("Amplitude waterfall")
    ax_wf.set_ylabel("subcarrier")
    ax_wf.set_xlabel("seconds ago")
    fig.colorbar(img, ax=ax_wf, pad=0.01, label="|H|")

    (ln_mean,) = ax_mo.plot([], [], lw=1)
    ax_mo_r = ax_mo.twinx()
    (ln_std,) = ax_mo_r.plot([], [], lw=1.2, color="tab:red")
    ax_mo.set_title("Motion (red: 1 s std)")
    ax_mo.set_xlim(-window_s, 0)
    ax_mo.set_xlabel("seconds ago")
    ax_mo.set_ylabel("mean |H|")
    ax_mo_r.set_ylabel("std", color="tab:red")

    (ln_sp_now,) = ax_sp.plot(SC_LABELS, np.zeros(N_SC), lw=0.8, color="0.6", label="latest")
    (ln_sp_avg,) = ax_sp.plot(SC_LABELS, np.zeros(N_SC), lw=1.5, label="1 s mean")
    ax_sp.set_title("Spectrum")
    ax_sp.set_xlabel("subcarrier")
    ax_sp.legend(fontsize=7, loc="upper right")

    (ln_rate,) = ax_lk.plot([], [], lw=1.5, marker=".")
    ax_lk_r = ax_lk.twinx()
    (ln_rssi,) = ax_lk_r.plot([], [], lw=1.2, color="tab:orange", marker=".")
    ax_lk.set_title("Link (blue: frames/s, orange: RSSI)")
    ax_lk.set_xlim(-60, 0)
    ax_lk.set_ylim(0, 120)
    ax_lk.axhline(RATE_HZ, color="0.8", lw=0.8, ls="--")
    ax_lk.set_xlabel("seconds ago")
    ax_lk.set_ylabel("frames/s")
    ax_lk_r.set_ylim(-100, -20)
    ax_lk_r.set_ylabel("RSSI dBm", color="tab:orange")

    title = fig.suptitle("waiting for data...", fontsize=11, family="monospace")

    def update(_: int) -> None:
        with lock:
            data = list(frames)
            air_lost, air_pct, dup = stats.air_lost, stats.air_loss_pct, stats.duplicates
            uart_lost = stats.uart_lost
        if not data:
            return
        t = np.array([d[0] for d in data])
        rssi = np.array([d[1] for d in data])
        amp = np.stack([d[2] for d in data])
        t_all = t - t[-1]

        win = t_all >= -window_s
        t_w, amp_w = t_all[win], amp[win]
        n_cols = int(window_s * RATE_HZ)
        grid = np.full((N_SC, n_cols), np.nan, dtype=np.float32)
        cols = np.clip(((t_w + window_s) / window_s * (n_cols - 1)).astype(int), 0, n_cols - 1)
        grid[:, cols] = amp_w.T
        img.set_data(grid)
        img.set_clim(*np.percentile(amp_w[:, DATA_SC], [2, 98]))

        mean_amp = amp_w[:, DATA_SC].mean(axis=1)
        ln_mean.set_data(t_w, mean_amp)
        ax_mo.set_ylim(mean_amp.min() - 1, mean_amp.max() + 1)
        motion = 0.0
        if len(mean_amp) > RATE_HZ:
            std = np.array(
                [mean_amp[max(0, i - RATE_HZ) : i + 1].std() for i in range(len(mean_amp))]
            )
            ln_std.set_data(t_w, std)
            ax_mo_r.set_ylim(0, max(1.0, std.max() * 1.2))
            motion = std[-1]

        ln_sp_now.set_ydata(amp_w[-1])
        ln_sp_avg.set_ydata(amp_w[t_w >= -1].mean(axis=0))
        ax_sp.set_ylim(0, max(10, amp_w[-RATE_HZ:].max() * 1.1))

        recent = t_all > -61
        secs = np.floor(t_all[recent]).astype(int)
        uniq, counts = np.unique(secs, return_counts=True)
        full = uniq < 0  # the current second is still filling
        rate_now = 0
        if full.any():
            r_sec = [rssi[recent][secs == u].mean() for u in uniq[full]]
            ln_rate.set_data(uniq[full] + 0.5, counts[full])
            ln_rssi.set_data(uniq[full] + 0.5, r_sec)
            rate_now = counts[full][-1]

        gap_ms = np.diff(t_w).max() * 1000 if len(t_w) > 1 else 0.0
        title.set_text(
            f"{args.rx}  {rate_now:3d} Hz  RSSI {rssi[-1]:4d} dBm  motion {motion:5.2f}  "
            f"max gap {gap_ms:5.1f} ms | air loss {air_lost} ({air_pct:.2f}%)  "
            f"retries {dup}  uart loss {uart_lost}  ck_err {reader.checksum_errors}"
        )

    def on_key(ev) -> None:
        if ev.key == "q":
            plt.close(fig)

    fig.canvas.mpl_connect("key_press_event", on_key)
    anim = FuncAnimation(fig, update, interval=100, cache_frame_data=False)  # noqa: F841
    plt.show()
    running = False  # stops read_loop


if __name__ == "__main__":
    main()
