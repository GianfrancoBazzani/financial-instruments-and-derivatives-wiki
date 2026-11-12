import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;

// Run `pnpm build` first: the tests use the built site through `pnpm preview`.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // --ignore-lock: without it astro preview detaches to the background and Playwright sees the process exit.
    command: `pnpm preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/`,
    // A taken port fails loudly: never test a stale server.
    reuseExistingServer: false,
  },
});
