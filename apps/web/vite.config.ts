import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_REPOSITORY === "husinn-abd/VibeAudit" ? "/VibeAudit/" : "/",
  resolve: {
    alias: {
      "@vibeaudit/core/markdown": path.resolve(__dirname, "../../packages/core/src/markdown.ts"),
      "@vibeaudit/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@vibeaudit/iso": path.resolve(__dirname, "../../packages/iso/src/index.ts"),
      "@vibeaudit/security": path.resolve(__dirname, "../../packages/security/src/index.ts")
    }
  },
  build: {
    sourcemap: true
  }
});
