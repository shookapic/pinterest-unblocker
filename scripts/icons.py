"""Render the original open-lock mark as standard PNG extension icons."""
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parent.parent


def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def color_at(x, y):
    # Rounded green tile and an open cream shackle.
    cx, cy = max(20, min(x, 108)), max(20, min(y, 108))
    if (x - cx) ** 2 + (y - cy) ** 2 > 20 ** 2:
        return (0, 0, 0, 0)
    cream = (248, 246, 239, 255)
    radius = ((x - 65) ** 2 + (y - 44) ** 2) ** 0.5
    if 19 <= radius <= 28 and y <= 45 and (x < 65 or y < 36):
        return cream
    if 37 <= x <= 46 and 42 <= y <= 65:
        return cream
    if 32 <= x <= 96 and 61 <= y <= 103:
        corner_x, corner_y = max(40, min(x, 88)), max(69, min(y, 95))
        if (x - corner_x) ** 2 + (y - corner_y) ** 2 <= 8 ** 2:
            if (x - 64) ** 2 + (y - 79) ** 2 <= 5 ** 2 or (61 <= x <= 67 and 79 <= y <= 91):
                return (23, 59, 50, 255)
            return cream
    return (23, 59, 50, 255)


def render(size):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            samples = [color_at((x + (sx + .5) / 4) * 128 / size, (y + (sy + .5) / 4) * 128 / size)
                       for sy in range(4) for sx in range(4)]
            raw.extend(round(sum(c[i] for c in samples) / 16) for i in range(4))
    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


if __name__ == "__main__":
    target = ROOT / "extension" / "icons"
    target.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        (target / f"{size}.png").write_bytes(render(size))
    print("Rendered extension icons")
