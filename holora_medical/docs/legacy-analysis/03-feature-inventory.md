# 03 - Feature inventory

| ID | Module | Feature | Actor | Entry point | Main logic | DB tables | External dependency |
|---|---|---|---|---|---|---|---|
| AUTH-01 | Auth | Register patient/provider | Public | `POST /auth/register` | tạo user, role, patient profile hoặc free provider subscription | users, user_role, role, patient, provider_subscription | bcrypt |
| AUTH-02 | Auth | Login | Public | `POST /auth/login` | validate active user/password, issue JWT + refresh token | users, user_role, role, refresh_tokens | bcrypt, JWT |
| AUTH-03 | Auth | Google auth | Public | `POST /auth/google` | verify Google ID token, tạo patient nếu user mới | users, role, user_role, patient | Google OAuth |
| AUTH-04 | Auth | Refresh/logout/session revoke | User | `/auth/refresh`, `/auth/logout`, `/auth/logout-all` | rotate/revoke refresh tokens | refresh_tokens | crypto |
| AUTH-05 | Auth | Forgot/reset/change password | Public/User | `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password` | reset token, update password bằng bcrypt | users | console email simulator |
| DOCTOR-01 | Doctor | Doctor directory/search/profile/admin CRUD | Public/Admin/Doctor/Owner | `/doctors/*` | search, CRUD, owner branch filtering, invite flow | doctor, users, specialty, doctor_branch, doctor_invite | email |
| PATIENT-01 | Patient | Patient self/admin profile CRUD và stats | Patient/Admin/Owner | `/patients/*` | self profile, admin CRUD, owner branch views | patient, users, patient_branch, appointment | none |
| BRANCH-01 | Branch | Branch CRUD và my branches | Public/Admin/Owner | `/branches/*` | CRUD, sinh code, owner-scoped branches | branch, doctor_branch, patient_branch | none |
| SCHEDULE-01 | Schedule | Quản lý lịch làm việc bác sĩ | Admin/Doctor | `/schedules/*` | create/update/delete work shifts | doctor_schedule | none |
| APPT-01 | Appointment | Get available slots | Public | `GET /appointments/available-slots` | schedule slots trừ appointment overlap | doctor_schedule, appointment, doctor_branch | none |
| APPT-02 | Appointment | Book appointment | Patient | `POST /appointments` | validate patient/branch/overlap, tạo appointment hoặc recurring set | appointment, patient, doctor_branch, recurring_appointments | audit |
| APPT-03 | Appointment | List/read appointments | Patient/Doctor/Admin/Owner | `/appointments` | query theo role/scope | appointment, doctor, patient, branch | none |
| APPT-04 | Appointment | Update appointment status | Admin/Doctor/Owner | `PUT /appointments/:id/status` | update status, cancellation policy | appointment | audit |
| CONSULT-01 | Consultation | Create consultation | Patient | `POST /consultations` | tạo consultation và ảnh đính kèm optional | consultation, consultation_image, patient | audit |
| CONSULT-02 | Consultation | Doctor/patient responses | Doctor/Patient/Admin | `POST /consultations/:id/responses` | transaction update status + response + attachments | consultation, consultation_response, consultation_image | multer, audit |
| CONSULT-03 | Consultation | Reopen/delete image/owner views | Doctor/Admin/Patient/Owner | `/consultations/*` | state/ownership checks | consultation, consultation_image, ai_analysis_request | audit |
| AI-01 | AI | Request image analysis | Auth user | `POST /ai/analyze` | tạo request, async call FastAPI, lưu result | ai_analysis_request, ai_analysis_result | FastAPI image service |
| AI-02 | AI | Review/share AI result | Doctor/Admin | `PATCH /ai/review/:requestId` | update doctor review và patient visibility | ai_analysis_result, notification | notification |
| RX-01 | Prescription | Create/update/issue/cancel prescriptions | Doctor | `/prescriptions/*` | draft + items, draft-only edit, issue/cancel | prescription, prescription_item | audit |
| PAY-01 | Appointment payment | Mock appointment payment | Patient | `/api/payments/appointments/:id/pay` | mark appointment `payment_status=paid` | appointment | none |
| SUB-01 | Subscription | Plan list/my subscriptions | Public/User | `/subscriptions/plans`, `/subscriptions/me` | đọc active plans và subscriptions của owner/doctor | subscription_plan, subscription_entitlement, provider_subscription | none |
| SUB-02 | Subscription | Payment order + confirm | User | `/subscriptions/payments`, `/subscriptions/payments/confirm` | tạo token order, confirm, activate subscription | payment_order, provider_subscription | crypto |
| REVIEW-01 | Review | Doctor review CRUD và moderation | Patient/Doctor/Admin | `/reviews/*` | review lifecycle và admin moderation | review, appointment, doctor, patient | none |
| NOTIF-01 | Notification | List/read notifications | User | `/notifications/*` | read/mark read | notification | none |
| HOL-01 | HoloraMind | Chat và messages | User | `/holoramind/*` | lưu chats/messages | holora_mind_chats, holora_mind_messages | none found |
| EMR-01 | EMR | EMR CRUD | User | `/api/emr/*` | create/read/update/delete records | emr_record | none |
| BG-01 | Reminder | Appointment reminder emails | Cron/manual | `node src/jobs/appointmentReminder.job.js` | email bệnh nhân cho lịch hẹn confirmed sắp tới | appointment, patient, doctor | SMTP |

