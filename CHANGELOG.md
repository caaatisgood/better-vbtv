# Changelog

## v1.3.1 — 2026-09-13

### Changes

- Dropped two unused dependencies (`@solidjs/router`, `solid-devtools`). The content script injected into every VBTV page is ~43% smaller (28.6 KB to 16.3 KB; 10.8 KB to 5.8 KB gzipped) and the packaged extension ~14% smaller (40.1 KB to 34.6 KB). No change in behaviour.
- Updated build dependencies and the GitHub Actions behind the release pipeline.
- Pull requests are now typechecked, built for both browsers, linted, and audited for advisories in shipped dependencies before merge. (#25)

## v1.3.0 — 2026-09-12

### Features

- Audio track hotkey: press `a` to cycle through alternate audio tracks (e.g. commentary language options, ambient sound) on matches that have them. (#8)

## v1.2.0 — 2026-07-18

### Features

- Fullscreen toggle: press `f` to enter or exit fullscreen on the player. Thanks @Jasper-Nelligan.

### Fixes

- Arrow-key seeking now works after clicking the fullscreen button — the keys were being swallowed once a player control had focus. Thanks @Jasper-Nelligan.
- Player shortcuts no longer double-trigger with the built-in video.js controls: a focused seek bar or menu won't also act on the key, and keys typed in menus or inputs pass through untouched.

## v1.1.3 — 2026-07-02

### Fixes

- Re-hide the match duration on the match-selection / list screens. The runtime label had come back and spoiled set counts — a long video gives away a 3-set match. (#4)

## v1.1.2 — 2026-06-22

### Changes

- Consolidate the store listings onto a single version (Chrome was 1.1.1, Firefox 1.1.0).
- Shrink the packaged extension from ~118 KB to ~40 KB — recompressed icons and no duplicate bundled logo.
