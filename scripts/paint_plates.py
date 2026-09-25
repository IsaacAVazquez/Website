"""Painted versions of the home collage plates, one painter per plate.

A sibling of paint_impressionist.py. Each style renders the plate from our own
photo, with no painting used as input, and the paint reveal in catalog97.css
shows the result in a circle around the pointer over the plate:

    python3 scripts/paint_plates.py vangogh public/images/home/retro-launch-pad.jpg /tmp/launch.png
    cwebp -m 6 -q 35 -resize 688 0 /tmp/launch.png -o public/images/home/launch-pad-van-gogh.webp

    python3 scripts/paint_plates.py seurat public/images/home/retro-transit.jpg /tmp/transit.png
    cwebp -m 6 -q 45 -resize 540 0 /tmp/transit.png -o public/images/home/transit-seurat.webp

    python3 scripts/paint_plates.py hopper public/images/home/retro-matchday.jpg /tmp/matchday.png
    cwebp -m 6 -q 85 -resize 540 0 /tmp/matchday.png -o public/images/home/matchday-hopper.webp

The widths cover each plate's cover-fit size in the desktop collage, and the
qualities keep each file under 80KB. The output keeps the plate's aspect
ratio, because the hover layer is cropped with the same cover fit and position
as the photo under it. The random seed is fixed, so a re-run reproduces the
same painting. Re-run the matching pair whenever a plate changes. Needs Pillow
and numpy.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

STYLE, SRC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
rng = np.random.default_rng(11)


def load(width):
    """The plate at `width`, with the riso halftone screen smoothed away."""
    src = Image.open(SRC).convert("RGB")
    height = round(src.height * width / src.width)
    src = src.resize((width, height), Image.LANCZOS)
    return src.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.5))


def to_hsv(img):
    return np.asarray(img.convert("HSV"), float) / 255


def from_hsv(hsv):
    return Image.fromarray((np.clip(hsv, 0, 1) * 255).astype("uint8"), "HSV").convert("RGB")


def smooth_noise(h, w, scale, seed):
    """Low-frequency noise in [-1, 1], for flow fields and colour drift."""
    r = np.random.default_rng(seed)
    small = r.normal(0, 1, (max(2, h // scale), max(2, w // scale)))
    img = Image.fromarray(((small - small.min()) / np.ptp(small) * 255).astype("uint8"))
    big = np.asarray(img.resize((w, h), Image.BICUBIC), float) / 255
    return big * 2 - 1


# --------------------------------------------------------------------------
# Van Gogh: curved strokes traced along a flow field that follows the edges
# and swirls through the flat sky, laid in bristle by bristle and lit as
# raised paint. Yellows and blues pushed toward chrome and ultramarine.
# --------------------------------------------------------------------------

VG_YELLOWS = np.array([[250, 204, 40], [255, 226, 90], [240, 170, 30], [255, 240, 150], [226, 150, 40]], float)
VG_BLUES = np.array([[28, 52, 130], [40, 78, 160], [70, 120, 190], [20, 36, 90], [110, 160, 210]], float)
VG_GREENS = np.array([[60, 110, 80], [90, 140, 70], [40, 80, 90], [130, 160, 80]], float)
VG_LIGHTS = np.array([[250, 246, 225], [220, 235, 245], [255, 240, 190]], float)


def vg_colour(c):
    """Pushes a sampled colour onto Van Gogh's palette, with broken variation."""
    c = c.astype(float)
    r, g, b = c / 255
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = (max(r, g, b) - min(r, g, b)) / (max(r, g, b) + 1e-6)
    if r > 0.55 and g > 0.35 and b < 0.35 and sat > 0.4:          # the sky and the gantry arm
        base = c if r > g * 1.6 else VG_YELLOWS[rng.integers(len(VG_YELLOWS))] * 0.6 + c * 0.4
    elif lum < 0.3:                                               # iron, shadow: deep blue, never black
        base = VG_BLUES[rng.integers(4)] * 0.75 + c * 0.25
    elif lum > 0.75:                                              # the white rocket, highlights
        base = VG_LIGHTS[rng.integers(len(VG_LIGHTS))] * 0.7 + c * 0.3
    elif g > b * 1.05:                                            # scrub
        base = VG_GREENS[rng.integers(len(VG_GREENS))] * 0.7 + c * 0.3
    else:                                                         # water and haze
        base = VG_BLUES[rng.integers(1, 5)] * 0.6 + c * 0.4
    if rng.random() < 0.012:                                      # a complementary accent
        base = VG_BLUES[[1, 2, 4][rng.integers(3)]] if base[2] < base[0] else VG_YELLOWS[rng.integers(3)]
    return np.clip(base * (1 + rng.normal(0, 0.06)) + rng.normal(0, 8, 3), 0, 255)


def vangogh():
    W = 900
    src = load(W)
    H = src.height
    ref = np.asarray(src, float)
    lum = np.asarray(src.convert("L").filter(ImageFilter.GaussianBlur(4)), float)
    gy, gx = np.gradient(lum)
    mag = np.hypot(gx, gy)
    # Edge tangents, where there are edges.
    tx, ty = -gy / (mag + 1e-6), gx / (mag + 1e-6)
    # A swirl field for the flat areas: a few vortices over a drifting wind.
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    sx = np.full((H, W), 0.5) + 0.35 * smooth_noise(H, W, 90, 1)
    sy = 0.15 + 0.35 * smooth_noise(H, W, 90, 2)
    for cx, cy, rad, spin in [(0.18, 0.18, 0.2, 1), (0.42, 0.32, 0.16, -1), (0.12, 0.55, 0.14, 1),
                              (0.88, 0.14, 0.13, -1), (0.62, 0.08, 0.1, 1), (0.3, 0.05, 0.1, -1)]:
        dx, dy = xx - cx * W, yy - cy * H
        r = np.hypot(dx, dy) + 1e-6
        fall = np.exp(-((r / (rad * W)) ** 2)) * 2.2
        sx += spin * -dy / r * fall
        sy += spin * dx / r * fall
    # Tie the sign of the edge tangent to the swirl so the two blend smoothly.
    flip = np.sign(tx * sx + ty * sy + 1e-9)
    tx, ty = tx * flip, ty * flip
    edge = np.clip(mag / 6, 0, 1)
    fx, fy = edge * tx + (1 - edge) * sx, edge * ty + (1 - edge) * sy
    norm = np.hypot(fx, fy) + 1e-6
    fx, fy = fx / norm, fy / norm

    canvas = Image.new("RGB", (W, H), (40, 50, 90))
    height = Image.new("L", (W, H), 0)
    dc = ImageDraw.Draw(canvas)
    dh = ImageDraw.Draw(height)

    def trace(x, y, length):
        pts = [(x, y)]
        for sgn in (1, -1):
            px, py = x, y
            seg = []
            for _ in range(int(length / 2 / 2)):
                ix, iy = int(min(W - 1, max(0, px))), int(min(H - 1, max(0, py)))
                px += sgn * fx[iy, ix] * 2
                py += sgn * fy[iy, ix] * 2
                seg.append((px, py))
            pts = pts + seg if sgn == 1 else seg[::-1] + pts
        return pts

    ref_lum = ref @ [0.299, 0.587, 0.114]
    for width, length, step in [(14, 60, 9), (9, 40, 6), (6, 22, 4), (4, 12, 3)]:
        pts = [(x, y) for y in range(0, H, step) for x in range(0, W, step)]
        rng.shuffle(pts)
        cur_lum = np.asarray(canvas.convert("L"), float)
        for x, y in pts:
            x = x + rng.uniform(-step / 2, step / 2)
            y = y + rng.uniform(-step / 2, step / 2)
            ix, iy = int(min(W - 1, max(0, x))), int(min(H - 1, max(0, y)))
            # Finer passes only repaint edges and places where the value is still wrong.
            # The two finest passes stay on the edges, so the sky keeps its long swirls.
            if width < 14 and abs(cur_lum[iy, ix] - ref_lum[iy, ix]) < 30 and mag[iy, ix] < 2.5:
                continue
            if width < 9 and mag[iy, ix] < 1.2:
                continue
            # Strokes shorten at edges so the rocket and tower keep their shape.
            path = np.array(trace(x, y, length * rng.uniform(0.7, 1.2) * (1 - 0.55 * edge[iy, ix])))
            if len(path) < 3:
                continue
            col = vg_colour(ref[iy, ix])
            d = np.gradient(path, axis=0)
            nrm = np.stack([-d[:, 1], d[:, 0]], 1) / (np.hypot(d[:, 0], d[:, 1])[:, None] + 1e-6)
            # A darker rim under the stroke keeps each one distinct, then the
            # bristles: parallel threads of the same load, each a little lighter or darker.
            rim = tuple(int(v) for v in col * 0.68)
            dc.line([tuple(p) for p in path], fill=rim, width=int(width + 2), joint="curve")
            dh.line([tuple(p) for p in path], fill=40, width=int(width + 2), joint="curve")
            for k in np.arange(-width / 2 + 1, width / 2, 2.4):
                line = [tuple(p) for p in path + nrm * k]
                shade = np.clip(col * (1 + rng.normal(0, 0.1)), 0, 255)
                dc.line(line, fill=tuple(int(v) for v in shade), width=3, joint="curve")
                dh.line(line, fill=int(rng.uniform(140, 255)), width=2, joint="curve")

    # Raised paint: light the stroke relief from the upper left.
    hmap = np.asarray(height.filter(ImageFilter.GaussianBlur(1.1)), float) / 255
    hy, hx = np.gradient(hmap)
    shade = np.clip(1 + (-hx - hy) * 3.2, 0.7, 1.32)[:, :, None]
    out = np.clip(np.asarray(canvas, float) * shade, 0, 255).astype("uint8")
    return Image.fromarray(out)


# --------------------------------------------------------------------------
# Seurat: no strokes, only small round dots of nearly pure pigment. Each dot
# picks the palette colour that best carries the colour still owed in its
# neighbourhood (error diffusion over the dot lattice), so neighbouring dots
# mix optically, and a scatter of complementary dots sharpens each field.
# --------------------------------------------------------------------------

SEURAT = np.array([
    [250, 248, 238],  # lead white
    [250, 222, 60],   # lemon yellow
    [244, 170, 40],   # chrome orange
    [226, 70, 40],    # vermilion
    [206, 70, 120],   # rose madder
    [120, 70, 160],   # violet
    [36, 50, 170],    # ultramarine
    [40, 110, 200],   # cobalt
    [70, 170, 220],   # cerulean
    [40, 140, 90],    # emerald
    [150, 190, 70],   # yellow green
    [36, 36, 70],     # a dark blue-violet, Seurat's deepest note
], float)
SPARKS = SEURAT[2:11]  # no white, lemon, or the dark note


def seurat():
    W = 900
    src = load(W)
    H = src.height
    ref = np.asarray(src.filter(ImageFilter.GaussianBlur(1.5)), float)
    # Seurat's colour is brighter and chalkier than a print: lift and saturate.
    hsv = to_hsv(Image.fromarray(ref.astype("uint8")))
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.25, 0, 1)
    hsv[..., 2] = np.clip(hsv[..., 2] * 0.85 + 0.12, 0, 1)
    ref = np.asarray(from_hsv(hsv), float)
    # The plate's land and bridge are black ink on cream, so give them colour by
    # value: violet-blue shadows, green hills, warm light on the concrete.
    yy, xx = np.mgrid[0:H, 0:W] / np.array([H, W])[:, None, None]
    hills = yy > 0.8 - 0.16 * xx
    lum = ref @ [0.299, 0.587, 0.114] / 255
    neutral = hsv[..., 1] < 0.35
    ramp_x = [0, 0.3, 0.55, 0.8, 1]
    shade = np.stack([np.interp(lum, ramp_x, [30, 60, 170, 238, 250]),
                      np.interp(lum, ramp_x, [34, 60, 140, 214, 244]),
                      np.interp(lum, ramp_x, [90, 140, 150, 170, 226])], -1)
    green = np.stack([np.interp(lum, ramp_x, [30, 40, 120, 210, 245]),
                      np.interp(lum, ramp_x, [40, 110, 170, 214, 240]),
                      np.interp(lum, ramp_x, [100, 80, 80, 150, 210])], -1)
    ref = np.where(neutral[..., None], np.where(hills[..., None], green, shade), ref)

    canvas = Image.new("RGB", (W, H), (238, 230, 212))
    draw = ImageDraw.Draw(canvas)
    for spacing, radius, seed in [(9, 4.6, 0), (9, 4.0, 1), (7, 3.3, 2)]:
        off = 0 if seed == 0 else spacing / 2 * (seed % 2 or 1)
        gh, gw = int(H / spacing) + 1, int(W / spacing) + 1
        ys = np.clip((np.arange(gh) * spacing + off) % H, 0, H - 1).astype(int)
        xs = np.clip((np.arange(gw) * spacing + off) % W, 0, W - 1).astype(int)
        target = ref[ys][:, xs].copy()
        err = np.zeros_like(target)
        dots = []
        for j in range(gh):
            for i in range(gw):
                want = target[j, i] + err[j, i] + rng.normal(0, 16, 3)
                dist = ((SEURAT - want) ** 2).sum(1)
                pick = SEURAT[int(np.argmin(dist))]
                e = (want - pick) * 0.85
                if i + 1 < gw:
                    err[j, i + 1] += e * 7 / 16
                if j + 1 < gh:
                    if i > 0:
                        err[j + 1, i - 1] += e * 3 / 16
                    err[j + 1, i] += e * 5 / 16
                    if i + 1 < gw:
                        err[j + 1, i + 1] += e * 1 / 16
                col = pick
                if rng.random() < 0.035:
                    # A complementary spark: the chromatic pigment nearest the opposite
                    # hue, so blue fields get orange and green fields get rose.
                    opp = 255 - target[j, i]
                    col = SPARKS[int(np.argmin(((SPARKS - opp) ** 2).sum(1)))]
                dots.append((xs[i], ys[j], col))
        order = rng.permutation(len(dots))
        for n in order:
            x, y, col = dots[n]
            x = x + rng.normal(0, spacing * 0.22)
            y = y + rng.normal(0, spacing * 0.22)
            r = radius * rng.uniform(0.8, 1.15)
            c = tuple(int(v) for v in np.clip(col + rng.normal(0, 6, 3), 0, 255))
            draw.ellipse([x - r, y - r, x + r, y + r], fill=c)
    return canvas


# --------------------------------------------------------------------------
# Hopper: no brushwork at all. The photo is sorted into a few plain planes
# (sky, flag, the white pole and lines, tree line, pitch), each plane is
# posterized to two or three flat tones, and a low sun from the left throws
# long, hard-edged shadows of the pole and the goal across the grass.
# --------------------------------------------------------------------------

SKY_TOP, SKY_LOW = np.array([192, 66, 50]), np.array([246, 196, 132])
HOPPER = {
    "flag": [[236, 196, 70], [206, 150, 44], [150, 98, 36]],
    "white": [[248, 238, 212], [196, 196, 190]],
    "trees": [[30, 56, 58], [44, 74, 66]],
    "grass": [[40, 78, 60], [70, 112, 66], [104, 138, 70]],
    "shadow": [26, 48, 52],
}


def smooth_labels(labels, n, sigma):
    """Clean plane edges: blur each label's mask and keep the strongest."""
    stack = [np.asarray(Image.fromarray(((labels == k) * 255).astype("uint8"))
                        .filter(ImageFilter.GaussianBlur(sigma)), float) for k in range(n)]
    return np.argmax(np.stack(stack), 0)


def hopper():
    W = 720
    src = Image.open(SRC).convert("RGB")
    H = round(src.height * W / src.width)
    src = src.resize((W, H), Image.LANCZOS)
    # Flatten hard: repeated median filtering erases the halftone and any texture.
    flat = src
    for size in (7, 9, 9, 7):
        flat = flat.filter(ImageFilter.MedianFilter(size))
    ref = np.asarray(flat, float) / 255
    r, g, b = ref[..., 0], ref[..., 1], ref[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = (ref.max(2) - ref.min(2)) / (ref.max(2) + 1e-6)
    wide = np.asarray(flat.convert("L").filter(ImageFilter.GaussianBlur(25)), float) / 255
    yy, xx = np.mgrid[0:H, 0:W] / np.array([H, W])[:, None, None]
    horizon = 0.6  # where the pitch meets the tree line

    # 0 sky, 1 flag, 2 white, 3 trees, 4 grass
    labels = np.where(yy < horizon - 0.02, 0, 4)
    labels[(yy > 0.49) & (yy < horizon + 0.01) & (lum < 0.32)] = 3
    flag = (g > r * 0.6) & (b < g * 0.78) & (r > b * 1.2) & (yy > 0.15) & (yy < 0.52) & (xx > 0.2) & (xx < 0.5)
    labels[flag] = 1
    # Thin white shapes (pole, posts, crossbar, lines) come from a lighter
    # flattening so the crossbar survives; broad pale haze stays out.
    fine = np.asarray(src.filter(ImageFilter.MedianFilter(5)).convert("L"), float) / 255
    labels[(np.maximum(lum, fine) > 0.6) & (sat < 0.3) & (wide < 0.6) & (yy > 0.12)] = 2
    labels = smooth_labels(labels, 5, 2.5)

    out = np.zeros((H, W, 3))
    # Sky: a sunset in eight gentle flat steps, deepest at the top.
    step = np.clip(np.floor(yy / horizon * 8) / 7, 0, 1)[..., None] ** 1.4
    sky = SKY_TOP * (1 - step) + SKY_LOW * step
    out[labels == 0] = sky[labels == 0]
    tone = smooth_labels(np.digitize(lum, [0.3, 0.52]), 3, 2.0)       # 0 dark, 1 mid, 2 light
    for name, k in (("flag", 1), ("trees", 3)):
        cols = np.array(HOPPER[name])
        pick = np.clip(2 - tone, 0, len(cols) - 1) if name == "flag" else np.clip(tone, 0, 1)
        out[labels == k] = cols[pick][labels == k]
    out[labels == 2] = HOPPER["white"][0]
    # Crisp form on the pole and posts: the side away from the sun is in shade.
    white = labels == 2
    right_edge = white & ~np.roll(white, -5, axis=1) & np.roll(white, 6, axis=1)
    out[right_edge] = HOPPER["white"][1]
    # The pitch: light rakes a strip of far grass, the rest is one flat green.
    grass = np.array(HOPPER["grass"])
    g_tone = np.where(yy < horizon + 0.035, 2, 1)
    out[labels == 4] = grass[g_tone][labels == 4]

    # Long shadows from a low sun on the left, laid over the grass and lines.
    shadow = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(shadow)
    P = lambda x, y: (x * W, y * H)
    d.polygon([P(0.185, 0.875), P(0.215, 0.885), P(1.02, 0.975), P(1.02, 0.935)], fill=255)   # the pole
    d.polygon([P(0.86, 0.925), P(1.02, 0.91), P(1.02, 0.975), P(0.9, 0.96)], fill=255)        # its flag
    for x0 in (0.565, 0.735):                                                             # the goal posts
        d.polygon([P(x0, 0.617), P(x0 + 0.012, 0.617), P(x0 + 0.13, 0.672), P(x0 + 0.115, 0.674)], fill=255)
    d.polygon([P(0.68, 0.668), P(0.85, 0.668), P(0.85, 0.675), P(0.68, 0.675)], fill=255)     # the crossbar
    on_ground = (labels == 4) | ((labels == 2) & (yy > horizon + 0.06))
    sh = (np.asarray(shadow) > 127) & on_ground
    out[sh] = HOPPER["shadow"]
    out[sh & (labels == 2)] = [120, 128, 124]                                          # lines in shade

    img = Image.fromarray(out.astype("uint8"))
    # The crossbar is a pixel or two in the plate, too thin to survive the
    # flattening, so it is painted back in along the tops of the posts.
    ImageDraw.Draw(img).line([P(0.566, 0.495), P(0.736, 0.493)], fill=tuple(HOPPER["white"][0]), width=6)
    return img.filter(ImageFilter.GaussianBlur(0.6))  # just enough to anti-alias the plane edges


PAINTERS = {"vangogh": vangogh, "seurat": seurat, "hopper": hopper}
img = PAINTERS[STYLE]()
img.save(OUT)
print(img.size)
