import os
import struct
import zlib

BASE = os.path.join(os.path.dirname(__file__), "..", "src-tauri", "icons")


def png(w: int, h: int, rgb: tuple[int, int, int]) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = b"".join(b"\x00" + bytes(rgb) * w for _ in range(h))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def main() -> None:
    os.makedirs(BASE, exist_ok=True)
    for name, size in [("32x32.png", 32), ("128x128.png", 128), ("128x128@2x.png", 256)]:
        path = os.path.join(BASE, name)
        with open(path, "wb") as f:
            f.write(png(size, size, (224, 70, 56)))
    # Placeholder ICO/ICNS — copy 128 PNG; tauri icon command can regenerate proper ones
    with open(os.path.join(BASE, "icon.ico"), "wb") as f:
        f.write(png(32, 32, (224, 70, 56)))
    with open(os.path.join(BASE, "icon.icns"), "wb") as f:
        f.write(png(32, 32, (224, 70, 56)))
    print(f"Created icons in {BASE}")


if __name__ == "__main__":
    main()
