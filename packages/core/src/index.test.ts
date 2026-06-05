import { describe, expect, it } from "vitest";
import { createFingerprint, evaluatePolicy, normalizeScannerOutput, toSarif } from "./index.js";

describe("core package", () => {
  it("creates stable fingerprints across slash styles", () => {
    const a = createFingerprint({ scanner: "semgrep", ruleId: "rule", filePath: "src\\index.ts", startLine: 5, evidence: "x" });
    const b = createFingerprint({ scanner: "semgrep", ruleId: "rule", filePath: "src/index.ts", startLine: 5, evidence: "x" });
    expect(a).toBe(b);
  });

  it("redacts mock secret evidence while normalizing", () => {
    const findings = normalizeScannerOutput("mock", {
      findings: [{ ruleId: "secret", severity: "high", evidence: "api_key=supersecret" }]
    });
    expect(findings[0]?.masked).toBe(true);
    expect(findings[0]?.evidence).not.toContain("supersecret");
  });

  it("fails policy when threshold findings exist", () => {
    const findings = normalizeScannerOutput("mock", {
      findings: [{ ruleId: "danger", severity: "critical", evidence: "unsafe" }]
    });
    const result = evaluatePolicy({
      policy: {
        schema_version: 1,
        required_scanners: ["mock"],
        fail_on: "high",
        ignored_rules: [],
        accepted_risk_max_days: 90,
        ai_privacy_mode: "disabled"
      },
      findings,
      scannerRuns: [
        {
          scanner: "mock",
          version: "test",
          command: ["mock"],
          startedAt: "2026-01-01T00:00:00.000Z",
          completedAt: "2026-01-01T00:00:00.000Z",
          exitCode: 0,
          status: "success",
          rawOutputHash: "hash"
        }
      ]
    });

    expect(result.passed).toBe(false);
    expect(result.blockedFindingIds).toHaveLength(1);
  });

  it("exports SARIF", () => {
    const findings = normalizeScannerOutput("mock", {
      findings: [{ ruleId: "danger", severity: "high", filePath: "src/app.ts", startLine: 10 }]
    });
    const sarif = toSarif({ tool: { name: "VibeAudit", version: "0.3.1" }, findings });
    expect(sarif.version).toBe("2.1.0");
  });
});
