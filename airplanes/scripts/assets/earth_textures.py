#!/usr/bin/env python3
"""Earth textures for the globe (CONTRACTS §11). Content-owned, reproducible.

    python3 -I scripts/assets/earth_textures.py --src <three-globe>/package/example/img \
        --out public/textures/earth [--preview <dir>] [--only day,night,normal,water,clouds]

Use scripts/assets/build-earth.sh to fetch three-globe@2.45.3 into a temporary folder outside the
repo and run this. Inputs (NASA Blue Marble / Black Marble derived, via three-globe's examples):
earth-blue-marble.jpg, earth-night.jpg, earth-topology.png, earth-water.png. The cloud layer is
generated here from noise; three-globe's clouds.png is NOT used (unknown licence).

Every output is equirectangular: longitude -180 -> 180 left to right, north up. Needs Pillow
(with WebP) and numpy only. Deterministic: same inputs, same bytes.
"""
from __future__ import annotations

import argparse
import math
import os
import sys
import time

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None

# Size budgets in bytes (brief + CONTRACTS §11); the script fails loudly if one is exceeded.
BUDGET = {
    'day-2k.webp': 450_000,
    'day-4k.webp': 1_400_000,
    'night-2k.webp': 250_000,
    'night-4k.webp': 700_000,
    'normal-2k.webp': 400_000,
    'water-1k.webp': 60_000,
    'clouds-2k.webp': 500_000,
}


# ----------------------------------------------------------------------------------------------
# helpers


def load(path: str, mode: str) -> Image.Image:
    im = Image.open(path)
    im.load()
    return im.convert(mode)


def save_webp(im: Image.Image, path: str, quality: int, budget: int, lossless: bool = False) -> int:
    """Saves as WebP, lowering the quality in steps until the file fits its budget."""
    q = quality
    while True:
        if lossless:
            im.save(path, 'WEBP', lossless=True, quality=100, method=6, exact=False)
        else:
            im.save(path, 'WEBP', quality=q, method=6)
        size = os.path.getsize(path)
        if size <= budget or lossless or q <= 40:
            break
        q -= 4
    status = 'ok' if size <= budget else 'OVER BUDGET'
    print(f'  {os.path.basename(path):16s} {im.size[0]}x{im.size[1]}  {size / 1000:7.1f} KB  (q={q if not lossless else "lossless"}, budget {budget / 1000:.0f} KB) {status}')
    if size > budget:
        raise SystemExit(f'{path} is over its {budget} byte budget')
    return size


def resize(im: Image.Image, w: int, h: int) -> Image.Image:
    return im if im.size == (w, h) else im.resize((w, h), Image.LANCZOS, reducing_gap=3.0)


def lat_lon_grid(w: int, h: int) -> tuple[np.ndarray, np.ndarray]:
    """Pixel-centre latitude (rows, north first) and longitude (columns, -180 first), radians."""
    lat = (0.5 - (np.arange(h) + 0.5) / h) * math.pi
    lon = ((np.arange(w) + 0.5) / w - 0.5) * 2 * math.pi
    return lat, lon


def smoothstep(e0: float, e1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def gauss(x: np.ndarray, mu: float, sigma: float) -> np.ndarray:
    return np.exp(-0.5 * ((x - mu) / sigma) ** 2)


# ----------------------------------------------------------------------------------------------
# day: NASA Blue Marble (with relief and bathymetry shading), resized only


def make_day(src: str, out: str) -> None:
    im = load(os.path.join(src, 'earth-blue-marble.jpg'), 'RGB')
    for w, name, q in ((4096, 'day-4k.webp', 90), (2048, 'day-2k.webp', 88)):
        save_webp(resize(im, w, w // 2), os.path.join(out, name), q, BUDGET[name])


# ----------------------------------------------------------------------------------------------
# night: Black Marble city lights. The source is blue-tinted (land and sea are dark blue) and the
# lights are near-neutral, so the red channel separates them: background red stays <= ~16.


NIGHT_FLOOR = 20.0  # red level treated as black (deserts and ice sheets reach ~16)
NIGHT_WHITE = 105.0  # red level where city cores reach full brightness


def night_rgb(red: np.ndarray) -> np.ndarray:
    v = np.clip((red - NIGHT_FLOOR) / (NIGHT_WHITE - NIGHT_FLOOR), 0.0, 1.0)
    v = v ** 1.5  # dim the halos around cities so the cores stay crisp
    # Sodium-light palette: deep amber at the dim fringe, pale warm white in the cores.
    lo = np.array([255, 150, 60], np.float32) / 255
    hi = np.array([255, 238, 205], np.float32) / 255
    mix = np.clip(v * 1.4, 0.0, 1.0)[..., None]
    col = lo * (1 - mix) + hi * mix
    return np.clip(col * v[..., None] * 255 + 0.5, 0, 255).astype(np.uint8)


def make_night(src: str, out: str) -> None:
    im = load(os.path.join(src, 'earth-night.jpg'), 'RGB')
    red4 = np.asarray(im, np.float32)[..., 0]
    # 2K: downsample the linear red channel first (Lanczos keeps points sharp), then grade.
    red2 = np.asarray(Image.fromarray(red4).resize((2048, 1024), Image.LANCZOS), np.float32)
    for red, name, q in ((red4, 'night-4k.webp', 86), (red2, 'night-2k.webp', 86)):
        save_webp(Image.fromarray(night_rgb(red), 'RGB'), os.path.join(out, name), q, BUDGET[name])


# ----------------------------------------------------------------------------------------------
# normal: tangent-space normal map from the elevation map (+X east, +Y north, flat = 128,128,255)


def wrap_blur(a: np.ndarray, sigma: float) -> np.ndarray:
    """Separable Gaussian blur that wraps east-west and clamps north-south."""
    r = max(1, int(math.ceil(3 * sigma)))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    p = np.concatenate([a[:, -r:], a, a[:, :r]], axis=1)
    a = sum(k[i] * p[:, i:i + a.shape[1]] for i in range(2 * r + 1))
    p = np.concatenate([np.repeat(a[:1], r, 0), a, np.repeat(a[-1:], r, 0)], axis=0)
    return sum(k[i] * p[i:i + a.shape[0]] for i in range(2 * r + 1))


def make_normal(src: str, out: str, preview: str | None) -> None:
    topo = np.asarray(load(os.path.join(src, 'earth-topology.png'), 'L'), np.float32) / 255.0
    h, w = topo.shape
    assert (w, h) == (2048, 1024), (w, h)
    # Gentle smoothing removes 8-bit terracing; the power curve lifts mid-height ranges (Alps,
    # Rockies) relative to Tibet so mountains stay readable without noisy lowlands.
    z = wrap_blur(topo, 1.1) ** 0.8
    # Sobel with east-west wrap; rows run north -> south.
    zp = np.concatenate([z[:, -1:], z, z[:, :1]], axis=1)
    zp = np.concatenate([zp[:1], zp, zp[-1:]], axis=0)
    c = zp[1:-1]
    north, south = zp[:-2], zp[2:]
    gx = ((c[:, 2:] - c[:, :-2]) * 2 + (north[:, 2:] - north[:, :-2]) + (south[:, 2:] - south[:, :-2])) / 8.0
    gy = ((north[:, 1:-1] - south[:, 1:-1]) * 2 + (north[:, 2:] - south[:, 2:]) + (north[:, :-2] - south[:, :-2])) / 8.0
    lat, _ = lat_lon_grid(w, h)
    coslat = np.cos(lat)[:, None]
    # East-west pixels shrink by cos(latitude): scale that gradient up, clamped near the poles,
    # and fade the whole relief over the last few degrees so the poles never pinch.
    gx = gx / np.maximum(coslat, 0.12)
    polar_fade = smoothstep(0.0, 0.10, coslat)  # 0 at the pole, 1 below ~84 degrees
    strength = 9.0
    nx = -strength * gx * polar_fade
    ny = -strength * gy * polar_fade
    # Soft limit on the slope (tan of the tilt) so ice-sheet edges and the Himalaya stay
    # under ~50 degrees instead of turning into hard ridges at glancing light.
    slope = np.sqrt(nx * nx + ny * ny)
    soft = 1.0 / np.sqrt(1.0 + (slope / 1.4) ** 2)
    nx, ny = nx * soft, ny * soft
    nz = np.ones_like(nx)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx * inv, ny * inv, nz * inv
    rgb = np.stack([128 + 127 * nx, 128 + 127 * ny, 128 + 127 * nz], axis=-1)
    rgb = np.clip(np.rint(rgb), 0, 255).astype(np.uint8)
    flat = rgb[topo == 0].reshape(-1, 3)
    if len(flat):
        uniq, counts = np.unique(flat, axis=0, return_counts=True)
        print(f'  normal: most common ocean value {tuple(int(v) for v in uniq[counts.argmax()])}, max tilt {math.degrees(math.acos(float(nz.min()))):.1f} deg')
    save_webp(Image.fromarray(rgb, 'RGB'), os.path.join(out, 'normal-2k.webp'), 90, BUDGET['normal-2k.webp'])
    if preview:
        # Hillshade check: light from the north-west, as on printed relief maps.
        light = np.array([-1.0, 1.0, 1.4])
        light /= np.linalg.norm(light)
        shade = np.clip(nx * light[0] + ny * light[1] + nz * light[2], 0, 1)
        Image.fromarray((shade / shade.max() * 255).astype(np.uint8)).resize((1024, 512), Image.LANCZOS).save(os.path.join(preview, 'normal-hillshade.png'))


# ----------------------------------------------------------------------------------------------
# water: ocean mask, white = water. Rivers (1-2 px lines in the source) are removed with a
# morphological opening so only seas and large lakes stay.


def make_water(src: str, out: str) -> None:
    m = load(os.path.join(src, 'earth-water.png'), 'L')
    m = m.point(lambda v: 255 if v >= 128 else 0)
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    m = resize(m, 1024, 512).filter(ImageFilter.GaussianBlur(0.6))
    a = np.asarray(m, np.float32) / 255
    lat, _ = lat_lon_grid(1024, 512)
    wgt = np.cos(lat)[:, None] * np.ones_like(a)
    print(f'  water: {100 * (a * wgt).sum() / wgt.sum():.1f} % of the surface is water (Earth: about 71 %)')
    save_webp(m, os.path.join(out, 'water-1k.webp'), 82, BUDGET['water-1k.webp'])


# ----------------------------------------------------------------------------------------------
# clouds: generated. 3-D gradient noise sampled on the unit sphere (no seam, no pole pinch),
# domain-warped fBm, mid-latitude cyclone swirls, and a latitude coverage profile: ITCZ band,
# clear subtropics, cloudy storm tracks and Southern Ocean, moderate polar caps.

_GRAD = np.array([[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
                  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1], [1, 1, 0], [-1, 1, 0], [0, -1, 1], [0, -1, -1]], np.float32)


class Noise3:
    """Improved Perlin gradient noise in 3-D, vectorised over arrays of points."""

    def __init__(self, seed: int) -> None:
        rng = np.random.default_rng(seed)
        p = rng.permutation(256)
        self.perm = np.concatenate([p, p]).astype(np.int32)

    def __call__(self, x: np.ndarray, y: np.ndarray, z: np.ndarray) -> np.ndarray:
        perm = self.perm
        xf, yf, zf = np.floor(x), np.floor(y), np.floor(z)
        xi = xf.astype(np.int32) & 255
        yi = yf.astype(np.int32) & 255
        zi = zf.astype(np.int32) & 255
        x, y, z = (x - xf).astype(np.float32), (y - yf).astype(np.float32), (z - zf).astype(np.float32)
        u = x * x * x * (x * (x * 6 - 15) + 10)
        v = y * y * y * (y * (y * 6 - 15) + 10)
        w = z * z * z * (z * (z * 6 - 15) + 10)
        a, b = perm[xi] + yi, perm[xi + 1] + yi
        aa, ab, ba, bb = perm[a] + zi, perm[a + 1] + zi, perm[b] + zi, perm[b + 1] + zi

        def g(hsh: np.ndarray, dx: np.ndarray, dy: np.ndarray, dz: np.ndarray) -> np.ndarray:
            gr = _GRAD[hsh & 15]
            return gr[..., 0] * dx + gr[..., 1] * dy + gr[..., 2] * dz

        x1, y1, z1 = x - 1, y - 1, z - 1
        l1 = g(perm[aa], x, y, z) + u * (g(perm[ba], x1, y, z) - g(perm[aa], x, y, z))
        l2 = g(perm[ab], x, y1, z) + u * (g(perm[bb], x1, y1, z) - g(perm[ab], x, y1, z))
        l3 = g(perm[aa + 1], x, y, z1) + u * (g(perm[ba + 1], x1, y, z1) - g(perm[aa + 1], x, y, z1))
        l4 = g(perm[ab + 1], x, y1, z1) + u * (g(perm[bb + 1], x1, y1, z1) - g(perm[ab + 1], x, y1, z1))
        m1 = l1 + v * (l2 - l1)
        m2 = l3 + v * (l4 - l3)
        return m1 + w * (m2 - m1)


def fbm(noise: Noise3, p: np.ndarray, freq: float, octaves: int, gain: float = 0.5, lac: float = 2.03) -> np.ndarray:
    total = np.zeros(p.shape[:-1], np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        # Offset every octave so lattice points never line up.
        off = 17.31 * (o + 1)
        total += amp * noise(p[..., 0] * freq + off, p[..., 1] * freq - off * 0.7, p[..., 2] * freq + off * 1.3)
        norm += amp
        amp *= gain
        freq *= lac
    return total / norm


def rotate(p: np.ndarray, axis: np.ndarray, ang: np.ndarray) -> np.ndarray:
    """Rodrigues rotation of points p (..., 3) about a unit axis by per-point angles."""
    c, s = np.cos(ang)[..., None], np.sin(ang)[..., None]
    k = axis[None, None, :]
    return p * c + np.cross(k, p) * s + k * (p @ axis)[..., None] * (1 - c)


def unit(lat_deg: float, lon_deg: float) -> np.ndarray:
    la, lo = math.radians(lat_deg), math.radians(lon_deg)
    return np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])


def make_clouds(out: str, preview: str | None, w: int = 2048, h: int = 1024) -> None:
    t0 = time.time()
    lat, lon = lat_lon_grid(w, h)
    LAT, LON = np.meshgrid(lat, lon, indexing='ij')
    p = np.stack([np.cos(LAT) * np.cos(LON), np.cos(LAT) * np.sin(LON), np.sin(LAT)], axis=-1).astype(np.float32)
    latd = np.degrees(LAT).astype(np.float32)
    rng = np.random.default_rng(20261007)
    n_warp, n_base, n_detail, n_low = Noise3(11), Noise3(23), Noise3(37), Noise3(53)

    # 1. Cyclones: twist the sampling domain around storm centres in both storm tracks.
    #    Counter-clockwise inflow in the north, clockwise in the south (seen from space).
    q = p.copy()
    centres = []
    for hemi in (1, -1):
        for _ in range(7 if hemi > 0 else 8):
            centres.append((hemi * rng.uniform(40, 64), rng.uniform(-180, 180), hemi))
    for cl, co, hemi in centres:
        axis = unit(cl, co).astype(np.float32)
        d = np.arccos(np.clip(p @ axis, -1, 1))  # angular distance, radians
        radius = math.radians(rng.uniform(7, 12))
        twist = rng.uniform(2.2, 3.6) * np.exp(-((d / radius) ** 2))
        q = rotate(q, axis, (-hemi * twist).astype(np.float32))
    # A few tropical storms and weaker eddies at lower latitudes.
    for _ in range(4):
        hemi = rng.choice([1, -1])
        axis = unit(hemi * rng.uniform(12, 24), rng.uniform(-180, 180)).astype(np.float32)
        d = np.arccos(np.clip(p @ axis, -1, 1))
        twist = rng.uniform(2.5, 3.5) * np.exp(-((d / math.radians(rng.uniform(3, 5))) ** 2))
        q = rotate(q, axis, (-hemi * twist).astype(np.float32))
    print(f'  clouds: swirls {time.time() - t0:.1f}s')

    # 2. Zonal stretch: weather systems are wider east-west than north-south.
    qs = q * np.array([1.0, 1.0, 1.7], np.float32)

    # 3. Domain warp, then fBm.
    wv = np.stack([fbm(n_warp, qs + o, 1.6, 4) for o in (0.0, 5.2, 9.7)], axis=-1)
    qw = qs + 0.55 * wv
    base = fbm(n_base, qw, 2.2, 8, gain=0.52)
    detail = fbm(n_detail, qw * np.array([1.0, 1.0, 1.4], np.float32), 14.0, 4, gain=0.55)
    low = fbm(n_low, p, 1.3, 3)  # large-scale longitude variation of cloudiness
    print(f'  clouds: noise {time.time() - t0:.1f}s')

    # 4. Coverage profile by latitude (fraction of sky with cloud), with an ITCZ that wanders.
    itcz = 6.0 + 3.0 * np.sin(LON * 2 + 0.6).astype(np.float32) + 4.0 * low
    cov = (0.30
           + 0.48 * gauss(latd, itcz, 4.5)            # ITCZ: a narrow band of tall convection
           - 0.14 * gauss(np.abs(latd), 24.0, 7.0)    # subtropical highs: mostly clear
           + 0.42 * gauss(latd, 54.0, 11.0)           # northern storm track
           + 0.52 * gauss(latd, -56.0, 10.0)          # Southern Ocean: the cloudiest place on Earth
           + 0.14 * gauss(np.abs(latd), 86.0, 10.0))  # polar caps
    cov = np.clip(cov * (1.0 + 0.55 * low), 0.08, 0.92)

    # 5. Threshold the field at the quantile that gives that coverage, with soft edges.
    nb = (base - base.mean()) / base.std()
    qs_ = np.linspace(0, 1, 1001)
    table = np.quantile(nb[::4, ::4], qs_)
    thr = np.interp(1.0 - cov, qs_, table)
    dd = nb - thr
    alpha = smoothstep(-0.18, 1.05, dd) ** 1.1
    # Texture inside the clouds and wispy fringes.
    alpha = alpha * (0.78 + 0.22 * np.clip(detail * 2.2 + 0.5, 0, 1))
    alpha += 0.10 * smoothstep(-0.55, 0.0, dd) * np.clip(detail * 3 + 0.4, 0, 1)
    alpha = np.clip(alpha, 0, 1)
    img = Image.fromarray(np.clip(alpha * 255 + 0.5, 0, 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.5))
    a = np.asarray(img, np.float32) / 255
    wgt = np.cos(LAT)
    print(f'  clouds: mean alpha {(a * wgt).sum() / wgt.sum():.2f}, area with alpha > 0.2: {100 * (wgt * (a > 0.2)).sum() / wgt.sum():.0f} %, '
          f'seam diff {np.abs(a[:, 0] - a[:, -1]).mean():.3f} vs neighbours {np.abs(a[:, 1] - a[:, 0]).mean():.3f}  ({time.time() - t0:.1f}s)')
    save_webp(img, os.path.join(out, 'clouds-2k.webp'), 82, BUDGET['clouds-2k.webp'])


# ----------------------------------------------------------------------------------------------


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', required=True, help="three-globe's package/example/img directory")
    ap.add_argument('--out', required=True, help='output directory (public/textures/earth)')
    ap.add_argument('--preview', help='optional directory for check images')
    ap.add_argument('--only', default='day,night,normal,water,clouds')
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    if args.preview:
        os.makedirs(args.preview, exist_ok=True)
    only = set(args.only.split(','))
    steps = [('day', lambda: make_day(args.src, args.out)), ('night', lambda: make_night(args.src, args.out)),
             ('normal', lambda: make_normal(args.src, args.out, args.preview)), ('water', lambda: make_water(args.src, args.out)),
             ('clouds', lambda: make_clouds(args.out, args.preview))]
    for name, fn in steps:
        if name in only:
            print(name)
            fn()
    total = sum(os.path.getsize(os.path.join(args.out, f)) for f in BUDGET if os.path.exists(os.path.join(args.out, f)))
    print(f'total {total / 1e6:.2f} MB')


if __name__ == '__main__':
    sys.exit(main())
