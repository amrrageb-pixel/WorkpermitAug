import path from 'path';
import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts (which carries dev-server-only settings) so unit tests
// don't need the full plugin/proxy setup — just the module resolution the source files use.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
