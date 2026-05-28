import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for NoteVault end-to-end tests.
 *
 * Spin-up assumptions (covered by `webServer` below):
 *   - Postgres is reachable at $E2E_DATABASE_URL (default points at the
 *     docker-compose stack from deploy/).
 *   - The backend is built (`cd ../backend && npm run build`) so that
 *     `node dist/server.js` is fast and deterministic on each run.
 *   - The frontend is served via `vite preview` on :4173 to mirror what
 *     production users hit.
 *
 * The global setup in `tests/global-setup.ts` resets the DB before the
 * first test so each run starts from a known-empty state.
 */

const E2E_FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 4173);
const E2E_BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT ?? 3101);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // shared DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: "./tests/global-setup.ts",

  use: {
    baseURL: `http://127.0.0.1:${E2E_FRONTEND_PORT}`,
    actionTimeout: 7_000,
    navigationTimeout: 15_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      name: "backend",
      command: "npm --prefix ../backend run start",
      url: `http://127.0.0.1:${E2E_BACKEND_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        PORT: String(E2E_BACKEND_PORT),
        NODE_ENV: "test",
        LOG_LEVEL: "warn",
        DATABASE_URL:
          process.env.E2E_DATABASE_URL ??
          "postgres://notevault:notevault@localhost:5432/notevault_e2e",
        JWT_SECRET: "e2e-secret-padding-padding-1234",
        JWT_EXPIRES_IN: "1h",
        CORS_ORIGIN: `http://127.0.0.1:${E2E_FRONTEND_PORT}`,
      },
    },
    {
      name: "frontend",
      command: `npm --prefix ../frontend run preview -- --host 127.0.0.1 --port ${E2E_FRONTEND_PORT} --strictPort`,
      url: `http://127.0.0.1:${E2E_FRONTEND_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        VITE_API_URL: `http://127.0.0.1:${E2E_BACKEND_PORT}/api`,
      },
    },
  ],
});
