# Incremental migration plan

## Completion status (2026-09-29, post-cutover stabilization)

- `MIGRATION_IMPLEMENTATION_COMPLETE`
- `FINAL_LARAVEL_PARITY_GATE_PASSED`
- `FRONTEND_LARAVEL_CUTOVER_VERIFIED`
- `POST_CUTOVER_STABILIZATION`
- `LEGACY_NODE_BACKEND_REMOVED`

Coverage:

| | |
|---|---|
| Canonical endpoints | 155 |
| Migrated | 148 |
| Deferred | 7 (5 EMR `/api/emr*`, 2 appointment payment `/api/payments/appointments/:id/*`) |
| Remaining | 0 |

Runtime topology: frontend `:8081` → Laravel `:5002`; FastAPI `:8000`; MySQL host `:3308`.
Legacy Node backend (`:5001`, `backend/` source, `backend` Compose service) was removed by
project decision — **final runtime backend: Laravel**, frontend target: Laravel,
Node rollback: **REMOVED BY PROJECT DECISION**. Code-level Node rollback is no longer
available (see `12-cutover-rollback-and-cleanup.md`).

Deferred boundary is accepted and future work, not incomplete migration: real payment gateway, security hardening, queue/scheduler redesign, storage redesign (see `11-compatibility-decisions.md`, CD-003/CD-004).

Database volumes, DB bootstrap SQL (`docker/init-db.sql`, `holora_medical.sql`), the shared
uploads volume `backend_uploads` and FastAPI are preserved and unchanged.

## Readiness status

- P0–P2: **COMPLETE**.
- R1: **ACCEPTED**.
- R2: **ACCEPTED** — 155 canonical/documented API contracts, 155 trace-complete, 0 trace-incomplete, 0 generic placeholders, 0 documentation gaps, 0 residual `NEED_VERIFY`.
- Compatibility decisions: **COMPLETE** — see `11-compatibility-decisions.md`.
- Phase 3: **READY_FOR_IMPLEMENTATION**.

## Phase 3 implementation order

1. Build Laravel compatibility foundation: DB access, error/CORS/rate-limit behavior, static upload path and audit adapter.
2. Capture and port authentication: custom compatible HS256 JWT guard, refresh token lifecycle and role-code authorization.
3. Port User/RBAC.
4. Port Provider entitlement and ownership middleware.
5. Port Specialty, Branch, Doctor, Patient and Medical Code utility.
6. Port Schedule, Appointment and Recurring using the accepted compatibility decisions.
7. Port Consultation, Upload and Notification.
8. Port AI integration with fixture-tested FastAPI contract.
9. Port Prescription and Review; keep EMR unavailable as specified by CD-003.
10. Port Subscription and Payment.
11. Port Dashboard, Earnings, Audit reads and HoloraMind.
12. Port reminder/background behavior under CD-001 and CD-008.

## Module sequence and parity gate

For each module: document Node behavior, capture contracts and DB access, implement, build/start the services, run manual smoke checks, and compare status/body/DB/side effects before setting its checklist status `PARITY_VERIFIED`. Do not proceed on failure.

## Implementation constraints

- Apply CD-001 through CD-010; deferred capabilities are explicitly unavailable rather than implementation blockers.
- Do not introduce a payment gateway, queue architecture, scheduler redesign, or storage redesign in the initial migration.
