import { defineConfig, devices } from '@playwright/test'

const PORT = 4317

/**
 * Smoke tests against the real production build: the same prerendered HTML and
 * bundles that GitHub Pages serves. `npm test` builds first, then previews.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /responsive\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /responsive\.spec/ },
    // Every page at every breakpoint, with screenshots: `npm run test:responsive`.
    { name: 'responsive', use: { ...devices['Desktop Chrome'] }, testMatch: /responsive\.spec/ },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    // The chatbot's AI is a fake host: tests answer it themselves, or it is
    // blocked and the chatbot falls back to its built-in answers.
    env: { VITE_CHAT_API_URL: 'https://chat.invalid' },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
