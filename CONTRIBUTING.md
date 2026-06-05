# Contributing

Thanks for helping build VibeAudit.

## Development

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm test
```

Keep changes scoped. If a change touches the scanner model, update tests in
`packages/core`. If it touches redaction or token handling, update
`packages/security` tests.

Before release work, check the [VibeAudit Standard](./docs/VIBEAUDIT_STANDARD.md).

## Pull Request Checklist

- The change is covered by tests or has a clear reason tests are not needed.
- Secret values are never written to logs, reports, or fixtures.
- Scanner output normalization keeps stable fingerprints.
- Public docs are updated when behavior changes.
- User-visible updates bump the release version and update `CHANGELOG.md`.
- Scoped API behavior keeps explicit organization and project context.
