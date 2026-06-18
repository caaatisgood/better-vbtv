# Better VBTV

A Chrome extension that makes watching [VBTV (Volleyball World TV)](https://tv.volleyballworld.com) replays better — **spoiler-free**, with keyboard controls, playback speed, and an automatic watch history that remembers where you left off.

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

### From the Chrome Web Store

Install **Better VBTV** directly: https://chromewebstore.google.com/detail/better-vbtv/hfmjokcmjjoabfiikfgonfbnmmbakgfj

### From source

```bash
pnpm install
pnpm build       # outputs to dist/
```

Then load it in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

### Development

```bash
pnpm dev         # vite dev server with HMR
```

## Tech

Built with [SolidJS](https://www.solidjs.com/) + [Vite](https://vitejs.dev/) via [`@crxjs/vite-plugin`](https://crxjs.dev/). Manifest V3.

## Privacy

No data collection, no analytics, no external requests beyond the public JW Player feed used to fetch a video's title and poster for history. Details in [PRIVACY.md](PRIVACY.md).

## License

ISC — see [LICENSE](LICENSE).
