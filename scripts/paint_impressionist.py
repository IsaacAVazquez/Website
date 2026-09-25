"""Stroke-based impressionist rendering (Hertzmann-style, simplified).

Builds the painted layer the Monet hover reveals over the portrait:

    python3 scripts/paint_impressionist.py public/images/headshot-home.webp /tmp/painted.png
    cwebp -q 68 -resize 720 0 /tmp/painted.png -o public/images/home/headshot-monet.webp

Re-run it whenever the headshot changes. Needs Pillow and numpy.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
W = 900
rng = np.random.default_rng(7)

src = Image.open(SRC).convert("RGB")
H = round(src.height * W / src.width)
src = src.resize((W, H), Image.LANCZOS)

SHADOW = np.array([72, 82, 150], float)    # blue-violet shadows
LIGHT = np.array([255, 236, 205], float)   # warm cream lights
LEAF = np.array([96, 140, 110], float)     # a green note for mid tones


def orientation(ref):
    lum = np.asarray(ref.convert("L").filter(ImageFilter.GaussianBlur(3)), float)
    gy, gx = np.gradient(lum)
    return gx, gy, np.hypot(gx, gy)


def stroke_color(c, rng):
    c = c.astype(float)
    lum = c @ [0.299, 0.587, 0.114] / 255
    if lum < 0.35:
        c = c * 0.8 + SHADOW * 0.2
    elif lum > 0.72:
        c = c * 0.85 + LIGHT * 0.15
    elif rng.random() < 0.12:
        c = c * 0.85 + LEAF * 0.15
    c = c * (1 + rng.normal(0, 0.05)) + rng.normal(0, 9, 3)  # broken colour
    return tuple(int(v) for v in np.clip(c, 0, 255))


canvas = Image.new("RGB", (W, H), (236, 228, 210))
for radius, threshold in [(16, 0), (9, 18), (5, 20), (3, 20), (2, 24)]:
    ref = src.filter(ImageFilter.GaussianBlur(radius * 0.7))
    ref_a = np.asarray(ref, int)
    gx, gy, mag = orientation(ref)
    diff = np.abs(np.asarray(canvas, int) - ref_a).sum(axis=2) / 3
    draw = ImageDraw.Draw(canvas, "RGBA")
    step = max(2, radius)
    pts = [(x, y) for y in range(0, H, step) for x in range(0, W, step)]
    rng.shuffle(pts)
    for x, y in pts:
        x = int(min(W - 1, max(0, x + rng.integers(-step // 2, step // 2 + 1))))
        y = int(min(H - 1, max(0, y + rng.integers(-step // 2, step // 2 + 1))))
        if threshold and diff[y, x] < threshold:
            continue
        # Strokes run along the edges (perpendicular to the gradient).
        if mag[y, x] > 1e-3:
            dx, dy = -gy[y, x] / mag[y, x], gx[y, x] / mag[y, x]
        else:
            a = rng.uniform(0, np.pi)
            dx, dy = np.cos(a), np.sin(a)
        a = np.arctan2(dy, dx) + rng.normal(0, 0.25)
        dx, dy = np.cos(a), np.sin(a)
        length = radius * rng.uniform(1.4, 2.8)
        col = stroke_color(ref_a[y, x], rng) + (int(rng.uniform(200, 240)),)
        x0, y0, x1, y1 = x - dx * length / 2, y - dy * length / 2, x + dx * length / 2, y + dy * length / 2
        w = max(2, int(radius * rng.uniform(0.8, 1.15)))
        draw.line([(x0, y0), (x1, y1)], fill=col, width=w)
        r = w / 2
        for cx, cy in ((x0, y0), (x1, y1)):
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)

# Canvas weave: a faint embossed noise so the paint sits on something.
noise = Image.fromarray((rng.normal(128, 30, (H, W))).clip(0, 255).astype("uint8"))
weave = noise.filter(ImageFilter.GaussianBlur(1.4)).filter(ImageFilter.EMBOSS).convert("RGB")
canvas = Image.blend(canvas, Image.blend(canvas, weave, 0.5), 0.1)
canvas.save(OUT)
print(canvas.size)
