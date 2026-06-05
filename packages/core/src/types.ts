import { z } from "zod";

export const severityLevels = ["info", "low", "medium", "high", "critical"] as const;
export type Severity = (typeof severityLevels)[number];

export const scannerNames = ["semgrep", "gitleaks", "trivy", "checkov", "osv", "mock"] as const;
export type ScannerName = (typeof scannerNames)[number];

export const findingStatusValues = ["open", "triaged", "accepted", "fixed", "false_positive"] as const;
export type FindingStatus = (typeof findingStatusValues)[number];

export const scanTargetSchema = z.object({
  type: z.enum(["local_path", "git_url"]),
  value: z.string().min(1),
  commit: z.string().optional(),
  branch: z.string().optional()
});

export type ScanTarget = z.infer<typeof scanTargetSchema>;

export const scannerRunSchema = z.object({
  scanner: z.enum(scannerNames),
  version: z.string().default("unknown"),
  command: z.array(z.string()),
  startedAt: z.string(),
  completedAt: z.string(),
  exitCode: z.number(),
  status: z.enum(["success", "failed", "skipped"]),
  rawOutputHash: z.string(),
  error: z.string().optional()
});

export type ScannerRun = z.infer<typeof scannerRunSchema>;

export const normalizedFindingSchema = z.object({
  id: z.string(),
  fingerprint: z.string(),
  scanner: z.enum(scannerNames),
  ruleId: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(severityLevels),
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
  filePath: z.string().optional(),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
  evidence: z.string().optional(),
  evidenceHash: z.string(),
  masked: z.boolean().default(false),
  cwe: z.array(z.string()).default([]),
  owasp: z.array(z.string()).default([]),
  isoControls: z.array(z.string()).default([]),
  firstSeenAt: z.string(),
  lastSeenAt: z.string(),
  status: z.enum(findingStatusValues).default("open")
});

export type NormalizedFinding = z.infer<typeof normalizedFindingSchema>;

export const policyConfigSchema = z.object({
  schema_version: z.literal(1).default(1),
  required_scanners: z.array(z.enum(scannerNames)).default(["semgrep", "gitleaks", "trivy"]),
  fail_on: z.enum(severityLevels).default("high"),
  ignored_rules: z.array(z.string()).default([]),
  accepted_risk_max_days: z.number().int().positive().default(90),
  ai_privacy_mode: z.enum(["disabled", "strict", "balanced", "full"]).default("disabled")
});

export type PolicyConfig = z.infer<typeof policyConfigSchema>;

export type PolicyEvaluation = {
  passed: boolean;
  threshold: Severity;
  requiredScanners: ScannerName[];
  missingRequiredScanners: ScannerName[];
  blockedFindingIds: string[];
  ignoredFindingIds: string[];
  evaluatedAt: string;
};

export type ScanReport = {
  schemaVersion: 1;
  tool: {
    name: "VibeAudit";
    version: string;
  };
  target: ScanTarget;
  scannerRuns: ScannerRun[];
  findings: NormalizedFinding[];
  policy: PolicyConfig;
  policyEvaluation: PolicyEvaluation;
  generatedAt: string;
  artifactHash: string;
};
