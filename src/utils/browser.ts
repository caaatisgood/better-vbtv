// Cross-browser extension API.
//
// Firefox exposes a promise-based `browser` global; Chrome (MV3) exposes a
// promise-based `chrome` global. Both share the same API shape, so prefer
// `browser` when present and fall back to `chrome`. This lets the rest of the
// codebase `await` storage/tabs/runtime calls identically in either browser.
const ext: typeof chrome =
  (globalThis as unknown as { browser?: typeof chrome }).browser ?? globalThis.chrome;

export default ext;
