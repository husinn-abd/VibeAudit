import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@vibeaudit/core": path.resolve(__dirname, "packages/core/src/index.ts"),
      "@vibeaudit/security": path.resolve(__dirname, "packages/security/src/index.ts"),
      "@vibeaudit/iso": path.resolve(__dirname, "packages/iso/src/index.ts")
    }
  },
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"]
  }
});
