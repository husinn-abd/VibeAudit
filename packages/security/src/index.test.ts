import { describe, expect, it } from "vitest";
import { createEvidenceHash, hashApiToken, redactSecrets, verifyApiToken } from "./index.js";

describe("security helpers", () => {
  it("redacts common secret shapes", () => {
    const result = redactSecrets("token=ghp_abcdefghijklmnopqrstuvwxyz123456 password=hunter2");
    expect(result.masked).toBe(true);
    expect(result.redacted).not.toContain("hunter2");
    expect(result.redacted).toContain("[REDACTED]");
  });

  it("hashes and verifies API tokens", () => {
    const token = "viba_test_token";
    const hash = hashApiToken(token);
    expect(verifyApiToken(token, hash)).toBe(true);
    expect(verifyApiToken("wrong", hash)).toBe(false);
  });

  it("creates stable canonical hashes", () => {
    expect(createEvidenceHash({ b: 2, a: 1 })).toBe(createEvidenceHash({ a: 1, b: 2 }));
  });
});
