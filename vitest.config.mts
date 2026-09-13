import { defineConfig } from 'vitest/config';

// Deliberately not reusing vite.config.mts: that config loads the crxjs plugin,
// which expects to be packaging an extension and has no role in a unit run.
export default defineConfig({
  define: {
    // vite.config.mts injects this at build time; logger.ts dereferences it, so
    // it has to exist here too or any module that calls log() throws.
    __DEBUG__: JSON.stringify(false),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
});
