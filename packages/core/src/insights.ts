import { severityLevels, type NormalizedFinding, type ScanReport, type ScannerName, type Severity } from "./types.js";

export type SeverityCounts = Record<Severity, number>;

export type ScannerCoverage = {
  required: ScannerName[];
  completed: ScannerName[];
  missing: ScannerName[];
  totalPresent: number;
  percent: number;
};

export type RemediationQueueItem = {
  findingId: string;
  title: string;
  severity: Severity;
  scanner: ScannerName;
  ruleId: string;
  location: string;
  ownerRole: string;
  dueInDays: number;
  dueDate: string;
  priority: number;
  recommendation: string;
  evidenceHash: string;
};

export type EvidenceIntegrityCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type EvidenceIntegritySummary = {
  passed: boolean;
  failedCheckIds: string[];
  checks: EvidenceIntegrityCheck[];
};

export type ScanInsights = {
  generatedAt: string;
  policyState: "passed" | "blocked";
  riskScore: number;
  riskLevel: "clear" | Severity;
  severityCounts: SeverityCounts;
  activeFindingCount: number;
  acceptedFindingCount: number;
  blockedFindingCount: number;
  scannerCoverage: ScannerCoverage;
  topIsoControls: Array<{ control: string; count: number }>;
  remediationQueue: RemediationQueueItem[];
  evidenceIntegrity: EvidenceIntegritySummary;
};

const severityWeights: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 4,
  high: 12,
  critical: 25
};

const severityPriority: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1
};

const defaultSlaDays: Record<Severity, number> = {
  critical: 7,
  high: 14,
  medium: 30,
  low: 90,
  info: 120
};

export function createScanInsights(report: ScanReport, options: { queueLimit?: number } = {}): ScanInsights {
  const activeFindings = report.findings.filter((finding) => isActiveFinding(finding));
  const severityCounts = countSeverities(report.findings);
  const riskScore = Math.min(
    100,
    Math.round(activeFindings.reduce((total, finding) => total + severityWeights[finding.severity], 0))
  );

  return {
    generatedAt: report.generatedAt,
    policyState: report.policyEvaluation.passed ? "passed" : "blocked",
    riskScore,
    riskLevel: riskLevelForScore(riskScore),
    severityCounts,
    activeFindingCount: activeFindings.length,
    acceptedFindingCount: report.findings.filter((finding) => finding.status === "accepted").length,
    blockedFindingCount: report.policyEvaluation.blockedFindingIds.length,
    scannerCoverage: createScannerCoverage(report),
    topIsoControls: createTopIsoControls(activeFindings),
    remediationQueue: createRemediationQueue(report, options),
    evidenceIntegrity: createEvidenceIntegritySummary(report)
  };
}

export function createRemediationQueue(
  report: ScanReport,
  options: { queueLimit?: number } = {}
): RemediationQueueItem[] {
  const blockedIds = new Set(report.policyEvaluation.blockedFindingIds);
  const generatedAt = parseReportDate(report.generatedAt);
  const queueLimit = options.queueLimit ?? 5;

  return report.findings
    .filter((finding) => isActiveFinding(finding))
    .sort((a, b) => {
      const blockedDelta = Number(blockedIds.has(b.id)) - Number(blockedIds.has(a.id));
      if (blockedDelta !== 0) return blockedDelta;
      const severityDelta = severityPriority[b.severity] - severityPriority[a.severity];
      if (severityDelta !== 0) return severityDelta;
      return a.title.localeCompare(b.title);
    })
    .slice(0, queueLimit)
    .map((finding, index) => {
      const dueInDays = defaultSlaDays[finding.severity];
      return {
        findingId: finding.id,
        title: finding.title,
        severity: finding.severity,
        scanner: finding.scanner,
        ruleId: finding.ruleId,
        location: formatLocation(finding),
        ownerRole: ownerRoleForScanner(finding.scanner),
        dueInDays,
        dueDate: formatDueDate(generatedAt, dueInDays),
        priority: index + 1,
        recommendation: recommendationForFinding(finding),
        evidenceHash: finding.evidenceHash
      };
    });
}

export function createEvidenceIntegritySummary(report: ScanReport): EvidenceIntegritySummary {
  const findingIds = new Set(report.findings.map((finding) => finding.id));
  const secretFindings = report.findings.filter((finding) => isSecretLikeFinding(finding));
  const checks: EvidenceIntegrityCheck[] = [
    {
      id: "artifact-hash",
      label: "Artifact hash",
      passed: isSha256(report.artifactHash),
      detail: isSha256(report.artifactHash)
        ? "Scan artifact hash is present and SHA-256 shaped."
        : "Scan artifact hash is missing or not SHA-256 shaped."
    },
    {
      id: "scanner-metadata",
      label: "Scanner metadata",
      passed: report.scannerRuns.length > 0 && report.scannerRuns.every(hasCompleteScannerMetadata),
      detail: `${report.scannerRuns.filter(hasCompleteScannerMetadata).length}/${report.scannerRuns.length} scanner runs include version, command, timestamps, and raw output hash.`
    },
    {
      id: "finding-evidence-hashes",
      label: "Finding evidence hashes",
      passed: report.findings.every((finding) => isSha256(finding.evidenceHash)),
      detail: `${report.findings.filter((finding) => isSha256(finding.evidenceHash)).length}/${report.findings.length} findings include SHA-256 evidence hashes.`
    },
    {
      id: "secret-redaction",
      label: "Secret redaction",
      passed: secretFindings.every(hasSafeSecretEvidence),
      detail:
        secretFindings.length === 0
          ? "No secret-like findings were present in this scan."
          : `${secretFindings.filter(hasSafeSecretEvidence).length}/${secretFindings.length} secret-like findings are masked or free of raw token patterns.`
    },
    {
      id: "policy-trace",
      label: "Policy trace",
      passed:
        Boolean(report.policyEvaluation.evaluatedAt) &&
        report.policyEvaluation.blockedFindingIds.every((findingId) => findingIds.has(findingId)),
      detail: "Policy evaluation includes an evaluated time and references imported finding IDs."
    },
    {
      id: "target-scope",
      label: "Target scope",
      passed: Boolean(report.target.type && report.target.value),
      detail: report.target.commit
        ? `Target includes ${report.target.type}, path/URL, and commit ${report.target.commit}.`
        : `Target includes ${report.target.type} and path/URL; commit is optional for local scans.`
    }
  ];
  const failedCheckIds = checks.filter((check) => !check.passed).map((check) => check.id);

  return {
    passed: failedCheckIds.length === 0,
    failedCheckIds,
    checks
  };
}

function countSeverities(findings: NormalizedFinding[]): SeverityCounts {
  return severityLevels.reduce<SeverityCounts>((counts, severity) => {
    counts[severity] = findings.filter((finding) => finding.severity === severity).length;
    return counts;
  }, {} as SeverityCounts);
}

function createScannerCoverage(report: ScanReport): ScannerCoverage {
  const successfulScanners = new Set(
    report.scannerRuns.filter((run) => run.status === "success").map((run) => run.scanner)
  );
  const required = report.policy.required_scanners;
  const completed = required.filter((scanner) => successfulScanners.has(scanner));
  const missing = required.filter((scanner) => !successfulScanners.has(scanner));

  return {
    required,
    completed,
    missing,
    totalPresent: new Set(report.scannerRuns.map((run) => run.scanner)).size,
    percent: required.length === 0 ? 100 : Math.round((completed.length / required.length) * 100)
  };
}

function createTopIsoControls(findings: NormalizedFinding[]): Array<{ control: string; count: number }> {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    for (const control of finding.isoControls) {
      counts.set(control, (counts.get(control) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([control, count]) => ({ control, count }));
}

function isActiveFinding(finding: NormalizedFinding): boolean {
  return !["accepted", "fixed", "false_positive"].includes(finding.status);
}

function riskLevelForScore(score: number): ScanInsights["riskLevel"] {
  if (score === 0) return "clear";
  if (score >= 70) return "critical";
  if (score >= 35) return "high";
  if (score >= 12) return "medium";
  return "low";
}

function formatLocation(finding: NormalizedFinding): string {
  if (!finding.filePath) return "-";
  return finding.startLine ? `${finding.filePath}:${finding.startLine}` : finding.filePath;
}

function ownerRoleForScanner(scanner: ScannerName): string {
  switch (scanner) {
    case "gitleaks":
      return "Security Lead";
    case "trivy":
    case "osv":
      return "Platform Owner";
    case "checkov":
      return "Cloud Engineer";
    default:
      return "Developer";
  }
}

function recommendationForFinding(finding: NormalizedFinding): string {
  if (finding.scanner === "gitleaks") {
    return "Rotate the exposed secret, revoke old credentials, and remove the secret from source history.";
  }
  if (finding.scanner === "trivy" || finding.scanner === "osv") {
    return "Upgrade the affected package or pin a fixed version, then rerun dependency scanning.";
  }
  if (finding.scanner === "checkov") {
    return "Patch the infrastructure rule violation and attach the updated IaC diff as evidence.";
  }

  return "Patch the vulnerable code path, add a regression test, and rerun the scanner.";
}

function parseReportDate(value: string): Date {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    return new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])));
  }

  return new Date();
}

function formatDueDate(baseDate: Date, dueInDays: number): string {
  const dueDate = new Date(baseDate);
  dueDate.setUTCDate(dueDate.getUTCDate() + dueInDays);
  return dueDate.toISOString().slice(0, 10);
}

function isSha256(value: string | undefined): boolean {
  return Boolean(value && /^[a-f0-9]{64}$/i.test(value));
}

function hasCompleteScannerMetadata(run: ScanReport["scannerRuns"][number]): boolean {
  return Boolean(
    run.scanner &&
      run.version &&
      run.command.length > 0 &&
      run.startedAt &&
      run.completedAt &&
      isSha256(run.rawOutputHash)
  );
}

function isSecretLikeFinding(finding: NormalizedFinding): boolean {
  const haystack = `${finding.scanner} ${finding.ruleId} ${finding.title}`.toLowerCase();
  return finding.scanner === "gitleaks" || /(secret|token|api[-_ ]?key|credential|password)/.test(haystack);
}

function hasSafeSecretEvidence(finding: NormalizedFinding): boolean {
  if (!finding.evidence) return true;
  if (finding.masked) return true;
  return !/(ghp_[a-z0-9_]{20,}|api[_-]?key\s*=\s*[^[]|secret\s*=\s*[^[]|password\s*=\s*[^[])/i.test(finding.evidence);
}
