# Parity checklist

## Final gate result (2026-09-29)

`FINAL_LARAVEL_PARITY_GATE_PASSED` — `FRONTEND_LARAVEL_CUTOVER_VERIFIED` — `POST_CUTOVER_STABILIZATION` — `LEGACY_NODE_BACKEND_REMOVED`

- Canonical 155 / Migrated 148 / Deferred 7 / Remaining 0.
- Live Node↔Laravel sweep: 148 endpoints, Laravel 5xx = 0, unexpected 419 = 0, 145 payload deep-compares with 0 value differences and 0 datetime-format differences, 32 elevated-role probes with 0 mismatches.
- Static RBAC/authorization comparison: 148 endpoints, 0 issues. CSRF gate: 78/78 mutation routes, 0 unexpected 419.
- Accepted divergence: Node `GET /notifications` 500 (schema drift, CD-004) while Laravel returns the correct payload; Laravel intentionally has no Node rate limiters.
- Verification method: live HTTP probes and shell/curl sweeps only — project decision remains **NO AUTOMATED TESTS** (no PHPUnit/test suite introduced).

## Global gate

- [x] Node backend was kept unmodified and runnable throughout parity verification; it is now removed by project decision (`LEGACY_NODE_BACKEND_REMOVED`).
- [x] Frontend base URL switched to Laravel (`VITE_API_URL=http://localhost:5002`); Node `:5001` rollback target removed with the Node backend.
- [x] Existing schema and migration artifacts inventoried.
- [x] Live schema drift accepted/handled — no schema changes introduced (no migrations, seeders or SQL changes).
- [x] Laravel exists as a separate service and reads the existing DB.
- [x] JWT, refresh rotation, roles and ownership verified against Node responses.
- [x] CORS and error response behavior compared (rate limiters deliberately not ported — accepted divergence).

## Endpoint/module status

| Module | Node | Laravel | Request | Response | DB | Status |
|---|---|---|---|---|---|---|
| Auth/session | reference | migrated | compared | compared | compared | PARITY_VERIFIED |
| RBAC/users | reference | migrated | compared | compared | compared | PARITY_VERIFIED |
| Patient/doctor/branch/specialty | reference | migrated | compared | compared | compared | PARITY_VERIFIED |
| Schedule/appointment/recurring | reference | migrated | compared | compared | compared | PARITY_VERIFIED (appointment payment deferred, CD-004) |
| Consultation/upload | reference | migrated | compared | compared | compared | PARITY_VERIFIED |
| AI/notifications | reference | migrated | compared | compared | compared | PARITY_VERIFIED (Node `/notifications` 500 accepted, CD-004) |
| Prescription/EMR/reviews | reference | migrated | compared | compared | compared | PARITY_VERIFIED (5 EMR endpoints deferred, CD-003) |
| Subscription/payment/reporting/HoloraMind | reference | migrated | compared | compared | compared | PARITY_VERIFIED (2 appointment-payment endpoints deferred, CD-004) |
| Reminder/background jobs | reference | not ported | n/a | n/a | n/a | DEFERRED_ACCEPTED (CD-001/CD-008) |

For each endpoint, compare request validation, HTTP status, JSON structure/field names, authorization, SQL reads/writes, upload/static file behavior, mail/HTTP effects, and rate-limit/error cases. A code review alone never changes status to `PARITY_VERIFIED`.

## Mandatory per-endpoint dimensions

- [ ] absent vs `null` vs empty string, numeric/string type coercion, path/query parsing and query defaults.
- [ ] exact multipart field names/counts, physical upload path, public upload URL and static `/public` response.
- [ ] exact success JSON, message text, HTTP status, headers where applicable, and every documented error response.
- [ ] JWT primary role and roles-array order, missing/expired/invalid token behavior, role/provider authorization.
- [ ] DB reads/writes, generated IDs/codes, partial-write failure, explicit transaction rollback and legacy non-transaction behavior.
- [ ] CORS origin/credentials/preflight and global/auth/strict rate-limit behavior.
- [ ] FastAPI API-key/header, multipart fields, 15-second timeout, FastAPI failure, Node AI result-insert failure and stuck processing.
- [ ] SMTP reminder failure/crash/duplicate behavior and concurrent appointment booking/refresh rotation.
