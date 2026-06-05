import { createHtmlReport as renderHtmlReport, type ScanReport } from "@vibeaudit/core";
import { z } from "zod";

export const scanReportSchema = z.custom<ScanReport>((value) => {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<ScanReport>;
  return (
    report.schemaVersion === 1 &&
    report.tool?.name === "VibeAudit" &&
    typeof report.tool.version === "string" &&
    typeof report.target?.value === "string" &&
    Array.isArray(report.scannerRuns) &&
    Array.isArray(report.findings) &&
    Boolean(report.policy) &&
    Boolean(report.policyEvaluation) &&
    typeof report.generatedAt === "string" &&
    typeof report.artifactHash === "string"
  );
});

export type ImportableScanReport = z.infer<typeof scanReportSchema>;

export function createHtmlReport(report: ImportableScanReport): string {
  return renderHtmlReport(report);
}
