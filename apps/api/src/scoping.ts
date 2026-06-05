export type ScopeHeaders = Record<string, string | string[] | undefined>;

export const missingOrganizationError = {
  error: "x-organization-id header is required"
} as const;

export function readOrganizationId(headers: ScopeHeaders): string | undefined {
  const value = headers["x-organization-id"];
  const organizationId = Array.isArray(value) ? value[0] : value;
  const normalized = organizationId?.trim();

  return normalized ? normalized : undefined;
}
