# MeDecode

Educational React + Laravel + MySQL application with a Python/OpenCV image service.
This repository contains the standalone PHP migration of the application.
There is no VPS deployment in this workflow.
Use synthetic accounts and images only; this is not a clinical application.

The user-facing brand is MeDecode (including MeDecode AI and MeDecode Free/Plus).
Legacy database/table names, API routes and plan codes remain unchanged for data
compatibility. They are internal identifiers, not the application's display name.

## Start with Docker

Requirements: Docker Desktop (Linux containers, Compose v2) and PowerShell 7.2+.
Node, PHP, Composer and Python are not required on the host for this workflow.
Clone the repository and run commands from its root:

```powershell
git clone https://github.com/tuan2904/holara.git
cd holara
git switch medecode-initial-import
pwsh -File docker/setup.ps1
docker compose --env-file docker/.env -f docker/docker-compose.yml config --quiet
docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build
docker compose --env-file docker/.env -f docker/docker-compose.yml ps
```

The setup script creates ignored `docker/.env` with independent random database
passwords, JWT secret, internal API key and Laravel APP_KEY. It refuses to
overwrite an existing file. Do not copy secrets or database volumes from the
parent project. On another OS, copy `docker/.env.example` manually and generate
four different random 32-byte secrets and a base64-encoded 32-byte Laravel key.

| Component | Local address |
|---|---|
| Website | http://localhost:18081 |
| Laravel health | http://localhost:15002/internal/health |
| Image service health | http://localhost:18000/health |
| Image API documentation | http://localhost:18000/docs |
| phpMyAdmin | http://localhost:18080 |
| MySQL | 127.0.0.1:13308 |

Compose uses the project name `medecode` and separate volumes/networks. Published
ports bind only to localhost. Keep these separate from the original application.
Health endpoints confirm availability, not complete feature correctness.

### Configuration

- Keep `MYSQL_DATABASE=holora_medical` and `MYSQL_USER=holora_app`; initialization
  SQL references them. Identical schema names inside different containers do not
  share data.
- If changing the frontend port, update `CORS_ORIGIN` and `FRONTEND_URL` too.
- If changing the backend port, update `VITE_API_URL`. Frontend environment values
  are compiled into the bundle, so run `up -d --build` again.
- `GOOGLE_CLIENT_ID` is optional and must match the configured Google application.
  Never place secrets in `VITE_*` variables, which are public.
- `DEMO_PAYMENTS_ENABLED=false` is the default. Enabling it permits **simulated
  subscription payments only**, not real MoMo/VNPay transactions. Appointment
  payment UI is disabled because its backend contract is not implemented.
- Password-reset mail defaults to the Laravel log mailer. Real delivery requires
  explicit SMTP configuration in the backend environment. Protect logs, which
  may contain password-reset links. Change `FRONTEND_URL` when changing origins.

### Database and first administrator

The first start initializes the isolated empty MySQL volume using
`docker/init-db.sql` and `holora_medical.sql`. The dump contains schema and reference
data, not preset user credentials. **Never import it into an existing database:
it contains DROP TABLE statements.** This migration uses a SQL baseline, not an
implemented Laravel migration history; do not assume `artisan migrate` installs it.

Register a synthetic user on the website. In this stack's phpMyAdmin, log in as
`holora_app` with the password from `docker/.env`, select `holora_medical`, then run:

```sql
INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN role r
WHERE u.email = 'your-local-account@example.test' AND r.code = 'super_admin'
AND NOT EXISTS (
  SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id
);
```

Replace the sample email with the registered account. Log out and log in again.
No default administrator password is distributed. Existing users must also log in
again after the session-binding update; older JWTs without a session ID are rejected.

### Stop or inspect

```powershell
docker compose --env-file docker/.env -f docker/docker-compose.yml logs --tail=100 laravel-backend image-processing
docker compose --env-file docker/.env -f docker/docker-compose.yml down
```

`down` retains uploaded files and database volumes. Do not use `down -v` unless
you deliberately intend to erase this demo's data. Never run parent-project
shutdown or volume-removal commands as part of this setup.

## Architecture

```text
React/Vite -> Laravel routes -> middleware/controllers/services -> MySQL
                               |
                               +-> FastAPI/OpenCV -> processed / edge / mask
```

| Directory | Responsibility |
|---|---|
| `frontend/src` | Screens, components, contexts, Axios clients |
| `laravel-backend/routes` | HTTP route contracts |
| `laravel-backend/app/Http` | Authentication, authorization and controllers |
| `laravel-backend/app/Services` | Sessions, clinical access, safe uploads, booking |
| `laravel-backend/tests` | MySQL-backed regression and concurrency tests |
| `image-processing/app` | Image API and OpenCV pipeline |
| `docker` | Independent runtime, initialization and test environment |

Protected Laravel APIs require a bearer access token bound to an active refresh
session. Password reset/change revokes sessions. Python processing endpoints use
an internal API key. Resource ownership is checked in addition to role checks.
Image processing is synchronous in this course demo; HTTP failures are recorded
as failed jobs rather than successful results.

## Tests

Run isolated database regression tests without installing PHP:

```powershell
docker compose -p medecode_tests -f docker/compose.test.yml up --build --abort-on-container-exit --exit-code-from tests
docker compose -p medecode_tests -f docker/compose.test.yml down
```

This creates `medecode_tests` resources, an ephemeral MySQL database named
`medecode_test`, and a separate Composer dependency volume. The suite refuses to
run against another database. Tests cover ownership, uploads, session revocation,
refresh rotation, rate limiting, recurring/concurrent booking, image sharing and
demo-payment restrictions. Python responses are mocked in the standard suite.
Keep the explicit `-p medecode_tests`: it overrides COMPOSE_PROJECT_NAME from
any local `.env` and prevents mixing test and demo resources.

Frontend checks require Node.js 22.12+ and npm:

```powershell
npm --prefix frontend ci
npm --prefix frontend run lint
npm --prefix frontend run build
```

The workflow in `.github/workflows/ci.yml` checks Laravel regressions, frontend
lint/build and dependency advisories. Private report documents under `docs/` are
not distributed. Local verification passed 21 regression cases (82 assertions),
with one optional live Python case skipped in the standard suite; live Python
image generation/download/sharing was also checked separately.

## Local source development

Use PHP 8.4 with Composer, Node.js 22.12+, and the separate Docker database/image
service. Copy `laravel-backend/.env.example` and `frontend/.env.example` to their
respective `.env` files. Set Laravel database credentials, JWT_SECRET and
INTERNAL_API_KEY to this demo stack's values; generate APP_KEY using
`php artisan key:generate` after `composer install`.

```powershell
docker compose --env-file docker/.env -f docker/docker-compose.yml up -d mysql image-processing
```

In `laravel-backend`, run `composer install`, then
`php artisan serve --host=127.0.0.1 --port=15002`. Stop this stack's Docker backend
first if it already occupies that port. In `frontend`, run `npm ci` and
`npm run dev`; Vite uses port **15173** and fails if occupied instead of silently
switching ports.

## Security and limitations

- Uploads are stored outside the PHP public directory, validated by type/content,
  renamed randomly and served with restrictive response headers.
- Uploaded/result image URLs remain unauthenticated, unguessable links for the
  local demo. They are **not production-grade private medical storage**. Add
  authenticated downloads or expiring signed URLs before using sensitive data.
- Do not use processing outputs as diagnoses. The pipeline enhances images; it
  is not a validated diagnostic model.
- Google OAuth, real SMTP, video providers and chatbot integrations require their
  own credentials and separate end-to-end verification.
- Laravel's built-in server is for this local course demo, not production hosting.
- Never commit `.env`, real patient data, uploads, logs or dependencies. Read
  [SECURITY.md](SECURITY.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## License

See [LICENSE](LICENSE). Dependency licenses apply separately. This migration does
not introduce a change of license.
