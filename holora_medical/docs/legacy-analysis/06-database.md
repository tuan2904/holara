# 06 - Phân tích database

Database chính là MySQL `holora_medical`. Source schema chính: `holora_medical.sql`; ngoài ra có migration scripts trong `backend/scripts/db` và `backend/migrations/sql`.

## Tables

| Table | Mục đích | PK | FK/constraint quan trọng | Used by |
|---|---|---|---|---|
| `users` | tài khoản user | `id` | likely unique email/username; status/auth_provider/reset fields | auth, RBAC, profiles |
| `role` | roles | `id` | unique `name`, `code` | auth/RBAC |
| `permission` | permission catalog | `id` | unique `code` | RBAC |
| `user_role` | mapping user-role | `id` | users, role | auth/RBAC |
| `role_permission` | mapping role-permission | `id` | unique role+permission, granted_by | RBAC |
| `refresh_tokens` | refresh token lưu DB | `id` | user_id, token_hash indexes | auth |
| `patient` | hồ sơ bệnh nhân | `id` | `user_id`, unique patient_code | patient/auth/appointment |
| `doctor` | hồ sơ bác sĩ | `id` | `user_id`, `specialty_id`, unique doctor_code/license | doctor/schedule/appointment |
| `specialty` | cây chuyên khoa | `id` | self FK `parent_id`, unique code/name | doctor/specialty |
| `branch` | chi nhánh/phòng khám | `id` | owner_user_id, unique code | branch/provider |
| `doctor_branch` | gán doctor-branch | `id` | unique doctor+branch, soft delete | provider/scheduling |
| `patient_branch` | gán patient-branch | `id` | unique patient+branch, soft delete | provider/patient |
| `doctor_invite` | invite setup tài khoản doctor | `id` | unique token_hash, user/doctor/creator | doctor/auth |
| `doctor_schedule` | ca làm việc bác sĩ | `id` | doctor_id | schedule/availability |
| `appointment` | lịch hẹn | `id` | patient, doctor, specialty, branch, recurring; unique appointment_code | appointment/payment/reminder |
| `recurring_appointments` | định nghĩa lịch hẹn lặp | `id` | patient, doctor, branch | recurring booking |
| `consultation` | ca tư vấn | `id` | patient, doctor, appointment | consultation |
| `consultation_image` | attachment của consultation | `id` | consultation, uploaded_by, response_id | consultation/AI |
| `consultation_response` | message/chẩn đoán trong consultation | `id` | consultation, responder_user | consultation |
| `ai_analysis_request` | yêu cầu AI processing | `id` | consultation, image, requested_by | AI |
| `ai_analysis_result` | kết quả/review AI | `id` | unique request_id, reviewed_by_doctor | AI |
| `prescription` | header toa thuốc | `id` | doctor, patient, consultation, appointment, unique code | prescription |
| `prescription_item` | dòng thuốc | `id` | prescription_id | prescription |
| `review` | review bác sĩ | `id` | appointment, doctor, patient | review |
| `notification` | notification user | `id` | user_id | notification/AI |
| `subscription_plan` | plan catalog | `id` | unique code | subscription |
| `subscription_entitlement` | entitlement theo plan | `id` | unique plan+feature | provider middleware |
| `provider_subscription` | subscription gán cho provider | `id` | owner_user_id, plan_id | subscription/provider |
| `payment_order` | payment subscription simulated | `id` | unique token, invoice_number | subscription |
| `payment` | bảng legacy/doctor payment | `id` | doctor, appointment | earnings/payment |
| `holora_mind_chats` | chat sessions | `id` | user_id | HoloraMind |
| `holora_mind_messages` | chat messages | `id` | chat_id | HoloraMind |
| `audit_log` / `audit_logs` | audit history | `id` | user_id | audit utilities/controllers |
| `video_consultation_session` | dữ liệu video session | `id` | appointment/participants | video UI |
| `emr_record` | EMR records | `id` | patient/doctor/appointment | EMR, từ migration SQL |

## Relationship sketch

```text
users
  -> user_role -> role -> role_permission -> permission
  -> refresh_tokens
  -> patient -> appointment -> consultation -> consultation_response
                       |              |-> consultation_image -> ai_analysis_request -> ai_analysis_result
                       |-> prescription -> prescription_item
                       |-> review
  -> doctor -> doctor_schedule
            -> doctor_branch -> branch <- patient_branch <- patient
  -> provider_subscription -> subscription_plan -> subscription_entitlement
  -> payment_order
  -> notification
```

## DB-specific features

- MySQL enum/status columns xuất hiện trong `appointment`, `doctor`, `doctor_schedule`, `payment_order`, `prescription`, `provider_subscription`, `recurring_appointments`, `specialty`, `subscription_plan`, `users`.
- Soft delete fields: `deleted_at` trên nhiều bảng như users, patient, doctor_branch, patient_branch, branch, provider subscriptions.
- JSON/text payloads: AI result lưu `result_payload`; recurring dùng `repeat_days`.
- SQL dump có `LOCK TABLES` do mysqldump, không phải application locking.
- Không thấy stored procedures/triggers.

## Schema inconsistency cần verify

- `appointment.controller.js` dùng `appointment_date`, `start_time`, `end_time`; reminder/cancellation lại đọc `scheduled_at`.
- Migration `015_create_recurring_appointments.sql` tham chiếu `appointments`, trong khi schema table là `appointment`.
- Notification migration tham chiếu `user(id)`, nhưng schema dùng `users`.
- Tồn tại cả `audit_log` và `audit_logs`.
- `emr_record` có trong migration SQL nhưng không nằm trong danh sách `CREATE TABLE` từ `holora_medical.sql`.

