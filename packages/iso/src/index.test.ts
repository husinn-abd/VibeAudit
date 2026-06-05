import { describe, expect, it } from "vitest";
import { buildIsoCoverage, mapFindingToIsoControls } from "./index.js";

describe("iso mapping", () => {
  it("maps semgrep findings to secure development controls", () => {
    expect(mapFindingToIsoControls({ scanner: "semgrep", cwe: [], owasp: [], severity: "high" })).toContain("A.8.28");
  });

  it("builds coverage counts", () => {
    const coverage = buildIsoCoverage([
      {
        id: "x",
        fingerprint: "x",
        scanner: "trivy",
        ruleId: "CVE-1",
        title: "CVE",
        description: "CVE",
        severity: "critical",
        confidence: "high",
        evidenceHash: "hash",
        masked: false,
        cwe: [],
        owasp: [],
        isoControls: [],
        firstSeenAt: "2026-01-01T00:00:00.000Z",
        lastSeenAt: "2026-01-01T00:00:00.000Z",
        status: "open"
      }
    ]);

    expect(coverage.some((item) => item.findingCount > 0)).toBe(true);
  });
});
