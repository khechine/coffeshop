import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/domains/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domains/**/*.ts'],
      exclude: ['src/domains/**/*.spec.ts', 'src/domains/index.ts'],
    },
  },
});
