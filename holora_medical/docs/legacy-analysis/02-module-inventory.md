# 02 - Module/domain inventory

## Business modules

| Module | Mục đích | Main files | Database tables | Dependencies |
|---|---|---|---|---|
| Auth | Register/login/OAuth/refresh/logout/password reset/accept invite | `auth.routes.js`, `auth.controller.js` | `users`, `role`, `user_role`, `refresh_tokens`, `doctor_invite`, `patient`, `provider_subscription` | bcrypt, JWT, Google OAuth, audit |
| User/RBAC | Admin CRUD users, sessions, roles, permissions | `user.controller.js`, `role.controller.js`, `permission.controller.js` | `users`, `role`, `permission`, `user_role`, `role_permission`, `refresh_tokens` | role middleware |
| Patient | Hồ sơ bệnh nhân, stats, quan hệ doctor/branch | `patient.controller.js` | `patient`, `patient_branch`, `appointment`, `doctor`, `branch` | auth/roles |
| Doctor | Doctor directory/profile/admin CRUD/invites/owner branch doctors | `doctor.controller.js` | `doctor`, `doctor_branch`, `doctor_invite`, `users`, `specialty`, `branch` | email, medical code, provider subscription |
| Branch | Chi nhánh/phòng khám và branch theo owner | `branch.controller.js` | `branch`, `doctor_branch`, `patient_branch`, `appointment` | provider middleware |
| Specialty | CRUD chuyên khoa và hierarchy | `specialty.controller.js` | `specialty`, `doctor` | admin auth |
| Schedule | Ca làm việc của bác sĩ | `schedule.controller.js` | `doctor_schedule` | auth roles |
| Appointment | Availability, booking, status, owner/admin views, recurring booking | `appointment.controller.js` | `appointment`, `doctor_schedule`, `doctor_branch`, `patient`, `doctor`, `recurring_appointments` | audit, recurring service |
| Consultation | Yêu cầu tư vấn, phản hồi, file đính kèm, owner/admin views | `consultation.controller.js` | `consultation`, `consultation_image`, `consultation_response`, `patient`, `doctor` | multer upload, audit |
| AI Analysis | Yêu cầu/kết quả/review/share phân tích ảnh | `ai.controller.js`, `ai.service.js` | `ai_analysis_request`, `ai_analysis_result`, `consultation_image`, `notification` | FastAPI image service, notification |
| Prescription | Lifecycle toa thuốc | `prescription.controller.js` | `prescription`, `prescription_item`, `doctor`, `patient` | medical code, audit |
| Payment | Mock payment cho appointment | `payment.controller.js` | `appointment` | auth |
| Subscription | Plans, provider subscriptions, payment orders | `subscription.controller.js`, `provider.middleware.js` | `subscription_plan`, `subscription_entitlement`, `provider_subscription`, `payment_order` | crypto |
| Review | Review bác sĩ và moderation | `review.controller.js` | `review`, `appointment`, `doctor`, `patient` | auth/admin |
| Notification | Notifications/read state của user | `notification.controller.js`, `notification.util.js` | `notification` | auth |
| HoloraMind | Chat/messages | `holoraMind.controller.js` | `holora_mind_chats`, `holora_mind_messages` | auth |
| EMR | Electronic medical records | `emr.controller.js` | `emr_record` | auth |
| Dashboard/Earnings/Audit | Analytics, doctor earnings, audit log views | dashboard/earnings/audit controllers | `appointment`, `payment`, `audit_logs`, bảng liên quan | auth/admin/doctor |

## Infrastructure modules

| Module | Mục đích | Main files | Database tables | Dependencies |
|---|---|---|---|---|
| DB config | MySQL pool và connection retry | `backend/src/config/db.js` | all backend tables | mysql2 |
| Upload | Multer local-disk upload | `upload.controller.js` | none directly | multer, filesystem |
| Email | SMTP sender | `email.util.js` | none | nodemailer |
| Image Processing | API preprocess ảnh y tế | `image-processing/app/*` | image-service SQLAlchemy tables | FastAPI, SQLAlchemy, OpenCV |
| Docker | Compose các service local/prod | `docker/docker-compose.yml` | MySQL | Docker |

## Shared/common modules

| Module | Mục đích | Main files |
|---|---|---|
| Auth middleware | Parse và verify JWT | `auth.middleware.js` |
| Role middleware | Authorization bằng role-code từ DB | `role.middleware.js` |
| Provider middleware | Check subscription/entitlement và trial assignment | `provider.middleware.js` |
| Audit utility | Ghi audit log | `audit.util.js` |
| Medical code utility | Sinh mã doctor/patient/prescription | `medical-code.util.js` |
| Notification utility | Tạo notification | `notification.util.js` |

