import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "dist",
    environment: "node",
    include: ["tests/dist/**/*.test.ts"],
  },
});
