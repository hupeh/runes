import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    pool: "threads",
    environment: "jsdom",
    setupFiles: "scripts/setup-vitest.ts",
    projects: ["packages/*/"],
  },
});
