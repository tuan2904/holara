# 04 - Phân tích flow feature

## AUTH-02 Login

Actor: public user.
Trigger: `POST /auth/login`.
Flow: fetch non-deleted user theo email, reject missing/inactive, bcrypt compare, fetch roles, sign HS256 access token 15 phút, tạo refresh token random/hash vào `refresh_tokens`, audit login, trả user/token.
Validation: kỳ vọng có email/password; thiếu credential chưa được validate rõ trước query.
DB read/write: `users`, `user_role`, `role`, `refresh_tokens`, audit table.
Side effects: audit log.
Errors: invalid credentials 401, inactive 403, DB 500.
Transaction boundary: không có.
Source: `backend/src/controllers/auth.controller.js` functions `login`, `issueTokenAndRespond`, `createRefreshToken`.

## AUTH-04 Refresh token rotation

Actor: public client có refresh token.
Trigger: `POST /auth/refresh`.
Flow: hash token, load token+user, reject missing/revoked/expired/inactive, revoke token cũ với `replaced_by_hash`, insert refresh token mới, issue JWT mới.
Branch: nếu token đã revoked được dùng lại, hệ thống xem như possible reuse attack và revoke toàn bộ active tokens của user.
Transaction boundary: không có giữa revoke+insert.
Source: `auth.controller.js` `refreshToken`.

## APPT-01 Available slots

Actor: public hoặc frontend.
Trigger: `GET /appointments/available-slots`.
Flow: validate doctor/date, nếu có branch thì verify doctor làm ở branch đó, load active `doctor_schedule`, load appointment intervals trong ngày với status không thuộc cancelled/completed/no_show, chia shift theo slot duration, loại overlap, trả danh sách start time unique và sorted.
Business rule: công thức overlap là `proposedStart < overlap.end && proposedEnd > overlap.start`.
DB read: `doctor_branch`, `doctor_schedule`, `appointment`.
Transaction boundary: read-only.
Source: `appointment.controller.js` `getAvailableSlots`.

## APPT-02 Book appointment

Actor: patient.
Trigger: `POST /appointments`.
Flow: route yêu cầu patient role, controller cũng check `req.user.role`; map user sang patient, validate doctor/branch/date/start/duration, verify doctor_branch, tính start/end datetime, check overlap, tạo single appointment status `scheduled` hoặc tạo recurring record và child appointments.
Branch: nếu `recurring` true, tạo `recurring_appointments`, rồi generate appointments qua service.
DB read/write: `patient`, `doctor_branch`, `appointment`, optional `recurring_appointments`.
Side effects: audit log.
Error cases: missing profile 403, branch mismatch 400, overlap 409.
Transaction boundary: không có; race-condition được check bằng SELECT trước INSERT nhưng chưa thấy DB lock hoặc unique constraint.
Source: `appointment.controller.js` `bookAppointment`, `_doBookAppointment`; `recurringAppointment.service.js`.

## APPT-04 Cancel/status update

Actor: admin/super_admin/doctor/clinic_owner.
Trigger: `PUT /appointments/:id/status`.
Flow: nếu status mới là `cancelled`, load appointment `scheduled_at`, reject nếu còn dưới 2 giờ, sau đó update status và reason. Các status khác update trực tiếp.
DB read/write: `appointment`.
Side effects: audit log.
Transaction boundary: không có.
Source: `appointment.controller.js` `updateAppointmentStatus`.
NEED VERIFY: schema dùng nhiều `appointment_date`, `start_time`, `end_time`; reminder và cancellation lại đọc `scheduled_at`.

## CONSULT-02 Add consultation response

Actor: doctor hoặc patient.
Trigger: `POST /consultations/:id/responses`.
Flow: normalize uploaded files/body attachments, require content hoặc attachment, giới hạn 5 attachments, validate response type, lấy một DB connection cố định, detect doctor profile, begin transaction, update consultation status/doctor assignment cho doctor, insert response, insert attachments, commit.
State branch: doctor + `complete=true` -> `completed`; doctor + không complete -> `in_progress`; patient reply chỉ update timestamp.
DB write: `consultation`, `consultation_response`, `consultation_image`.
Side effects: audit log sau commit.
Transaction boundary: có, explicit `beginTransaction`/`commit`/`rollback`.
Source: `consultation.controller.js` `addConsultationResponse`.

## AI-01 Request analysis

Actor: authenticated user.
Trigger: `POST /ai/analyze`.
Flow: validate consultation/image IDs, verify image thuộc consultation, insert `ai_analysis_request` status `processing`, trả 202 ngay, async call FastAPI image service, insert `ai_analysis_result`, mark request completed; nếu lỗi mark request failed.
DB read/write: `consultation_image`, `ai_analysis_request`, `ai_analysis_result`.
External dependency: `IMAGE_PROCESSING_URL` `/api/v1/preprocess`, `/api/v1/jobs/:id/result`.
Transaction boundary: không có.
Source: `ai.controller.js` `requestAnalysis`; `ai.service.js` `analyzeImage`.

## RX-01 Prescription lifecycle

Actor: doctor.
Trigger: `POST /prescriptions`, `PUT /prescriptions/:id`, `POST /prescriptions/:id/issue`, `POST /prescriptions/:id/cancel`.
Flow: lấy doctor ID từ user, tạo draft prescription với ít nhất một medication, insert items; chỉ owner doctor được update draft; draft có thể issue; prescription chưa cancelled có thể cancel bởi owner doctor.
DB write: `prescription`, `prescription_item`.
Transaction boundary: không có, kể cả create prescription + items và replace items.
Source: `prescription.controller.js`.

## SUB-02 Subscription payment

Actor: authenticated user.
Trigger: `POST /subscriptions/payments`, `POST /subscriptions/payments/confirm`.
Flow: tạo pending `payment_order` cho non-free plan và allowed method; token hết hạn sau 15 phút; confirm validate pending order/token/expiry, mark paid với invoice number, activate hoặc update provider subscription.
DB write: `payment_order`, `provider_subscription`.
External dependency: không có; comment trong code nói production gateway callback là future.
Transaction boundary: không có.
Source: `subscription.controller.js` `createPayment`, `confirmPayment`.

