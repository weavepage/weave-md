import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.{js,ts}', 'tests/**/*.test.{js,ts}'],
    globals: true
  }
})
