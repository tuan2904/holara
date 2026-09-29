# Business rules and state contracts

| Domain | Rules to preserve |
|---|---|
| Registration | provider account type receives `clinic_owner`; other accounts receive patient. Provider registration attempts HOLORA_FREE assignment. |
| Appointment | only patient books; doctor must belong to branch; required doctor/branch/date/start/duration; reject overlap except cancelled/completed/no_show; cancel less than two hours before appointment is rejected. |
| Recurrence | default horizon six months; max 100 occurrences. |
| Consultation | new requests require chief complaint and symptoms; max 3 initial images. A response requires content or attachment, max 5 attachments. Doctor reply assigns pending case and makes it in_progress/completed; only completed can reopen; patient can delete only pending images never sent to AI. |
| AI | analysis creates processing record and returns 202. Patient sees only doctor-shared result. Valid review statuses: pending_review, approved, approved_watch, not_standard, revoked; only approved/approved_watch share. |
| Prescription | require patient and at least one nonblank medication; only owning doctor acts; only draft may update or issue; non-cancelled draft/issued may cancel. |
| Subscription | free plan cannot create payment order; payment order expires in 15 min; account scope activation has no end date. Provider mutations use subscription feature/limit middleware. |
| Appointment payment | owning patient only; cannot pay twice; marks appointment paid. |
| Sessions | local login requires active account/correct bcrypt password; refresh reuse revokes all sessions. |

### State transitions

```text
appointment: create -> scheduled; cancel -> cancelled (>=2h only)
consultation: create -> pending -> in_progress|completed -> in_progress (reopen)
AI request: processing -> completed|failed
prescription: draft -> issued|cancelled
payment order: pending -> paid|expired
provider subscription: trialing|active (subject to plan/scope)
```

Evidence is in the corresponding Node controllers, `recurringAppointment.service.js`, and provider middleware. The cancellation/reminder datetime discrepancy remains `NEED_VERIFY`.

## Evidence-backed remediation rules

### BR-PROVIDER-001 — HOLORA_FREE account subscription

**Trigger/API:** provider registration; provider branch/doctor mutations.  
**Rule:** a new provider is assigned active `HOLORA_FREE` if no account subscription exists; registration does not wait for it.  
**Evidence:** `auth.controller.js:register`; `provider.middleware.js:ensureHoloraFreeSubscription`.  
**Database:** `subscription_plan`, `provider_subscription`.  
**Authorization:** provider role is `clinic_owner`; selected entitlement checks bypass `super_admin`/`admin`.  
**Transaction behavior / side effects:** fire-and-forget, non-fatal assignment; audit event.  
**Laravel migration impact:** do not make it synchronous/transactional without approved contract change.

### BR-PROVIDER-002 — entitlement, ownership, quota and trials

**Trigger/API:** branch/doctor mutations using provider middleware.  
**Rule:** provider roles come from DB; enabled current entitlement is required at configured scope order. Branch trial is `BRANCH_TRIAL_30D`; doctor trial is `DOCTOR_TRIAL_14D`; ownership and quota are route-resource scoped.  
**Evidence:** `provider.middleware.js:requireProviderRole`, `findEntitledSubscription`, `createTrialSubscription`, `requireActiveSubscription`, ownership/limit functions.  
**Database:** users/RBAC, branch, doctor, subscription tables.  
**Transaction behavior / side effects:** independent raw queries; may insert trial subscription.  
**Laravel migration impact:** preserve scope order, bypass roles, trial timing, status/body.

### BR-CODE-001 — medical code generation

**Trigger/API:** next-code and create flows for doctor, patient, branch, prescription.  
**Rule:** utility supplies domain-prefixed codes and callers persist unique code columns.  
**Evidence:** `utils/medical-code.util.js:generateMedicalCode`; patient/doctor/branch/prescription controllers.  
**Database:** `doctor.doctor_code`, `patient.patient_code`, `branch.code`, `prescription.prescription_code`.  
**Authorization:** inherited from caller. **Transaction behavior:** lookup and create are separate.  
**Laravel migration impact:** preserve prefix, lookup and collision behavior before replacing with model events.

### BR-INVITE-001 — doctor invite lifecycle

**Trigger/API:** `POST /auth/doctor-invite/accept`.  
**Rule:** token/password required; password minimum 6; unknown invite 404; revoked/used/expired 410. Token is SHA-256 hashed; success updates password and `used_at`.  
**Evidence:** `auth.controller.js:acceptDoctorInvite`. **Database:** `doctor_invite`, `users`, `doctor`.  
**Authorization:** public token flow. **Transaction behavior:** two updates, no transaction. **Side effects:** no SMTP call evidenced.  
**Laravel migration impact:** retain hash, statuses and non-transaction behavior initially.

### BR-AUTH-005 — Google creation and refresh session lifecycle

**Trigger/API:** `POST /auth/google`, `POST /auth/refresh`.  
**Rule:** verified new Google account creates user + patient role + patient profile. Refresh uses 40-byte random hex, SHA-256 storage, seven-day expiry, `replaced_by_hash`, and all-session revoke on reuse.  
**Evidence:** `auth.controller.js:googleAuth`, `createRefreshToken`, `refreshToken`.  
**Database:** users, roles, patient, `refresh_tokens`. **Transaction behavior:** multi-write without transaction. **Side effects:** audit.  
**Laravel migration impact:** reproduce exactly.

### BR-APPT-006 — cancellation/reminder datetime incompatibility

**Trigger/API:** `PUT /appointments/:id/status`; reminder script.  
**Rule:** cancellation applies a two-hour cutoff from `scheduled_at`; reminder selects confirmed appointments 2–24 hours ahead by `scheduled_at`; booking writes date/start/end.  
**Evidence:** `appointment.controller.js:updateAppointmentStatus`, `jobs/appointmentReminder.job.js:getUpcomingAppointments`, `appointment.controller.js:bookAppointment`.  
**Database:** appointment. **Authorization:** cancel route allows super_admin/admin/doctor/clinic_owner. **Transaction:** none. **Side effects:** audit/SMTP.  
**Laravel migration impact:** `RUNTIME_SCHEMA_MISMATCH` until runtime DB is read; do not normalize it.

### BR-AI-004 — review and image authorization behavior

**Trigger/API:** `POST /ai/analyze`, `PATCH /ai/review/:requestId`, consultation image actions.  
**Rule:** analysis only verifies image belongs to supplied consultation, not caller ownership. Review needs doctor profile or primary JWT role admin/super_admin, not consultation ownership. Patient result query filters `shared_with_patient=1`.  
**Evidence:** `ai.controller.js:requestAnalysis`, `reviewAIResult`, `getAIAnalysisForConsultation`; `consultation.controller.js:deleteConsultationImage`.  
**Database:** consultation/image, AI tables, notification. **Transaction:** none; notification non-blocking. **Migration impact:** preserve permissive legacy behavior until explicitly changed.

### BR-AUDIT-001 and BR-TX-001 — audit and transaction semantics

**Rule:** `logAudit` writes `audit_logs` fire-and-forget; failure only logs. Consultation response uses explicit `beginTransaction`/`commit`/`rollback`; registration, Google, booking, refresh rotation, prescription and subscription multi-writes do not use a shared transaction.  
**Evidence:** `utils/audit.util.js:logAudit`; `consultation.controller.js:addConsultationResponse`; relevant controllers.  
**Laravel migration impact:** an observer or broad DB transaction can alter legacy partial-write/response semantics; parity must test both.
