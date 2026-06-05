import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const workspaceRoot = path.resolve(__dirname, "../..");
  const rootEnv = loadEnv(mode, workspaceRoot, "");
  const appEnv = loadEnv(mode, __dirname, "");

  for (const [key, value] of Object.entries({ ...rootEnv, ...appEnv })) {
    process.env[key] ??= value;
  }

  return {
    plugins: [react()],
    base: process.env.GITHUB_REPOSITORY === "husinn-abd/VibeAudit" ? "/VibeAudit/" : "/",
    envDir: workspaceRoot,
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
  };
});
