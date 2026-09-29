# Module inventory (Phase 1)

| Module | Node routes/controllers | Principal tables | Dependencies / migration dependencies |
|---|---|---|---|
| Auth/session | `auth.routes`, `auth.controller` | users, role, user_role, refresh_tokens, patient, doctor_invite | bcrypt, JWT, Google, audit; foundation |
| RBAC/admin users | users/roles/permissions routes | users, role, permission, user_role, role_permission | auth + role middleware |
| Patient | `patient.controller` | patient, patient_branch, appointment | auth/RBAC, doctor/branch |
| Doctor/provider | `doctor.controller` | doctor, doctor_branch, branch, doctor_invite | branch, specialty, email, subscriptions |
| Specialty/branch | specialty/branch controllers | specialty, branch, doctor_branch, patient_branch | provider entitlement middleware |
| Scheduling/appointments | schedule/appointment/recurring | doctor_schedule, appointment, recurring_appointments | patient, doctor, branch, audit |
| Consultation | `consultation.controller` | consultation, response, image | uploads, appointments, audit |
| AI analysis | AI controller/service | ai_analysis_request/result, consultation_image | FastAPI, notification |
| Prescription/EMR | prescription/emr controllers | prescription/item, emr_record | patient/doctor/consultation |
| Subscription/payment | subscription/payment controllers | plan, entitlement, provider_subscription, payment_order, payment | provider middleware, crypto |
| Reviews/notifications | review/notification controllers | review, notification | appointment/doctor/patient |
| Reporting | dashboard, earnings, audit controllers | appointment/payment/audit_logs | role/ownership scope |
| HoloraMind | `holoraMind.controller` | holora_mind_chats/messages | auth |
| Video | **UNVERIFIED_BACKEND_FEATURE**: frontend Jitsi use and SQL table only; no backend route/controller found | video_consultation_session | do not schedule as a migrated API module without evidence |
| Medical Code Utility | `utils/medical-code.util.js` | doctor/patient/branch/prescription code columns | used by profile/domain creates; business-critical sequence behavior |
| Audit Logging | `utils/audit.util.js` | audit_logs | fire-and-forget cross-cutting DB write |
| Doctor Invite / Onboarding | doctor/auth controllers | doctor_invite, users, doctor | token lifecycle and password setup; no SMTP call evidenced |
| Provider entitlement / ownership | `provider.middleware.js` | provider_subscription, plan, entitlement, branch, doctor | role, ownership, trial and quota policy |
| Infrastructure | upload/email/reminder/image service | local files; image-service DB | SMTP, FastAPI, Docker |

### Actual migration dependency order (proposal only)

1. Database connection/read-only schema mappings and error envelope.
2. JWT/refresh-token compatibility plus role-code middleware.
3. User/RBAC, specialty, branch, patient, doctor/provider subscription scope.
4. Schedule and appointments (including recurring rules).
5. Consultation/uploads, then AI processing and notifications.
6. Prescription/EMR/review/payment/subscription, reporting, HoloraMind.
7. Scheduler/queue parity after the corresponding synchronous behaviors are characterized.

No module is migrated in this phase.
