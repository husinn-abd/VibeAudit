# VibeAudit Standard

This document is the operating standard for the VibeAudit repository. A change is
not considered release-ready until it keeps these guarantees true or clearly
documents a temporary exception.

## Product Standard

- VibeAudit is local-first by default. Source code is scanned locally and is not
  uploaded in the default flow.
- The MVP proves the loop: scan, normalize, redact, evaluate policy, review
  evidence, and export reports.
- Demo data must be clearly labeled as demo data.
- Public screenshots must come from the real local application, not from a
  static mockup.
- ISO/IEC 27001 output must be labeled as audit support, not certification
  proof.

## Security Standard

- API tokens are stored only as hashes.
- Secrets are redacted before persistence, report export, or AI processing.
- Raw scanner output is access-restricted and is not committed to the repo.
- Scanner artifacts include SHA-256 hashes, scanner metadata, command metadata,
  source target, and creation time.
- Project-scoped API routes require explicit organization and project context.
- AI defaults to disabled. Strict AI mode may send metadata only, not raw source
  files or unredacted secrets.

## Repository Standard

- Generated artifacts, local databases, logs, build output, and dependency
  folders stay out of git.
- Fixtures may contain fake secret-shaped strings only when they are needed to
  test redaction. They must be obvious test values.
- Changes stay scoped to the app or package they affect.
- Shared behavior belongs in `packages/*`; product surfaces belong in `apps/*`.
- Behavior changes update docs and tests where practical.

## Release Standard

- User-visible changes bump the release version.
- `CHANGELOG.md` must separate `Added`, `Improved`, `Fixed`, and `QA` when those
  categories apply.
- GitHub releases must match the version in package metadata.
- CI must run install, typecheck, tests, and build before a release is considered
  healthy.
- Quick access in `README.md` and `scripts/quickstart.ps1` must be run locally
  before release notes claim they work.

## Verification Checklist

Run these before publishing a release:

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\quickstart.ps1
```

For dashboard changes, also run the web app locally and capture a real
screenshot from the rendered interface.
