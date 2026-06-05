export const webConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4317",
  organizationId: import.meta.env.VITE_ORGANIZATION_ID ?? "org_default",
  projectId: import.meta.env.VITE_PROJECT_ID ?? "proj_vibeaudit_demo",
  demoMode: (import.meta.env.VITE_DEMO_MODE ?? "true").toLowerCase() !== "false"
};
