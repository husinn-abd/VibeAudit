import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/(ghp_|github_pat_|gho_)[A-Za-z0-9_]{20,}/g, "$1[REDACTED]"],
  [/(sk-[A-Za-z0-9]{16,})/g, "sk-[REDACTED]"],
  [/(AKIA[0-9A-Z]{16})/g, "AKIA[REDACTED]"],
  [/((?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*["']?)([^"'\s,;]+)/gi, "$1[REDACTED]"]
];

export type RedactionResult = {
  redacted: string;
  redactionCount: number;
  masked: boolean;
};

export function sha256(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function createEvidenceHash(value: unknown): string {
  return sha256(canonicalJson(value));
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortForJson(value));
}

export function redactSecrets(input: string): RedactionResult {
  let redacted = input;
  let redactionCount = 0;

  for (const [pattern, replacement] of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, (...args: unknown[]) => {
      redactionCount += 1;
      return typeof replacement === "string" ? replacement.replace(/\$(\d+)/g, (_, index) => String(args[Number(index)] ?? "")) : "[REDACTED]";
    });
  }

  return {
    redacted,
    redactionCount,
    masked: redactionCount > 0
  };
}

export function generateApiToken(prefix = "viba"): string {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

export function hashApiToken(token: string): string {
  return sha256(`vibeaudit-api-token:${token}`);
}

export function verifyApiToken(token: string, hashedToken: string): boolean {
  const actual = Buffer.from(hashApiToken(token), "utf8");
  const expected = Buffer.from(hashedToken, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function appendAuditHash(previousHash: string | null, entry: unknown): string {
  return sha256(`${previousHash ?? "GENESIS"}:${canonicalJson(entry)}`);
}

function sortForJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortForJson(nested)])
    );
  }

  return value;
}
