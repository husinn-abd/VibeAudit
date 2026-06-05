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

## Pull Request Checklist

- The change is covered by tests or has a clear reason tests are not needed.
- Secret values are never written to logs, reports, or fixtures.
- Scanner output normalization keeps stable fingerprints.
- Public docs are updated when behavior changes.
