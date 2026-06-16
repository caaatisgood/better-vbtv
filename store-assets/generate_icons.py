#!/usr/bin/env python3
"""Better VBTV logo — Mikasa 2026 palette as a blended diagonal gradient sweep.

Single soft bend (no repeating bands) so it reads as an abstract gradient orb,
not a volleyball. Yellow -> warm orange -> navy, extremes compressed toward
center for heavy blend. Grain particles keep it sharp.
"""
import numpy as np
from PIL import Image
import os

YELLOW = np.array([253, 184, 19], float)
ORANGE = np.array([247, 85,  28], float)   # vivid bright orange
NAVY   = np.array([ 30, 38, 140], float)
NAVY_D = np.array([ 22, 26,  96], float)

# orange holds a plateau in the middle so it reads strongly, not as a thin edge
STOPS = [(0.0, YELLOW), (0.30, ORANGE), (0.52, ORANGE), (0.84, NAVY), (1.0, NAVY_D)]

def ramp(u, stops):
    pos = np.array([p for p, _ in stops]); cols = np.array([c for _, c in stops])
    out = np.empty(u.shape + (3,), float)
    for k in range(3):
        out[..., k] = np.interp(u, pos, cols[:, k])
    return out

# ---------- ICON (blended sweep, circular) ----------
def icon(size, supersample=4, grain=0.07, seed=7, amp=0.45, w2=0.18, squash=0.82, lo=-1.05, hi=1.05):
    S = size * supersample
    yy, xx = np.mgrid[0:S, 0:S].astype(float)
    x = (xx / S) * 2 - 1; y = (yy / S) * 2 - 1
    a = np.deg2rad(-38)
    t = x * np.cos(a) + y * np.sin(a); p = -x * np.sin(a) + y * np.cos(a)
    tb = t + amp * np.sin(1.4 * p + 0.5) + w2 * np.sin(3.3 * p + 1.8)     # wavy blend line
    u = np.clip((tb - lo) / (hi - lo), 0, 1)
    u = np.clip(0.5 + (u - 0.5) * squash, 0, 1)                          # compress -> blend
    img = ramp(u, STOPS)
    base = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((size, size), Image.LANCZOS)
    arr = np.asarray(base, float)
    rng = np.random.default_rng(seed)
    g = rng.normal(0, 255 * grain, (size, size, 1))
    sp = rng.random((size, size, 1)); g += np.where(sp > 0.985, 70, 0); g += np.where(sp < 0.015, -70, 0)
    arr = arr + g
    yy2, xx2 = np.mgrid[0:size, 0:size].astype(float)
    cx = (xx2 + 0.5) / size * 2 - 1; cy = (yy2 + 0.5) / size * 2 - 1
    rr = np.sqrt(cx * cx + cy * cy); edge = 1.5 / size
    alpha = np.clip((1.0 - rr) / edge + 0.5, 0, 1) * 255
    out = np.empty((size, size, 4), np.uint8)
    out[..., :3] = np.clip(arr, 0, 255).astype(np.uint8); out[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(out, "RGBA")

# ---------- BACKGROUND (dark, big blended sweep, grain, vignette) ----------
def background(w, h, grain=0.035, seed=11, darken=0.42, amp=0.30, w2=0.10, squash=0.88):
    Sf = 2; W, H = w * Sf, h * Sf
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    m = max(W, H)
    x = (xx - W / 2) / m * 2; y = (yy - H / 2) / m * 2
    a = np.deg2rad(-32)
    t = x * np.cos(a) + y * np.sin(a); p = -x * np.sin(a) + y * np.cos(a)
    tb = t + amp * np.sin(1.1 * p + 0.4) + w2 * np.sin(2.6 * p + 1.5)
    u = np.clip((tb + 1.05) / 2.10, 0, 1)
    u = np.clip(0.5 + (u - 0.5) * squash, 0, 1)
    img = ramp(u, STOPS)
    base_dark = np.array([16, 16, 20], float)
    img = base_dark * (1 - darken) + img * darken
    r = np.sqrt(x * x + y * y); vig = np.clip((1.6 - r) / 1.4, 0, 1)
    img = img * (0.55 + 0.45 * vig[..., None])
    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)
    arr = np.asarray(out, float)
    rng = np.random.default_rng(seed)
    arr = arr + rng.normal(0, 255 * grain, (h, w, 1))
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")

if __name__ == "__main__":
    o = os.path.dirname(os.path.abspath(__file__))
    icon(128, grain=0.07).save(f"{o}/icon-128.png")
    icon(48,  grain=0.05).save(f"{o}/icon-48.png")
    icon(16,  grain=0.02).save(f"{o}/icon-16.png")
    icon(256, grain=0.06).save(f"{o}/logo-256.png")
    background(1280, 800).save(f"{o}/bg_hero.png")
    background(1400, 560, seed=21).save(f"{o}/bg_marquee.png")
    background(440, 280, seed=31).save(f"{o}/bg_tile.png")
    print("assets done")
