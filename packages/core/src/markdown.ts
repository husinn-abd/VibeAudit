import type { ScanReport } from "./types.js";

export function createMarkdownReport(report: ScanReport): string {
  const counts = report.findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, {});
  const scannerRows = report.scannerRuns
    .map(
      (run) =>
        `| ${escapeMarkdown(run.scanner)} | ${escapeMarkdown(run.version)} | ${escapeMarkdown(run.status)} | ${run.exitCode} | ${escapeMarkdown(run.rawOutputHash)} |`
    )
    .join("\n");
  const findingRows = report.findings
    .map((finding) => {
      const location = [finding.filePath, finding.startLine].filter(Boolean).join(":") || "-";
      return `| ${escapeMarkdown(finding.severity)} | ${escapeMarkdown(finding.title)} | ${escapeMarkdown(finding.scanner)} | ${escapeMarkdown(finding.ruleId)} | ${escapeMarkdown(location)} | ${escapeMarkdown(finding.evidenceHash)} |`;
    })
    .join("\n");
  const severitySummary = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([severity, count]) => `- ${capitalize(severity)}: ${count}`)
    .join("\n");

  return `# VibeAudit Report

Generated: ${escapeMarkdown(report.generatedAt)}
Target: ${escapeMarkdown(report.target.value)}
Target type: ${escapeMarkdown(report.target.type)}
${report.target.branch ? `Branch: ${escapeMarkdown(report.target.branch)}\n` : ""}${report.target.commit ? `Commit: ${escapeMarkdown(report.target.commit)}\n` : ""}Tool: ${escapeMarkdown(report.tool.name)} ${escapeMarkdown(report.tool.version)}

## Policy Result

- Status: ${report.policyEvaluation.passed ? "Passed" : "Failed"}
- Threshold: ${escapeMarkdown(report.policy.fail_on)}
- Required scanners: ${report.policy.required_scanners.map(escapeMarkdown).join(", ")}
- Missing required scanners: ${report.policyEvaluation.missingRequiredScanners.length > 0 ? report.policyEvaluation.missingRequiredScanners.map(escapeMarkdown).join(", ") : "None"}
- Blocked findings: ${report.policyEvaluation.blockedFindingIds.length}
- Artifact hash: \`${escapeMarkdown(report.artifactHash)}\`

## Finding Summary

${severitySummary || "- No findings"}

## Scanner Runs

| Scanner | Version | Status | Exit code | Raw output hash |
| --- | --- | --- | ---: | --- |
${scannerRows || "| - | - | - | - | - |"}

## Findings

| Severity | Finding | Scanner | Rule / ID | Location | Evidence hash |
| --- | --- | --- | --- | --- | --- |
${findingRows || "| - | - | - | - | - | - |"}

## Notices

- Secret evidence is redacted before report generation.
- Evidence hashes are preserved for audit traceability.
- ISO/IEC 27001 output is audit support, not certification proof.
`;
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
