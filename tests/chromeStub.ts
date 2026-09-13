// Minimal stand-in for the slice of the extension API the units under test
// touch: `chrome.storage.local` get/set, plus no-op listener registration.
//
// utils/browser resolves the extension API at module-eval time
// (`globalThis.browser ?? globalThis.chrome`), so the stub has to be installed
// before any module under test is imported — hence a setupFile, not per-test
// wiring.

const store = new Map<string, unknown>();

/** Drop all stored keys. Call between tests so state does not leak. */
export function resetChromeStorage(): void {
  store.clear();
}

export function installChromeStub(): void {
  const stub = {
    storage: {
      local: {
        async get(keys: string[]): Promise<Record<string, unknown>> {
          const out: Record<string, unknown> = {};
          for (const key of keys) {
            if (store.has(key)) out[key] = store.get(key);
          }
          return out;
        },
        async set(items: Record<string, unknown>): Promise<void> {
          for (const [key, value] of Object.entries(items)) {
            store.set(key, value);
          }
        },
      },
      onChanged: {
        addListener: () => {},
        removeListener: () => {},
      },
    },
    runtime: {
      onMessage: {
        addListener: () => {},
      },
    },
  };

  (globalThis as unknown as { chrome: unknown }).chrome = stub;
}
