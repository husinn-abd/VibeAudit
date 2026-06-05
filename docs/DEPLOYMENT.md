# Deployment

## GitHub Pages

The public dashboard deploys from `.github/workflows/pages.yml`.

The Vite base path is configured for `/VibeAudit/` when deployed from the
`husinn-abd/VibeAudit` GitHub repository.

## Local Development

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\quickstart.ps1
corepack pnpm --filter @vibeaudit/web dev
```

See [ENVIRONMENT.md](./ENVIRONMENT.md) for all supported API, web, runner, and
Docker Compose variables.

## Self-hosted Preview

The initial Compose file starts the API and web containers. Scanner execution
is still local-first through the CLI until the runner fleet is designed.

```bash
cp .env.example .env
docker compose up --build
```

## Production Notes

- Keep public registration disabled until a proper admin bootstrap exists.
- Keep AI disabled unless a privacy mode and provider are explicitly chosen.
- Do not enable raw scanner archive uploads for untrusted users.
- Put the API behind HTTPS before using API tokens.
