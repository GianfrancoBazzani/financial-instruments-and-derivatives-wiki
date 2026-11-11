import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["tests/**/*.test.ts", "src/**/*.test.ts", "tools/**/*.test.ts"],
          exclude: ["node_modules/**", "tests/e2e/**", "tests/dist/**"],
        },
      },
      {
        test: {
          name: "jsdom",
          environment: "jsdom",
          setupFiles: ["tests/setup-dom.ts"],
          include: ["tests/**/*.test.tsx", "src/**/*.test.tsx"],
          exclude: ["node_modules/**", "tests/e2e/**", "tests/dist/**"],
        },
      },
    ],
  },
});
