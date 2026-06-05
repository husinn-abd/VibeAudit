# VibeAudit

VibeAudit is a local-first, AI-aware repository security auditor for secrets,
vulnerabilities, policy gates, and ISO/IEC 27001 evidence support.

The first release focuses on one dependable loop:

1. Scan a local folder or git URL.
2. Normalize scanner output into one finding model.
3. Apply a policy gate.
4. Import scans into a dashboard.
5. Export developer, executive, SARIF, and evidence-oriented reports.

## Why This Repository Is Structured This Way

Large open-source monorepos usually keep product surfaces in `apps/`, shared
libraries in `packages/`, operational docs in `docs/`, and automation in
`.github/`. VibeAudit follows that shape from day one so the CLI, API, web UI,
and shared security logic can evolve without becoming one tangled application.

## Repository Layout

```text
apps/
  api/       REST API, auth boundary, imports, reports
  runner/    Local CLI scanner orchestrator
  web/       Static dashboard and future self-hosted UI
packages/
  core/      Finding schema, normalization, SARIF, policy engine
  iso/       Lightweight ISO/IEC 27001 mappings
  security/  Redaction, hashing, token helpers, audit chain primitives
docs/
  Implementation phases, architecture, deployment notes
```

## Quickstart

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm test
```

Run the web dashboard locally:

```bash
corepack pnpm --filter @vibeaudit/web dev
```

Run a local scan with mock data:

```bash
corepack pnpm --filter @vibeaudit/runner exec tsx src/index.ts scan . --mock --sarif artifacts/vibeaudit.sarif
```

Real scanner execution uses Docker and the Semgrep, Gitleaks, and Trivy images.

## V1 Boundaries

V1 is local-first and self-hosted. Source code is not uploaded by default. The
API receives normalized findings, metadata, evidence hashes, and redacted
evidence snippets. Full enterprise features such as SSO, GitHub Apps, GitLab
Apps, multi-runner fleets, and full ISMS lifecycle management are post-V1.

## Deployment

The public dashboard deploys to GitHub Pages through `.github/workflows/pages.yml`.
The self-hosted stack starts with Docker Compose and expands after the API
storage layer stabilizes.

## Security

Please read [SECURITY.md](./SECURITY.md) before using VibeAudit on sensitive
repositories. VibeAudit is an audit support tool, not proof of certification
or a substitute for an organization's ISMS.
