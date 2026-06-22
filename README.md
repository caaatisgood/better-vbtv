# Better VBTV

A browser extension (Chrome & Firefox) that makes watching [VBTV (Volleyball World TV)](https://tv.volleyballworld.com) replays better — **spoiler-free**, with keyboard controls, playback speed, and an automatic watch history that remembers where you left off.

## Features

- **Spoiler-free mode** — hides match durations, timecodes, and other result-revealing UI so replays stay a surprise. Toggle from the popup or with the `s` key.
- **Keyboard seek & controls** — YouTube-style shortcuts on the player page (seek, frame-step, volume, play/pause, mute).
- **Playback speed** — speed up or slow down replays with `>` / `<`.
- **Shortcuts overlay** — press `?` on the player to see every shortcut.
- **Watch history + resume** — videos you watch are recorded automatically; reopen one and get a "Resume from mm:ss?" prompt. Browse, open, or clear history from the popup.

Everything is stored locally in your browser. Nothing is sent to any server — see [PRIVACY.md](PRIVACY.md).

## Keyboard shortcuts

Active on the `/player` page:

| Key | Action |
|-----|--------|
| `←` / `→` | Seek ∓ small step (default 5s) |
| `J` / `L` | Seek ∓ large step (default 10s) |
| `Home` / `End` | Jump to start / end |
| `,` / `.` | Step one frame back / forward |
| `<` / `>` | Decrease / increase playback speed |
| `↑` / `↓` | Volume up / down |
| `M` | Mute / unmute |
| `K` / `Space` | Play / pause |
| `s` | Toggle spoiler-free mode |
| `?` | Toggle shortcuts overlay |
| `Esc` | Close overlay |

Seek step sizes and toast font size are configurable in the popup.

## Install

### From a store

| Browser | Download |
|---------|----------|
| **Chrome / Chromium** (Edge, Opera, Brave…) | [Chrome Web Store](https://chromewebstore.google.com/detail/better-vbtv/hfmjokcmjjoabfiikfgonfbnmmbakgfj) |
| **Firefox** | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/better-vbtv/) |

### From source

```bash
pnpm install
pnpm build       # Chrome  → dist/chromium/
pnpm build:firefox # Firefox → dist/firefox/
```

Then load it in **Chrome**:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/chromium/` folder

…or in **Firefox**:

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select any file inside the `dist/firefox/` folder (e.g. `manifest.json`)

> Temporary add-ons are removed when Firefox restarts. For a packaged build run `pnpm zip:firefox` (produces `dist/better-vbtv-firefox.zip`).

### Development

```bash
pnpm dev           # Chrome:  vite dev server with HMR
pnpm dev:firefox   # Firefox: vite dev server with HMR
```

## Tech

Built with [SolidJS](https://www.solidjs.com/) + [Vite](https://vitejs.dev/) via [`@crxjs/vite-plugin`](https://crxjs.dev/). Manifest V3. A small [`src/utils/browser.ts`](src/utils/browser.ts) shim keeps the same source running on Chrome (`chrome`) and Firefox (`browser`).

## Privacy

No data collection, no analytics, no external requests beyond the public JW Player feed used to fetch a video's title and poster for history. Details in [PRIVACY.md](PRIVACY.md).

## License

ISC — see [LICENSE](LICENSE).
