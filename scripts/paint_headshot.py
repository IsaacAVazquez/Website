"""Portrait-tuned Van Gogh / Seurat / Hopper renderings of the home headshot.

A portrait variant of scripts/paint_plates.py: the plate styles were tuned for
landscapes, so here stroke and dot sizes shrink over the face, the palettes
carry skin tones, and Hopper's planes come from a k-means posterize with the
figure's cast shadow on the wall instead of the matchday's hand-drawn shapes.

    python3 scripts/paint_headshot.py vangogh|seurat|hopper public/images/headshot-home.webp OUT.png
    cwebp -m 6 -q Q -resize 720 1080 OUT.png -o public/images/home/headshot-<style>.webp
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

STYLE, SRC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
rng = np.random.default_rng(11)
W = 900
SRC_IMG = Image.open(SRC).convert("RGB")
H = round(SRC_IMG.height * W / SRC_IMG.width)
S = W / SRC_IMG.width  # source px -> working px


def load(median=5, blur=1.0):
    src = SRC_IMG.resize((W, H), Image.LANCZOS)
    return src.filter(ImageFilter.MedianFilter(median)).filter(ImageFilter.GaussianBlur(blur))


def to_hsv(img):
    return np.asarray(img.convert("HSV"), float) / 255


def from_hsv(hsv):
    return Image.fromarray((np.clip(hsv, 0, 1) * 255).astype("uint8"), "HSV").convert("RGB")


def smooth_noise(h, w, scale, seed):
    r = np.random.default_rng(seed)
    small = r.normal(0, 1, (max(2, h // scale), max(2, w // scale)))
    img = Image.fromarray(((small - small.min()) / np.ptp(small) * 255).astype("uint8"))
    big = np.asarray(img.resize((w, h), Image.BICUBIC), float) / 255
    return big * 2 - 1


YY, XX = np.mgrid[0:H, 0:W].astype(float)
# The face, in source pixels: centre (665, 540), ear to ear ~410, hairline to chin ~640.
FC = (665 * S, 540 * S)
FR = (200 * S, 320 * S)
_fd = np.hypot((XX - FC[0]) / FR[0], (YY - FC[1]) / FR[1])
FACE = np.clip((1.25 - _fd) / 0.35, 0, 1)            # 1 inside the face, soft falloff
EYES = np.zeros((H, W))
for ex, ey in ((590, 505), (740, 500), (668, 640)):    # both eyes and the mouth
    EYES = np.maximum(EYES, np.clip(1.6 - np.hypot((XX - ex * S) / (70 * S), (YY - ey * S) / (40 * S)), 0, 1))
EYES = np.clip(EYES, 0, 1)


# --------------------------------------------------------------------------
# Van Gogh
# --------------------------------------------------------------------------

VG_YELLOWS = np.array([[250, 204, 40], [255, 226, 90], [240, 170, 30], [255, 240, 150], [226, 150, 40]], float)
VG_BLUES = np.array([[28, 52, 130], [40, 78, 160], [70, 120, 190], [20, 36, 90], [110, 160, 210]], float)
VG_GREENS = np.array([[70, 130, 100], [110, 160, 90], [60, 110, 120], [150, 180, 100]], float)
VG_LIGHTS = np.array([[250, 246, 225], [215, 232, 248], [240, 244, 255]], float)
VG_SKIN = np.array([[236, 176, 120], [224, 146, 96], [246, 206, 150], [210, 120, 86], [240, 190, 160]], float)
VG_HAIR = np.array([[40, 36, 70], [70, 44, 34], [30, 40, 90], [96, 60, 40]], float)


def vg_colour(c, face):
    c = c.astype(float)
    r, g, b = c / 255
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = (max(r, g, b) - min(r, g, b)) / (max(r, g, b) + 1e-6)
    if face > 0.3 and lum < 0.26:                        # hair and beard: blue-black and umber, never flat black
        base = VG_HAIR[rng.integers(len(VG_HAIR))] * 0.45 + c * 0.55
    elif lum < 0.22 and b > r * 1.15:                   # the navy suit and tie
        base = VG_BLUES[rng.integers(4)] * 0.6 + c * 0.4
    elif lum < 0.24:                                     # hair and beard: blue-black and umber, never flat black
        base = VG_HAIR[rng.integers(len(VG_HAIR))] * 0.55 + c * 0.45
    elif face > 0.3 and r > b * 1.12:                    # skin: ochre, orange, rose
        base = VG_SKIN[rng.integers(len(VG_SKIN))] * 0.5 + c * 0.5
        if lum < 0.42 and rng.random() < 0.15:           # his green shadow notes
            base = VG_GREENS[rng.integers(2)] * 0.35 + c * 0.65
    elif lum > 0.72 and b >= r * 0.97:                   # the shirt
        base = VG_LIGHTS[rng.integers(len(VG_LIGHTS))] * 0.6 + c * 0.4
    elif b > r * 1.12:                                   # blue in the suit's lit side
        base = VG_BLUES[rng.integers(1, 5)] * 0.6 + c * 0.4
    elif lum > 0.62:                                     # pale wall and window light: chrome yellow and cream
        base = VG_YELLOWS[rng.integers(len(VG_YELLOWS))] * 0.55 + c * 0.45
    elif g >= r * 0.97:                                  # the greener glass
        base = VG_GREENS[rng.integers(len(VG_GREENS))] * 0.6 + c * 0.4
    else:                                                # warm wall: ochre broken with blue
        base = (VG_YELLOWS[rng.integers(len(VG_YELLOWS))] if rng.random() < 0.6
                else VG_BLUES[rng.integers(2, 5)]) * 0.5 + c * 0.5
    if face < 0.3 and rng.random() < 0.012:
        base = VG_BLUES[[1, 2, 4][rng.integers(3)]] if base[2] < base[0] else VG_YELLOWS[rng.integers(3)]
    jitter = 0.04 if face > 0.5 else 0.06
    return np.clip(base * (1 + rng.normal(0, jitter)) + rng.normal(0, 6, 3), 0, 255)


def vangogh():
    src = load(5, 1.2)
    sharp = SRC_IMG.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.8))
    m = FACE[..., None]
    ref = np.asarray(src, float) * (1 - m) + np.asarray(sharp, float) * m
    lum = np.asarray(src.convert("L").filter(ImageFilter.GaussianBlur(3)), float)
    gy, gx = np.gradient(lum)
    mag = np.hypot(gx, gy)
    tx, ty = -gy / (mag + 1e-6), gx / (mag + 1e-6)
    sx = np.full((H, W), 0.5) + 0.35 * smooth_noise(H, W, 90, 1)
    sy = 0.15 + 0.35 * smooth_noise(H, W, 90, 2)
    # Swirls in the wall behind him, and a gentle orbit round the face so the
    # cheeks and forehead are modelled along their form.
    for cx, cy, rad, spin in [(0.12, 0.12, 0.2, 1), (0.9, 0.1, 0.16, -1), (0.1, 0.42, 0.14, -1),
                              (0.93, 0.42, 0.15, 1), (0.3, 0.02, 0.12, -1), (0.72, 0.03, 0.1, 1),
                              (0.95, 0.75, 0.1, -1)]:
        dx, dy = XX - cx * W, YY - cy * H
        r = np.hypot(dx, dy) + 1e-6
        fall = np.exp(-((r / (rad * W)) ** 2)) * 2.2
        sx += spin * -dy / r * fall
        sy += spin * dx / r * fall
    dx, dy = XX - FC[0], YY - FC[1]
    r = np.hypot(dx / FR[0], dy / FR[1]) + 1e-6
    orbit = FACE * 1.5
    sx = sx * (1 - FACE) + orbit * -dy / (np.hypot(dx, dy) + 1e-6)
    sy = sy * (1 - FACE) + orbit * dx / (np.hypot(dx, dy) + 1e-6)
    flip = np.sign(tx * sx + ty * sy + 1e-9)
    tx, ty = tx * flip, ty * flip
    edge = np.clip(mag / 5, 0, 1)
    fx, fy = edge * tx + (1 - edge) * sx, edge * ty + (1 - edge) * sy
    norm = np.hypot(fx, fy) + 1e-6
    fx, fy = fx / norm, fy / norm

    canvas = Image.new("RGB", (W, H), (60, 70, 110))
    height = Image.new("L", (W, H), 0)
    dc = ImageDraw.Draw(canvas)
    dh = ImageDraw.Draw(height)

    def trace(x, y, length):
        pts = [(x, y)]
        for sgn in (1, -1):
            px, py = x, y
            seg = []
            for _ in range(max(1, int(length / 4))):
                ix, iy = int(min(W - 1, max(0, px))), int(min(H - 1, max(0, py)))
                px += sgn * fx[iy, ix] * 2
                py += sgn * fy[iy, ix] * 2
                seg.append((px, py))
            pts = pts + seg if sgn == 1 else seg[::-1] + pts
        return pts

    ref_lum = ref @ [0.299, 0.587, 0.114]
    # (width, length, step, where): coarse passes stay off the face, fine ones stay on it.
    passes = [(13, 56, 9, "bg"), (9, 38, 6, "bg"), (6, 22, 4, "all"), (4, 12, 3, "all"),
              (6, 22, 3, "face"), (3, 11, 2, "feat"), (2, 7, 2, "eyes")]
    for width, length, step, where in passes:
        pts = [(x, y) for y in range(0, H, step) for x in range(0, W, step)]
        rng.shuffle(pts)
        cur_lum = np.asarray(canvas.convert("L"), float)
        for x, y in pts:
            x = x + rng.uniform(-step / 2, step / 2)
            y = y + rng.uniform(-step / 2, step / 2)
            ix, iy = int(min(W - 1, max(0, x))), int(min(H - 1, max(0, y)))
            f, e = FACE[iy, ix], EYES[iy, ix]
            if where == "bg" and f > 0.35 and width < 13:
                continue
            if where == "face" and f < 0.2:
                continue
            if where == "eyes" and e < 0.3:
                continue
            if where == "feat" and (f < 0.2 or (mag[iy, ix] < 1.5 and e < 0.2)):
                continue
            if where == "all":
                if abs(cur_lum[iy, ix] - ref_lum[iy, ix]) < 26 and mag[iy, ix] < 2.2 and f < 0.2:
                    continue
                if width < 6 and mag[iy, ix] < 1.2 and f < 0.2:
                    continue
            if where == "eyes" and abs(cur_lum[iy, ix] - ref_lum[iy, ix]) < 14 and mag[iy, ix] < 3:
                continue
            path = np.array(trace(x, y, length * rng.uniform(0.7, 1.2) * (1 - 0.5 * edge[iy, ix])))
            if len(path) < 3:
                continue
            col = vg_colour(ref[iy, ix], f)
            d = np.gradient(path, axis=0)
            nrm = np.stack([-d[:, 1], d[:, 0]], 1) / (np.hypot(d[:, 0], d[:, 1])[:, None] + 1e-6)
            rim = tuple(int(v) for v in col * (0.8 if f > 0.5 else 0.68))
            dc.line([tuple(p) for p in path], fill=rim, width=int(width + 1), joint="curve")
            dh.line([tuple(p) for p in path], fill=40, width=int(width + 1), joint="curve")
            if width <= 3:
                dc.line([tuple(p) for p in path], fill=tuple(int(v) for v in col), width=width, joint="curve")
                dh.line([tuple(p) for p in path], fill=int(rng.uniform(140, 255)), width=max(1, width - 1))
                continue
            for k in np.arange(-width / 2 + 1, width / 2, 2.2):
                line = [tuple(p) for p in path + nrm * k]
                shade = np.clip(col * (1 + rng.normal(0, 0.08)), 0, 255)
                dc.line(line, fill=tuple(int(v) for v in shade), width=3, joint="curve")
                dh.line(line, fill=int(rng.uniform(140, 255)), width=2, joint="curve")

    hmap = np.asarray(height.filter(ImageFilter.GaussianBlur(1.0)), float) / 255
    hy, hx = np.gradient(hmap)
    k = 3.0 * (1 - 0.6 * FACE)  # softer relief on the face so it reads as skin, not crumple
    shade = np.clip(1 + (-hx - hy) * k, 0.72, 1.3)[:, :, None]
    out = np.clip(np.asarray(canvas, float) * shade, 0, 255).astype("uint8")
    return Image.fromarray(out)


# --------------------------------------------------------------------------
# Seurat
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
    [36, 36, 70],     # dark blue-violet
    # the tints he mixed with white, which carry the skin and the shirt
    [244, 196, 168],  # flesh: vermilion + white
    [236, 162, 110],  # orange + white
    [196, 214, 244],  # cobalt + white
    [212, 196, 150],  # yellow ochre + white
    [110, 60, 60],    # madder brown, for the beard's warm side
    [22, 24, 44],     # the deepest note, for pupils and the beard core
], float)
SPARKS = SEURAT[2:11]


def seurat():
    src = load(3, 1.0)
    ref = np.asarray(src, float)
    hsv = to_hsv(src)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.3, 0, 1)
    hsv[..., 2] = np.clip(hsv[..., 2] * 0.9 + 0.08, 0, 1)
    ref = np.asarray(from_hsv(hsv), float)
    lum = ref @ [0.299, 0.587, 0.114] / 255
    # The grey wall: colour by value, violet in shadow, warm in the light.
    neutral = (hsv[..., 1] < 0.18) & (FACE < 0.3)
    ramp_x = [0, 0.3, 0.55, 0.8, 1]
    shade = np.stack([np.interp(lum, ramp_x, [30, 70, 170, 236, 250]),
                      np.interp(lum, ramp_x, [34, 66, 150, 214, 244]),
                      np.interp(lum, ramp_x, [90, 140, 170, 180, 226])], -1)
    ref = np.where(neutral[..., None], shade, ref)

    canvas = Image.new("RGB", (W, H), (238, 230, 212))
    draw = ImageDraw.Draw(canvas)
    # (spacing, radius, seed, noise, mask): the face gets a finer lattice on top.
    layers = [(9, 4.4, 0, 14, None), (9, 3.8, 1, 14, None), (7, 3.1, 2, 12, None),
              (5, 2.5, 3, 8, FACE > 0.25), (4, 2.0, 4, 6, EYES > 0.25)]
    for spacing, radius, seed, noise, mask in layers:
        off = 0 if seed == 0 else spacing / 2
        gh, gw = int(H / spacing) + 1, int(W / spacing) + 1
        ys = np.clip((np.arange(gh) * spacing + off) % H, 0, H - 1).astype(int)
        xs = np.clip((np.arange(gw) * spacing + off) % W, 0, W - 1).astype(int)
        target = ref[ys][:, xs].copy()
        err = np.zeros_like(target)
        dots = []
        for j in range(gh):
            for i in range(gw):
                want = target[j, i] + err[j, i] + rng.normal(0, noise, 3)
                dist = ((SEURAT - want) ** 2).sum(1)
                pick = SEURAT[int(np.argmin(dist))]
                e = (want - pick) * 0.8
                if i + 1 < gw:
                    err[j, i + 1] += e * 7 / 16
                if j + 1 < gh:
                    if i > 0:
                        err[j + 1, i - 1] += e * 3 / 16
                    err[j + 1, i] += e * 5 / 16
                    if i + 1 < gw:
                        err[j + 1, i + 1] += e * 1 / 16
                if mask is not None and not mask[ys[j], xs[i]]:
                    continue
                col = pick
                if rng.random() < (0.035 if mask is None else 0.015):
                    opp = 255 - target[j, i]
                    col = SPARKS[int(np.argmin(((SPARKS - opp) ** 2).sum(1)))]
                dots.append((xs[i], ys[j], col))
        for n in rng.permutation(len(dots)):
            x, y, col = dots[n]
            x = x + rng.normal(0, spacing * 0.2)
            y = y + rng.normal(0, spacing * 0.2)
            r = radius * rng.uniform(0.85, 1.12)
            c = tuple(int(v) for v in np.clip(col + rng.normal(0, 5, 3), 0, 255))
            draw.ellipse([x - r, y - r, x + r, y + r], fill=c)
    return canvas


# --------------------------------------------------------------------------
# Hopper
# --------------------------------------------------------------------------

HOPPER_BG = np.array([
    [222, 190, 128],  # sunlit wall ochre
    [240, 222, 176],  # cream light
    [184, 142, 96],   # ochre in shade
    [150, 96, 66],    # sienna
    [92, 124, 108],   # grey-green facade
    [58, 96, 92],     # window teal
    [34, 58, 56],     # deep green glass
], float)
HOPPER_FIG = np.array([
    [24, 30, 56],     # navy in shadow
    [44, 58, 102],    # navy lit
    [240, 238, 228],  # shirt white
    [170, 182, 198],  # shirt in shade
    [240, 190, 150],  # skin in light
    [212, 146, 110],  # skin mid
    [156, 96, 76],    # skin shadow
    [36, 28, 28],     # hair and beard
    [80, 56, 46],     # beard warm
], float)


def kmeans(x, k, iters=25, seed=3):
    r = np.random.default_rng(seed)
    c = x[r.choice(len(x), k, replace=False)].copy()
    for _ in range(iters):
        lab = np.argmin(((x[:, None, :] - c[None]) ** 2).sum(2), 1)
        for j in range(k):
            if (lab == j).any():
                c[j] = x[lab == j].mean(0)
    return c


def assign(x, c):
    return np.argmin(((x[:, None, :] - c[None]) ** 2).sum(2), 1)


def smooth_labels(labels, n, sigma):
    stack = [np.asarray(Image.fromarray(((labels == k) * 255).astype("uint8"))
                        .filter(ImageFilter.GaussianBlur(sigma)), float) for k in range(n)]
    return np.argmax(np.stack(stack), 0)


def figure_mask(img):
    """The traced silhouette, snapped to the photo where it meets the soft background."""
    P = lambda x, y: (x * S, y * S)
    poly = Image.new("L", (W, H), 0)
    ImageDraw.Draw(poly).polygon([P(*p) for p in [
        (0, 1799), (0, 1120), (60, 1020), (170, 955), (400, 860), (490, 770), (500, 720),
        (470, 600), (455, 520), (460, 330), (500, 250), (600, 205), (720, 205), (820, 235),
        (875, 290), (870, 430), (850, 520), (870, 540), (855, 620), (830, 680), (800, 790),
        (810, 850), (1040, 980), (1070, 1060), (1072, 1250), (1040, 1500), (1020, 1799)]], fill=255)
    outer = np.asarray(poly.filter(ImageFilter.MaxFilter(31)), float) > 127
    inner = np.asarray(poly.filter(ImageFilter.MinFilter(31)), float) > 127
    a = np.asarray(img, float)
    # The background behind the band, from the pixels safely outside the silhouette.
    bgw = (~outer).astype(float)
    blur = lambda z: np.asarray(Image.fromarray(z.astype("float32"), "F").resize((W // 24, H // 24), Image.BOX)
                                .resize((W, H), Image.BILINEAR), float)
    est = np.stack([blur(a[..., i] * bgw) for i in range(3)], -1) / (blur(bgw)[..., None] + 1e-6)
    diff = np.abs(a - est).mean(2)
    fig = inner | (outer & (diff > 34))
    m = Image.fromarray((fig * 255).astype("uint8")).filter(ImageFilter.MedianFilter(9))
    return np.asarray(m.filter(ImageFilter.GaussianBlur(1.5)), float) > 127


def hopper():
    src = SRC_IMG.resize((W, H), Image.LANCZOS)
    fig = figure_mask(src.filter(ImageFilter.MedianFilter(5)))
    heavy = src
    for size in (9, 9, 9):
        heavy = heavy.filter(ImageFilter.MedianFilter(size))
    heavy = np.asarray(heavy.filter(ImageFilter.GaussianBlur(4)), float)
    body = src
    for size in (7, 7, 7):
        body = body.filter(ImageFilter.MedianFilter(size))
    face = src.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MedianFilter(5))
    m = np.clip(FACE * 1.4, 0, 1)[..., None]
    body = np.asarray(body, float) * (1 - m) + np.asarray(face, float) * m
    out = np.zeros((H, W, 3))

    # The wall and window behind him: a few big planes, warmed onto Hopper's facade colours.
    # Fill the figure with the surrounding wall, then box-blur tall and then wide so the
    # plane edges run straight along the building's verticals and sills.
    a = np.asarray(src, float)
    # Masked (normalized) box blur, tall and then narrow, over the wall pixels only, so
    # the plane edges run straight along the building's verticals and the figure never bleeds in.
    a = np.asarray(src, float)
    grown = np.asarray(Image.fromarray((fig * 255).astype("uint8")).filter(ImageFilter.MaxFilter(9)), float) > 127
    w = (~grown).astype(float)[..., None]

    def box(z, n, axis):
        pad = [(n // 2 + 1, n // 2) if ax == axis else (0, 0) for ax in range(z.ndim)]
        c = np.cumsum(np.pad(z, pad, mode="edge"), axis)
        return np.take(c, range(n, n + z.shape[axis]), axis) - np.take(c, range(0, z.shape[axis]), axis)
    num, den = a * w, w
    for n, axis in ((201, 0), (7, 1)):
        num, den = box(num, n, axis), box(den, n, axis)
    heavy = num / (den + 1e-6)
    bg_px = heavy[~fig]
    cb = kmeans(bg_px[rng.choice(len(bg_px), 20000, replace=False)], 5)
    lab = assign(heavy.reshape(-1, 3), cb).reshape(H, W)
    lab = smooth_labels(lab, 5, 3)
    cols = []
    for c in cb:
        warm = c * [1.08, 1.0, 0.86]
        p = HOPPER_BG[int(np.argmin(((HOPPER_BG - warm) ** 2).sum(1)))]
        cols.append(p * 0.7 + c * 0.3)
    bg = np.array(cols)[lab]

    # The figure: flat planes of suit, shirt, skin and hair.
    fp = body[fig]
    k = int(__import__("os").environ.get("HOPPER_K", 11))
    cf = kmeans(fp[rng.choice(len(fp), 30000, replace=False)], k)
    labf = assign(body.reshape(-1, 3), cf).reshape(H, W)
    labf = smooth_labels(labf, k, 1.4)
    cols = []
    for c in cf:
        p = HOPPER_FIG[int(np.argmin(((HOPPER_FIG - c) ** 2).sum(1)))]
        cols.append(p * 0.6 + c * 0.4)
    figc = np.array(cols)[labf]
    out = np.where(fig[..., None], figc, bg)

    P = lambda x, y: (x * S, y * S)
    # A shaft of low sun across the wall, then the figure's hard shadow thrown down and right.
    shaft = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shaft).polygon([P(-10, 420), P(460, 40), P(460, 250), P(-10, 700)], fill=255)
    lit = (np.asarray(shaft) > 127) & ~fig
    out[lit] = np.clip(out[lit] * 1.1 + [22, 14, 0], 0, 255)
    dx, dy = int(130 * S), int(50 * S)
    sh = np.zeros_like(fig)
    sh[dy:, dx:] = fig[:-dy, :-dx]
    wall = sh & ~fig
    out[wall] = out[wall] * np.array([0.56, 0.56, 0.66])
    img = Image.fromarray(np.clip(out, 0, 255).astype("uint8"))
    return img.filter(ImageFilter.GaussianBlur(0.6))


PAINTERS = {"vangogh": vangogh, "seurat": seurat, "hopper": hopper}
img = PAINTERS[STYLE]()
img.save(OUT)
print(img.size)
