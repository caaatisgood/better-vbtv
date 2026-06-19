import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { crx } from '@crxjs/vite-plugin'
import baseManifest from './manifest.json'

// Target browser, selected via `BROWSER=firefox`. Defaults to Chrome.
const browser = process.env.BROWSER === 'firefox' ? 'firefox' : 'chrome';

// Firefox needs an explicit add-on id (and minimum version that supports MV3).
// Chrome ignores `browser_specific_settings`, so we only add it for Firefox.
const manifest = browser === 'firefox'
  ? {
      ...baseManifest,
      browser_specific_settings: {
        gecko: {
          id: 'better-vbtv@caaatisgood',
          strict_min_version: '115.0',
        },
      },
    }
  : baseManifest;

export default defineConfig({
  plugins: [
    solidPlugin(),
    crx({ manifest, browser }),
  ],
  server: {
    port: 3000,
  },
  define: {
    __DEBUG__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    // Keep Chrome and Firefox artifacts side by side.
    outDir: browser === 'firefox' ? 'dist-firefox' : 'dist',
  },
});
