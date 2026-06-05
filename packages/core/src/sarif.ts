import type { NormalizedFinding, ScanReport } from "./types.js";

export function toSarif(report: Pick<ScanReport, "findings" | "tool">): Record<string, unknown> {
  const rules = uniqueRules(report.findings);

  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: report.tool.name,
            informationUri: "https://github.com/husinn-abd/VibeAudit",
            version: report.tool.version,
            rules
          }
        },
        results: report.findings.map(toSarifResult)
      }
    ]
  };
}

function uniqueRules(findings: NormalizedFinding[]): Array<Record<string, unknown>> {
  const rules = new Map<string, NormalizedFinding>();
  for (const finding of findings) {
    rules.set(finding.ruleId, finding);
  }

  return [...rules.values()].map((finding) => ({
    id: finding.ruleId,
    name: finding.title,
    shortDescription: { text: finding.title },
    fullDescription: { text: finding.description },
    properties: {
      scanner: finding.scanner,
      severity: finding.severity,
      confidence: finding.confidence
    }
  }));
}

function toSarifResult(finding: NormalizedFinding): Record<string, unknown> {
  return {
    ruleId: finding.ruleId,
    level: severityToSarifLevel(finding.severity),
    message: { text: finding.title },
    fingerprints: {
      vibeaudit: finding.fingerprint
    },
    locations: finding.filePath
      ? [
          {
            physicalLocation: {
              artifactLocation: { uri: finding.filePath },
              region: finding.startLine ? { startLine: finding.startLine, endLine: finding.endLine ?? finding.startLine } : undefined
            }
          }
        ]
      : []
  };
}

function severityToSarifLevel(severity: string): "none" | "note" | "warning" | "error" {
  if (severity === "critical" || severity === "high") return "error";
  if (severity === "medium") return "warning";
  if (severity === "low") return "note";
  return "none";
}
