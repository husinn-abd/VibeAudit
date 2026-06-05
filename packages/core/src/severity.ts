import type { Severity } from "./types.js";

const rank: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export function normalizeSeverity(value: unknown): Severity {
  const normalized = String(value ?? "info").toLowerCase();

  if (normalized.includes("critical")) return "critical";
  if (normalized.includes("high")) return "high";
  if (normalized.includes("medium") || normalized.includes("moderate")) return "medium";
  if (normalized.includes("low")) return "low";
  return "info";
}

export function severityMeetsThreshold(severity: Severity, threshold: Severity): boolean {
  return rank[severity] >= rank[threshold];
}

export function compareSeverity(a: Severity, b: Severity): number {
  return rank[b] - rank[a];
}
