# Changelog

All notable changes to VibeAudit are documented here.

## [0.3.4] - 2026-06-05

### Added

- Added a copy-paste PowerShell quickstart that works from any folder by cloning the repo, entering it, checking for `package.json`, and then running install/test/build/mock scan.
- Added troubleshooting guidance for `ERR_PNPM_NO_PKG_MANIFEST` and `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`.

### Improved

- Made the README quickstart explicit that pnpm commands must run from the VibeAudit repository folder.
- Removed `corepack enable` from the quickstart because it can require administrator rights on Windows and is not needed for `corepack pnpm ...`.
- Added `git pull --ff-only` so an existing quickstart clone updates before running install/test/build.
- Bumped all workspace package versions and the runner version to `0.3.4`.

### Fixed

- Fixed quickstart instructions that could fail when copied from `C:\Users\HusinAbdullah` or any folder outside the repo.

### QA

- Verified `C:\Users\HusinAbdullah` does not contain `package.json`, matching the reported pnpm error cause.
- Verified `corepack pnpm install`, `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build` from the repository folder.
- Verified `corepack pnpm --filter @vibeaudit/runner scan:mock:demo` exits `0`, writes JSON/SARIF/Markdown artifacts, and reports tool version `0.3.4`.
- Verified the public quickstart flow from `C:\Users\HusinAbdullah`: clone, enter `C:\Users\HusinAbdullah\VibeAudit`, install, test, build, and mock scan all complete successfully.

## [0.3.3] - 2026-06-05

### Added

- Added Markdown report generation in `packages/core`.
- Added runner `--markdown <path>` support and updated the mock quickstart to write `artifacts/mock-report.md`.
- Added a project-scoped API Markdown report endpoint with downloadable `.md` response headers.
- Added a dashboard `MD` export button that downloads a Markdown report from the rendered interface.

### Improved

- Updated README and implementation phases to include Markdown report export.
- Bumped all workspace package versions and the runner version to `0.3.3`.

### Fixed

- No bug fixes in this release.

### QA

- Verified `corepack pnpm install`.
- Verified `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build`.
- Verified `corepack pnpm --filter @vibeaudit/runner scan:mock:demo` exits `0` and writes JSON, SARIF, and Markdown artifacts with tool version `0.3.3`.
- Verified raw `corepack pnpm --filter @vibeaudit/runner scan:mock` still exits `1` for CI policy-gate behavior while writing `artifacts/mock-report.md`.
- Verified local API Markdown export: mock scan import returns `200`, project-scoped Markdown endpoint returns `200`, `content-type` is `text/markdown`, `content-disposition` includes a `.md` attachment filename, and the body includes the report heading, evidence hashes, and redaction notice.
- Verified local dashboard download with Browser plus Playwright fallback for download capture: the `MD` button is unique, downloads `vibeaudit-demo-report.md`, updates status to `Markdown .md report downloaded`, and emits no console errors.

## [0.3.2] - 2026-06-05

### Added

- Added `docs/VIBEAUDIT_STANDARD.md` as the public repo standard for product behavior, security baseline, release discipline, and verification.
- Added API scoping tests for explicit `x-organization-id` handling.

### Improved

- Linked the VibeAudit standard from the README, contribution guide, and security policy.
- Documented that scoped API calls require explicit organization context.
- Bumped all workspace package versions and the runner version to `0.3.2`.

### Fixed

- Fixed API organization scoping so scoped routes no longer silently fall back to `org_default` when `x-organization-id` is missing.
- Fixed the HTML report API route so scan reports are requested through organization and project context.

### QA

- Verified `corepack pnpm install`.
- Verified `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build`.
- Verified `corepack pnpm --filter @vibeaudit/runner scan:mock:demo` exits `0`, writes JSON/SARIF artifacts, and reports tool version `0.3.2`.
- Verified raw `corepack pnpm --filter @vibeaudit/runner scan:mock` still exits `1` for CI policy-gate behavior.
- Verified API smoke locally: `/health` returns `ok`, `/v1/projects` without `x-organization-id` returns `400`, `/v1/projects` with `x-organization-id: org_default` returns the VibeAudit Demo project, mock scan import returns `200`, project-scoped HTML report export returns `200`, and the old unscoped report route returns `404`.

## [0.3.1] - 2026-06-05

### Added

- Added `scan:mock:demo` for a beginner-friendly quickstart scan that writes JSON and SARIF artifacts, summarizes the expected policy failure, and exits `0`.

### Improved

- Improved the README quickstart so the first local mock scan feels successful while preserving the raw `scan:mock` command for CI policy-gate exit code testing.
- Bumped all workspace package versions and the runner version to `0.3.1`.

### Fixed

- Fixed quickstart confusion where the deterministic mock scan produced valid artifacts but pnpm displayed a recursive-run failure because the raw policy gate correctly exited `1`.

### QA

- Verified `corepack pnpm install`, `corepack pnpm test`, and `corepack pnpm build`.
- Verified the local dashboard at `http://localhost:5173`.
- Verified `corepack pnpm --filter @vibeaudit/runner scan:mock:demo` exits `0`, writes JSON/SARIF artifacts, and reports the expected failed policy.
- Verified raw `corepack pnpm --filter @vibeaudit/runner scan:mock` still exits `1` for CI policy-gate behavior.

## [0.3.0] - 2026-06-05

### Added

- Added a screenshot-matched dashboard layout based on the requested VibeAudit command-center reference.
- Added the right-side finding inspector with SQL Injection details, metadata fields, evidence code block, ISO evidence table, and report export controls.
- Added table pagination chrome, rule/status filters, scanner badges, tags, privacy header state, and local repository header treatment.

### Improved

- Reworked the public dashboard visual system to match the supplied reference: dark left sidebar, white project header, policy summary strip, scanner cards, dense findings table, and right detail panel.
- Improved demo data presentation to show realistic aggregate counts, scanner counts, 180-finding table context, and selected SQL Injection evidence.
- Bumped all workspace package versions and the runner version to `0.3.0`.

### Fixed

- Fixed the dashboard design mismatch with the requested reference by replacing the previous command-center layout.

### QA

- Verified local dashboard rendering at `http://127.0.0.1:5173/`.
- Verified screenshot-matched default state: `SQL Injection`, `Findings (180)`, policy block, scanner cards, summary counts, evidence highlight, ISO table, and report export controls.
- Verified dashboard interaction: search `lodash`, selected finding detail update, and JSON export state.
- Verified responsive layout at `390x844` with no page-level horizontal overflow.
- Verified `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build`.
- Verified `corepack pnpm --filter @vibeaudit/runner scan:mock` returns exit code `1` for the expected policy failure and reports tool version `0.3.0`.

## [0.2.0] - 2026-06-05

### Added

- Added a modern dashboard command-center interface for the public GitHub Pages demo.
- Added a visible scan flow: scan, normalize, policy, review, and export.
- Added finding search plus severity and scanner filters in the dashboard.
- Added local interaction state for selected findings, risk acceptance, navigation, import status, ISO evidence selection, and report export status.
- Added this changelog so every release version has a readable update record.

### Improved

- Improved the README with a clearer product flow for local scanning, policy evaluation, dashboard review, and report export.
- Improved the dashboard hierarchy for policy gate status, evidence integrity, scanner runs, finding details, ISO-lite mapping, and report exports.
- Improved responsive behavior for mobile and narrow desktop viewports.
- Bumped all workspace package versions and the runner version to `0.2.0`.

### Fixed

- No bug fixes in this release.

### QA

- Verified local dashboard rendering at `http://127.0.0.1:5173/`.
- Verified dashboard interaction: search, selected finding, accept risk, and JSON export state.
- Verified responsive layout at `390x844` with no page-level horizontal overflow.
- Verified `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build`.
- Verified `corepack pnpm --filter @vibeaudit/runner scan:mock` returns exit code `1` for the expected policy failure.

## [0.1.0] - 2026-06-05

### Added

- Initialized the VibeAudit TypeScript monorepo.
- Added runner, API, web dashboard, core, security, and ISO-lite packages.
- Added CI and GitHub Pages deployment workflows.
- Added initial README, architecture, deployment, security, contribution, and implementation phase documentation.
