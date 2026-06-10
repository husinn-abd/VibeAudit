# VibeAudit

[![CI](https://github.com/husinn-abd/VibeAudit/actions/workflows/ci.yml/badge.svg)](https://github.com/husinn-abd/VibeAudit/actions/workflows/ci.yml)
[![Deploy Web Dashboard](https://github.com/husinn-abd/VibeAudit/actions/workflows/pages.yml/badge.svg)](https://github.com/husinn-abd/VibeAudit/actions/workflows/pages.yml)
[![Version](https://img.shields.io/badge/version-0.3.8-0f8f7f.svg)](./CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-0f8f7f.svg)](./LICENSE)
[![Live demo](https://img.shields.io/badge/live-dashboard-101820.svg)](https://husinn-abd.github.io/VibeAudit/)

VibeAudit is a local-first security audit cockpit for modern repositories. It
helps developers and auditors scan code, normalize findings, enforce policy
gates, preserve evidence hashes, and prepare ISO/IEC 27001 audit support without
uploading source code by default.

[Open the live dashboard](https://husinn-abd.github.io/VibeAudit/) |
[Read the implementation phases](./docs/IMPLEMENTATION_PHASES.md) |
[Configure environment](./docs/ENVIRONMENT.md) |
[Review the VibeAudit standard](./docs/VIBEAUDIT_STANDARD.md) |
[See the changelog](./CHANGELOG.md) |
[Review the security policy](./SECURITY.md)

![VibeAudit dashboard](./docs/assets/vibeaudit-dashboard.png)

Screenshot captured from the real `apps/web` dashboard running locally. The
sample data is seeded demo data, but the interface, selection state, policy
panel, evidence panel, and report controls are rendered by the application.

## Why VibeAudit

Security scanners are useful, but their output is often scattered across CLI
logs, SARIF uploads, CI failures, PDF reports, and spreadsheet-based risk
registers. VibeAudit turns those signals into one reviewable workflow:

- Run Semgrep, Gitleaks, and Trivy from a local runner.
- Normalize findings into one stable model.
- Redact secrets before storage, reports, or AI.
- Apply a policy gate that can fail CI.
- Track evidence hashes, scanner metadata, and ISO control mappings.
- Export developer, executive, Markdown, JSON, SARIF, and evidence-oriented reports.

## Who It Helps

- Developers who want a fast local security check before pushing.
- Security teams that need consistent evidence across projects.
- Auditors who need traceable scanner metadata and control mapping.
- Open-source maintainers who want a readable public security posture.
- AI-heavy teams that want assistance without sending full source by default.

## What Works Now

| Area | Status |
| --- | --- |
| Public dashboard | Deployed on GitHub Pages |
| Dashboard UI | Modern command-center interface with filters, selected evidence, scanner flow, ISO, and export state |
| Monorepo foundation | `apps/*`, `packages/*`, docs, CI, Pages workflow |
| Runner CLI | Mock scans, JSON output, SARIF output, Markdown output, Docker scanner wrappers |
| Core model | Severity mapping, fingerprints, policy evaluation, reports |
| Secret safety | Redaction, evidence hashing, API token hashing helpers |
| ISO-lite | A.8.8, A.8.25, A.8.28, A.8.29 support mappings |
| API | MVP import, projects, findings, risk acceptance, HTML and Markdown report endpoints |

VibeAudit is pre-release. The dashboard currently uses demo data while the API
and persisted storage are being connected.

## Product Flow

1. **Scan locally** with the runner against a folder or git URL.
2. **Normalize** Semgrep, Gitleaks, and Trivy output into one finding model.
3. **Redact and hash** evidence before it is stored, shown, or exported.
4. **Evaluate policy** with `securerepo.policy.yml`, including `fail_on` and required scanners.
5. **Review in dashboard** with severity filters, scanner filters, selected finding evidence, scanner run metadata, and ISO-lite mappings.
6. **Accept risk or export** HTML, PDF, Markdown, JSON, and SARIF reports from the same scan data.
7. **Fail CI when needed** using the runner exit code: `0` pass, `1` policy failed, `2` scanner/runtime error, `3` invalid input/config.

## Quick Access From PowerShell

Copy and paste this block from any PowerShell prompt, including your Windows
home folder. It clones the repo if needed, updates it if it already exists, and
then runs the built-in quickstart script.

```powershell
$repo = Join-Path $env:USERPROFILE "VibeAudit"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is required. Install Git for Windows, reopen PowerShell, then run this block again."
}

git --version
if ($LASTEXITCODE -ne 0) {
  throw "Git is required. Install Git for Windows, reopen PowerShell, then run this block again."
}

if (Test-Path (Join-Path $repo ".git")) {
  Set-Location $repo
  git pull --ff-only
  if ($LASTEXITCODE -ne 0) {
    throw "git pull failed. Commit/stash local changes or reclone the repo, then run this block again."
  }
} else {
  if (Test-Path $repo) {
    throw "$repo already exists but is not a git repo. Move it or choose another folder."
  }
  git clone https://github.com/husinn-abd/VibeAudit.git $repo
  if ($LASTEXITCODE -ne 0) {
    throw "git clone failed. Check internet access and GitHub access, then run this block again."
  }
  Set-Location $repo
}

powershell -ExecutionPolicy Bypass -File .\scripts\quickstart.ps1
```

The script checks Git, Node.js, Corepack, pnpm, optional Docker availability,
and the repo root before it installs dependencies. It then creates `.env` from
`.env.example` when needed, runs install, typecheck, tests, production build,
and a mock scan. If any dependency install or validation step fails, it prints
the exact fix to try next.

The mock scan writes:

- `artifacts/mock-report.json`
- `artifacts/mock-report.sarif`
- `artifacts/mock-report.md`

If the repository is already cloned somewhere else, enter that folder and run
the same script:

```powershell
Set-Location "D:\0Documents\Documents\SecureRepo-Auditor"
powershell -ExecutionPolicy Bypass -File .\scripts\quickstart.ps1
```

To only check machine dependencies before installing packages:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\quickstart.ps1 -CheckOnly
```

To save a machine-readable setup report:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\quickstart.ps1 -CheckOnly -DoctorReport artifacts\quickstart-doctor.json
```

## Environment Setup

The committed `.env.example` files are safe templates. Real `.env` files stay
ignored by git.

```powershell
Copy-Item .env.example .env
```

Optional app-specific override templates are available here:

- `apps/api/.env.example`
- `apps/runner/.env.example`
- `apps/web/.env.example`

Full details: [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md).

### Why The Old Command Failed

This error:

```text
ERR_PNPM_NO_PKG_MANIFEST No package.json found in C:\Users\HusinAbdullah
```

means pnpm was run from your Windows home folder, not from the VibeAudit repo.
Confirm you are in the correct folder with:

```powershell
Test-Path .\package.json
```

It must print `True` before running `corepack pnpm install`, `corepack pnpm test`,
or `corepack pnpm build`. The recommended fix is to use the clone-based quick
access block above, because it always enters the repo before running checks.

## Manual Quickstart

Install dependencies, run tests, and build everything:

```bash
cp .env.example .env
corepack pnpm install
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm --filter @vibeaudit/runner scan:mock:demo
```

Run the dashboard locally:

```bash
corepack pnpm --filter @vibeaudit/web dev
```

Open:

```text
http://localhost:5173
```

Run a deterministic mock scan:

```bash
corepack pnpm --filter @vibeaudit/runner scan:mock:demo
```

The demo writes `artifacts/mock-report.json`, `artifacts/mock-report.sarif`,
and `artifacts/mock-report.md`,
then exits `0` after confirming the expected policy failure.

For CI policy-gate behavior, use the raw command:

```bash
corepack pnpm --filter @vibeaudit/runner scan:mock
```

The raw mock scan intentionally returns exit code `1` because the sample policy
fails on high and critical findings.

## Real Scanner Mode

Real scanning uses Docker images for the required V1 scanner set:

- Semgrep for SAST.
- Gitleaks for committed secrets.
- Trivy for dependency and filesystem vulnerabilities.

```bash
corepack pnpm --filter @vibeaudit/runner exec tsx src/index.ts scan . \
  --output artifacts/vibeaudit-report.json \
  --sarif artifacts/vibeaudit-report.sarif \
  --markdown artifacts/vibeaudit-report.md
```

VibeAudit mounts local source read-only when running scanner containers.

## Policy Example

Create `securerepo.policy.yml`:

```yaml
schema_version: 1
required_scanners:
  - semgrep
  - gitleaks
  - trivy
fail_on: high
ignored_rules: []
accepted_risk_max_days: 90
ai_privacy_mode: disabled
```

Policy evaluation is deterministic and shared by the CLI, API imports, and
dashboard views.

## Architecture

```text
apps/
  api/       REST API, project scope, imports, findings, report endpoints
  runner/    Local CLI scanner orchestrator
  web/       Dashboard deployed to GitHub Pages
packages/
  core/      Finding schema, normalization, SARIF, policy engine, reports
  iso/       Lightweight ISO/IEC 27001 mappings
  security/  Redaction, hashing, token helpers, audit hash primitives
docs/
  Architecture, deployment, implementation phases, repo patterns, standards
```

The default import payload contains normalized findings, scanner metadata,
policy output, evidence hashes, and redacted snippets. Full source code is not
part of the default import contract.

API calls that read or write scoped data must include explicit organization
context through `x-organization-id`; project routes also carry `projectId` in the
path.

## Current Roadmap

1. Connect the dashboard to the API instead of demo data.
2. Persist imports through Prisma with SQLite for local use.
3. Add Postgres-ready deployment path.
4. Add PDF report generation from the same report model.
5. Add strict local AI assistance for finding explanations.
6. Add scanner benchmark fixtures for regression testing.

Deferred enterprise features include SSO, GitHub App, GitLab App, multi-runner
fleet, signed release pipeline, and full ISMS lifecycle workflows.

## Security And Compliance Notes

VibeAudit helps collect and organize technical evidence. It does not certify an
organization, replace an ISMS, or prove ISO/IEC 27001 compliance by itself.

Before using VibeAudit on sensitive repositories, read [SECURITY.md](./SECURITY.md).

## Contributing

Issues and pull requests are welcome. Keep changes scoped, update tests for
scanner or policy behavior, and never add real secrets to fixtures.

Start here:

- [Contribution guide](./CONTRIBUTING.md)
- [Architecture notes](./docs/ARCHITECTURE.md)
- [Deployment notes](./docs/DEPLOYMENT.md)
