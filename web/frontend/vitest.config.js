import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config.js'
export default defineConfig({
  ...viteConfig,
  test: {
    globals: true,
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'test/e2e'],
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}']
  }
})
