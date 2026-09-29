# API contract (Phase 1)

## Contract-wide rules

Base URL is the frontend's `VITE_API_URL` (Laravel Docker default `http://localhost:5002`; the original Node default `http://localhost:5001` is historical and no longer served). Protected requests send `Authorization: Bearer <HS256 JWT>`. Success and failure bodies are controller-specific; the stable minimum failure shape is `{ "message": string }`. Missing/expired/invalid access tokens return respectively `401`, `401` with `code: TOKEN_EXPIRED`, and `403` with `code: INVALID_TOKEN` from the auth middleware. Laravel must reproduce route paths, field casing, status codes and response bodies by endpoint—not introduce a universal envelope.

`Auth` below means valid bearer token; role text names route/middleware constraints. Request fields shown are observed required/high-value fields; unlisted query/body fields must be preserved by endpoint characterization before implementation. Controller functions are the authoritative validation/response source.

## Discovery accounting

`PREVIOUS_COUNT = 155`; `CURRENT_COUNT = 155`; `COUNT_DIFFERENCE_REASON = none`. Current count is 154 declarations in `backend/src/routes/*.js` plus `GET /` in `backend/src/app.js`. `TOTAL_DOCUMENTED_ENDPOINTS = 155`; independent records are in [api-contracts/complete.md](api-contracts/complete.md). Controller-level fields explicitly marked `NEED_VERIFY` remain evidence gaps, but do not erase route coverage.

## Final verification status

Route and ID coverage are complete (`155/155`), but deep-trace completeness is **not accepted**: all 155 base records still contain a generic controller `NEED_VERIFY` placeholder, while batch notes are grouped supplements rather than field-level evidence in each record. Therefore `TOTAL_TRACE_COMPLETE = 0`, `TOTAL_TRACE_INCOMPLETE = 155`, and `R2 = REQUEST_CHANGES` until every record is enriched in place with source-specific handler, middleware, request, response, database, transaction, side-effect and frontend evidence (or an endpoint-specific reason for a residual `NEED_VERIFY`).

Confirmed corrections: `GET /` exists; `GET /consultations` does not exist; register returns `{ message, user_id, role, account_type }` with 201 rather than token payload; Google body field is `credential`; dashboard stats/analytics permit `super_admin`, `admin`, `doctor`, `clinic_owner` (not accountant); recurring patient/doctor list endpoints exist.

## Endpoint operation catalog

| Method/path | Auth / role | Request, validation, response/status | Node controller; tables; side effects |
|---|---|---|---|
| GET `/` | Public | no request; `200 { message: "Holora Medical Backend is running" }` | app route; no DB/side effects |
| POST `/auth/register` | Public | `full_name, username, email, password[, phone, account_type]`; provider maps to clinic_owner, otherwise patient. `201 { message, user_id, role, account_type }`, **no tokens**; 400/409/500 | auth.register; users/role/user_role/patient/provider_subscription; bcrypt/audit |
| POST `/auth/login` | Public | email, password. Success `{token,refreshToken,user}`; 401 bad credentials, 403 inactive | auth.login; users/roles/refresh_tokens; audit |
| POST `/auth/google` | Public | body `credential`; 400 missing credential, 401 invalid/unverified token, 403 inactive, 500 missing configuration/DB; success login token payload | auth.googleAuth; users/roles/patient; Google verify |
| POST `/auth/doctor-invite/accept` | Public | invite token + account details; invite validity required | auth.acceptDoctorInvite; doctor_invite/users/doctor |
| POST `/auth/forgot-password`, `/auth/reset-password` | Public | email; reset token/new password. Strict rate limit; exact mail behavior NEED_VERIFY | auth; users |
| POST `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/change-password` | Public/Auth/Auth/Auth | refreshToken; logout refreshToken; none; current_password/new_password. Rotating response returns token payload | auth; refresh_tokens/users; reuse revokes all sessions |
| `/users`, `/roles`, `/permissions` CRUD and nested role/session actions | Auth admin/super_admin | CRUD payloads and IDs; role mapping/session endpoints use body IDs. Standard list/detail/mutation responses; 400/404/409 controller-specific | user/role/permission controllers; RBAC tables/refresh_tokens/audit_logs |
| GET/PUT `/patients/me`; GET `/patients/me/{stats,doctors,branches}` | Auth | profile fields on PUT; caller must map to patient | patient; patient/patient_branch/appointment/doctor |
| GET `/patients/my-branches`; CRUD `/patients`; GET `/patients/{id, next-code}` | provider for my-branches; admin for CRUD | filters/pagination NEED_VERIFY; generated code read | patient; patient/branch/appointment |
| GET `/doctors`, `/doctors/search`, `/doctors/next-code`, `/doctors/:id` | Public | search query params; directory/detail JSON | doctor; doctor/users/specialty/branch |
| GET/PUT `/doctors/me`; GET `/doctors/me/patients`; GET `/doctors/my-branches` | Auth / provider for branches | profile payload on PUT; ownership is controller enforced | doctor; doctor/patient/doctor_branch |
| POST `/doctors`; PUT/DELETE `/doctors/:id` | Auth provider + owned branch + entitled | doctor/branch payload; entitlement/limit check; mutation body/status controller-specific | doctor; doctor/doctor_branch/branch; email invite |
| GET `/branches`, `/branches/next-code`, `/branches/:id`; GET `/branches/my` | public; Auth provider for my | optional filters; detail/list JSON | branch; branch/doctor_branch/patient_branch |
| POST/PUT/DELETE `/branches[/:id]` | Auth provider + subscription/ownership | branch payload; branch.manage entitlement and limit required | branch; branch and mappings |
| GET `/specialties[/:id]`; POST/PUT/DELETE `/specialties[/:id]`; PATCH parent; POST reassign-delete | public reads; admin writes | specialty fields; parent/reassignment IDs; hierarchy validation | specialty; specialty/doctor |
| GET `/schedules`; POST/PUT/DELETE `/schedules[/:id]` | Auth; writes admin/doctor | doctor schedule payload, controller validation | schedule; doctor_schedule |
| GET `/appointments/available-slots` | Public | `doctor_id,date,duration_minutes[,branch_id]`; valid doctor/date, slots JSON | appointment.getAvailableSlots; schedule/appointment/doctor_branch |
| POST/GET `/appointments`; GET `/appointments/admin/all`, `/owner/all`, `/:id`, `/:id/consultation`; PUT `/:id/status` | patient; Auth; admin; owner; Auth; admin/doctor/owner | booking needs doctor, branch, date, start time, duration; overlap 409, branch mismatch 400. Status/cancellation_reason, 2-hour cancellation rule | appointment; appointment/schedule/branch/patient/recurring; audit |
| `/api/recurring-appointments` CRUD; children/cancel/cancel-all | Auth admin/super_admin | recurrence/ID inputs, child status actions | recurring controllers; recurring_appointments/appointment |
| POST `/consultations`; GET doctor-requests/owner/all/my-history/detail; POST responses; PATCH reopen; DELETE image | Auth (owner route owner) | **there is no GET `/consultations`**. Create requires complaint/symptoms; response content or <=5 attachments; upload multipart field `attachments`; image delete state-limited | consultation; consultation/image/response; local files/audit |
| POST `/upload` | Auth | multipart `attachments`, maximum 5; upload paths response | upload.uploadFiles; filesystem |
| POST `/ai/analyze`; GET `/ai/consultation/:id`; PATCH `/ai/review/:requestId` | Auth | consultation_id/image_id; returns 202 processing; review status constrained | AI; analysis tables/image; FastAPI + notification. `PATCH /ai/review/:requestId` may invoke notification utility, whose runtime columns mismatch source (`type/body/link` absent): **RUNTIME_SCHEMA_MISMATCH** side effect |
| Prescription CRUD/actions and context lists | Auth; controller enforces doctor/patient ownership | create needs patient + nonempty medication item; updates/issue only draft | prescription; prescription/item; audit |
| GET plans/me/payment-history; POST activate/create-payment/confirm-payment | public/Auth; role varies (owner payment) | actual paths are `/subscriptions/plans`, `/me`, `/payment-history`, `/activate`, `/create-payment`, `/confirm-payment`; plan/scope/token payload; payment token 15-min expiry | subscription; plan/entitlement/subscription/payment_order |
| POST/GET `/api/payments/appointments/:id/{pay,payment-status}` | Auth patient/Auth | owning patient only; no repeat payment | payment; appointment. Runtime `appointment` lacks `payment_status`: **RUNTIME_SCHEMA_MISMATCH**; both payment endpoints will fail DB query/update |
| Reviews public doctor/list summary; authenticated CRUD/me/check/received/admin/moderate | mixed; admin moderation | review fields/status/query filters | review; review/appointment/doctor/patient |
| GET/PATCH `/notifications[/:id/read]`, `/notifications/read-all` | Auth | limit query; read state | notification; notification. Runtime table lacks queried `type/body/link` columns: `GET /notifications` is **RUNTIME_SCHEMA_MISMATCH**; write-read state fields remain present |
| GET chats/messages; POST `/holoramind/send` | Auth | chatId, content | HoloraMind; chats/messages |
| dashboards, audit logs, earnings/history, EMR CRUD | Auth plus route roles | reporting filters; EMR record fields | respective controllers; listed domain tables. Runtime `emr_record` absent: all `/api/emr/*` endpoints are **RUNTIME_SCHEMA_MISMATCH** |

The complete route declaration and ordering is retained in `backend/src/routes/*.js`; this document deliberately preserves exact grouped paths and highlights controller-local contract gaps as `NEED_VERIFY`. Before each migration, turn the matching row into request/response fixtures captured against Node.
