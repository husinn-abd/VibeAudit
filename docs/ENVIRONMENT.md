# Environment Configuration

VibeAudit uses committed `.env.example` files and ignored real `.env` files.
Never commit real secrets.

## Fast Setup

From the repository root:

```powershell
Copy-Item .env.example .env
```

Then run:

```powershell
corepack pnpm install
corepack pnpm test
corepack pnpm build
corepack pnpm --filter @vibeaudit/runner scan:mock:demo
```

## Files

| File | Purpose | Commit? |
| --- | --- | --- |
| `.env.example` | Main local configuration template for API, web, runner, database, and optional AI placeholders. | Yes |
| `.env` | Your local real values copied from `.env.example`. | No |
| `apps/api/.env.example` | Optional API override template. | Yes |
| `apps/api/.env` | API-only local overrides. | No |
| `apps/runner/.env.example` | Optional runner override template. | Yes |
| `apps/runner/.env` | Runner-only local overrides. | No |
| `apps/web/.env.example` | Optional dashboard override template. | Yes |
| `apps/web/.env` | Web-only local overrides. | No |

## Loading Rules

- API and runner load root `.env` first.
- API and runner then load their app-specific `.env` file if it exists.
- Real operating-system environment variables win over `.env` values.
- The web dashboard loads root `.env` and `apps/web/.env`.
- Only `VITE_` variables are exposed to browser code.

## Important Variables

| Variable | Used by | Default |
| --- | --- | --- |
| `VIBEAUDIT_API_HOST` | API | `0.0.0.0` |
| `VIBEAUDIT_API_PORT` | API, Docker Compose | `4317` |
| `VIBEAUDIT_API_LOGGER` | API | `true` |
| `VIBEAUDIT_API_MAX_IMPORT_BYTES` | API | `10485760` |
| `DATABASE_URL` | Prisma | `file:./dev.db` |
| `VITE_API_BASE_URL` | Web | `http://localhost:4317` |
| `VITE_ORGANIZATION_ID` | Web | `org_default` |
| `VITE_PROJECT_ID` | Web | `proj_vibeaudit_demo` |
| `VITE_DEMO_MODE` | Web | `true` |
| `VIBEAUDIT_SCANNER_TIMEOUT_MS` | Runner | `480000` |
| `VIBEAUDIT_MAX_REPO_BYTES` | Runner | `536870912` |
| `VIBEAUDIT_RUNNER_OUTPUT` | Runner | `artifacts/vibeaudit-report.json` |
| `VIBEAUDIT_RUNNER_SARIF` | Runner | blank unless configured |
| `VIBEAUDIT_RUNNER_MARKDOWN` | Runner | blank unless configured |

## Docker Compose

Docker Compose reads root `.env` automatically when it exists. It also has safe
defaults, so this still works before `.env` is created:

```powershell
docker compose up --build
```
