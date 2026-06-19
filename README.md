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

### From the Chrome Web Store

Install **Better VBTV** directly: https://chromewebstore.google.com/detail/better-vbtv/hfmjokcmjjoabfiikfgonfbnmmbakgfj

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

## Releasing

Publishing is automated by [`.github/workflows/release.yml`](.github/workflows/release.yml). Cut a **GitHub Release** with a `vX.Y` tag and the workflow builds both targets, names the version from the tag, attaches the packaged zips to the release, and pushes to each store.

Chrome, Edge, and Opera all ship the same Chromium build (`dist/chromium/`); Firefox ships the Gecko build (`dist/firefox/`). Each store job no-ops until its secrets exist. The store jobs run in an optional `store-release` GitHub Environment — leave it unprotected for hands-off releases, or add required reviewers there if you ever want a manual gate.

| Store | Automated? | Secrets / setup |
|-------|-----------|-----------------|
| **Chrome Web Store** | **Submits for review** (auto-publishes when approved) | `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN` ([API setup](https://developer.chrome.com/docs/webstore/using-api)) |
| **Edge Add-ons** | Uploads & **submits for review** | `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_API_KEY` (Partner Center → Publish API) |
| **Firefox (AMO)** | Signs & **submits for review** | `AMO_JWT_ISSUER`, `AMO_JWT_SECRET` ([API keys](https://addons.mozilla.org/developers/addon/api/key/)) |
| **Opera** | Manual — no API | Upload the `better-vbtv-chromium.zip` release asset at the [Opera dashboard](https://addons.opera.com/developer/) |

### What else you need to publish on Firefox

- A free **Firefox Add-on Developer (AMO)** account.
- Mozilla **signs** the add-on for you on upload — no separate signing step.
- Because the build is bundled/minified, AMO review requires a **source-code submission** with build steps. This repo's `pnpm install` + `pnpm build:firefox` instructions satisfy that; point reviewers at this README.
- Since the extension collects no data, declare **"No"** for data collection in the submission form (we keep `strict_min_version` at 115, so the newer `data_collection_permissions` manifest key — which requires Firefox 140+ — is intentionally omitted).
- Listing assets: icons (included), at least one screenshot, a description, and a privacy policy ([PRIVACY.md](PRIVACY.md)).

## Tech

Built with [SolidJS](https://www.solidjs.com/) + [Vite](https://vitejs.dev/) via [`@crxjs/vite-plugin`](https://crxjs.dev/). Manifest V3. A small [`src/utils/browser.ts`](src/utils/browser.ts) shim keeps the same source running on Chrome (`chrome`) and Firefox (`browser`).

## Privacy

No data collection, no analytics, no external requests beyond the public JW Player feed used to fetch a video's title and poster for history. Details in [PRIVACY.md](PRIVACY.md).

## License

ISC — see [LICENSE](LICENSE).
