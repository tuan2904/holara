# Current architecture (Phase 0)

> **Superseded baseline.** This is the Phase 0 evidence snapshot of the original
> Node/Express system, kept as migration history. The Node backend has since been
> migrated to Laravel and removed — see `09-migration-plan.md` and
> `12-cutover-rollback-and-cleanup.md` for the current runtime state.

## Evidence-based runtime shape

```text
React 19/Vite frontend
  -> Axios (`frontend/src/services/api.js`), bearer access token in localStorage
  -> Express 5/CommonJS (`backend/server.js` -> `backend/src/app.js`)
  -> route modules -> controllers (mostly raw SQL via mysql2 pool)
  -> MySQL 8 `holora_medical`

Express AI controller -> HTTP multipart + INTERNAL_API_KEY -> FastAPI image-processing
Express uploads -> local `backend/public/uploads` volume
```

The Node application is the behavioral reference and remains untouched. It has no ORM; `ai.service.js` and recurring appointments are the only clear service/repository layers. Most validation, authorization, state transitions and SQL are controller-local.

## Runtime and cross-cutting behavior

| Concern | Observed behavior | Source |
|---|---|---|
| HTTP | Express JSON API; static uploads at `/public` | `backend/src/app.js` |
| CORS | comma-delimited allowlist, credentials true; requests without Origin allowed | `backend/src/app.js` |
| Limits | global 100/min/IP; auth 10/min/IP; password reset 3/15 min/IP | `backend/src/app.js` |
| Errors | controllers usually emit `{ message }`; global handler emits `{ message, error? }` | `error.middleware.js` |
| Database | `mysql2` callback pool, 10 connections, retry log only | `config/db.js` |
| File storage | Multer disk storage, `/public/uploads`, Docker named volume | `upload.controller.js`, compose |
| Audit | fire-and-forget writes to `audit_logs` | `utils/audit.util.js` |
| Cache/queue | no application cache or broker found | repository scan |

## Deploy topology

`docker/docker-compose.yml` exposes MySQL, phpMyAdmin, image-processing, Node backend (host `5001` by default), and frontend. MySQL initializes `holora_medical` and `holora_image_processing_db`; `holora_medical.sql` is imported after `init-db.sql`. No Laravel service exists, as required for this phase.

## Source-of-truth caveats

- `holora_medical.sql` is the schema baseline, but Node migration scripts may have been applied later.
- APIs are not consistently `/api` prefixed: only payments, EMR, earnings history, and recurring routes use `/api`.
- The frontend currently targets Node through `VITE_API_URL`; it must not be redirected during discovery.
- No CI configuration or durable background queue was found.
