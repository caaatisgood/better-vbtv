import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { crx } from '@crxjs/vite-plugin'
import baseManifest from './manifest.json'

// Target browser, selected via `BROWSER=firefox`. Defaults to Chrome.
// Chrome, Edge, and Opera are all Chromium and share the "chrome" build.
const browser = process.env.BROWSER === 'firefox' ? 'firefox' : 'chrome';

// In CI the release tag drives the published version (e.g. `v1.2` -> `1.2`),
// overriding manifest.json. Locally, manifest.json's value is used.
const version = process.env.EXT_VERSION?.replace(/^v/, '');

const manifest = {
  ...baseManifest,
  ...(version ? { version } : {}),
  // Firefox needs an explicit add-on id (and a minimum version that supports
  // MV3). Chrome/Edge/Opera ignore `browser_specific_settings`.
  ...(browser === 'firefox'
    ? {
        browser_specific_settings: {
          gecko: {
            id: 'better-vbtv@caaatisgood',
            strict_min_version: '115.0',
          },
        },
      }
    : {}),
};

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
