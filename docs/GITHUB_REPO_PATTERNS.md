# GitHub Repository Patterns Used

VibeAudit follows patterns that show up across large public repositories:

- Product surfaces live under `apps/`.
- Shared libraries live under `packages/`.
- Automation lives under `.github/`.
- Operational docs live under `docs/`.
- Security and contribution policies are root-level files.
- Package manager and build orchestration are explicit at the root.
- CI validates install, build, type checks, and tests before deploy.

This keeps the repository readable on GitHub and lets contributors understand
where new work belongs without opening every folder.
