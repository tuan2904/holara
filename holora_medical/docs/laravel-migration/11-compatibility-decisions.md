# Final compatibility decisions

**Gate status: COMPLETE.** The live MySQL schema is the canonical data baseline. These decisions apply only to the initial Laravel migration; they do not authorize a Node, frontend, or database change.

## CD-001 — Appointment datetime compatibility

Problem:
Cancellation and reminder code reads `appointment.scheduled_at`, which is absent from runtime.

Evidence:
Runtime `appointment` has `appointment_date`, `start_time`, and `end_time`; booking, availability, reporting, and recurring flows use those fields. See `03-database-contract.md` and BR-APPT-006.

Decision:
FIX

Laravel Migration Behavior:
Use `start_time` as the appointment instant for the existing two-hour cancellation calculation and 2–24-hour reminder window; retain `appointment_date`/`start_time`/`end_time` in all reads and writes. Do not emulate the broken `scheduled_at` query.

DB Change Required:
NO

Frontend Change Required:
NO

Deferred Follow-up:
Define timezone and reminder scheduling/idempotency policy before any production scheduler rollout.

Reason:
`start_time` is the canonical existing datetime and is the only evidence-backed replacement. Adding `scheduled_at` would preserve a runtime-invalid reference.

## CD-002 — Appointment payment state compatibility

Problem:
Appointment payment endpoints read and update absent `appointment.payment_status`, while the frontend needs a paid/unpaid state.

Evidence:
The runtime `appointment` table has no such column; the historical `006` script is not the runtime baseline. `payment` has its own status, but no documented canonical appointment-payment linkage that can safely substitute the missing field.

Decision:
DEFER

Laravel Migration Behavior:
Do not implement the two appointment payment mutation/status APIs against a fabricated column or infer paid state from unrelated payment rows. Keep the module explicitly unavailable with a stable compatibility response indicating that appointment payment is not enabled on this schema; do not report an invented paid/unpaid value. Other simulated subscription/payment-order flows remain migratable under CD-009.

DB Change Required:
NO

Frontend Change Required:
YES

Deferred Follow-up:
Approve a canonical appointment-payment data model and an explicit frontend state/error treatment, then make a separate schema/API change.

Reason:
There is no evidence-backed source of truth for this state. A safe Laravel port cannot make the current broken Node SQL work without a data-contract decision.

## CD-003 — EMR runtime absence

Problem:
Node exposes EMR APIs but runtime has no `emr_record` table.

Evidence:
Runtime inspection and the schema dump both lack the table; only historical migration `007` defines it.

Decision:
DEFER

Laravel Migration Behavior:
Do not register an operational EMR CRUD module in the initial Laravel service. Requests to `/api/emr/*` receive one explicit module-unavailable compatibility response and make no database writes.

DB Change Required:
NO

Frontend Change Required:
YES

Deferred Follow-up:
Approve the EMR schema, retention/access policy, and API rollout as a separate feature.

Reason:
Creating the missing table would be a schema redesign outside migration parity.

## CD-004 — Notification canonical-column mapping

Problem:
Node expects `type`, `body`, and `link`; runtime `notification` uses `notification_type`, `message`, `reference_type`, and `reference_id`.

Evidence:
The canonical runtime columns are documented in `03-database-contract.md`; AI review can invoke this side effect.

Decision:
FIX

Laravel Migration Behavior:
Read/write only canonical columns. Map API `type` to `notification_type` and `body` to `message`; expose canonical references and derive a `link` only where `reference_type`/`reference_id` has a documented route, otherwise return `null`. Preserve `is_read`/`read_at` behavior and avoid duplicate notification business logic.

DB Change Required:
NO

Frontend Change Required:
NO

Deferred Follow-up:
Define a durable, canonical URL/link contract if consumers require links for every notification.

Reason:
The runtime table is authoritative, while aliases preserve the observable client shape wherever the canonical data can represent it.

## CD-005 — Recurring-appointment route prefix

Problem:
The frontend calls `/recurring-appointments/...`; canonical backend routes are `/api/recurring-appointments/...`.

Evidence:
The route catalog and architecture inventory identify recurring endpoints as `/api`-prefixed while frontend usage is unprefixed.

Decision:
PRESERVE

Laravel Migration Behavior:
Register `/recurring-appointments/...` as a compatibility alias to the same handlers, middleware, validation, and response serializers as `/api/recurring-appointments/...`. No second controller or business implementation is permitted.

DB Change Required:
NO

Frontend Change Required:
NO

Deferred Follow-up:
Deprecate the alias only through a separately announced client-version migration.

Reason:
An alias safely preserves the deployed frontend contract without changing canonical routing or duplicating behavior.

## CD-006 — Observed authorization and ownership gaps

Problem:
AI review, consultation detail, EMR, and other documented flows have missing or permissive ownership/security checks.

Evidence:
BR-AI-004 records that analysis validates image-to-consultation, not caller ownership, and review does not require consultation ownership; other findings are recorded in the completed API contracts.

Decision:
DEFER

Laravel Migration Behavior:
Classify these as `DEFER_SECURITY_HARDENING`. Reproduce documented authorization behavior needed for endpoint parity; do not silently add resource-ownership policies. The EMR exception remains unavailable under CD-003.

DB Change Required:
NO

Frontend Change Required:
NO

Deferred Follow-up:
Perform a dedicated security review, introduce policies per endpoint, and communicate intentional authorization changes.

Reason:
Hardening changes observable access behavior and is not required merely to operate Laravel.

## CD-007 — Multi-write and transaction semantics

Problem:
Many legacy workflows have partial-write behavior; consultation response is the documented explicit transaction exception.

Evidence:
BR-AUDIT-001/BR-TX-001 identifies non-transactional registration, booking, refresh, prescription, and subscription flows, and an explicit consultation-response transaction.

Decision:
PRESERVE

Laravel Migration Behavior:
Preserve each endpoint's existing transaction boundary: retain the consultation-response transaction and do not wrap legacy non-transactional multi-writes in a new global transaction.

DB Change Required:
NO

Frontend Change Required:
NO

Deferred Follow-up:
Evaluate atomicity and compensation separately after parity release.

Reason:
Laravel conveniences must not erase observable partial-write or failure semantics.

## CD-008 — Asynchronous and non-blocking side effects

Problem:
AI post-response work, audit logging, free-subscription assignment, and notifications are fire-and-forget/non-blocking.

Evidence:
`07-background-processing.md`, BR-PROVIDER-001, BR-AI-004, and BR-AUDIT-001 document in-process AI continuation, non-fatal audit/notification writes, and non-blocking free-plan assignment.

Decision:
PRESERVE

Laravel Migration Behavior:
Keep these effects in-process and non-blocking after the documented primary response where applicable; log side-effect failures without retroactively changing successful primary responses. Do not introduce queues, workers, retries, or a new scheduler architecture in the initial migration. Reminder querying uses CD-001's `start_time` replacement.

DB Change Required:
NO

Frontend Change Required:
NO

Deferred Follow-up:
Design durable jobs, retry, recovery, and idempotency as a separately approved operational change.

Reason:
Queue architecture changes timing, recovery, and failure behavior.

## CD-009 — Simulated subscription and payment flows

Problem:
The legacy commercial flow has no real gateway or webhook.

Evidence:
`06-external-integrations.md` and the API contract document token-based simulated subscription confirmation and 15-minute payment-order expiry.

Decision:
PRESERVE

Laravel Migration Behavior:
Preserve simulated subscription activation, payment-order token/expiry, statuses, and response contracts. Do not add a gateway, webhook, or callback. Appointment payment remains excluded by CD-002.

DB Change Required:
NO

Frontend Change Required:
NO

Deferred Follow-up:
Approve provider, reconciliation, webhook, and failure-state contracts before gateway integration.

Reason:
There is a complete existing simulated contract, but no evidence for a real-payment design.

## CD-010 — Upload and public-file compatibility

Problem:
Clients depend on multipart attachments, limits, local storage, and `/public` URLs.

Evidence:
`00-current-architecture.md`, `02-api-contract.md`, and `06-external-integrations.md` record Multer local storage at `backend/public/uploads`, `/public` serving, `attachments`, and maximum-five limits where applicable.

Decision:
PRESERVE

Laravel Migration Behavior:
Accept multipart field `attachments`; preserve endpoint-specific maximum counts (five for `/upload` and consultation responses, three initial consultation images), retain compatible local disk/volume layout, and serve existing-compatible `/public/uploads/...` URLs. Keep file validation and response shape at their documented endpoint contracts.

DB Change Required:
NO

Frontend Change Required:
NO

Deferred Follow-up:
Plan any object storage/CDN move with URL migration and retention compatibility.

Reason:
Storage path and multipart/public URL behavior are observable client contracts.

## Readiness verification

- API contracts: **155/155 complete** (`TRACE_COMPLETE: 155`, `TRACE_INCOMPLETE: 0`).
- Runtime schema contract: **complete and accepted** as canonical.
- Known compatibility blockers: covered by CD-001 through CD-010; unavailable modules have explicit behavior and follow-ups.
- Unresolved implementation blocker: **none** for the scoped initial Laravel migration. Deferred modules/features are intentionally excluded rather than blockers.
