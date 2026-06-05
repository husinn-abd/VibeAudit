import { redactSecrets } from "@vibeaudit/security";
import { createFinding } from "./fingerprint.js";
import { normalizeSeverity } from "./severity.js";
import type { NormalizedFinding, ScannerName } from "./types.js";

type AnyRecord = Record<string, unknown>;

export function normalizeScannerOutput(scanner: ScannerName, raw: unknown, now = new Date().toISOString()): NormalizedFinding[] {
  switch (scanner) {
    case "semgrep":
      return normalizeSemgrep(raw, now);
    case "gitleaks":
      return normalizeGitleaks(raw, now);
    case "trivy":
      return normalizeTrivy(raw, now);
    case "mock":
      return normalizeMock(raw, now);
    default:
      return [];
  }
}

function normalizeSemgrep(raw: unknown, now: string): NormalizedFinding[] {
  const results = asArray((raw as AnyRecord)?.results);

  return results.map((entry) => {
    const record = entry as AnyRecord;
    const extra = (record.extra ?? {}) as AnyRecord;
    const metadata = (extra.metadata ?? {}) as AnyRecord;
    const evidence = String(extra.lines ?? extra.message ?? "");
    const redacted = redactSecrets(evidence);

    return createFinding({
      scanner: "semgrep",
      ruleId: String(record.check_id ?? "semgrep.unknown"),
      title: String(extra.message ?? record.check_id ?? "Semgrep finding"),
      description: String(extra.message ?? "Semgrep rule matched source code."),
      severity: normalizeSeverity(metadata.impact ?? extra.severity),
      confidence: normalizeConfidence(metadata.confidence),
      filePath: String(record.path ?? ""),
      startLine: readNumber((record.start as AnyRecord)?.line),
      endLine: readNumber((record.end as AnyRecord)?.line),
      evidence: redacted.redacted,
      masked: redacted.masked,
      cwe: normalizeStringArray(metadata.cwe),
      owasp: normalizeStringArray(metadata.owasp),
      isoControls: [],
      firstSeenAt: now,
      lastSeenAt: now,
      status: "open"
    });
  });
}

function normalizeGitleaks(raw: unknown, now: string): NormalizedFinding[] {
  const results = Array.isArray(raw) ? raw : asArray((raw as AnyRecord)?.findings);

  return results.map((entry) => {
    const record = entry as AnyRecord;
    const evidence = String(record.Secret ?? record.Match ?? record.Description ?? "");
    const redacted = redactSecrets(evidence);

    return createFinding({
      scanner: "gitleaks",
      ruleId: String(record.RuleID ?? record.RuleId ?? "gitleaks.secret"),
      title: String(record.Description ?? "Potential secret detected"),
      description: "Gitleaks detected a possible committed secret.",
      severity: "high",
      confidence: "high",
      filePath: String(record.File ?? record.Path ?? ""),
      startLine: readNumber(record.StartLine ?? record.Line),
      endLine: readNumber(record.EndLine ?? record.Line),
      evidence: redacted.redacted,
      masked: true,
      cwe: ["CWE-798"],
      owasp: ["A02:2021"],
      isoControls: [],
      firstSeenAt: now,
      lastSeenAt: now,
      status: "open"
    });
  });
}

function normalizeTrivy(raw: unknown, now: string): NormalizedFinding[] {
  const results = asArray((raw as AnyRecord)?.Results);

  return results.flatMap((result) => {
    const record = result as AnyRecord;
    const target = String(record.Target ?? "");
    const vulnerabilities = asArray(record.Vulnerabilities);

    return vulnerabilities.map((vulnerability) => {
      const vuln = vulnerability as AnyRecord;
      const title = String(vuln.Title ?? vuln.VulnerabilityID ?? "Dependency vulnerability");
      const installed = String(vuln.InstalledVersion ?? "");
      const fixed = String(vuln.FixedVersion ?? "no fixed version listed");
      const evidence = `${vuln.PkgName ?? "package"} ${installed} -> ${fixed}`;

      return createFinding({
        scanner: "trivy",
        ruleId: String(vuln.VulnerabilityID ?? "trivy.vulnerability"),
        title,
        description: String(vuln.Description ?? title),
        severity: normalizeSeverity(vuln.Severity),
        confidence: "high",
        filePath: target,
        evidence,
        masked: false,
        cwe: normalizeStringArray(vuln.CweIDs),
        owasp: ["A06:2021"],
        isoControls: [],
        firstSeenAt: now,
        lastSeenAt: now,
        status: "open"
      });
    });
  });
}

function normalizeMock(raw: unknown, now: string): NormalizedFinding[] {
  const findings = asArray((raw as AnyRecord)?.findings);

  return findings.map((entry) => {
    const record = entry as AnyRecord;
    const evidence = String(record.evidence ?? record.description ?? "");
    const redacted = redactSecrets(evidence);

    return createFinding({
      scanner: "mock",
      ruleId: String(record.ruleId ?? "mock.rule"),
      title: String(record.title ?? "Mock finding"),
      description: String(record.description ?? "Mock finding for local demos and tests."),
      severity: normalizeSeverity(record.severity),
      confidence: normalizeConfidence(record.confidence),
      filePath: String(record.filePath ?? ""),
      startLine: readNumber(record.startLine),
      evidence: redacted.redacted,
      masked: redacted.masked,
      cwe: normalizeStringArray(record.cwe),
      owasp: normalizeStringArray(record.owasp),
      isoControls: normalizeStringArray(record.isoControls),
      firstSeenAt: now,
      lastSeenAt: now,
      status: "open"
    });
  });
}

function normalizeConfidence(value: unknown): "low" | "medium" | "high" {
  const normalized = String(value ?? "medium").toLowerCase();
  if (normalized.includes("high")) return "high";
  if (normalized.includes("low")) return "low";
  return "medium";
}

function readNumber(value: unknown): number | undefined {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}
