# Architecture

VibeAudit is a local-first monorepo.

## Design Principles

- Keep source code local by default.
- Normalize scanner data before storing or reporting it.
- Treat secret redaction as a security boundary.
- Make policy evaluation deterministic.
- Keep ISO/IEC 27001 support configurable and evidence-oriented.
- Avoid enterprise-only complexity until the local loop works.

## Components

### Runner

The runner is a CLI that scans a folder or git URL, captures scanner metadata,
normalizes findings, applies policy, and writes JSON/SARIF artifacts.

### API

The API accepts normalized scan imports, stores project-scoped findings, manages
status workflow, and serves report exports.

### Web

The web app is the operational dashboard. The first deployed version is static
and uses demo data. It will later connect to the API through `VITE_API_BASE_URL`.

### Shared Packages

- `@vibeaudit/core`: finding schema, scanner normalization, fingerprinting,
  policy evaluation, SARIF.
- `@vibeaudit/security`: redaction, hashing, token helpers.
- `@vibeaudit/iso`: ISO/IEC 27001 control mapping.

## Data Safety

The default import payload contains normalized findings, scanner metadata,
policy output, evidence hashes, and redacted snippets. Full source code is not
part of the default import contract.
