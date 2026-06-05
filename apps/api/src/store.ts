import { randomUUID } from "node:crypto";
import type { NormalizedFinding, ScanReport } from "@vibeaudit/core";
import { generateApiToken, hashApiToken } from "@vibeaudit/security";

export type Role = "owner" | "auditor" | "developer" | "viewer";

export type Organization = {
  id: string;
  name: string;
  createdAt: string;
};

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  repositoryUrl?: string;
  createdAt: string;
};

export type StoredScan = {
  id: string;
  organizationId: string;
  projectId: string;
  report: ScanReport;
  importedAt: string;
};

export type ApiTokenRecord = {
  id: string;
  organizationId: string;
  projectId?: string;
  name: string;
  hashedToken: string;
  createdAt: string;
};

export type RiskAcceptance = {
  id: string;
  organizationId: string;
  projectId: string;
  findingId: string;
  owner: string;
  reviewer: string;
  justification: string;
  expiresAt: string;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  organizationId: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

const now = () => new Date().toISOString();

export class MemoryStore {
  readonly organizations = new Map<string, Organization>();
  readonly projects = new Map<string, Project>();
  readonly scans = new Map<string, StoredScan>();
  readonly apiTokens = new Map<string, ApiTokenRecord>();
  readonly riskAcceptances = new Map<string, RiskAcceptance>();
  readonly auditLog: AuditLogEntry[] = [];

  constructor() {
    const organization: Organization = {
      id: "org_default",
      name: "Default Organization",
      createdAt: now()
    };
    const project: Project = {
      id: "proj_vibeaudit_demo",
      organizationId: organization.id,
      name: "VibeAudit Demo",
      repositoryUrl: "https://github.com/husinn-abd/VibeAudit",
      createdAt: now()
    };
    this.organizations.set(organization.id, organization);
    this.projects.set(project.id, project);
  }

  listProjects(organizationId: string): Project[] {
    return [...this.projects.values()].filter((project) => project.organizationId === organizationId);
  }

  createProject(input: { organizationId: string; name: string; repositoryUrl?: string }): Project {
    const project: Project = {
      id: `proj_${randomUUID()}`,
      organizationId: input.organizationId,
      name: input.name,
      repositoryUrl: input.repositoryUrl,
      createdAt: now()
    };
    this.projects.set(project.id, project);
    this.audit(input.organizationId, "system", "project.created", project.id);
    return project;
  }

  importScan(input: { organizationId: string; projectId: string; report: ScanReport }): StoredScan {
    this.assertProjectAccess(input.organizationId, input.projectId);
    const scan: StoredScan = {
      id: `scan_${randomUUID()}`,
      organizationId: input.organizationId,
      projectId: input.projectId,
      report: input.report,
      importedAt: now()
    };
    this.scans.set(scan.id, scan);
    this.audit(input.organizationId, "api", "scan.imported", scan.id);
    return scan;
  }

  listScans(organizationId: string, projectId: string): StoredScan[] {
    this.assertProjectAccess(organizationId, projectId);
    return [...this.scans.values()].filter((scan) => scan.organizationId === organizationId && scan.projectId === projectId);
  }

  listFindings(organizationId: string, projectId: string): NormalizedFinding[] {
    return this.listScans(organizationId, projectId).flatMap((scan) => scan.report.findings);
  }

  createApiToken(input: { organizationId: string; projectId?: string; name: string }): { token: string; record: ApiTokenRecord } {
    if (input.projectId) {
      this.assertProjectAccess(input.organizationId, input.projectId);
    }

    const token = generateApiToken();
    const record: ApiTokenRecord = {
      id: `tok_${randomUUID()}`,
      organizationId: input.organizationId,
      projectId: input.projectId,
      name: input.name,
      hashedToken: hashApiToken(token),
      createdAt: now()
    };
    this.apiTokens.set(record.id, record);
    this.audit(input.organizationId, "system", "api_token.created", record.id);
    return { token, record };
  }

  acceptRisk(input: Omit<RiskAcceptance, "id" | "createdAt">): RiskAcceptance {
    this.assertProjectAccess(input.organizationId, input.projectId);
    const acceptance: RiskAcceptance = {
      ...input,
      id: `risk_${randomUUID()}`,
      createdAt: now()
    };
    this.riskAcceptances.set(acceptance.id, acceptance);
    this.audit(input.organizationId, input.owner, "risk.accepted", input.findingId);
    return acceptance;
  }

  audit(organizationId: string, actor: string, action: string, target: string): void {
    this.auditLog.push({
      id: `audit_${randomUUID()}`,
      organizationId,
      actor,
      action,
      target,
      createdAt: now()
    });
  }

  assertProjectAccess(organizationId: string, projectId: string): Project {
    const project = this.projects.get(projectId);
    if (!project || project.organizationId !== organizationId) {
      throw new Error("Project not found for organization");
    }
    return project;
  }
}
