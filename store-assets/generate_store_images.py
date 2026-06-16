#!/usr/bin/env python3
import base64, io, os
from generate_icons import background, icon

OUT = os.path.dirname(os.path.abspath(__file__))
HTML = f"{OUT}/html"; os.makedirs(HTML, exist_ok=True)

def b64(img):
    buf = io.BytesIO(); img.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

LOGO = b64(icon(256, grain=0.06))
LOGO_S = b64(icon(96, grain=0.05))
BG_HERO = b64(background(1280, 800))
BG_HERO2 = b64(background(1280, 800, seed=42))
BG_MARQ = b64(background(1400, 560, seed=21))
BG_TILE = b64(background(440, 280, seed=31))

FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace"

# ---- popup card replica (spoiler-free ON state) ----
SHORTCUTS = [
    ("?", "Show / hide shortcuts panel"),
    ("s", "Toggle spoiler-free mode"),
    ("← →", "Seek (small interval)"),
    ("j l", "Seek (large interval)"),
    ("space k", "Play / pause"),
    ("&lt; &gt;", "Slow down / speed up"),
    ("↑ ↓ m", "Volume / mute"),
    (", .", "Frame step (paused)"),
    ("Home End", "Jump to start / end"),
]
shortcut_rows = "".join(
    f'<div class="srow"><kbd class="kfix">{k}</kbd><span>{l}</span></div>' for k, l in SHORTCUTS
)

POPUP_CSS = f"""
.popup{{font-family:{FONT};background:#18181b;color:#fff;padding:16px;font-size:16px;width:320px;
  border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.06);box-sizing:border-box}}
.popup p{{margin:0}}
.title{{font-weight:400;font-size:20px;margin:0 0 20px}}
.toggleRow{{margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}}
.status{{color:#9ca3af;display:flex;align-items:center;font-size:20px}}
.status span{{font-size:12px}}
.hint{{color:#6b7280;font-size:11px}}
.divider{{margin:24px 0 16px;border:none;border-top:1px solid #333}}
.section{{display:flex;flex-direction:column;gap:8px}}
.sectionTitle{{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#818cf8;margin:0 0 4px}}
.field{{display:flex;align-items:center;justify-content:space-between}}
.field label{{display:inline-flex;align-items:center;gap:3px}}
.field input{{width:64px;padding:5px 8px;background:#27272a;color:#fff;border:1px solid #3f3f46;border-radius:6px;font-size:13.6px;font-family:{FONT}}}
.shortcuts{{display:flex;flex-direction:column;gap:5px}}
.srow{{display:flex;align-items:center;gap:10px;font-size:12.5px;color:#d4d4d8}}
.popup kbd{{display:inline-block;min-width:17px;text-align:center;padding:1px 6px;font-family:{MONO};
  font-size:11px;color:#e4e4e7;background:#27272a;border:1px solid #3f3f46;border-bottom-width:2px;border-radius:5px}}
.kfix{{flex:0 0 84px}}
.footer{{font-family:{MONO};font-size:12px;color:#9ca3af}}
.footer a{{color:inherit;text-decoration:underline}}
.footer p+p{{margin-top:4px}}
.sw{{position:relative;display:inline-block;width:40px;height:20px;flex:none}}
.sw .slider{{position:absolute;inset:0;background:#2196F3;border-radius:20px}}
.sw .slider:before{{content:"";position:absolute;height:16px;width:16px;left:2px;bottom:2px;background:#fff;border-radius:50%;transform:translateX(20px)}}
"""

POPUP_HTML = f"""
<div class="popup">
  <h1 class="title">Better VBTV</h1>
  <div class="toggleRow">
    <p>Spoiler-free mode <span class="hint">press <kbd>s</kbd></span></p>
    <span class="sw"><span class="slider"></span></span>
  </div>
  <div><p class="status">😌&nbsp;<span>Spoilers will be hidden across VBTV</span></p></div>
  <hr class="divider"/>
  <div class="section">
    <p class="sectionTitle">Seek intervals (seconds)</p>
    <div class="field"><label><kbd>←</kbd> <kbd>→</kbd></label><input value="5"/></div>
    <div class="field"><label><kbd>j</kbd> <kbd>l</kbd></label><input value="10"/></div>
  </div>
  <hr class="divider"/>
  <div class="section">
    <p class="sectionTitle">Keyboard shortcuts <span class="hint">press <kbd>?</kbd> on VBTV</span></p>
    <div class="shortcuts">{shortcut_rows}</div>
  </div>
  <hr class="divider"/>
  <div class="footer">
    <p>created by caaatisgood</p>
    <p><a>feedback or bug reports 💬</a></p>
  </div>
</div>
"""

PAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
*{{box-sizing:border-box}} html,body{{margin:0}}
body{{width:{W}px;height:{H}px;overflow:hidden;font-family:{FONT};
  background:#0e0e11 url('{BG}') center/cover no-repeat;position:relative}}
{POPUP_CSS}
{EXTRA}
</style></head><body>{BODY}</body></html>"""

def page(name, w, h, bg, body, extra=""):
    html = PAGE.format(W=w, H=h, FONT=FONT, BG=bg, POPUP_CSS=POPUP_CSS, EXTRA=extra, BODY=body)
    with open(f"{HTML}/{name}.html", "w") as f:
        f.write(html)

# ===== Screenshot 1: hero — popup + headline =====
s1_extra = f"""
.wrap{{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 90px}}
.left{{max-width:560px}}
.brand{{display:flex;align-items:center;gap:18px;margin-bottom:34px}}
.brand img{{width:72px;height:72px;border-radius:18px;box-shadow:0 12px 30px rgba(0,0,0,.5)}}
.brand .nm{{font-size:30px;font-weight:600;color:#fff;letter-spacing:-.5px}}
.h1{{font-size:62px;line-height:1.04;font-weight:800;color:#fff;letter-spacing:-1.5px;margin:0 0 26px}}
.h1 .y{{color:#FDB813}}
.sub{{font-size:24px;line-height:1.45;color:#d4d4d8;font-weight:400;margin:0}}
.card{{transform:scale(1.18);transform-origin:right center}}
"""
s1_body = f"""<div class="wrap">
  <div class="left">
    <div class="brand"><img src="{LOGO_S}"/><span class="nm">Better VBTV</span></div>
    <h1 class="h1">Watch volleyball replays, <span class="y">zero spoilers.</span></h1>
    <p class="sub">Scores, brackets and thumbnails stay hidden on Volleyball World TV — until you decide to look.</p>
  </div>
  <div class="card">{POPUP_HTML}</div>
</div>"""
page("shot1", 1280, 800, BG_HERO, s1_body, s1_extra)

# ===== Screenshot 2: shortcuts / controls =====
s2_extra = f"""
.wrap2{{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 90px}}
.right{{max-width:520px;text-align:left}}
.h2{{font-size:58px;line-height:1.05;font-weight:800;color:#fff;letter-spacing:-1.4px;margin:0 0 22px}}
.h2 .o{{color:#FF6A2B}}
.sub2{{font-size:23px;line-height:1.5;color:#d4d4d8;margin:0 0 30px}}
.keys{{display:flex;flex-wrap:wrap;gap:12px}}
.bigk{{font-family:{MONO};font-size:20px;color:#fff;background:rgba(39,39,42,.85);border:1px solid #52525b;
  border-bottom-width:4px;border-radius:10px;padding:10px 16px}}
.card2{{transform:scale(1.22);transform-origin:left center}}
"""
s2_body = f"""<div class="wrap2">
  <div class="card2">{POPUP_HTML}</div>
  <div class="right">
    <h2 class="h2">Keyboard <span class="o">superpowers.</span></h2>
    <p class="sub2">Seek, change speed, frame-step and pull up a shortcuts overlay — all without touching the mouse.</p>
    <div class="keys">
      <span class="bigk">← →</span><span class="bigk">j&nbsp;&nbsp;l</span>
      <span class="bigk">&lt; &gt;</span><span class="bigk">space</span>
      <span class="bigk">,&nbsp;&nbsp;.</span><span class="bigk">?</span>
    </div>
  </div>
</div>"""
page("shot2", 1280, 800, BG_HERO2, s2_body, s2_extra)

# ===== Marquee 1400x560 =====
mq_extra = f"""
.mq{{position:absolute;inset:0;display:flex;align-items:center;gap:60px;padding:0 110px}}
.mq img{{width:200px;height:200px;border-radius:46px;box-shadow:0 24px 60px rgba(0,0,0,.55)}}
.mqnm{{font-size:74px;font-weight:800;color:#fff;letter-spacing:-2px;margin:0 0 14px}}
.mqsub{{font-size:30px;color:#e4e4e7;margin:0;font-weight:400}}
.mqsub .y{{color:#FDB813}}
"""
mq_body = f"""<div class="mq"><img src="{LOGO}"/>
  <div><p class="mqnm">Better VBTV</p>
  <p class="mqsub">Volleyball replays, <span class="y">spoiler-free</span> — plus keyboard seek & speed.</p></div>
</div>"""
page("marquee", 1400, 560, BG_MARQ, mq_body, mq_extra)

# ===== Small tile 440x280 =====
tile_extra = f"""
.tile{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px}}
.tile img{{width:120px;height:120px;border-radius:30px;box-shadow:0 16px 40px rgba(0,0,0,.55)}}
.tilenm{{font-size:34px;font-weight:800;color:#fff;letter-spacing:-1px;margin:0}}
.tilesub{{font-size:16px;color:#FDB813;margin:0;font-weight:500}}
"""
tile_body = f"""<div class="tile"><img src="{LOGO}"/>
  <p class="tilenm">Better VBTV</p><p class="tilesub">spoiler-free volleyball</p></div>"""
page("tile", 440, 280, BG_TILE, tile_body, tile_extra)

print("html built ->", HTML)
for n in ["shot1","shot2","marquee","tile"]:
    print(" ", f"{HTML}/{n}.html")
