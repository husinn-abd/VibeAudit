import Fastify from "fastify";
import { createHtmlReport, scanReportSchema } from "./validation.js";
import { MemoryStore } from "./store.js";

const port = Number(process.env.VIBEAUDIT_API_PORT ?? 4317);
const store = new MemoryStore();
const app = Fastify({ logger: true });

app.get("/health", async () => ({
  status: "ok",
  service: "vibeaudit-api",
  time: new Date().toISOString()
}));

app.get("/v1/projects", async (request) => {
  const organizationId = readOrganizationId(request.headers);
  return { projects: store.listProjects(organizationId) };
});

app.post("/v1/projects", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const body = request.body as { name?: string; repositoryUrl?: string };

  if (!body?.name) {
    return reply.code(400).send({ error: "Project name is required" });
  }

  return { project: store.createProject({ organizationId, name: body.name, repositoryUrl: body.repositoryUrl }) };
});

app.post("/v1/api-tokens", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const body = request.body as { name?: string; projectId?: string };

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

  try {
    return { scans: store.listScans(organizationId, projectId).map((scan) => ({ ...scan, report: undefined })) };
  } catch (error) {
    return reply.code(404).send({ error: error instanceof Error ? error.message : "Project not found" });
  }
});

app.get("/v1/projects/:projectId/findings", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const { projectId } = request.params as { projectId: string };

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

app.get("/v1/scans/:scanId/reports/html", async (request, reply) => {
  const organizationId = readOrganizationId(request.headers);
  const { scanId } = request.params as { scanId: string };
  const scan = store.scans.get(scanId);

  if (!scan || scan.organizationId !== organizationId) {
    return reply.code(404).send({ error: "Scan not found for organization" });
  }

  reply.header("Content-Type", "text/html; charset=utf-8");
  return createHtmlReport(scan.report);
});

app.get("/v1/audit-log", async (request) => {
  const organizationId = readOrganizationId(request.headers);
  return { auditLog: store.auditLog.filter((entry) => entry.organizationId === organizationId) };
});

await app.listen({ port, host: "0.0.0.0" });

function readOrganizationId(headers: Record<string, string | string[] | undefined>): string {
  const value = headers["x-organization-id"];
  return Array.isArray(value) ? (value[0] ?? "org_default") : (value ?? "org_default");
}
