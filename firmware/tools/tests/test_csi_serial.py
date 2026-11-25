import struct

from csi_serial import FLAG_RETRY, HDR_FMT, FrameReader, LinkStats


def make_frame(
    uart_seq: int,
    rx_seq: int,
    csi: bytes = bytes(range(128)),
    flags: int = 0,
    t_us: int = 0,
    rssi: int = -40,
    channel: int = 6,
    bad_checksum: bool = False,
) -> bytes:
    body = struct.pack(HDR_FMT, 2, flags, uart_seq, rx_seq, t_us, rssi, channel, len(csi))
    ck = 0
    for b in body + csi:
        ck ^= b
    if bad_checksum:
        ck ^= 0xFF
    return b"\xa5\x5a" + body + bytes([ck]) + csi


def test_parses_frames_and_text_lines():
    data = b"#STAT,1,100,100,100,0,-40\n" + make_frame(0, 10) + b"junk" + make_frame(1, 11)
    frames, lines = FrameReader().feed(data)
    assert [f.rx_seq for f in frames] == [10, 11]
    assert lines == ["#STAT,1,100,100,100,0,-40"]
    assert frames[0].rssi == -40 and frames[0].channel == 6 and len(frames[0].csi) == 128


def test_frame_split_across_reads():
    raw = make_frame(0, 5)
    reader = FrameReader()
    assert reader.feed(raw[:9]) == ([], [])
    frames, _ = reader.feed(raw[9:])
    assert len(frames) == 1 and frames[0].rx_seq == 5


def test_bad_checksum_is_dropped_and_counted():
    reader = FrameReader()
    frames, _ = reader.feed(make_frame(0, 1, bad_checksum=True) + make_frame(1, 2))
    assert [f.rx_seq for f in frames] == [2]
    assert reader.checksum_errors == 1


def test_air_loss_wraps_at_4096_and_skips_duplicates():
    frames, _ = FrameReader().feed(
        make_frame(0, 4094)
        + make_frame(1, 4095)
        + make_frame(2, 4095, flags=FLAG_RETRY)  # retransmission
        + make_frame(3, 2)  # 0 and 1 lost over the air
    )
    stats = LinkStats()
    kept = [f.rx_seq for f in frames if stats.add(f)]
    assert kept == [4094, 4095, 2]
    assert stats.duplicates == 1
    assert stats.air_lost == 2
    assert stats.uart_lost == 0


def test_uart_loss_from_uart_seq_gap():
    frames, _ = FrameReader().feed(make_frame(10, 1) + make_frame(13, 2))
    stats = LinkStats()
    for f in frames:
        stats.add(f)
    assert stats.uart_lost == 2
    assert stats.air_lost == 0


def test_tx_reboot_is_not_counted_as_loss():
    # 1102 frames "missing" within 10 ms can only be a counter restart
    frames, _ = FrameReader().feed(make_frame(0, 3000, t_us=0) + make_frame(1, 7, t_us=10_000))
    stats = LinkStats()
    for f in frames:
        stats.add(f)
    assert stats.air_lost == 0
    assert stats.resyncs == 1


def test_long_outage_is_counted_as_loss():
    # 2 s with no frames at 100 Hz: about 199 frames lost over the air
    frames, _ = FrameReader().feed(make_frame(0, 100, t_us=0) + make_frame(1, 300, t_us=2_000_000))
    stats = LinkStats()
    for f in frames:
        stats.add(f)
    assert stats.air_lost == 199
    assert stats.resyncs == 0


def test_hash_byte_in_garbage_does_not_stall_the_next_frame():
    reader = FrameReader()
    frames, lines = reader.feed(b"\x00#\x01\x02" + make_frame(0, 9))
    assert [f.rx_seq for f in frames] == [9]
    assert lines == []
