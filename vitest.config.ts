import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/renderer/shared/**',
        'src/renderer/features/*/service/**',
        'src/shared/util/**',
        'src/main/ipc/**',
      ],
      exclude: ['**/*.test.*', '**/*.d.ts', 'src/renderer/shared/api/db.types.ts'],
      thresholds: { lines: 80, statements: 80, functions: 75, branches: 70 },
    },
  },
});
