import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    solidPlugin(),
    crx({ manifest }),
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
  },
});
