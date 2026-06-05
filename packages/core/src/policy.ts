import type { NormalizedFinding, PolicyConfig, PolicyEvaluation, ScannerRun } from "./types.js";
import { policyConfigSchema } from "./types.js";
import { severityMeetsThreshold } from "./severity.js";

export const defaultPolicy: PolicyConfig = policyConfigSchema.parse({});

export function parsePolicyConfig(input: unknown): PolicyConfig {
  return policyConfigSchema.parse(input ?? {});
}

export function evaluatePolicy(params: {
  policy: PolicyConfig;
  findings: NormalizedFinding[];
  scannerRuns: ScannerRun[];
  now?: string;
}): PolicyEvaluation {
  const completedScanners = new Set(
    params.scannerRuns.filter((run) => run.status === "success").map((run) => run.scanner)
  );
  const ignoredRules = new Set(params.policy.ignored_rules);
  const ignoredFindingIds: string[] = [];
  const blockedFindingIds: string[] = [];

  for (const finding of params.findings) {
    if (ignoredRules.has(finding.ruleId)) {
      ignoredFindingIds.push(finding.id);
      continue;
    }

    if (finding.status === "accepted" || finding.status === "false_positive") {
      continue;
    }

    if (severityMeetsThreshold(finding.severity, params.policy.fail_on)) {
      blockedFindingIds.push(finding.id);
    }
  }

  const missingRequiredScanners = params.policy.required_scanners.filter((scanner) => !completedScanners.has(scanner));

  return {
    passed: blockedFindingIds.length === 0 && missingRequiredScanners.length === 0,
    threshold: params.policy.fail_on,
    requiredScanners: params.policy.required_scanners,
    missingRequiredScanners,
    blockedFindingIds,
    ignoredFindingIds,
    evaluatedAt: params.now ?? new Date().toISOString()
  };
}
