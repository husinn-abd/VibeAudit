import { buildIsoCoverage } from "@vibeaudit/iso";
import type { NormalizedFinding, PolicyEvaluation, ScannerRun } from "@vibeaudit/core";

export const scannerRuns: ScannerRun[] = [
  {
    scanner: "semgrep",
    version: "docker-image",
    command: ["docker", "run", "semgrep/semgrep", "semgrep", "--config", "auto", "--json", "/src"],
    startedAt: "2026-06-05T02:12:03.000Z",
    completedAt: "2026-06-05T02:12:54.000Z",
    exitCode: 0,
    status: "success",
    rawOutputHash: "9b9a49e5c2f9a5da95c7b16d6b5c8f2f60db5c7e8de1b74061b7417848c84d4c"
  },
  {
    scanner: "gitleaks",
    version: "docker-image",
    command: ["docker", "run", "zricethezav/gitleaks", "detect", "--source=/src"],
    startedAt: "2026-06-05T02:13:00.000Z",
    completedAt: "2026-06-05T02:13:09.000Z",
    exitCode: 1,
    status: "success",
    rawOutputHash: "35511a34f14342c909fa3212f8be25f62b69c29bf1bba98205b671d44f941cc0"
  },
  {
    scanner: "trivy",
    version: "docker-image",
    command: ["docker", "run", "aquasec/trivy", "fs", "--format", "json", "/src"],
    startedAt: "2026-06-05T02:13:13.000Z",
    completedAt: "2026-06-05T02:14:01.000Z",
    exitCode: 0,
    status: "success",
    rawOutputHash: "0ef52cddadf859f755a5d51ee8a0ad6267e6e969f19c48ed03e6ae1a442c55b6"
  }
];

export const findings: NormalizedFinding[] = [
  {
    id: "f_secret_key",
    fingerprint: "3f08e0b77d32471a91a88a54f83e8820",
    scanner: "gitleaks",
    ruleId: "gitleaks.generic-api-key",
    title: "Committed API key",
    description: "A possible API token is present in source history.",
    severity: "high",
    confidence: "high",
    filePath: "src/config.ts",
    startLine: 12,
    endLine: 12,
    evidence: "api_key=[REDACTED]",
    evidenceHash: "e8f1f42d26f4f835a2d8262d4115d67335bbd0d52eec2a1dcae85cc99fcff81c",
    masked: true,
    cwe: ["CWE-798"],
    owasp: ["A02:2021"],
    isoControls: ["A.8.8", "A.8.25", "A.8.28", "A.8.29"],
    firstSeenAt: "2026-06-05T02:13:09.000Z",
    lastSeenAt: "2026-06-05T02:13:09.000Z",
    status: "open"
  },
  {
    id: "f_jwt_expiry",
    fingerprint: "ac8998e6bc2a4968ae0fa9748e70e4bd",
    scanner: "semgrep",
    ruleId: "semgrep.jwt-missing-expiry",
    title: "JWT missing expiry validation",
    description: "Token validation should require expiry checks.",
    severity: "medium",
    confidence: "medium",
    filePath: "src/auth/session.ts",
    startLine: 44,
    endLine: 44,
    evidence: "jwt.verify(token, key)",
    evidenceHash: "248e7031af9106549c33c030f12ee1e8393cf528a29812b5ed4d94c458d33c0c",
    masked: false,
    cwe: ["CWE-613"],
    owasp: ["A07:2021"],
    isoControls: ["A.8.8", "A.8.25", "A.8.28"],
    firstSeenAt: "2026-06-05T02:12:54.000Z",
    lastSeenAt: "2026-06-05T02:12:54.000Z",
    status: "triaged"
  },
  {
    id: "f_dependency_cve",
    fingerprint: "a4f02db6acdd42c2bd28085031be3ef8",
    scanner: "trivy",
    ruleId: "CVE-2026-0001",
    title: "Outdated dependency",
    description: "A dependency has a known vulnerability with a fixed version available.",
    severity: "critical",
    confidence: "high",
    filePath: "package-lock.json",
    evidence: "demo-lib 1.0.0 -> 1.0.3",
    evidenceHash: "2c109b820fc3e39333ad1d8faad2cfbdbf1575c62cafc5afc261f2c0e7f9595e",
    masked: false,
    cwe: ["CWE-937"],
    owasp: ["A06:2021"],
    isoControls: ["A.8.8", "A.8.29"],
    firstSeenAt: "2026-06-05T02:14:01.000Z",
    lastSeenAt: "2026-06-05T02:14:01.000Z",
    status: "open"
  },
  {
    id: "f_headers",
    fingerprint: "f1ce0b15f7044d628d79a85b7483e704",
    scanner: "semgrep",
    ruleId: "semgrep.missing-security-headers",
    title: "Security headers are incomplete",
    description: "The response pipeline should set security headers for browser-facing routes.",
    severity: "low",
    confidence: "medium",
    filePath: "src/server.ts",
    startLine: 28,
    endLine: 31,
    evidence: "reply.header('Content-Type', 'application/json')",
    evidenceHash: "b399943a6a084a87f253c2ee8b6f5ee589c1062c1b25c39230a907af79d35893",
    masked: false,
    cwe: ["CWE-693"],
    owasp: ["A05:2021"],
    isoControls: ["A.8.8", "A.8.25", "A.8.28"],
    firstSeenAt: "2026-06-05T02:12:54.000Z",
    lastSeenAt: "2026-06-05T02:12:54.000Z",
    status: "accepted"
  }
];

export const policyEvaluation: PolicyEvaluation = {
  passed: false,
  threshold: "high",
  requiredScanners: ["semgrep", "gitleaks", "trivy"],
  missingRequiredScanners: [],
  blockedFindingIds: ["f_secret_key", "f_dependency_cve"],
  ignoredFindingIds: [],
  evaluatedAt: "2026-06-05T02:14:03.000Z"
};

export const isoCoverage = buildIsoCoverage(findings);

export const project = {
  name: "VibeAudit Demo",
  repository: "github.com/husinn-abd/VibeAudit",
  branch: "main",
  commit: "3f08e0b",
  artifactHash: "d09e96b450a05dc6d404da0ed8e3ad5f5e657b5d862f9f5e823e60f239bdb668",
  generatedAt: "2026-06-05 09:14 WIB"
};
