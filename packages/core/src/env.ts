import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

export type EnvLoadResult = {
  workspaceRoot: string;
  files: Array<{
    path: string;
    keys: string[];
  }>;
};

export function loadVibeAuditEnv(options: { cwd?: string; appDir?: string; fileName?: string } = {}): EnvLoadResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const appDir = path.resolve(options.appDir ?? cwd);
  const fileName = options.fileName ?? ".env";
  const workspaceRoot = findWorkspaceRoot(cwd);
  const originalKeys = new Set(Object.keys(process.env));
  const envFiles = uniquePaths([path.join(workspaceRoot, fileName), path.join(appDir, fileName)]);
  const files: EnvLoadResult["files"] = [];

  for (const envFile of envFiles) {
    if (!existsSync(envFile)) continue;

    const parsed = parse(readFileSync(envFile));
    const keys: string[] = [];
    for (const [key, value] of Object.entries(parsed)) {
      if (originalKeys.has(key)) continue;
      process.env[key] = value;
      keys.push(key);
    }
    files.push({ path: envFile, keys });
  }

  return { workspaceRoot, files };
}

function findWorkspaceRoot(start: string): string {
  let current = start;

  while (true) {
    if (existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths.map((entry) => path.resolve(entry)))];
}
