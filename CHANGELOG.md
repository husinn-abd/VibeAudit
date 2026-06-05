# Changelog

All notable changes to VibeAudit are documented here.

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
