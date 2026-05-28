import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    // Tests touching the shared DB must run serially to avoid colliding on
    // the (truncate-and-reinsert) seed fixtures.
    fileParallelism: false,
    testTimeout: 10_000,
  },
});
