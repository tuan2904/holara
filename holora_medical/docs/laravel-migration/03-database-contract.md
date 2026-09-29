# Database compatibility contract (Phase 2)

## Canonical Runtime Schema

### RUNTIME CURRENT

**RESOLVED — runtime MySQL 8 đã healthy và được đọc bằng các query chỉ-đọc.** Runtime hiện có 35 bảng, gồm `appointment`, `audit_log`, `audit_logs`, `notification`, `recurring_appointments`, và **không có** `emr_record`, `notifications`, hoặc `recurring_appointment`.

| Object | Runtime DB | Node Expectation | SQL Dump | Historical Migration | Verdict |
|---|---|---|---|---|---|
| `appointment` datetime | Có `appointment_date DATE`, `start_time DATETIME`, `end_time DATETIME`; không có `scheduled_at` | booking/availability dùng date/start/end; cancel/reminder đọc `scheduled_at` | date/start/end, không `scheduled_at` | không có migration tạo `scheduled_at` | **RUNTIME_SCHEMA_MISMATCH** cho cancel/reminder |
| `appointment.payment_status` | Không có | payment controller SELECT/UPDATE | Không có | `006` có ADD COLUMN | **RUNTIME_SCHEMA_MISMATCH** cho payment API |
| `emr_record` | Không tồn tại | EMR controller CRUD | Không có | `007` có CREATE TABLE | **RUNTIME_SCHEMA_MISMATCH** cho toàn bộ EMR API |
| `recurring_appointments` | Có, số nhiều; FK/`appointment.recurring_id` dùng đúng | controllers/services dùng số nhiều + `appointment` | Có | Node script đúng; SQL `015` sai `appointments` | Runtime/source aligned; historical SQL conflict |
| `notification` | Có; FK `user_id -> users.id`; columns `title,message,notification_type,reference_type,reference_id,is_read,read_at` | controller/utility đọc/ghi `type,body,link` | schema dump cùng dạng runtime | historical notification script dùng `user(id)` và shape khác | **RUNTIME_SCHEMA_MISMATCH** notification read/create |
| `audit_logs` | Có, đúng columns utility/controller dùng | utility/controller dùng plural | Có | audit script tạo plural | Runtime/source aligned |
| `audit_log` | Có nhưng shape khác (`module_name`, old/new values) | không thấy source runtime dùng | Có | n/a | legacy/unconsumed table |
| `users`, `patient`, `doctor`, `branch` | Có; inspected by `SHOW CREATE TABLE`; keys/FKs/status match dump baseline | active runtime source references resolved | Có | later scripts add known fields/indexes | canonical runtime confirms current baseline |

### SQL DUMP

`holora_medical.sql` là ảnh chụp schema, không phải canonical runtime. Nó định nghĩa `appointment` (số ít) với `appointment_date DATE NOT NULL`, `start_time DATETIME NOT NULL`, `end_time DATETIME NOT NULL`; **không có** `scheduled_at` hay `payment_status`. Nó có `notification` với FK tới `users`, có `recurring_appointments`, `audit_log`, `audit_logs`, nhưng không có `emr_record`.

### HISTORICAL MIGRATION

- `006_add_payment_status_to_appointment.sql` thêm `payment_status ENUM('unpaid','paid')`.
- `007_create_emr_record.sql` tạo `emr_record` với FK tới `patient`, `doctor`, `appointment`.
- `014_add_cancellation_policy_to_appointment.sql` thêm cancellation fields, trong đó `cancellation_reason` đã tồn tại trong dump.
- `015_create_recurring_appointments.sql` tham chiếu sai `appointments` (số nhiều); script Node `migrate-recurring-appointment.js` dùng đúng `appointment`.
- `migrate-notification.js` tham chiếu sai `user(id)`; dump/runtime source dùng `users`.

### SOURCE EXPECTATION

Runtime Node booking, availability, reporting và recurring sử dụng `appointment.appointment_date`, `start_time`, `end_time`. Riêng `appointment.controller.js:updateAppointmentStatus` và `appointmentReminder.job.js:getUpcomingAppointments` đọc `appointment.scheduled_at`. Payment controller ghi `appointment.payment_status`; EMR controller đọc/ghi `emr_record`; notification utility ghi `notification`; recurring controllers/services dùng `appointment`.

**RUNTIME_SCHEMA_MISMATCH (confirmed):** runtime lacks `appointment.scheduled_at`, `appointment.payment_status`, and `emr_record`; runtime `notification` lacks Node-required `type`, `body`, and `link`. Không được tự sửa source/schema hoặc tạo Laravel migration trong P0–P2.

## Baseline and rule

Use the existing MySQL 8 `holora_medical` schema. Do not rename tables/columns, run destructive migrations, or assume Laravel `created_at/updated_at` semantics. SQL dump và migration scripts chỉ là evidence lịch sử cho đến khi canonical runtime baseline được thu thập.

## Table groups

| Group | Tables |
|---|---|
| Identity/RBAC | users, role, permission, user_role, role_permission, refresh_tokens, doctor_invite |
| Care identities | patient, doctor, specialty, branch, doctor_branch, patient_branch, doctor_schedule |
| Care workflow | appointment, recurring_appointments, consultation, consultation_image, consultation_response, video_consultation_session, emr_record |
| Clinical AI/Rx | ai_analysis_request, ai_analysis_result, prescription, prescription_item |
| Commercial | subscription_plan, subscription_entitlement, provider_subscription, payment_order, payment |
| Communication/reporting | notification, review, holora_mind_chats, holora_mind_messages, audit_log, audit_logs |

## Compatibility requirements

- Primary keys are integer IDs and relationships are established with existing foreign keys; preserve unsigned/nullability/deletion actions.
- Preserve unique keys including emails/usernames, role and permission codes, medical codes, plan codes, token hashes, `doctor_branch`, `patient_branch`, role-permission, and AI result per request.
- Preserve native status/enum values. Do not substitute PHP enums unless their serialized DB value matches exactly.
- Soft-delete behavior is inconsistent and is explicit in Node SQL (`deleted_at IS NULL`); models must not globally add `SoftDeletes` until table-by-table parity is verified.
- JSON/text fields include AI payloads and recurring repeat-days. Keep their raw behavior/casts compatible.

## Conflicts requiring live-schema verification

1. Booking reads/writes `appointment_date`, `start_time`, `end_time`, while cancellation/reminder read `scheduled_at`.
2. Dump has `appointment`; SQL migration `015` refers to `appointments`.
3. Both `audit_log` and `audit_logs` exist; active audit utility writes plural.
4. `emr_record` is created by migration SQL but absent from the dump table list.
5. Migration scripts include potentially duplicate or failed ALTER/FK statements. They are historical evidence, not a Laravel migration chain.

Initial Laravel database work must be connection-only/read-only schema inspection; no generated migrations are authorized.

## Final appointment datetime verdict

Canonical runtime contract là `appointment_date`, `start_time`, `end_time`. `scheduled_at` không tồn tại trong runtime, SQL dump, hoặc historical migration đã kiểm tra. Vì vậy `PUT /appointments/:id/status` (`updateAppointmentStatus`) và reminder script (`getUpcomingAppointments`) có reference runtime-invalid; mọi Laravel parity record cho hai behavior này phải ghi **RUNTIME_SCHEMA_MISMATCH**, không được thay thế bằng một datetime tự suy đoán.
