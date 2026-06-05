# Deployment

## GitHub Pages

The public dashboard deploys from `.github/workflows/pages.yml`.

The Vite base path is configured for `/VibeAudit/` when deployed from the
`husinn-abd/VibeAudit` GitHub repository.

## Local Development

```bash
corepack pnpm install
corepack pnpm --filter @vibeaudit/web dev
```

## Self-hosted Preview

The initial Compose file starts the API and web containers. Scanner execution
is still local-first through the CLI until the runner fleet is designed.

```bash
docker compose up --build
```

## Production Notes

- Keep public registration disabled until a proper admin bootstrap exists.
- Keep AI disabled unless a privacy mode and provider are explicitly chosen.
- Do not enable raw scanner archive uploads for untrusted users.
- Put the API behind HTTPS before using API tokens.
