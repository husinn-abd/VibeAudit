import { createEvidenceHash, sha256 } from "@vibeaudit/security";
import type { NormalizedFinding, ScannerName, Severity } from "./types.js";

export type FingerprintInput = {
  scanner: ScannerName;
  ruleId: string;
  filePath?: string;
  startLine?: number;
  evidence?: string;
};

export function normalizePathForFingerprint(filePath?: string): string {
  return (filePath ?? "")
    .replace(/\\/g, "/")
    .replace(/^[A-Za-z]:\//, "")
    .replace(/^\/src\//, "")
    .replace(/^\.?\//, "")
    .toLowerCase();
}

export function createFingerprint(input: FingerprintInput): string {
  return sha256(
    [
      input.scanner,
      input.ruleId,
      normalizePathForFingerprint(input.filePath),
      input.startLine ?? 0,
      createEvidenceHash(input.evidence ?? "")
    ].join(":")
  );
}

export function createFinding(params: Omit<NormalizedFinding, "id" | "fingerprint" | "evidenceHash">): NormalizedFinding {
  const fingerprint = createFingerprint({
    scanner: params.scanner,
    ruleId: params.ruleId,
    filePath: params.filePath,
    startLine: params.startLine,
    evidence: params.evidence
  });

  return {
    ...params,
    id: fingerprint.slice(0, 16),
    fingerprint,
    evidenceHash: createEvidenceHash(params.evidence ?? params.description)
  };
}

export function summarizeSeverity(findings: Array<{ severity: Severity }>): Record<Severity, number> {
  return findings.reduce<Record<Severity, number>>(
    (summary, finding) => {
      summary[finding.severity] += 1;
      return summary;
    },
    { info: 0, low: 0, medium: 0, high: 0, critical: 0 }
  );
}
