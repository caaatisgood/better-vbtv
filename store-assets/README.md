# Store assets — Better VBTV

Brand visuals for the Chrome Web Store listing. Built procedurally from the
**Mikasa V200W (2026 VNL) palette** — classic yellow, purple-blue, bright
orange — as a grainy bent-ribbon swoosh (volleyball-panel feel, sharper than
the old soft gradient).

## Palette
| Role | Hex |
|------|-----|
| Yellow (field) | `#FDB813` |
| Orange (pinstripe edge) | `#F4431E` |
| Purple-blue (ribbon) | `#1E268C` |
| Deep navy (core) | `#12165C` |

## Files
| File | Size | Use |
|------|------|-----|
| `../icons/icon-{16,48,128}.png` | 16/48/128 | extension icons (in `manifest.json`) |
| `store-icon-128.png` | 128×128 | Web Store listing icon |
| `screenshot-1-spoiler-free.png` | 1280×800 | listing screenshot |
| `screenshot-2-keyboard.png` | 1280×800 | listing screenshot |
| `marquee-1400x560.png` | 1400×560 | marquee promo tile |
| `small-tile-440x280.png` | 440×280 | small promo tile |
| `logo-256.png` | 256×256 | hi-res logo |

## Regenerate
Deterministic (fixed seeds) — same output every run. Needs `numpy`, `pillow`.

```bash
cd store-assets
python3 generate_icons.py          # icons + background plates
python3 generate_store_images.py   # writes html/, then screenshot via a browser
```

`generate_icons.py` writes the PNG icons/backgrounds directly. `generate_store_images.py`
builds self-contained HTML in `html/` (brand bg + embedded logo + a pixel replica
of the popup UI); render each at its exact viewport in a headless browser to capture
the final screenshots/tiles.
