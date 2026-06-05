import { describe, expect, it } from "vitest";
import { readOrganizationId } from "./scoping.js";

describe("API organization scoping", () => {
  it("requires an explicit organization header", () => {
    expect(readOrganizationId({})).toBeUndefined();
  });

  it("normalizes a provided organization header", () => {
    expect(readOrganizationId({ "x-organization-id": " org_default " })).toBe("org_default");
  });

  it("rejects blank organization headers", () => {
    expect(readOrganizationId({ "x-organization-id": "   " })).toBeUndefined();
  });
});
