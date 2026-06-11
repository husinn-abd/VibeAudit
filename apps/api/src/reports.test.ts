import { describe, expect, it } from "vitest";
import { createEvidenceHash } from "@vibeaudit/security";
import type { ScanReport } from "@vibeaudit/core";
import { createSarifReport } from "./validation.js";

describe("API report exports", () => {
  it("creates SARIF from imported scan data", () => {
    const report = makeReport();
    const sarif = createSarifReport(report);

    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs).toHaveLength(1);
    expect(JSON.stringify(sarif)).toContain("semgrep.demo-rule");
    expect(JSON.stringify(sarif)).toContain("src/index.ts");
  });
});

function makeReport(): ScanReport {
  const finding = {
    id: "finding_demo",
    fingerprint: "fingerprint_demo",
    scanner: "semgrep" as const,
    ruleId: "semgrep.demo-rule",
    title: "Demo finding",
    description: "Demo finding description",
    severity: "high" as const,
    confidence: "high" as const,
    filePath: "src/index.ts",
    startLine: 12,
    endLine: 12,
    evidence: "danger()",
    evidenceHash: createEvidenceHash("danger()"),
    masked: false,
    cwe: ["CWE-20"],
    owasp: ["A03:2021"],
    isoControls: ["A.8.28"],
    firstSeenAt: "2026-06-11T00:00:00.000Z",
    lastSeenAt: "2026-06-11T00:00:00.000Z",
    status: "open" as const
  };

  return {
    schemaVersion: 1,
    tool: { name: "VibeAudit", version: "0.3.9" },
    target: { type: "local_path", value: "." },
    scannerRuns: [
      {
        scanner: "semgrep",
        version: "0.3.9",
        command: ["semgrep", "--json"],
        startedAt: "2026-06-11T00:00:00.000Z",
        completedAt: "2026-06-11T00:00:01.000Z",
        exitCode: 0,
        status: "success",
        rawOutputHash: createEvidenceHash("raw")
      }
    ],
    findings: [finding],
    policy: {
      schema_version: 1,
      required_scanners: ["semgrep"],
      fail_on: "high",
      ignored_rules: [],
      accepted_risk_max_days: 90,
      ai_privacy_mode: "disabled"
    },
    policyEvaluation: {
      passed: false,
      threshold: "high",
      requiredScanners: ["semgrep"],
      missingRequiredScanners: [],
      blockedFindingIds: [finding.id],
      ignoredFindingIds: [],
      evaluatedAt: "2026-06-11T00:00:02.000Z"
    },
    generatedAt: "2026-06-11T00:00:03.000Z",
    artifactHash: createEvidenceHash("artifact")
  };
}
