import { createEvidenceHash } from "@vibeaudit/security";
import type { PolicyConfig, ScanReport, ScanTarget, ScannerRun } from "./types.js";
import { evaluatePolicy } from "./policy.js";
import type { NormalizedFinding } from "./types.js";

export function createScanReport(params: {
  version: string;
  target: ScanTarget;
  scannerRuns: ScannerRun[];
  findings: NormalizedFinding[];
  policy: PolicyConfig;
  generatedAt?: string;
}): ScanReport {
  const generatedAt = params.generatedAt ?? new Date().toISOString();
  const draft = {
    schemaVersion: 1 as const,
    tool: {
      name: "VibeAudit" as const,
      version: params.version
    },
    target: params.target,
    scannerRuns: params.scannerRuns,
    findings: params.findings,
    policy: params.policy,
    policyEvaluation: evaluatePolicy({
      policy: params.policy,
      findings: params.findings,
      scannerRuns: params.scannerRuns,
      now: generatedAt
    }),
    generatedAt
  };

  return {
    ...draft,
    artifactHash: createEvidenceHash(draft)
  };
}

export function createHtmlReport(report: ScanReport): string {
  const counts = report.findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, {});

  const rows = report.findings
    .map(
      (finding) => `<tr>
  <td>${escapeHtml(finding.severity)}</td>
  <td>${escapeHtml(finding.title)}</td>
  <td>${escapeHtml(finding.scanner)}</td>
  <td>${escapeHtml(finding.filePath ?? "-")}</td>
  <td>${escapeHtml(finding.evidenceHash)}</td>
</tr>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VibeAudit Report</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #17202a; margin: 32px; }
    h1 { margin-bottom: 4px; }
    .muted { color: #687385; }
    .summary { display: flex; gap: 12px; margin: 24px 0; }
    .metric { border: 1px solid #d9e0e8; border-radius: 8px; padding: 12px 16px; min-width: 96px; }
    .metric strong { display: block; font-size: 28px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #d9e0e8; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f6f8fb; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    code { font-family: "SFMono-Regular", Consolas, monospace; }
  </style>
</head>
<body>
  <h1>VibeAudit Report</h1>
  <p class="muted">Generated ${escapeHtml(report.generatedAt)} for ${escapeHtml(report.target.value)}</p>
  <p><strong>Policy:</strong> ${report.policyEvaluation.passed ? "Passed" : "Failed"} at ${escapeHtml(report.policy.fail_on)} threshold.</p>
  <p><strong>Artifact hash:</strong> <code>${escapeHtml(report.artifactHash)}</code></p>
  <section class="summary">
    ${Object.entries(counts)
      .map(([severity, count]) => `<div class="metric"><span>${escapeHtml(severity)}</span><strong>${count}</strong></div>`)
      .join("")}
  </section>
  <p class="muted">Secret evidence is redacted before report generation. ISO evidence support is not certification proof.</p>
  <table>
    <thead><tr><th>Severity</th><th>Finding</th><th>Scanner</th><th>Location</th><th>Evidence hash</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
