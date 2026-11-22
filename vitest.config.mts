import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // tsconfig keeps 'jsx: preserve' for Next; tests need JSX compiled (React automatic runtime).
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    // Reset every vi.fn() between tests so no stubbed behaviour leaks across tests.
    mockReset: true,
  },
});
