#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { Command } from "commander";
import YAML from "yaml";
import {
  createScanReport,
  defaultPolicy,
  normalizeScannerOutput,
  parsePolicyConfig,
  toSarif,
  type PolicyConfig,
  type ScanReport,
  type ScannerName,
  type ScannerRun
} from "@vibeaudit/core";
import { mapFindingToIsoControls } from "@vibeaudit/iso";
import { createEvidenceHash } from "@vibeaudit/security";

const execFileAsync = promisify(execFile);
const VERSION = "0.1.0";
const MAX_REPO_BYTES = 512 * 1024 * 1024;
const SCANNER_TIMEOUT_MS = 8 * 60 * 1000;

type ScanOptions = {
  output?: string;
  sarif?: string;
  policy?: string;
  failOn?: string;
  offline?: boolean;
  noAi?: boolean;
  mock?: boolean;
  upload?: string;
};

const program = new Command();

program
  .name("vibeaudit")
  .description("Local-first repository security auditor")
  .version(VERSION);

program
  .command("scan")
  .argument("<target>", "local folder, GitHub URL, GitLab URL, or git URL")
  .option("-o, --output <path>", "write normalized JSON report", "artifacts/vibeaudit-report.json")
  .option("--sarif <path>", "write SARIF report")
  .option("--policy <path>", "policy file path", "securerepo.policy.yml")
  .option("--fail-on <severity>", "override policy failure threshold")
  .option("--offline", "do not run network-dependent scanner modes")
  .option("--no-ai", "disable AI assistance")
  .option("--mock", "emit deterministic demo findings without Docker scanners")
  .option("--upload <url>", "upload scan report to an API import endpoint")
  .action(async (target: string, options: ScanOptions) => {
    try {
      const report = await scanTarget(target, options);
      await writeJson(options.output ?? "artifacts/vibeaudit-report.json", report);

      if (options.sarif) {
        await writeJson(options.sarif, toSarif(report));
      }

      if (options.upload) {
        await uploadReport(options.upload, report);
      }

      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      process.exitCode = report.policyEvaluation.passed ? 0 : 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`VibeAudit scan failed: ${message}\n`);
      process.exitCode = message.startsWith("Invalid") ? 3 : 2;
    }
  });

await program.parseAsync(process.argv);

async function scanTarget(target: string, options: ScanOptions): Promise<ScanReport> {
  const policy = await loadPolicy(options);
  const workspace = await resolveWorkspace(target);

  try {
    await assertRepoSize(workspace.path);
    const scannerResults = options.mock ? await runMockScanner() : await runDockerScanners(workspace.path, options);
    const findings = scannerResults.flatMap((result) =>
      normalizeScannerOutput(result.scanner, result.parsedOutput).map((finding) => ({
        ...finding,
        isoControls: finding.isoControls.length > 0 ? finding.isoControls : mapFindingToIsoControls(finding)
      }))
    );

    return createScanReport({
      version: VERSION,
      target: {
        type: workspace.isGitClone ? "git_url" : "local_path",
        value: target,
        commit: await readGitValue(workspace.path, ["rev-parse", "HEAD"]),
        branch: await readGitValue(workspace.path, ["rev-parse", "--abbrev-ref", "HEAD"])
      },
      scannerRuns: scannerResults.map((result) => result.run),
      findings,
      policy
    });
  } finally {
    if (workspace.cleanupPath) {
      await rm(workspace.cleanupPath, { recursive: true, force: true });
    }
  }
}

async function loadPolicy(options: ScanOptions): Promise<PolicyConfig> {
  let policy = defaultPolicy;

  if (options.policy) {
    try {
      const file = await readFile(options.policy, "utf8");
      policy = parsePolicyConfig(YAML.parse(file));
    } catch {
      policy = defaultPolicy;
    }
  }

  return parsePolicyConfig({
    ...policy,
    fail_on: options.failOn ?? policy.fail_on,
    ai_privacy_mode: options.noAi ? "disabled" : policy.ai_privacy_mode
  });
}

async function resolveWorkspace(target: string): Promise<{ path: string; cleanupPath?: string; isGitClone: boolean }> {
  if (isGitUrl(target)) {
    const directory = await mkdtemp(path.join(tmpdir(), "vibeaudit-"));
    await execFileAsync("git", ["clone", "--depth", "1", target, directory], { timeout: SCANNER_TIMEOUT_MS });
    return { path: directory, cleanupPath: directory, isGitClone: true };
  }

  const absolute = path.resolve(target);
  const targetStat = await stat(absolute).catch(() => undefined);

  if (!targetStat?.isDirectory()) {
    throw new Error(`Invalid target: ${target} is not a readable directory or git URL`);
  }

  return { path: absolute, isGitClone: false };
}

async function assertRepoSize(directory: string): Promise<void> {
  const { stdout } = await execFileAsync("git", ["-C", directory, "ls-files", "-z"], { timeout: 30_000 }).catch(() => ({ stdout: "" }));
  const files = stdout.split("\0").filter(Boolean);
  let bytes = 0;

  for (const file of files.slice(0, 25_000)) {
    const fileStat = await stat(path.join(directory, file)).catch(() => undefined);
    bytes += fileStat?.size ?? 0;
    if (bytes > MAX_REPO_BYTES) {
      throw new Error("Invalid target: repository exceeds the 512 MB V1 scan limit");
    }
  }
}

async function runDockerScanners(workspacePath: string, options: ScanOptions): Promise<ScannerResult[]> {
  const scanners: Array<() => Promise<ScannerResult>> = [
    () =>
      runScanner("semgrep", [
        "run",
        "--rm",
        "-v",
        `${workspacePath}:/src:ro`,
        options.offline ? "--network=none" : "",
        "semgrep/semgrep:latest",
        "semgrep",
        "--config",
        "auto",
        "--json",
        "/src"
      ]),
    () =>
      runScanner("gitleaks", [
        "run",
        "--rm",
        "-v",
        `${workspacePath}:/src:ro`,
        options.offline ? "--network=none" : "",
        "zricethezav/gitleaks:latest",
        "detect",
        "--source=/src",
        "--report-format=json",
        "--no-git",
        "--verbose"
      ]),
    () =>
      runScanner("trivy", [
        "run",
        "--rm",
        "-v",
        `${workspacePath}:/src:ro`,
        options.offline ? "--network=none" : "",
        "aquasec/trivy:latest",
        "fs",
        "--format",
        "json",
        "/src"
      ])
  ];

  const results: ScannerResult[] = [];
  for (const scanner of scanners) {
    results.push(await scanner());
  }

  return results;
}

async function runScanner(scanner: ScannerName, dockerArgs: string[]): Promise<ScannerResult> {
  const args = dockerArgs.filter(Boolean);
  const startedAt = new Date().toISOString();
  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    const result = await execFileAsync("docker", args, {
      timeout: SCANNER_TIMEOUT_MS,
      maxBuffer: 64 * 1024 * 1024
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error) {
    const childError = error as { stdout?: string; stderr?: string; code?: number };
    stdout = childError.stdout ?? "";
    stderr = childError.stderr ?? "";
    exitCode = typeof childError.code === "number" ? childError.code : 2;
  }

  const completedAt = new Date().toISOString();
  const parsedOutput = parseJsonOutput(stdout);

  return {
    scanner,
    parsedOutput,
    run: {
      scanner,
      version: "docker-image",
      command: ["docker", ...args],
      startedAt,
      completedAt,
      exitCode,
      status: parsedOutput ? "success" : "failed",
      rawOutputHash: createEvidenceHash({ stdout, stderr }),
      error: parsedOutput ? undefined : stderr || "Scanner did not emit JSON output"
    }
  };
}

async function runMockScanner(): Promise<ScannerResult[]> {
  const now = new Date().toISOString();
  const semgrepRaw = {
    results: [
      {
        check_id: "semgrep.jwt-missing-expiry",
        path: "src/auth/session.ts",
        start: { line: 44 },
        end: { line: 44 },
        extra: {
          message: "JWT missing expiry validation",
          lines: "jwt.verify(token, key)",
          severity: "WARNING",
          metadata: {
            impact: "medium",
            confidence: "medium",
            cwe: ["CWE-613"],
            owasp: ["A07:2021"]
          }
        }
      }
    ]
  };
  const gitleaksRaw = [
    {
      RuleID: "gitleaks.generic-api-key",
      Description: "Committed API key",
      File: "src/config.ts",
      StartLine: 12,
      EndLine: 12,
      Secret: "api_key=supersecret"
    }
  ];
  const trivyRaw = {
    Results: [
      {
        Target: "package-lock.json",
        Vulnerabilities: [
          {
            VulnerabilityID: "CVE-2026-0001",
            Title: "Outdated dependency",
            Description: "A dependency has a known vulnerability.",
            Severity: "CRITICAL",
            PkgName: "demo-lib",
            InstalledVersion: "1.0.0",
            FixedVersion: "1.0.3",
            CweIDs: ["CWE-937"]
          }
        ]
      }
    ]
  };

  return [
    mockScannerResult("semgrep", semgrepRaw, now),
    mockScannerResult("gitleaks", gitleaksRaw, now),
    mockScannerResult("trivy", trivyRaw, now)
  ];
}

function mockScannerResult(scanner: ScannerName, parsedOutput: unknown, timestamp: string): ScannerResult {
  return {
    scanner,
    parsedOutput,
    run: {
      scanner,
      version: VERSION,
      command: ["vibeaudit", "scan", "--mock", scanner],
      startedAt: timestamp,
      completedAt: timestamp,
      exitCode: 0,
      status: "success",
      rawOutputHash: createEvidenceHash(parsedOutput)
    }
  };
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8").catch(async (error) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      await import("node:fs/promises").then(({ mkdir }) => mkdir(path.dirname(filePath), { recursive: true }));
      await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
      return;
    }
    throw error;
  });
}

async function uploadReport(url: string, report: ScanReport): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report)
  });

  if (!response.ok) {
    throw new Error(`Upload failed with HTTP ${response.status}`);
  }
}

async function readGitValue(directory: string, args: string[]): Promise<string | undefined> {
  const result = await execFileAsync("git", ["-C", directory, ...args], { timeout: 15_000 }).catch(() => undefined);
  return result?.stdout.trim() || undefined;
}

function parseJsonOutput(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const firstBracket = trimmed.indexOf("[");
    const start = [firstBrace, firstBracket].filter((index) => index >= 0).sort((a, b) => a - b)[0];
    if (start === undefined) return undefined;
    return JSON.parse(trimmed.slice(start));
  }
}

function isGitUrl(value: string): boolean {
  return /^(https?:\/\/|git@|ssh:\/\/).+\.git$/.test(value) || /^https?:\/\/(github|gitlab)\.com\//.test(value);
}

type ScannerResult = {
  scanner: ScannerName;
  parsedOutput: unknown;
  run: ScannerRun;
};
