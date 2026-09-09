"""Generate Tauri app icons from the WEBPRO mark source image."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow is required. Install with: pip install pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
TAURI_DIR = ROOT / "src-tauri"
SOURCE = TAURI_DIR / "app-icon-source.png"
SQUARE = TAURI_DIR / "app-icon.png"
ICONS_DIR = TAURI_DIR / "icons"
IOS_BG = "#ffffff"
TARGET_SIZE = 1024
PAD_BG = (255, 255, 255, 255)


def square_icon(source: Path, dest: Path, size: int = TARGET_SIZE) -> None:
    image = Image.open(source).convert("RGBA")
    width, height = image.size
    canvas_size = max(width, height)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), PAD_BG)
    canvas.paste(image, ((canvas_size - width) // 2, (canvas_size - height) // 2), image)
    canvas = canvas.resize((size, size), Image.Resampling.LANCZOS)
    # Flatten to opaque RGB — Windows ICO/taskbar often renders alpha as black.
    flat = Image.new("RGB", (size, size), PAD_BG[:3])
    flat.paste(canvas, mask=canvas.split()[3])
    flat.save(dest)


def run_tauri_icon() -> None:
    tauri = shutil.which("tauri")
    if tauri:
        cmd = [tauri, "icon", str(SQUARE), "-o", "icons", "--ios-color", IOS_BG]
        cwd = TAURI_DIR
    else:
        npx = shutil.which("npx") or "npx"
        cmd = [npx, "tauri", "icon", str(SQUARE), "-o", "icons", "--ios-color", IOS_BG]
        cwd = TAURI_DIR

    print("Running:", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def rebuild_tauri_app() -> None:
    cargo = shutil.which("cargo")
    if not cargo:
        print("cargo not found; rebuild the app manually to refresh the embedded icon.", file=sys.stderr)
        return

    # Ensure Windows resource embedding picks up icon.ico changes.
    build_rs = TAURI_DIR / "build.rs"
    build_rs.touch(exist_ok=True)

    print("Rebuilding Tauri app so the new icon is embedded in the executable...")
    subprocess.run([cargo, "build", "-p", "webpro-mdx"], cwd=TAURI_DIR, check=True)


def main() -> None:
    if not SOURCE.is_file():
        print(f"Missing source image: {SOURCE}", file=sys.stderr)
        sys.exit(1)

    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    square_icon(SOURCE, SQUARE)
    print(f"Prepared square icon: {SQUARE} ({TARGET_SIZE}x{TARGET_SIZE})")
    run_tauri_icon()
    print(f"Generated icons in {ICONS_DIR}")
    rebuild_tauri_app()
    print("Done. Restart the app if it is already running.")


if __name__ == "__main__":
    main()
