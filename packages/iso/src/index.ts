import type { NormalizedFinding } from "@vibeaudit/core";

export type IsoControl = {
  id: string;
  title: string;
  purpose: string;
  evidenceExamples: string[];
};

export const isoControls: IsoControl[] = [
  {
    id: "A.8.8",
    title: "Management of technical vulnerabilities",
    purpose: "Track, evaluate, and remediate technical vulnerabilities.",
    evidenceExamples: ["Vulnerability register", "Scanner run metadata", "Remediation status history"]
  },
  {
    id: "A.8.25",
    title: "Secure development life cycle",
    purpose: "Integrate security expectations into development practices.",
    evidenceExamples: ["Policy gate result", "Secure coding finding traceability", "Developer remediation report"]
  },
  {
    id: "A.8.28",
    title: "Secure coding",
    purpose: "Reduce code-level weaknesses before release.",
    evidenceExamples: ["SAST findings", "Rule mappings", "False-positive review notes"]
  },
  {
    id: "A.8.29",
    title: "Security testing in development and acceptance",
    purpose: "Use security tests to verify systems before release.",
    evidenceExamples: ["CI SARIF artifact", "Scanner versions", "Policy pass/fail history"]
  }
];

export function mapFindingToIsoControls(finding: Pick<NormalizedFinding, "scanner" | "cwe" | "owasp" | "severity">): string[] {
  const controls = new Set<string>(["A.8.8"]);

  if (finding.scanner === "semgrep") {
    controls.add("A.8.25");
    controls.add("A.8.28");
  }

  if (finding.scanner === "gitleaks") {
    controls.add("A.8.25");
    controls.add("A.8.28");
  }

  if (finding.scanner === "trivy") {
    controls.add("A.8.29");
  }

  if (finding.severity === "high" || finding.severity === "critical") {
    controls.add("A.8.29");
  }

  return [...controls].sort();
}

export function buildIsoCoverage(findings: NormalizedFinding[]): Array<IsoControl & { findingCount: number }> {
  return isoControls.map((control) => ({
    ...control,
    findingCount: findings.filter((finding) => {
      const mapped = finding.isoControls.length > 0 ? finding.isoControls : mapFindingToIsoControls(finding);
      return mapped.includes(control.id);
    }).length
  }));
}

export const isoDisclaimer =
  "VibeAudit provides audit-support evidence for ISO/IEC 27001 activities. It does not certify an organization or replace an ISMS.";
