# VibeAudit Implementation Phases

## Phase 0: Public Repository Foundation

Status: in progress.

- Public GitHub repository.
- Monorepo workspace with `apps/*` and `packages/*`.
- README, security policy, contribution guide, CI, and GitHub Pages workflow.
- Initial web dashboard deploy.

## Phase 1: Scanner and Policy Loop

Goal: prove local scanning without uploading source code.

- Implement `vibeaudit scan <path-or-git-url>`.
- Support mock scans for demos and scanner regression tests.
- Run Semgrep, Gitleaks, and Trivy through Docker.
- Normalize scanner outputs into one finding schema.
- Generate JSON, SARIF, and Markdown.
- Apply `securerepo.policy.yml`.
- Return stable exit codes for CI gates.

## Phase 2: Import API

Goal: accept scan results without accepting source code by default.

- API token creation and hashed storage.
- Project and scan import endpoints.
- Schema validation and upload size limits.
- Organization and project scoping.
- Finding status workflow and risk acceptance.

## Phase 3: Dashboard MVP

Goal: make scan review useful for developers and auditors.

- Projects, scans, findings, policy, reports, and ISO evidence views.
- Finding detail with redacted evidence and scanner metadata.
- Report export controls.
- Basic RBAC roles: owner, auditor, developer, viewer.

## Phase 4: Reports and ISO-lite

Goal: produce useful artifacts without overclaiming compliance.

- HTML and Markdown reports.
- PDF report generated from the same report model.
- JSON and SARIF exports.
- ISO/IEC 27001 evidence support for vulnerability management controls.
- Clear disclaimer that evidence support is not certification proof.

## Phase 5: AI Strict Mode

Goal: add optional assistance without leaking source code.

- `disabled` and `local_openai_compatible` providers first.
- Strict mode sends metadata only.
- AI output is labeled assisted analysis.
- AI cannot change finding status or source code.

## Phase 6: Enterprise Backlog

Deferred from V1:

- SSO/OIDC/SAML.
- GitHub App and GitLab App.
- Slack, Teams, Jira, and Linear integrations.
- Multi-runner fleet.
- Signed release pipeline.
- Advanced air-gapped bundles.
- Full ISMS lifecycle workflows.
