# Cutover, rollback and cleanup inventory (2026-09-29)

State: `MIGRATION_IMPLEMENTATION_COMPLETE` · `FINAL_LARAVEL_PARITY_GATE_PASSED` · `FRONTEND_LARAVEL_CUTOVER_VERIFIED` · `POST_CUTOVER_STABILIZATION` · `LEGACY_NODE_BACKEND_REMOVED`

Coverage: canonical **155** / migrated **148** / deferred **7** / remaining **0**.

Final runtime backend: **Laravel**. Frontend target: **Laravel**. Node rollback: **REMOVED BY PROJECT DECISION**.

## 1. Frontend target

- Served frontend (`127.0.0.1:8081`) calls Laravel (`127.0.0.1:5002`).
- Verified by grepping the served bundle: `http://localhost:5002` ×1, `http://localhost:5001` ×0.
- No Laravel runtime call reaches Node; Laravel talks only to MySQL and FastAPI.

## 2. Rollback status (code-level Node rollback removed)

The legacy Node backend was deleted by project decision, so **reverting the frontend to
Node is no longer available**. Recovery options are now:

- **Forward fix only**: repair Laravel, then rebuild:
  ```sh
  docker compose --env-file .env build laravel-backend
  docker compose --env-file .env up -d laravel-backend
  ```
- **Restore from history**: Node source still exists in git history (`backend/**`, and the
  `backend` Compose service in `docker/docker-compose.yml` at any commit before the removal
  commit). Restoring it is a deliberate historical re-introduction, not an operational
  rollback, and requires re-adding the service, `BACKEND_PORT` and a frontend rebuild.
- **Data**: nothing needs reconciliation. MySQL data (`mysql_data`), DB bootstrap SQL
  (`docker/init-db.sql`, `holora_medical.sql`), the shared uploads volume `backend_uploads`,
  `JWT_SECRET`, `INTERNAL_API_KEY` and `LARAVEL_APP_KEY` were never Node-exclusive and are
  unchanged by the removal.

## 3. Deferred work inventory

Endpoint-level deferrals (7; accepted, future work — not incomplete migration):

| # | Route | Where referenced | Impact |
|---|---|---|---|
| 1 | `POST /api/emr` | `frontend/src/services/emrService.js:16` | **NOT_USED** — `emrService.js` has zero importers |
| 2 | `GET /api/emr/patient/:patient_id` | `emrService.js:6` | NOT_USED |
| 3 | `GET /api/emr/:id` | `emrService.js:11` | NOT_USED |
| 4 | `PUT /api/emr/:id` | `emrService.js:21` | NOT_USED |
| 5 | `DELETE /api/emr/:id` | `emrService.js:26` | NOT_USED |
| 6 | `GET /api/payments/appointments/:id/payment-status` | `frontend/src/services/appointmentService.js:114` | **OPTIONAL** — `PatientAppointmentDetailPage.jsx:72` swallows the 404, banner falls back to `unpaid` |
| 7 | `POST /api/payments/appointments/:id/pay` | `appointmentService.js:120` | **OPTIONAL** — `PatientAppointmentDetailPage.jsx:206` is a mock action; disclosed degradation: pay button fails with 404 |

Architectural deferrals (accepted decisions, see `11-compatibility-decisions.md`): real payment gateway, security hardening (Node rate limiters not ported), queue/scheduler redesign (CD-001/CD-008), storage redesign (CD-010).

These 7 endpoints were **not** implemented during cleanup.

## 4. Legacy cleanup inventory (after Node removal)

| Classification | Item | Status |
|---|---|---|
| **KEEP_PERMANENTLY** | `laravel-backend/**` application; `laravel-backend` Compose service; shared volume `backend_uploads` mounted on `laravel-backend` only; `LEGACY_UPLOADS_PATH`/`LEGACY_UPLOADS_URL_PREFIX`; `VITE_API_URL` (`http://localhost:5002`); `LegacyDatetimeSerialization`, legacy CORS and legacy JWT/role middleware; `.gitignore` `docs/` negations; `LARAVEL_BACKEND_PORT`/`LARAVEL_APP_KEY`/`JWT_SECRET`/`INTERNAL_API_KEY`/`IMAGE_PROCESSING_URL`; `docker/init-db.sql`, `docker/finalize.sql`, `holora_medical.sql` (DB bootstrap); `image-processing` (FastAPI); `phpmyadmin`, `mysql` services | kept |
| **REMOVED** | `backend/` source (117 tracked files + `node_modules`, `migrations/sql`, `scripts/`, `server.js`, `Dockerfile`, `package*.json`); `backend` Compose service and its `:5001` port, env block, `depends_on` and volume mount; `BACKEND_PORT` from `docker/.env` and `docker/.env.example`; Node rollback comment; `backend`-specific `.gitignore` entries; `backend` CI job and `node --check` steps; README Node startup instructions; `deploy.sh` Node seed/port/wait steps; frontend "Node.js + Express" version label | removed |
| **KEPT (history)** | `docs/legacy-analysis/**`, `docs/laravel-migration/00-current-architecture.md` (Phase 0 baseline), `02-api-contract.md` original Node contract notes, git history of `backend/**` | kept as migration evidence |
| **SAFE_LATER** | root stray `package-lock.json` (empty, untracked, produced by a root `npm` invocation); `frontend/temp.jsx` (pre-existing, unreferenced) | not part of Node removal |
| **NEEDS_DECISION** | Legacy schema retained for compatibility: `audit_log` (singular, 0 rows), `payment`, `ai_analysis_result`, `video_consultation_session`, `notification` canonical-column drift vs Node (CD-004); dropping/altering requires a reviewed DB change — **do not run now**; EMR + appointment-payment endpoints (§3); background/reminder jobs (CD-001/CD-008); security hardening (rate limiting, CORS, secrets); secret/`.env` handling (pre-existing repo convention) | unchanged |

Database is deliberately unchanged: no migrations, seeders or SQL changes were introduced,
and MySQL volumes were never removed (`down -v` was never used).

## 5. Recommended commit plan (not executed)

1. `feat(laravel): add Laravel backend parity service` — `laravel-backend/**`, `docker/docker-compose.yml` `laravel-backend` hunk, `docker/.env.example` `LARAVEL_*` lines.
2. `feat(frontend): target Laravel backend for API calls` — `frontend/src/services/api.js`, `frontend/.env.example`, compose/`.env.example` `VITE_API_URL` hunks.
3. `refactor: remove legacy Node backend` — deletion of `backend/**`, `backend` Compose service, `BACKEND_PORT`, `backend` CI job, Node-only README/`deploy.sh`/`.gitignore`/`VersionPage` references.
4. `docs: record migration status, parity gate and Node removal` — `.gitignore`, `docs/laravel-migration/**`, `docs/legacy-analysis/**`.

No commit or push has been performed.
