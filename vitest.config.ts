import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsxInject: "import React from 'react'",
  },
  test: {
    coverage: {
      exclude: ['**/*.spec.{ts,tsx}', '**/dist/**'],
      reporter: ['text', 'html', 'lcov', 'cobertura'],
    },
    deps: {
      interopDefault: true,
    },
    globals: true,
  },
});
