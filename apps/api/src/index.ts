import { fileURLToPath } from "node:url";
import { loadVibeAuditEnv } from "@vibeaudit/core/env";
import Fastify from "fastify";
import { createHtmlReport, createMarkdownReport, createSarifReport, scanReportSchema } from "./validation.js";
import { MemoryStore, type StoredScan } from "./store.js";
import { missingOrganizationError, readOrganizationId } from "./scoping.js";

loadVibeAuditEnv({ appDir: fileURLToPath(new URL("..", import.meta.url)) });

const apiConfig = {
  host: process.env.VIBEAUDIT_API_HOST ?? "0.0.0.0",
  port: readPositiveIntegerEnv("VIBEAUDIT_API_PORT", 4317),
  logger: readBooleanEnv("VIBEAUDIT_API_LOGGER", true),
  maxImportBytes: readPositiveIntegerEnv("VIBEAUDIT_API_MAX_IMPORT_BYTES", 10 * 1024 * 1024)
};
const store = new MemoryStore({
  defaultOrganizationId: process.env.VIBEAUDIT_DEFAULT_ORGANIZATION_ID,
  defaultOrganizationName: process.env.VIBEAUDIT_DEFAULT_ORGANIZATION_NAME,
  defaultProjectId: process.env.VIBEAUDIT_DEFAULT_PROJECT_ID,
  defaultProjectName: process.env.VIBEAUDIT_DEFAULT_PROJECT_NAME,
  defaultRepositoryUrl: process.env.VIBEAUDIT_DEFAULT_REPOSITORY_URL
});
const app = Fastify({ logger: apiConfig.logger, bodyLimit: apiConfig.maxImportBytes });

app.get("/health", async () => ({
  status: "ok",
  service: "vibeaudit-api",
  time: new Date().toISOString()
}));

app.get("/v1/projects", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  return { projects: store.listProjects(organizationId) };
});

app.post("/v1/projects", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const body = request.body as { name?: string; repositoryUrl?: string };
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  if (!body?.name) {
    return reply.code(400).send({ error: "Project name is required" });
  }

  return { project: store.createProject({ organizationId, name: body.name, repositoryUrl: body.repositoryUrl }) };
});

app.post("/v1/api-tokens", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const body = request.body as { name?: string; projectId?: string };
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  if (!body?.name) {
    return reply.code(400).send({ error: "Token name is required" });
  }

  const result = store.createApiToken({ organizationId, name: body.name, projectId: body.projectId });
  return { token: result.token, record: { ...result.record, hashedToken: "[stored hashed]" } };
});

app.post("/v1/projects/:projectId/scans/import", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const { projectId } = request.params as { projectId: string };
  const parsed = scanReportSchema.safeParse(request.body);
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  if (!parsed.success) {
    return reply.code(400).send({ error: "Invalid scan report", details: parsed.error.flatten() });
  }

  try {
    const scan = store.importScan({ organizationId, projectId, report: parsed.data });
    return { scanId: scan.id, importedAt: scan.importedAt, policy: scan.report.policyEvaluation };
  } catch (error) {
    return reply.code(404).send({ error: error instanceof Error ? error.message : "Project not found" });
  }
});

app.get("/v1/projects/:projectId/scans", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const { projectId } = request.params as { projectId: string };
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  try {
    return { scans: store.listScans(organizationId, projectId).map((scan) => ({ ...scan, report: undefined })) };
  } catch (error) {
    return reply.code(404).send({ error: error instanceof Error ? error.message : "Project not found" });
  }
});

app.get("/v1/projects/:projectId/findings", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const { projectId } = request.params as { projectId: string };
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  try {
    return { findings: store.listFindings(organizationId, projectId) };
  } catch (error) {
    return reply.code(404).send({ error: error instanceof Error ? error.message : "Project not found" });
  }
});

app.post("/v1/projects/:projectId/risk-acceptances", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const { projectId } = request.params as { projectId: string };
  const body = request.body as {
    findingId?: string;
    owner?: string;
    reviewer?: string;
    justification?: string;
    expiresAt?: string;
  };
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  if (!body.findingId || !body.owner || !body.reviewer || !body.justification || !body.expiresAt) {
    return reply.code(400).send({ error: "findingId, owner, reviewer, justification, and expiresAt are required" });
  }

  try {
    return {
      riskAcceptance: store.acceptRisk({
        organizationId,
        projectId,
        findingId: body.findingId,
        owner: body.owner,
        reviewer: body.reviewer,
        justification: body.justification,
        expiresAt: body.expiresAt
      })
    };
  } catch (error) {
    return reply.code(404).send({ error: error instanceof Error ? error.message : "Project not found" });
  }
});

app.get("/v1/projects/:projectId/scans/:scanId/reports/html", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const { projectId, scanId } = request.params as { projectId: string; scanId: string };
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  const scan = readScopedScan({ organizationId, projectId, scanId });
  if (!scan) {
    return reply.code(404).send({ error: "Scan not found for organization and project" });
  }

  reply.header("Content-Type", "text/html; charset=utf-8");
  return createHtmlReport(scan.report);
});

app.get("/v1/projects/:projectId/scans/:scanId/reports/markdown", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const { projectId, scanId } = request.params as { projectId: string; scanId: string };
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  const scan = readScopedScan({ organizationId, projectId, scanId });
  if (!scan) {
    return reply.code(404).send({ error: "Scan not found for organization and project" });
  }

  return reply
    .type("text/markdown; charset=utf-8")
    .header("content-disposition", `attachment; filename="vibeaudit-${scan.id}.md"`)
    .send(createMarkdownReport(scan.report));
});

app.get("/v1/projects/:projectId/scans/:scanId/reports/json", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const { projectId, scanId } = request.params as { projectId: string; scanId: string };
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  const scan = readScopedScan({ organizationId, projectId, scanId });
  if (!scan) {
    return reply.code(404).send({ error: "Scan not found for organization and project" });
  }

  return reply
    .type("application/json; charset=utf-8")
    .header("content-disposition", `attachment; filename="vibeaudit-${scan.id}.json"`)
    .send(scan.report);
});

app.get("/v1/projects/:projectId/scans/:scanId/reports/sarif", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const { projectId, scanId } = request.params as { projectId: string; scanId: string };
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  const scan = readScopedScan({ organizationId, projectId, scanId });
  if (!scan) {
    return reply.code(404).send({ error: "Scan not found for organization and project" });
  }

  return reply
    .type("application/sarif+json; charset=utf-8")
    .header("content-disposition", `attachment; filename="vibeaudit-${scan.id}.sarif"`)
    .send(createSarifReport(scan.report));
});

app.get("/v1/audit-log", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  if (!organizationId) {
    return reply.code(400).send(missingOrganizationError);
  }

  return { auditLog: store.auditLog.filter((entry) => entry.organizationId === organizationId) };
});

await app.listen({ port: apiConfig.port, host: apiConfig.host });

function readPositiveIntegerEnv(key: string, fallback: number): number {
  const value = Number(process.env[key]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function readBooleanEnv(key: string, fallback: boolean): boolean {
  const value = process.env[key]?.trim().toLowerCase();
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value);
}

function readScopedScan(input: { organizationId: string; projectId: string; scanId: string }): StoredScan | undefined {
  const scan = store.scans.get(input.scanId);
  if (!scan || scan.organizationId !== input.organizationId || scan.projectId !== input.projectId) {
    return undefined;
  }

  return scan;
}
