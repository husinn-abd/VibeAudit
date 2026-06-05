# Security Policy

VibeAudit is security tooling, so responsible disclosure matters.

## Supported Versions

The project is currently pre-release. Security fixes are applied to `main`.

## Reporting a Vulnerability

Open a private security advisory on GitHub or contact the maintainer with a
minimal reproduction, affected version, and impact summary. Do not publish
exploit details until a fix or mitigation is available.

## Product Security Baseline

- API tokens must be stored as hashes.
- Secret values must be redacted before persistence and report export.
- Raw scanner output is access-restricted.
- Scanner artifacts include SHA-256 hashes and scanner metadata.
- Project-scoped API access must include organization and project context.
- AI features are optional and must default to metadata-only strict mode.

The repository-level release and implementation rules are tracked in
[docs/VIBEAUDIT_STANDARD.md](./docs/VIBEAUDIT_STANDARD.md).

## ISO/IEC 27001 Notice

VibeAudit helps collect and organize technical evidence. It does not certify an
organization, replace an ISMS, or prove compliance by itself.
