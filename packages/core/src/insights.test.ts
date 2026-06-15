import { describe, expect, it } from "vitest";
import { createEvidenceHash } from "@vibeaudit/security";
import { createEvidenceIntegritySummary, createRemediationQueue, createScanInsights } from "./insights.js";
import type { ScanReport } from "./types.js";

describe("scan insights", () => {
  it("creates risk, coverage, ISO, and remediation insights from a scan report", () => {
    const report = makeReport();
    const insights = createScanInsights(report);

    expect(insights.policyState).toBe("blocked");
    expect(insights.riskScore).toBe(37);
    expect(insights.riskLevel).toBe("high");
    expect(insights.scannerCoverage.percent).toBe(67);
    expect(insights.scannerCoverage.missing).toEqual(["trivy"]);
    expect(insights.topIsoControls[0]).toEqual({ control: "A.8.25", count: 2 });
    expect(insights.remediationQueue.map((item) => item.findingId)).toEqual(["finding_secret", "finding_sast"]);
    expect(insights.evidenceIntegrity.passed).toBe(true);
  });

  it("builds deterministic SLA-driven remediation items", () => {
    const queue = createRemediationQueue(makeReport());

    expect(queue[0]).toMatchObject({
      findingId: "finding_secret",
      ownerRole: "Security Lead",
      dueInDays: 7,
      dueDate: "2026-06-22"
    });
    expect(queue[1]).toMatchObject({
      findingId: "finding_sast",
      ownerRole: "Developer",
      dueInDays: 14,
      dueDate: "2026-06-29"
    });
  });

  it("flags incomplete evidence integrity metadata", () => {
    const report = makeReport();
    report.artifactHash = "not-a-hash";
    report.findings[0]!.evidenceHash = "not-a-hash";

    const integrity = createEvidenceIntegritySummary(report);

    expect(integrity.passed).toBe(false);
    expect(integrity.failedCheckIds).toContain("artifact-hash");
    expect(integrity.failedCheckIds).toContain("finding-evidence-hashes");
  });
});

function makeReport(): ScanReport {
  return {
    schemaVersion: 1,
    tool: { name: "VibeAudit", version: "0.4.0" },
    target: {
      type: "local_path",
      value: ".",
      branch: "main",
      commit: "abc123"
    },
    scannerRuns: [
      makeScannerRun("semgrep"),
      makeScannerRun("gitleaks"),
      {
        scanner: "trivy",
        version: "0.4.0",
        command: ["trivy", "fs"],
        startedAt: "2026-06-15T00:00:00.000Z",
        completedAt: "2026-06-15T00:00:01.000Z",
        exitCode: 2,
        status: "failed",
        rawOutputHash: createEvidenceHash("trivy raw"),
        error: "demo failure"
      }
    ],
    findings: [
      {
        id: "finding_secret",
        fingerprint: "secret-fingerprint",
        scanner: "gitleaks",
        ruleId: "gitleaks.generic-api-key",
        title: "Committed API key",
        description: "A possible API token is present in source history.",
        severity: "critical",
        confidence: "high",
        filePath: "src/config.ts",
        startLine: 12,
        endLine: 12,
        evidence: "api_key=[REDACTED]",
        evidenceHash: createEvidenceHash("api_key=[REDACTED]"),
        masked: true,
        cwe: ["CWE-798"],
        owasp: ["A02:2021"],
        isoControls: ["A.8.25"],
        firstSeenAt: "2026-06-15T00:00:00.000Z",
        lastSeenAt: "2026-06-15T00:00:00.000Z",
        status: "open"
      },
      {
        id: "finding_sast",
        fingerprint: "sast-fingerprint",
        scanner: "semgrep",
        ruleId: "semgrep.sql-injection",
        title: "SQL injection",
        description: "User input is directly concatenated into a SQL query.",
        severity: "high",
        confidence: "high",
        filePath: "src/user.ts",
        startLine: 88,
        endLine: 88,
        evidence: "cursor.execute(query)",
        evidenceHash: createEvidenceHash("cursor.execute(query)"),
        masked: false,
        cwe: ["CWE-89"],
        owasp: ["A03:2021"],
        isoControls: ["A.8.25", "A.8.28"],
        firstSeenAt: "2026-06-15T00:00:00.000Z",
        lastSeenAt: "2026-06-15T00:00:00.000Z",
        status: "triaged"
      },
      {
        id: "finding_accepted",
        fingerprint: "accepted-fingerprint",
        scanner: "semgrep",
        ruleId: "semgrep.headers",
        title: "Security headers are incomplete",
        description: "Security header rule accepted for this demo.",
        severity: "medium",
        confidence: "medium",
        filePath: "src/server.ts",
        evidenceHash: createEvidenceHash("headers"),
        masked: false,
        cwe: [],
        owasp: [],
        isoControls: ["A.8.28"],
        firstSeenAt: "2026-06-15T00:00:00.000Z",
        lastSeenAt: "2026-06-15T00:00:00.000Z",
        status: "accepted"
      }
    ],
    policy: {
      schema_version: 1,
      required_scanners: ["semgrep", "gitleaks", "trivy"],
      fail_on: "high",
      ignored_rules: [],
      accepted_risk_max_days: 90,
      ai_privacy_mode: "disabled"
    },
    policyEvaluation: {
      passed: false,
      threshold: "high",
      requiredScanners: ["semgrep", "gitleaks", "trivy"],
      missingRequiredScanners: [],
      blockedFindingIds: ["finding_secret", "finding_sast"],
      ignoredFindingIds: [],
      evaluatedAt: "2026-06-15T00:00:02.000Z"
    },
    generatedAt: "2026-06-15T00:00:03.000Z",
    artifactHash: createEvidenceHash("artifact")
  };
}

function makeScannerRun(scanner: "semgrep" | "gitleaks"): ScanReport["scannerRuns"][number] {
  return {
    scanner,
    version: "0.4.0",
    command: [scanner, "--json"],
    startedAt: "2026-06-15T00:00:00.000Z",
    completedAt: "2026-06-15T00:00:01.000Z",
    exitCode: 0,
    status: "success",
    rawOutputHash: createEvidenceHash(`${scanner} raw`)
  };
}
