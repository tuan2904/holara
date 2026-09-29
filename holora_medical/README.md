# Holora Medical

An educational online health consultation application built with React, PHP/Laravel,
MySQL and a Python image-processing service. Community contributions are welcome.

**Current deployment:** local development and Docker Compose. The former VPS
deployment workflow is retired. There is no maintained public demo endpoint.

This is a learning project, not a clinical system. Image enhancement uses OpenCV;
the current risk/confidence/diagnostic output is simulated and must not be used
for medical decisions. Use synthetic data only. See [SECURITY.md](SECURITY.md).

## Features and architecture

- Patient registration, login, health profiles, appointments and consultation history.
- Doctor schedules, consultation responses, attachments and prescriptions.
- Administrative users, roles, permissions, specialties, branches and dashboards.
- Notifications, reviews, subscriptions and payment-related workflows.
- HoloraMind chat interface and Jitsi video integration (external services).
- Image processing: Gaussian smoothing, contrast enhancement, edge and mask outputs.
- Vietnamese/English UI and light/dark themes.

```text
Browser / React + Vite
        | HTTP / Axios / JSON or multipart uploads
        v
PHP / Laravel ------------> MySQL (holora_medical)
        |
        | HTTP + X-API-Key
        v
Python + FastAPI + OpenCV -----> MySQL (holora_image_processing_db)
```

The legacy Node.js/Express backend has been removed; Laravel is the only backend.

These are implemented code paths, not a guarantee that all optional integrations
work without provider credentials or additional configuration.

## Prerequisites

- Git.
- Docker Desktop with Linux containers and Compose v2, or Docker Engine + Compose v2.
- For development outside Docker: Node.js 22.12+ with npm (frontend), PHP 8.2+ with
  Composer (Laravel), Python 3.11 and MySQL 8.

Node.js, PHP and Python are not required on the host for the Docker workflow.

## Quick start with Docker

Run from the repository root (PowerShell examples):

```powershell
git clone https://github.com/imtechcom/holora_medical.git
cd holora_medical
Copy-Item docker/.env.example docker/.env
```

Edit `docker/.env`. Set **four different random values** for `MYSQL_PASSWORD`,
`MYSQL_ROOT_PASSWORD`, `JWT_SECRET` and `INTERNAL_API_KEY`. JWT_SECRET must contain
at least 32 characters. To generate each value without installing Node locally:

```powershell
docker run --rm node:22-alpine node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep `MYSQL_DATABASE=holora_medical` and `MYSQL_USER=holora_app`: the database
initialization SQL uses these names. Google sign-in is optional; set
`GOOGLE_CLIENT_ID` to enable it. Never put private keys in `VITE_*` variables,
because frontend build variables are public.

```powershell
docker compose --env-file docker/.env -f docker/docker-compose.yml config --quiet
docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build
docker compose --env-file docker/.env -f docker/docker-compose.yml ps
```

| Component | Default local URL |
|---|---|
| Web application | http://localhost:8081 |
| Laravel health | http://localhost:5002/internal/health |
| Image service health / API docs | http://localhost:8000/health / http://localhost:8000/docs |
| phpMyAdmin (manual database login) | http://localhost:8080 |
| MySQL | localhost:3308 |

All published container ports bind to `127.0.0.1`. Changing a port also requires
updating the matching browser URL, `VITE_API_URL` and/or `CORS_ORIGIN`. Rebuild
the frontend after changing build variables.

### Database and first account

On the first start with an empty MySQL volume, Compose imports `holora_medical.sql`:
schema and reference data only. No patient records, chats, tokens or preset user
passwords are distributed. **Do not import this SQL into an existing database:**
it includes DROP TABLE statements.

Register a new account in the UI. To make that local test account an administrator,
open phpMyAdmin, sign in with `holora_app` and `MYSQL_PASSWORD`, select
`holora_medical`, and run the following with your registered email:

```sql
INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN role r
WHERE u.email = 'your-local-account@example.test' AND r.code = 'super_admin'
AND NOT EXISTS (
  SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id
);
```

Log out and log in again. Do not promote accounts through a public API.
Initialization runs only for an empty volume. Existing installations need reviewed
schema changes and a backup; the legacy Node migration utilities were removed with
the Node backend, and the Laravel application deliberately runs without a migration
runner. The base dump does not include every later module table (for example EMR and
recurring appointments); review `docs/legacy-analysis/06-database.md` before testing
those modules. Successful container startup alone does not validate every feature.

### Logs and shutdown

```powershell
docker compose --env-file docker/.env -f docker/docker-compose.yml logs --tail=100 laravel-backend image-processing
docker compose --env-file docker/.env -f docker/docker-compose.yml down
```

Named volumes retain the database and uploaded files. `down -v` destroys them.

## Develop outside containers

Use the Docker database/image service with the same environment values:

```powershell
docker compose --env-file docker/.env -f docker/docker-compose.yml up -d mysql image-processing
Copy-Item laravel-backend/.env.example laravel-backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Fill Laravel DB credentials, `JWT_SECRET`, `INTERNAL_API_KEY` and `LARAVEL_APP_KEY`
from `docker/.env`. In separate terminals:

```powershell
cd laravel-backend
composer install
php artisan serve --port=5002
```

```powershell
cd frontend
npm ci
npm run dev
```

Frontend normally uses port 5173; use the actual URL printed by Vite and add it
to `CORS_ORIGIN` in `docker/.env` if the port changes. Laravel defaults are
documented in `laravel-backend/.env.example`. To develop Python locally, stop its
container, copy
`image-processing/.env.example` to `.env`, fill the same credentials, create a
virtual environment, install `requirements.txt`, and run from `image-processing`:

```powershell
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Repository map

```text
laravel-backend/app/       HTTP controllers, middleware and services
laravel-backend/routes/    Route table (legacy-compatible paths)
laravel-backend/config/    Framework plus legacy JWT/CORS/upload configuration
frontend/src/pages/        Screens
frontend/src/components/   Shared UI
frontend/src/context/      Shared state and authentication
frontend/src/services/     Axios API clients
image-processing/app/      FastAPI endpoints and OpenCV pipeline
docker/                    Local Compose and database initialization
docs/laravel-migration/    Migration plan, parity checklist and removal record
.github/workflows/         CI checks; no VPS deployment
```

## API overview

| Group | Paths |
|---|---|
| Authentication | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Administrative access | `/users`, `/roles`, `/permissions` |
| Medical workflows | `/patients`, `/doctors`, `/appointments`, `/consultations`, `/schedules` |
| Files and image processing | `/upload`, `/ai/analyze` |
| Other modules | `/dashboard`, `/reviews`, `/notifications`, `/holoramind`, `/subscriptions` |
| Python service | `/api/v1/preprocess`, `/api/v1/jobs/{job_id}`, `/api/v1/jobs/{job_id}/result` |

Backend protected endpoints use `Authorization: Bearer <access_token>`. Python
job endpoints require `X-API-Key: <INTERNAL_API_KEY>`. See route files for methods
and access checks; the table lists groups, not a complete API specification.

Administrative user/role/permission and patient CRUD routes require `admin` or
`super_admin`. Recurring-appointment routes are restricted to administrators until
patient/doctor ownership checks are implemented. Self-service profile routes remain
available to authenticated users.

## Checks and contributing

```powershell
npm --prefix frontend ci
npm --prefix frontend run lint
npm --prefix frontend run build
```

Manual API smoke checks are run against a running stack (no automated test suite
is part of this project). See `docs/laravel-migration/10-parity-checklist.md` for
the recorded parity gate.

Read [CONTRIBUTING.md](CONTRIBUTING.md). Please submit focused pull requests with
reproduction steps, validation results and screenshots for UI changes. Do not
commit `.env`, database exports with personal data, uploads, logs or dependencies.

## Troubleshooting

- Network Error: check Laravel logs, VITE_API_URL and allowed CORS origin.
- Database initialization fails: check credentials and MySQL logs; do not delete
  an existing volume without a backup.
- Image requests return 401: Laravel and Python must share INTERNAL_API_KEY.
- Missing images: check image-service connectivity and persisted file volumes.
- Login after an upgrade: verify JWT_SECRET and log in again if it changed.

## License

The repository includes the [Apache License 2.0](LICENSE). Some package metadata
still says ISC and needs maintainer reconciliation; dependency licenses apply
separately. No new license or relicensing is introduced by this README.
