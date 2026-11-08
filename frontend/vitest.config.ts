import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { buildInfoDefines } from './build-info.ts';

export default defineConfig({
  plugins: [react()],
  define: buildInfoDefines(),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright specs live in e2e/ and must not run under vitest
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@components': resolve(import.meta.dirname, 'src/components'),
      '@pages': resolve(import.meta.dirname, 'src/pages'),
      '@assets': resolve(import.meta.dirname, 'src/assets'),
      '@styles': resolve(import.meta.dirname, 'src/stylesheets'),
    },
  },
});
