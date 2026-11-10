"""Genera los iconos de la app (PWA y iPhone) en public/.

Uso: python3 scripts/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ACCENT = (242, 184, 75, 255)
INK = (20, 17, 10, 255)
OUT = Path(__file__).resolve().parent.parent / "public"
SCALE = 4  # se dibuja a 4x y se reduce para suavizar bordes


def draw_mark(draw: ImageDraw.ImageDraw, size: int, box: float) -> None:
    """Dibuja las dos velas centradas, ocupando `box` (0-1) del lado."""
    unit = size * box / 24.0
    off = (size - 24 * unit) / 2

    def p(x: float, y: float) -> tuple[float, float]:
        return (off + x * unit, off + y * unit)

    w = max(1, round(1.8 * unit))
    draw.line([p(8, 3), p(8, 21)], fill=INK, width=w)
    draw.line([p(16, 3), p(16, 21)], fill=INK, width=w)
    r = 1 * unit
    draw.rounded_rectangle([p(5.5, 8), p(10.5, 16)], radius=r, fill=INK)
    draw.rounded_rectangle([p(13.5, 5), p(18.5, 14)], radius=r, fill=INK)


def icon(size: int, *, rounded: bool, box: float) -> Image.Image:
    big = size * SCALE
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=big * 0.22, fill=ACCENT)
    else:
        d.rectangle([0, 0, big, big], fill=ACCENT)
    draw_mark(d, big, box)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    icon(192, rounded=True, box=0.62).save(OUT / "pwa-192.png")
    icon(512, rounded=True, box=0.62).save(OUT / "pwa-512.png")
    # Maskable: fondo completo y el dibujo dentro de la zona segura (80 %)
    icon(512, rounded=False, box=0.5).save(OUT / "pwa-maskable-512.png")
    # iPhone redondea las esquinas por su cuenta: fondo completo, sin transparencia
    icon(180, rounded=False, box=0.6).convert("RGB").save(OUT / "apple-touch-icon.png")
    (OUT / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
        '<rect width="24" height="24" rx="5.5" fill="#F2B84B"/>'
        '<g transform="translate(3 3) scale(0.75)">'
        '<path d="M8 3v18M16 3v18" stroke="#14110A" stroke-width="1.8" stroke-linecap="round"/>'
        '<rect x="5.5" y="8" width="5" height="8" rx="1" fill="#14110A"/>'
        '<rect x="13.5" y="5" width="5" height="9" rx="1" fill="#14110A"/>'
        "</g></svg>\n",
        encoding="utf-8",
    )
    print("Iconos generados en", OUT)


if __name__ == "__main__":
    main()
