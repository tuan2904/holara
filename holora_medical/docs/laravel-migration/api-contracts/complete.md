# Endpoint-complete API contract

TOTAL_CANONICAL_ENDPOINTS: 155. TOTAL_DOCUMENTED_ENDPOINTS: 155.

## Batch 1 controller-level enrichment (API-001 → API-025)

The following evidence supplements and supersedes `NEED_VERIFY` fields in the corresponding records only.

#### API-001

`POST /ai/analyze`: authenticated; body requires `consultation_id`, `consultation_image_id`; 400 missing, 404 invalid image, 500 DB error, 202 `{message,analysis_request_id,status:"processing"}`. Reads `consultation_image`; inserts `ai_analysis_request`; background Promise calls `ai.service:analyzeImage`, inserts `ai_analysis_result`, updates request completed/failed. No transaction. Frontend: `aiService.requestImageAnalysis`, DoctorConsultationDetailPage. Critical: 202 async response.

#### API-002

`GET /ai/consultation/:consultation_id`: authenticated; path `consultation_id`; patient query filters `shared_with_patient=1`, other roles see all request states. Returns `{data: rows}`; DB query failure deliberately returns `{data:[]}` with 200. Reads AI request/result/image. Frontend: `aiService.getAnalysisForConsultation`, patient/doctor consultation detail pages. Critical: role-dependent list shape.

#### API-003

`PATCH /ai/review/:requestId`: authenticated; body `review_status` required in `pending_review|approved|approved_watch|not_standard|revoked`, optional `review_note`; 400 invalid, 403 non-doctor/non-admin, 404 absent result, 500 DB. Updates AI result review fields; approved statuses set sharing and attempt notification insert. Returns `{message,shared_with_patient}`. Runtime notification-column mismatch. Frontend: `aiService.reviewAIResult`.

#### API-004

`GET /appointments`: authenticated; role claim determines patient/doctor scoped query, all other roles see all. Returns appointment row array joined with doctor/specialty/patient/branch aliases; 403 missing profile, 500 `{error}`. Reads appointment and joined tables; no write/transaction. Frontend: `appointmentService.getMyAppointments`.

#### API-005

`POST /appointments`: authenticated plus role middleware patient; body required `doctor_id,branch_id,appointment_date,start_time,duration_minutes`; optional `specialty_id,reason,appointment_type,recurring*`. Validates doctor branch and overlap; 400/403/409/500, single success 201 `{message,appointment_id}`, recurring 201 `{message,recurring_id,appointment_ids,count}`. Writes appointment or recurring tables; audit fire-and-forget; no transaction. Frontend: `appointmentService.bookAppointment`. Critical booking response/state.

#### API-006

`GET /appointments/:id`: authenticated; path `id`; patient/doctor ownership checked against resolved profiles; admin-like roles bypass. 404 absent, 403 mismatch/profile, 500 error; success raw joined appointment object. Frontend: `appointmentService.getAppointmentById` used patient/doctor/video pages. Critical object shape.

#### API-007

`GET /appointments/:id/consultation`: authenticated; reads first consultation by appointment ID. 404 `{message:"Chưa có tư vấn liên kết với lịch hẹn này."}`, 500, success `{message:"OK",data:{id,status,chief_complaint,appointment_id,created_at}}`. Frontend: `consultationService.getConsultationByAppointmentId`.

#### API-008

`PUT /appointments/:id/status`: authenticated; roles super_admin/admin/doctor/clinic_owner; body `status`, optional `cancellation_reason`. Cancel branch reads missing runtime `scheduled_at`, applies 2-hour cutoff; updates status/reason and audit. Success cancellation/other status messages; 400 cutoff,404 absent,500. **RUNTIME_SCHEMA_MISMATCH**. Frontend `appointmentService.updateStatus`.

#### API-009

`GET /appointments/admin/all`: authenticated; admin/super_admin. Optional query `status,start_date,end_date,search`; returns joined appointment array; 500 `{error}`. Frontend `appointmentService.getAllAppointmentsAdmin`.

#### API-010

`GET /appointments/available-slots`: public; query required `doctor_id,date`, optional `duration_minutes=30,branch_id`. Branch compatibility check, active schedules, booked overlap calculation; returns sorted unique string time array, [] no schedule; 400/500. Frontend `appointmentService.getAvailableSlots`. Critical list shape.

#### API-011

`GET /appointments/owner/all`: authenticated clinic_owner; optional `status,start_date,end_date,search,branch_id,doctor_id`; joins only branches owned by caller; returns array or 500. Frontend `appointmentService.getAllAppointmentsOwner`.

#### API-012

`GET /audit-logs`: authenticated; query `page=1,limit=25` bounded 1–100 plus `action,entity_type,user_id,from,to`; reads paginated `audit_logs` joined users. Success `{data,pagination:{page,limit,total,totalPages}}`; 500 `{message,error}`. Frontend `auditService.getAuditLogs`.

#### API-013

`GET /audit-logs/actions`: authenticated; returns `{data}` of distinct sorted audit actions; 500 `{message,error}`. Frontend `auditService.getAuditActions`.

#### API-014

`GET /audit-logs/entity-types`: authenticated; returns `{data}` distinct non-null types; 500 `{message,error}`. Frontend `auditService.getAuditEntityTypes`.

#### API-015

`POST /auth/change-password`: authenticated; body requires `current_password,new_password`, new length >=6. Reads user hash/provider; 400 missing/short/google/wrong password,404 user,500; updates bcrypt(10) hash, audit; success `{message:"Đổi mật khẩu thành công!"}`. Frontend `authService.changePasswordApi`.

#### API-016

`POST /auth/doctor-invite/accept`: public; body requires `token,password`, minimum 6. Reads SHA-256 invite; 404 missing,410 revoked/used/expired,500; updates user bcrypt(10) password and invite used time without transaction; success `{message,data:{email,doctor_id}}`. Frontend `acceptDoctorInviteApi`.

#### API-017

`POST /auth/forgot-password`: public; body `email` required. 400 missing; unknown email returns 200 generic message. Existing user gets plaintext reset token/one-hour expiry DB update, console reset URL and audit; success 200 message. Frontend `forgotPasswordApi`.

#### API-018

`POST /auth/google`: public; body `credential` required. 400 missing,500 unconfigured/DB,401 invalid/unverified,403 inactive. Verifies Google ID token, optionally creates user+patient role+patient profile without transaction, then issues token/refresh response. Frontend `googleAuthApi`; critical auth envelope.

#### API-019

`POST /auth/login`: public; body reads `email,password`; unknown/wrong 401, inactive 403, DB 500. Reads user/roles, bcrypt compare, issues HS256 token and stored refresh token plus audit. Success `{message:"Login successful",token,refreshToken,user:{id,full_name,username,email,auth_provider,status,role,roles}}`. Frontend `loginApi`, AuthContext and axios refresh interceptor; critical.

#### API-020

`POST /auth/logout`: public; body `refreshToken` required, 400 missing; hashes and revokes matching token, audit, success `{message:"Logged out successfully"}`, 500 failure. Frontend `logoutApi`, AuthContext.

#### API-021

`POST /auth/logout-all`: authenticated; revokes all active refresh tokens for caller; success `{message:"All sessions revoked",revokedCount}`, 500 failure. Frontend `logoutAllApi`; no transaction.

#### API-022

`POST /auth/refresh`: public; body `refreshToken` required. 400 missing,401 invalid/expired/reuse,403 inactive,500. Reads hash+user, detects reuse/revokes sessions, rotates old/new DB records without transaction, returns `{token,refreshToken,user}`. Frontend axios interceptor; critical `TOKEN_EXPIRED` recovery.

#### API-023

`POST /auth/register`: public; required `full_name,username,email,password`; 400 missing,409 duplicate,500. Inserts user, role mapping, then patient profile or fire-and-forget provider subscription, without transaction/audit. Success 201 `{message,user_id,role,account_type}`; no token. Frontend `registerApi`.

#### API-024

`POST /auth/reset-password`: public; body requires `token,new_password`, length >=6. 400 missing/short/invalid-or-expired,500; reads reset fields, bcrypt(10) update/clears token, audit; success `{message:"Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập ngay!"}`. Frontend `resetPasswordApi`.

#### API-025

`GET /branches`: public; no request/query. Reads `branch` rows where `deleted_at IS NULL`, ordered `created_at DESC`; success 200 `{message:"Branches fetched successfully",data: branch[]}`; DB error 500 `{message:"Database error",error}`. No write/transaction/side effect. Frontend `branchService.getAllBranches`, consumed by patient/admin/owner pages; compatibility critical list shape.

## Batch 2 controller-level enrichment (API-026 → API-050)

#### API-026–API-031 — Branch mutations and provider reads

`POST /branches` requires authenticated provider role, `branch.manage` account entitlement and branch quota; body requires `name,address`, optional `phone,email,city,description,status`; generates medical code then inserts branch, returns 201 `{message,data}`; 400 missing,409 duplicate code,500. `DELETE /branches/:id` requires provider ownership plus entitlement and soft-deletes; 200 message/404/500. `GET /branches/:id` is public and returns `{message,data}` or 404/500. `PUT /branches/:id` requires provider ownership/entitlement; required `name,address`, updates and rereads row. `GET /branches/my` requires authenticated provider and returns owner branches with `doctor_count`; `GET /branches/next-code` is public and returns `{message,data:{code}}`. Frontend: branchService methods and patient/admin/owner pages; list/object envelopes are critical. All writes are non-transactional; medical-code generation is a blocking helper.

#### API-032 — POST /consultations

Authenticated. Body requires `chief_complaint,symptoms`; optional `attachments` array (max 3), `doctor_id`, `appointment_id`. Resolves patient by JWT user; inserts consultation pending then optional image rows, audit fire-and-forget. 201 `{message:"Gửi yêu cầu tư vấn thành công.",consultation_id}`; 400 validation,404 no patient,500. No transaction: image insert failure is only logged. Frontend `consultationService.createRequest`; critical creation response.

#### API-033–API-039 — Consultation read/response lifecycle

`GET /consultations/:id` is authenticated but has no ownership check; returns `{message,data}` with consultation, patient/doctor fields, `images`, and response attachments; 404/500. `DELETE /consultations/:id/images/:imageId` requires authenticated caller; patient-state/AI-use checks are controller enforced, deletes image/file as applicable. `PATCH /consultations/:id/reopen` requires auth and completed-state doctor/admin behavior. `POST /consultations/:id/responses` requires auth; multipart field `attachments` max 5 or JSON attachment list; content or attachment required, response_type defaults `message`; uses `beginTransaction` to update consultation, insert response and attachment rows, rollback on SQL errors, commit then audit; 201 `{message,response_id,attachments_count}`. Doctor-request, patient-history and owner-all GET routes are authenticated (owner route role `clinic_owner`) and return controller `{message,data}` list envelopes with controller query filters. Frontend: consultationService methods and consultation pages; detail/list envelopes and multipart field are critical.

#### API-040–API-043 — Dashboard

All authenticated. Analytics/stats require role-code one of super_admin/admin/doctor/clinic_owner; doctor endpoint doctor role; patient endpoint patient role. They read aggregate appointment/consultation/payment and identity data and return dashboard-specific JSON composed by controller; no writes/transactions/external calls. Frontend `dashboardService.getAnalytics/getStats/getDoctorDashboard/getPatientDashboard`; response shapes are critical. NEED_VERIFY: dynamic aggregate field sets require controller fixture capture.

#### API-044 — GET /doctors

Public. Reads doctor/users/specialty then doctor_branch/branch to append `branch_ids`, `branches`, `branch_names`; returns `{message:"Doctors fetched successfully",data}`; 500 database error. Frontend `doctorService.getAllDoctors`; critical enriched list shape.

#### API-045 — POST /doctors

Authenticated provider, owned-branch access, `doctor.manage` entitlement and quota. Controller validates specialty leaf, license uniqueness, branch IDs and may create user/invite; writes doctor plus doctor_branch mappings, audit/invite token behavior. Multi-write non-transactional; response 201 `{message,data}` on direct create, errors include 400/409/500. Frontend `doctorService.createDoctor`; critical create envelope.

#### API-046–API-048 — Doctor by ID mutation/read

`DELETE /doctors/:id` and `PUT /doctors/:id` require authenticated provider/entitlement; update/delete paths perform ownership/branch policy and doctor/doctor_branch writes, audit. `GET /doctors/:id` is public, returns enriched doctor object or not-found. Frontend `doctorService.deleteDoctor/updateDoctor/getDoctorById`; critical object/list fields. Multi-write branch synchronization is non-transactional.

#### API-049–API-050 — Doctor self profile

Both authenticated. `GET /doctors/me` resolves doctor profile from JWT user and returns profile/enriched branches; `PUT /doctors/me` updates self fields under controller ownership, audit fire-and-forget. Frontend `doctorService.getMyProfile/updateMyProfile`; profile object shape critical. NEED_VERIFY: exact allowed update body fields require fixture-level controller extraction.

## Batch 3 controller-level enrichment (API-051 → API-075)

#### API-051–API-054 — Doctor self/search

Authenticated: `GET /doctors/me/patients` resolves current doctor then lists patients; `GET /doctors/my-branches` requires provider role and scopes doctors to owned branches. Public `GET /doctors/next-code` returns `{message,data:{code}}`. Public search defaults `q="",page="1",limit="20"`, bounds page >=1/limit 1–50, supports `specialty_id,branch_id,status`, returns `{message,data,meta:{page,limit,total,totalPages,hasMore}}`. Reads doctor/users/specialty/doctor_branch/branch. Frontend doctorService methods; pagination and enriched list fields critical.

#### API-055–API-056 — Earnings

Authenticated earnings history and doctor earnings reads; no writes/transaction. Frontend `earningsService.getDoctorEarnings/getDoctorEarningsHistory`. NEED_VERIFY: exact aggregate response fields require fixture capture.

#### API-057–API-061 — EMR CRUD

Authenticated; POST reads `patient_id,doctor_id,appointment_id,title,summary,diagnosis,treatment,notes,attachments`; id/patient path params drive GET/PUT/DELETE. Frontend `emrService` calls all. **RUNTIME_SCHEMA_MISMATCH:** all reference absent `emr_record`; no transaction/ownership middleware observed.

#### API-062–API-064 — HoloraMind

Authenticated chats/message list/send; send body `{chatId,content}`. Reads/writes `holora_mind_chats/messages`; frontend holoraMindService. NEED_VERIFY: exact dynamic response/ownership fields.

#### API-065–API-067 — Notifications

Authenticated. GET `limit` defaults 20/max 50 and returns `{data,unread_count}`. Read-one/read-all update `is_read`; frontend notificationService/context. **RUNTIME_SCHEMA_MISMATCH:** GET uses absent `type/body/link` runtime columns.

#### API-068–API-075 — Patient admin/self

Admin/super_admin CRUD is applied after self/provider routes; self profile and branch read require auth. Patient writes use code/audit and are non-transactional. Frontend patientService; list/object envelopes critical. NEED_VERIFY: exact field allowlists/aliases require fixtures.

## Batch 4 controller-level enrichment (API-076 → API-100)

#### API-076–API-079 — Patient self/provider reads and code

Authenticated patient self endpoints return doctors, stats, owned branches; provider `GET /patients/my-branches` requires provider middleware. `GET /patients/next-code` is admin due route ordering and returns generated patient code envelope. Frontend patientService consumes list/object envelopes. Reads patient/appointment/doctor/branch mappings; no writes. NEED_VERIFY: exact aggregate aliases for stats.

#### API-080–API-081 — Appointment payment

Authenticated; pay route additionally requires patient role and checks patient owns appointment, then updates `payment_status`; status route reads it and returns `{payment_status: value || "unpaid"}`. Frontend PatientAppointmentDetailPage branches UI on `paid/unpaid`. **RUNTIME_SCHEMA_MISMATCH:** `appointment.payment_status` absent; both endpoints fail runtime DB. No transaction/audit.

#### API-082–API-087 — Permissions admin CRUD

All authenticated admin/super_admin by app mount. List/detail/modules read permission records; create/update/delete use request permission fields and standard controller errors/success envelopes. Frontend permissionService plus admin permission/role pages consume `data` and module lists. No external effects; writes non-transactional. NEED_VERIFY: exact permission field validation per create/update controller branch.

#### API-088–API-096 — Prescriptions

Authenticated. Create body requires `patient_id` and nonempty `items[]` with nonblank `medication_name`; optional consultation/appointment/diagnosis/notes; doctor profile required. Inserts prescription draft then item rows without transaction, audit fire-and-forget, returns 201 `{message,prescription_id,prescription_code}`. Detail validates owner doctor/patient or admin and appends ordered items; context and doctor/patient list APIs read prescription/items. Update/issue/cancel enforce owner doctor and lifecycle. Frontend prescriptionService and consultation/appointment pages consume data/items; lifecycle/object shapes critical.

#### API-097–API-100 — Recurring appointment operations

All are authenticated admin/super_admin by app mount. Child cancel-all updates child appointments to cancelled; child list returns raw appointment rows ordered date; child cancel updates one row. Create passes raw body to repository, generates children synchronously, returns raw recurring object or 400 `{message}`. DB uses `recurring_appointments` and `appointment.recurring_id`; no transaction/audit in child handlers. **API_COMPATIBILITY_CRITICAL:** frontend appointmentService calls `/recurring-appointments/...` without `/api`, while backend canonical path is `/api/recurring-appointments/...`; this is a frontend/backend path mismatch, not rewritten here.

## Batch 5 controller-level enrichment (API-101 → API-125)

#### API-101–API-105 — Recurring appointment administration

All authenticated admin/super_admin through app mount. Delete/get/update by `:id`, lists by `doctor/:doctor_id` and `patient/:patient_id`, call recurring repository; errors return 400 `{message}`, missing detail returns 404 `{message:"Not found"}`, update/delete success `{success:true}`, lists/raw detail return raw repository objects. No frontend service call found for patient/doctor list or generic CRUD. Database `recurring_appointments` and generated `appointment` rows; create/generation earlier is non-transactional. No additional runtime mismatch.

#### API-106–API-115 — Reviews

Public doctor review list and summary endpoints precede router auth; all other review routes are authenticated, with admin moderation requiring admin/super_admin. Create/update/delete/check/me/received/admin/moderate controllers read/write `review` with appointment/doctor/patient joins and audit on mutations. Frontend `reviewService` maps every route; doctor list/summary and `{data,meta}` list shapes are compatibility-critical. NEED_VERIFY: exact per-action body and pagination aliases require fixture capture; controller ownership differs by create/update/delete/moderate path.

#### API-116–API-123 — Role and role-permission RBAC

All authenticated admin/super_admin inherited from app mount. Role CRUD reads/writes `role`; `GET /roles/:id/permissions` joins permissions; assign/remove routes use request role/permission IDs and mutate `role_permission`. Frontend roleService and user-role/admin pages consume returned role/permission data. Mutations/audit behavior is controller-specific and non-transactional where multiple query steps occur. NEED_VERIFY: exact validation/body messages must be fixture-captured.

#### API-124 — GET /schedules

Authenticated. Query parameters are controller filters for doctor schedules; returns schedule rows joined with doctor details, with role/controller behavior deciding scope. Frontend `scheduleService.getDoctorSchedules` consumes list response. Reads `doctor_schedule`, `doctor`, related branch data; no writes/transaction. NEED_VERIFY: exact query defaults/aliases.

#### API-125 — POST /schedules

Authenticated plus role-code super_admin/admin/doctor. Body accepts schedule data (controller supports schedule collection/default slot duration); writes `doctor_schedule`, returns created schedule/controller envelope or validation/DB error. Frontend `scheduleService.createSchedule`; schedule list/object shape is critical. No explicit transaction for multi-schedule processing; partial-write behavior is legacy evidence.

## Batch 6 controller-level enrichment (API-126 → API-150)

#### API-126–API-127 — Schedule update/delete

Authenticated role-code super_admin/admin/doctor. Path `id`; update body reads work-date/time, slot duration and status, delete removes schedule. Reads/writes `doctor_schedule`; returns controller messages/updated data or 404/500. Frontend scheduleService update/delete. No transaction/audit observed; schedule object shape critical.

#### API-128–API-134 — Specialty and hierarchy

Public GET list/detail precede router admin middleware; all mutations are authenticated admin/super_admin. CRUD reads/writes `specialty`; parent patch changes hierarchy; reassign-delete moves doctors then deletes source. Frontend specialtyService and admin pages consume tree/list objects. Multi-step reassign/delete is non-transactional and can partially complete. NEED_VERIFY: exact hierarchy cycle/error branches require fixtures.

#### API-135–API-140 — Subscriptions and payment orders

Plans endpoint is public; me authenticated; activate accepts provider roles super_admin/admin/doctor/clinic_owner/branch_manager; create/confirm/history require clinic_owner. Controllers read/write subscription_plan, entitlement, provider_subscription and payment_order. Payment creation/confirmation use simulated token flow, 15-minute expiry; no gateway/webhook. Frontend subscriptionService/SubscriptionPage consumes plan/order/history fields; status/envelope compatibility critical. Multi-write activation/confirmation is non-transactional.

#### API-141 — GET /

Public app root; no DB; returns `{message:"Holora Medical Backend is running"}`. No frontend consumer found.

#### API-142 — POST /upload

Authenticated; multer accepts multipart field `attachments`, maximum 5. Controller writes local `backend/public/uploads`, returns uploaded URL metadata/controller envelope; errors come from multer/controller. Frontend uploadService sends FormData and relies on URLs; **API_COMPATIBILITY_CRITICAL** physical path/public `/public` URL contract.

#### API-143–API-150 — Admin user management

All authenticated admin/super_admin inherited from app mount. List/create/detail/update/delete use `users`, roles and patient profile where applicable; force logout and session routes operate `refresh_tokens`; login-history reads audit/session data. Path IDs are `id`, `user_id`, `sessionId` as route declares. Frontend userService/userRoleService and admin pages consume user, role, session and history shapes. User creation/role/profile writes are multi-step non-transactional; audit writes fire-and-forget. NEED_VERIFY: exact create/update body field and list pagination branches require fixture capture.

## Batch 7 controller-level enrichment (API-151 → API-155)

#### API-151 — DELETE /users/:id/sessions/:sessionId

Authenticated admin/super_admin inherited from app mount. Path params `id,sessionId`; updates `refresh_tokens.revoked_at` only where session belongs to user and is active. Success `{message:"Session revoked successfully"}`; 404 `{message:"Session not found or already revoked"}`; 500 DB envelope. No transaction/audit. Frontend `userService.revokeSessionApi`, UserDetailPage; exact message/status critical for session UI.

#### API-152 — GET /users/:user_id/roles

Authenticated admin/super_admin. Path `user_id`; reads `user_role` joined `role` and assigning `users`, selects `id,code,name,description,status,assigned_at,assigned_by,assigned_by_name`; success `{message:"User roles fetched successfully",data:[]}` or 500. Frontend `userRoleService.getUserRolesApi` returns `.data`, AssignUserRoleModal; data list critical.

#### API-153 — GET /users/:user_id/available-roles

Authenticated admin/super_admin. Path `user_id`; reads active role list left joined user_role, exposes boolean `is_assigned`; success `{message:"Available roles fetched successfully",data:[]}` or 500. Frontend `getAvailableRolesApi`/AssignUserRoleModal; data/list/boolean contract critical.

#### API-154 — POST /users/assign-role

Authenticated admin/super_admin. Body requires `user_id,role_id`; validates active non-deleted user, active role, no existing assignment; 400 missing/already assigned,404 user/role,500 insert error. Inserts `user_role(user_id,role_id,assigned_at,assigned_by)` then fire-and-forget audit; success `{message:"Role assigned successfully",data:{user_id,role_id}}`. No transaction. Frontend userService/userRoleService return `.data`; critical envelope.

#### API-155 — POST /users/remove-role

Authenticated admin/super_admin. Body requires `user_id,role_id`; deletes matching `user_role`; 400 missing,404 absent mapping,500, success `{message:"Role removed successfully",data:{user_id,role_id}}`; audit fire-and-forget, no transaction. Frontend `removeRoleFromUserApi`/AssignUserRoleModal return `.data`; critical envelope.

### API-001 — POST /ai/analyze

Module: ai.routes.js

Route source: `backend/src/routes/ai.routes.js`

Controller/function: `requestAnalysis` (`backend/src/controllers/ai.controller.js`).

Middleware: router-level `authenticateToken`.

Authentication: REQUIRED — JWT claims populate `req.user`.

Authorization: Authenticated caller; image is checked only for the supplied `id` + `consultation_id` pair; no caller ownership predicate.

Path Params: NONE

Query Params: NONE

Request Body: `consultation_id`, `consultation_image_id`.

Validation: Both body fields required (400); matching `consultation_image` required (404).

Success Status: 202

Success Response: `{message:"Yêu cầu phân tích AI đã được gửi đi thành công.",analysis_request_id,status:"processing"}`.

Error Responses: 400 missing fields; 404 image not found; 500 database error.

Database Reads: `consultation_image` by image ID and consultation ID.

Database Writes: Insert `ai_analysis_request` with `processing`; later insert `ai_analysis_result` and mark request completed/failed.

Transaction: NO — POST_RESPONSE_ASYNC; partial/silent failure possible after 202.

Side Effects: Starts unawaited Promise after response; logs analysis-result insert failure.

External Integration: `ai.service.analyzeImage`: local uploaded file → FastAPI `/api/v1/preprocess` and job-result polling, `X-API-Key`, 15-second timeout.

Frontend Consumer: `aiService.requestImageAnalysis`; `DoctorConsultationDetailPage`.

Frontend Usage: Expects immediate 202 request ID/status while analysis continues.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: asynchronous 202 envelope and status are client workflow contract.

Evidence: `backend/src/routes/ai.routes.js`; `backend/src/controllers/ai.controller.js`; `backend/src/services/ai.service.js`; `frontend/src/services/aiService.js`.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-002 — GET /ai/consultation/:consultation_id

Module: ai.routes.js

Route source: `backend/src/routes/ai.routes.js`

Controller/function: `getAIAnalysisForConsultation` (`backend/src/controllers/ai.controller.js`).

Middleware: router-level `authenticateToken`.

Authentication: REQUIRED — JWT.

Authorization: Patient role sees only `shared_with_patient=1`; non-patient role sees all. No consultation ownership predicate observed.

Path Params: :consultation_id

Query Params: NONE

Request Body: NONE

Validation: Path `consultation_id` is used directly.

Success Status: 200

Success Response: `{data: results}`; patient list is sharing-filtered.

Error Responses: SQL failure deliberately returns 200 `{data: []}`.

Database Reads: `ai_analysis_request`, `ai_analysis_result`, `consultation_image` joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: `aiService.getAnalysisForConsultation`; `DoctorConsultationDetailPage`, `PatientConsultationDetailPage`.

Frontend Usage: Renders role-dependent analysis list fields.

Compatibility: API_COMPATIBILITY_CRITICAL; OBSERVED_NO_OWNERSHIP_CHECK
Reason: 200-empty-on-query-failure and patient sharing filter are material; caller is not tied to consultation.

Evidence: `backend/src/routes/ai.routes.js`; `backend/src/controllers/ai.controller.js`; `frontend/src/services/aiService.js`.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-003 — PATCH /ai/review/:requestId

Module: ai.routes.js

Route source: `backend/src/routes/ai.routes.js`

Controller/function: `reviewAIResult` (`backend/src/controllers/ai.controller.js`).

Middleware: router-level `authenticateToken`.

Authentication: REQUIRED — JWT.

Authorization: Doctor profile required, except `admin`/`super_admin`; no consultation/doctor ownership predicate.

Path Params: :requestId

Query Params: NONE

Request Body: `review_status`, optional `review_note`.

Validation: Status required and one of `pending_review|approved|approved_watch|not_standard|revoked`; invalid 400.

Success Status: 200

Success Response: `{message:"Đã lưu đánh giá kết quả AI.",shared_with_patient}`.

Error Responses: 400 invalid body; 403 ineligible reviewer; 404 no result; 500 database error.

Database Reads: Doctor profile; analysis result/request/consultation context for sharing notification.

Database Writes: Update `ai_analysis_result` review fields; `shared_with_patient=1` only for approved/approved_watch; attempted notification insert.

Transaction: NO — MULTI_WRITE_NON_TRANSACTIONAL; notification error is logged only.

Side Effects: FIRE_AND_FORGET notification when sharing.

External Integration: NONE

Frontend Consumer: `aiService.reviewAIResult`; doctor consultation detail UI.

Frontend Usage: Uses review status/note and returned sharing boolean.

Compatibility: RUNTIME_SCHEMA_MISMATCH; OBSERVED_NO_OWNERSHIP_CHECK
Reason: `createNotification` writes legacy `notification.type/body/link`, absent from canonical runtime schema; reviewer need not own consultation.

Evidence: `backend/src/routes/ai.routes.js`; `backend/src/controllers/ai.controller.js`; `backend/src/utils/notification.util.js`; `docs/laravel-migration/03-database-contract.md`; `frontend/src/services/aiService.js`.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-004 — GET /

Module: app.js

Route source: `backend/src/app.js`

Controller/function: `app root handler`.

Middleware: NONE.

Authentication: PUBLIC.

Authorization: PUBLIC

Path Params: NONE

Query Params: NONE

Request Body: NONE

Validation: NONE

Success Status: 200

Success Response: {message:"Holora Medical Backend is running"}

Error Responses: NONE

Database Reads: NONE

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: NONE_FOUND

Frontend Usage: No frontend call found.

Compatibility: NORMAL
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: backend/src/app.js.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-005 — GET /appointments

Module: appointment.routes.js

Route source: `backend/src/routes/appointment.routes.js`

Controller/function: `getMyAppointments`.

Middleware: authenticateToken.

Authentication: REQUIRED — JWT.

Authorization: Patient/doctor profile-scoped; other roles unscoped.

Path Params: NONE

Query Params: NONE

Request Body: NONE

Validation: NONE

Success Status: 200

Success Response: raw joined appointment array

Error Responses: 403 profile missing; 500 {error}.

Database Reads: appointment with doctor, specialty, patient, branch joins

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: appointmentService.getMyAppointments

Frontend Usage: My appointments listing.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: appointment route/controller; frontend appointment service.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-006 — POST /appointments

Module: appointment.routes.js

Route source: `backend/src/routes/appointment.routes.js`

Controller/function: `bookAppointment`.

Middleware: authenticateToken; authorizeRole(patient).

Authentication: REQUIRED — JWT.

Authorization: Patient only; controller resolves own patient profile.

Path Params: NONE

Query Params: NONE

Request Body: doctor_id, branch_id, appointment_date, start_time, duration_minutes; optional specialty/reason/type/recurrence

Validation: required fields, doctor-branch membership and overlapping active booking check

Success Status: 201

Success Response: single {message,appointment_id}; recurring {message,recurring_id,appointment_ids,count}

Error Responses: 400 validation/branch; 403; 409 overlap; 500.

Database Reads: patient, doctor_branch, appointment scheduling data

Database Writes: appointment or recurring_appointments plus generated children

Transaction: NO — MULTI_WRITE_NON_TRANSACTIONAL; concurrent race/partial write possible.

Side Effects: FIRE_AND_FORGET audit

External Integration: NONE

Frontend Consumer: appointmentService.bookAppointment

Frontend Usage: Booking flow consumes IDs/messages.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: appointment route/controller; recurring repository; frontend appointment service.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-007 — GET /appointments/:id

Module: appointment.routes.js

Route source: `backend/src/routes/appointment.routes.js`

Controller/function: `getAppointmentById`.

Middleware: authenticateToken.

Authentication: REQUIRED — JWT.

Authorization: Patient/doctor ownership via profiles; admin-like bypass.

Path Params: :id

Query Params: NONE

Request Body: NONE

Validation: NONE

Success Status: 200

Success Response: raw joined appointment object

Error Responses: 403 mismatch/profile; 404 absent; 500.

Database Reads: appointment joined with doctor/specialty/patient/branch

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: appointmentService.getAppointmentById

Frontend Usage: Detail/video-call screens.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: appointment route/controller; frontend appointment service.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-008 — GET /appointments/:id/consultation

Module: appointment.routes.js

Route source: `backend/src/routes/appointment.routes.js`

Controller/function: `getConsultationByAppointmentId`.

Middleware: authenticateToken.

Authentication: REQUIRED — JWT.

Authorization: Authenticated only; no ownership check.

Path Params: :id

Query Params: NONE

Request Body: NONE

Validation: NONE

Success Status: 200

Success Response: {message:"OK",data:{id,status,chief_complaint,appointment_id,created_at}}

Error Responses: 404 no linked consultation; 500.

Database Reads: first consultation by appointment ID

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: consultationService.getConsultationByAppointmentId

Frontend Usage: Appointment consultation navigation.

Compatibility: OBSERVED_NO_OWNERSHIP_CHECK
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: appointment route/controller; frontend consultation service.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-009 — PUT /appointments/:id/status

Module: appointment.routes.js

Route source: `backend/src/routes/appointment.routes.js`

Controller/function: `updateAppointmentStatus`.

Middleware: authenticateToken; authorizeRole(super_admin, admin, doctor, clinic_owner).

Authentication: REQUIRED — JWT.

Authorization: Role gate only; no record ownership predicate.

Path Params: :id

Query Params: NONE

Request Body: status; optional cancellation_reason

Validation: cancel flow applies 2-hour cutoff

Success Status: 200

Success Response: status-specific success message

Error Responses: 400 cutoff; 404 absent; 500.

Database Reads: appointment; cancellation flow selects scheduled_at

Database Writes: appointment status/cancellation reason

Transaction: NO — single write plus audit.

Side Effects: FIRE_AND_FORGET audit

External Integration: NONE

Frontend Consumer: appointmentService.updateStatus

Frontend Usage: Appointment status UI.

Compatibility: RUNTIME_SCHEMA_MISMATCH; OBSERVED_NO_OWNERSHIP_CHECK
Reason: Node status/cancellation flow references appointment.scheduled_at, absent from canonical runtime appointment table.

Evidence: appointment route/controller; database contract; scheduled_at absent at runtime.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-010 — GET /appointments/admin/all

Module: appointment.routes.js

Route source: `backend/src/routes/appointment.routes.js`

Controller/function: `getAllAppointmentsAdmin`.

Middleware: authenticateToken; authorizeRole(super_admin, admin).

Authentication: REQUIRED — JWT.

Authorization: Admin/super_admin.

Path Params: NONE

Query Params: status,start_date,end_date,search

Request Body: NONE

Validation: NONE

Success Status: 200

Success Response: raw joined appointment array

Error Responses: 500 {error}.

Database Reads: appointment and identity/branch joins

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: appointmentService.getAllAppointmentsAdmin

Frontend Usage: Admin appointment list.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: appointment route/controller; frontend appointment service.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-011 — GET /appointments/available-slots

Module: appointment.routes.js

Route source: `backend/src/routes/appointment.routes.js`

Controller/function: `getAvailableSlots`.

Middleware: NONE — route precedes router authentication.

Authentication: NOT_REQUIRED.

Authorization: PUBLIC; optional branch compatibility enforced.

Path Params: NONE

Query Params: doctor_id,date required; duration_minutes defaults 30; branch_id optional

Request Body: NONE

Validation: required doctor/date; parseInt duration; branch compatibility

Success Status: 200

Success Response: sorted unique HH:mm array, [] with no schedule

Error Responses: 400 missing/branch; 500.

Database Reads: doctor_schedule and booked appointment intervals

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: appointmentService.getAvailableSlots

Frontend Usage: Booking slot picker.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: appointment route/controller; frontend appointment service.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-012 — GET /appointments/owner/all

Module: appointment.routes.js

Route source: `backend/src/routes/appointment.routes.js`

Controller/function: `getAllAppointmentsOwner`.

Middleware: authenticateToken; authorizeRole(clinic_owner).

Authentication: REQUIRED — JWT.

Authorization: Clinic owner; SQL only owned branches.

Path Params: NONE

Query Params: status,start_date,end_date,search,branch_id,doctor_id optional

Request Body: NONE

Validation: NONE

Success Status: 200

Success Response: raw joined appointment array

Error Responses: 500 {error}.

Database Reads: appointment joined through owner branches

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: appointmentService.getAllAppointmentsOwner

Frontend Usage: Owner appointment listing.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: appointment route/controller; frontend appointment service.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-013 — GET /audit-logs

Module: audit.routes.js

Route source: `backend/src/routes/audit.routes.js`

Controller/function: `getAuditLogs`.

Middleware: authenticateToken.

Authentication: REQUIRED — JWT.

Authorization: Authenticated; no extra role gate.

Path Params: NONE

Query Params: page=1, limit=25 bounded 1–100; action,entity_type,user_id,from,to optional

Request Body: NONE

Validation: page min 1; limit min 1 max 100

Success Status: 200

Success Response: {data,pagination:{page,limit,total,totalPages}}

Error Responses: 500 {message,error}.

Database Reads: audit_logs left joined users plus count

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: auditService.getAuditLogs

Frontend Usage: Audit filters/pagination.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: audit route/controller; frontend audit service.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-014 — GET /audit-logs/actions

Module: audit.routes.js

Route source: `backend/src/routes/audit.routes.js`

Controller/function: `getAuditActions`.

Middleware: authenticateToken.

Authentication: REQUIRED — JWT.

Authorization: Authenticated.

Path Params: NONE

Query Params: NONE

Request Body: NONE

Validation: NONE

Success Status: 200

Success Response: {data} distinct sorted actions

Error Responses: 500 {message,error}.

Database Reads: distinct audit_logs.action

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: auditService.getAuditActions

Frontend Usage: Audit filter options.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: audit route/controller; frontend audit service.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-015 — GET /audit-logs/entity-types

Module: audit.routes.js

Route source: `backend/src/routes/audit.routes.js`

Controller/function: `getAuditEntityTypes`.

Middleware: authenticateToken.

Authentication: REQUIRED — JWT.

Authorization: Authenticated.

Path Params: NONE

Query Params: NONE

Request Body: NONE

Validation: NONE

Success Status: 200

Success Response: {data} distinct non-null entity types

Error Responses: 500 {message,error}.

Database Reads: distinct audit_logs.entity_type

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE

Frontend Consumer: auditService.getAuditEntityTypes

Frontend Usage: Audit filter options.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Contract shape/authorization behavior is consumed by the identified client.

Evidence: audit route/controller; frontend audit service.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-016 — POST /auth/change-password

Module: auth.routes.js

Route source: `backend/src/routes/auth.routes.js`

Controller/function: `changePassword` (`backend/src/controllers/auth.controller.js`).

Middleware: authenticateToken.

Authentication: REQUIRED — JWT.

Authorization: Caller only.

Path Params: NONE

Query Params: NONE

Request Body: current_password,new_password.

Validation: both required; new password >=6.

Success Status: 200

Success Response: {message:"Đổi mật khẩu thành công!"}.

Error Responses: 400 validation/google/wrong; 404 user; 500.

Database Reads: users password_hash/auth_provider.

Database Writes: bcrypt(10) password update.

Transaction: NO — single write plus audit.

Side Effects: FIRE_AND_FORGET audit.

External Integration: NONE

Frontend Consumer: authService.changePasswordApi.

Frontend Usage: Change-password form.

Compatibility: NORMAL
Reason: Auth response, session/token, or form semantics are client contract.

Evidence: auth routes/controller; frontend auth service/AuthContext.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-017 — POST /auth/doctor-invite/accept

Module: auth.routes.js

Route source: `backend/src/routes/auth.routes.js`

Controller/function: `acceptDoctorInvite` (`backend/src/controllers/auth.controller.js`).

Middleware: NONE.

Authentication: NOT_REQUIRED.

Authorization: PUBLIC.

Path Params: NONE

Query Params: NONE

Request Body: token,password.

Validation: both required; password >=6; SHA-256 invite token.

Success Status: 200

Success Response: {message,data:{email,doctor_id}}.

Error Responses: 404 absent; 410 revoked/used/expired; 500.

Database Reads: doctor_invite + user.

Database Writes: users bcrypt(10) password; doctor_invite.used_at.

Transaction: NO — MULTI_WRITE_NON_TRANSACTIONAL.

Side Effects: NONE_OBSERVED.

External Integration: NONE

Frontend Consumer: acceptDoctorInviteApi.

Frontend Usage: Invited-doctor activation.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Auth response, session/token, or form semantics are client contract.

Evidence: auth routes/controller; frontend auth service/AuthContext.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-018 — POST /auth/forgot-password

Module: auth.routes.js

Route source: `backend/src/routes/auth.routes.js`

Controller/function: `forgotPassword` (`backend/src/controllers/auth.controller.js`).

Middleware: NONE.

Authentication: NOT_REQUIRED.

Authorization: PUBLIC.

Path Params: NONE

Query Params: NONE

Request Body: email.

Validation: email required; unknown user intentionally generic success.

Success Status: 200

Success Response: generic reset message.

Error Responses: 400 missing; 500.

Database Reads: users by email.

Database Writes: reset token and one-hour expiry.

Transaction: NO — single write plus audit.

Side Effects: console reset URL; FIRE_AND_FORGET audit.

External Integration: NONE

Frontend Consumer: forgotPasswordApi.

Frontend Usage: Forgot-password form.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Auth response, session/token, or form semantics are client contract.

Evidence: auth routes/controller; frontend auth service/AuthContext.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-019 — POST /auth/google

Module: auth.routes.js

Route source: `backend/src/routes/auth.routes.js`

Controller/function: `googleAuth` (`backend/src/controllers/auth.controller.js`).

Middleware: NONE.

Authentication: NOT_REQUIRED.

Authorization: PUBLIC.

Path Params: NONE

Query Params: NONE

Request Body: credential.

Validation: credential required; Google token/audience/email verification.

Success Status: 200

Success Response: login envelope token,refreshToken,user.

Error Responses: 400 missing; 401 invalid; 403 inactive; 500 config/DB.

Database Reads: users, roles.

Database Writes: optional users/patient role/profile; refresh token.

Transaction: NO — MULTI_WRITE_NON_TRANSACTIONAL.

Side Effects: Google ID-token verification.

External Integration: Google OAuth verification.

Frontend Consumer: googleAuthApi.

Frontend Usage: Google login/register.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Auth response, session/token, or form semantics are client contract.

Evidence: auth routes/controller; frontend auth service/AuthContext.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-020 — POST /auth/login

Module: auth.routes.js

Route source: `backend/src/routes/auth.routes.js`

Controller/function: `login` (`backend/src/controllers/auth.controller.js`).

Middleware: NONE.

Authentication: NOT_REQUIRED.

Authorization: PUBLIC.

Path Params: NONE

Query Params: NONE

Request Body: email,password.

Validation: bcrypt comparison; inactive user rejected.

Success Status: 200

Success Response: {message:"Login successful",token,refreshToken,user:{id,full_name,username,email,auth_provider,status,role,roles}}.

Error Responses: 401 credentials; 403 inactive; 500.

Database Reads: users, user_role/role.

Database Writes: refresh_tokens insert.

Transaction: NO — write plus audit.

Side Effects: FIRE_AND_FORGET audit.

External Integration: NONE

Frontend Consumer: loginApi.

Frontend Usage: AuthContext and axios auth flow.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Auth response, session/token, or form semantics are client contract.

Evidence: auth routes/controller; frontend auth service/AuthContext.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-021 — POST /auth/logout

Module: auth.routes.js

Route source: `backend/src/routes/auth.routes.js`

Controller/function: `logoutUser` (`backend/src/controllers/auth.controller.js`).

Middleware: NONE.

Authentication: NOT_REQUIRED.

Authorization: PUBLIC.

Path Params: NONE

Query Params: NONE

Request Body: refreshToken.

Validation: refreshToken required; SHA-256 hash.

Success Status: 200

Success Response: {message:"Logged out successfully"}.

Error Responses: 400 missing; 500.

Database Reads: refresh_tokens.

Database Writes: revoke matching active refresh token.

Transaction: NO — single write plus audit.

Side Effects: FIRE_AND_FORGET audit.

External Integration: NONE

Frontend Consumer: logoutApi.

Frontend Usage: AuthContext logout.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Auth response, session/token, or form semantics are client contract.

Evidence: auth routes/controller; frontend auth service/AuthContext.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-022 — POST /auth/logout-all

Module: auth.routes.js

Route source: `backend/src/routes/auth.routes.js`

Controller/function: `logoutAll` (`backend/src/controllers/auth.controller.js`).

Middleware: authenticateToken.

Authentication: REQUIRED — JWT.

Authorization: Caller only.

Path Params: NONE

Query Params: NONE

Request Body: NONE.

Validation: NONE.

Success Status: 200

Success Response: {message:"All sessions revoked",revokedCount}.

Error Responses: 500.

Database Reads: refresh_tokens.

Database Writes: revoke all caller active tokens.

Transaction: NO — single write plus audit.

Side Effects: FIRE_AND_FORGET audit.

External Integration: NONE

Frontend Consumer: logoutAllApi.

Frontend Usage: All-sessions logout.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Auth response, session/token, or form semantics are client contract.

Evidence: auth routes/controller; frontend auth service/AuthContext.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-023 — POST /auth/refresh

Module: auth.routes.js

Route source: `backend/src/routes/auth.routes.js`

Controller/function: `refreshToken` (`backend/src/controllers/auth.controller.js`).

Middleware: NONE.

Authentication: NOT_REQUIRED.

Authorization: PUBLIC.

Path Params: NONE

Query Params: NONE

Request Body: refreshToken.

Validation: required; hash lookup, reuse/expiry checks.

Success Status: 200

Success Response: {token,refreshToken,user:{id,full_name,username,email,status,role,roles}}.

Error Responses: 400 missing; 401 invalid/expired/reuse; 403 inactive; 500.

Database Reads: refresh_tokens, users, roles.

Database Writes: revoke old and insert rotated token.

Transaction: NO — MULTI_WRITE_NON_TRANSACTIONAL.

Side Effects: reuse revokes all sessions.

External Integration: NONE

Frontend Consumer: axios refresh interceptor.

Frontend Usage: 401 TOKEN_EXPIRED recovery.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Auth response, session/token, or form semantics are client contract.

Evidence: auth routes/controller; frontend auth service/AuthContext.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-024 — POST /auth/register

Module: auth.routes.js

Route source: `backend/src/routes/auth.routes.js`

Controller/function: `register` (`backend/src/controllers/auth.controller.js`).

Middleware: NONE.

Authentication: NOT_REQUIRED.

Authorization: PUBLIC.

Path Params: NONE

Query Params: NONE

Request Body: full_name,username,email,password; account_type.

Validation: required; duplicate email/username check; provider or patient mapping.

Success Status: 201

Success Response: {message,user_id,role,account_type}.

Error Responses: 400 missing; 409 duplicate; 500.

Database Reads: users and role lookup.

Database Writes: users, user_role, patient profile or provider subscription.

Transaction: NO — MULTI_WRITE_NON_TRANSACTIONAL.

Side Effects: provider subscription/audit behavior.

External Integration: NONE

Frontend Consumer: registerApi.

Frontend Usage: Registration UI; no token response.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Auth response, session/token, or form semantics are client contract.

Evidence: auth routes/controller; frontend auth service/AuthContext.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-025 — POST /auth/reset-password

Module: auth.routes.js

Route source: `backend/src/routes/auth.routes.js`

Controller/function: `resetPassword` (`backend/src/controllers/auth.controller.js`).

Middleware: NONE.

Authentication: NOT_REQUIRED.

Authorization: PUBLIC.

Path Params: NONE

Query Params: NONE

Request Body: token,new_password.

Validation: required; new password >=6; token expiry check.

Success Status: 200

Success Response: {message:"Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập ngay!"}.

Error Responses: 400 missing/short/invalid-expired; 500.

Database Reads: users reset fields.

Database Writes: bcrypt(10) password and clear reset fields.

Transaction: NO — single write plus audit.

Side Effects: FIRE_AND_FORGET audit.

External Integration: NONE

Frontend Consumer: resetPasswordApi.

Frontend Usage: Reset-password form.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Auth response, session/token, or form semantics are client contract.

Evidence: auth routes/controller; frontend auth service/AuthContext.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-026 — GET /branches

Module: branch.routes.js

Route source: `backend/src/routes/branch.routes.js`

Controller/function: Route-bound handler export in branch.routes.js.

Middleware: Declared in backend/src/routes/branch.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /branches.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/branch.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-027 — POST /branches

Module: branch.routes.js

Route source: `backend/src/routes/branch.routes.js`

Controller/function: Route-bound handler export in branch.routes.js.

Middleware: Declared in backend/src/routes/branch.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to POST /branches.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/branch.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-028 — DELETE /branches/:id

Module: branch.routes.js

Route source: `backend/src/routes/branch.routes.js`

Controller/function: Route-bound handler export in branch.routes.js.

Middleware: Declared in backend/src/routes/branch.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to DELETE /branches/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/branch.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-029 — GET /branches/:id

Module: branch.routes.js

Route source: `backend/src/routes/branch.routes.js`

Controller/function: Route-bound handler export in branch.routes.js.

Middleware: Declared in backend/src/routes/branch.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /branches/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/branch.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-030 — PUT /branches/:id

Module: branch.routes.js

Route source: `backend/src/routes/branch.routes.js`

Controller/function: Route-bound handler export in branch.routes.js.

Middleware: Declared in backend/src/routes/branch.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to PUT /branches/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/branch.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-031 — GET /branches/my

Module: branch.routes.js

Route source: `backend/src/routes/branch.routes.js`

Controller/function: Route-bound handler export in branch.routes.js.

Middleware: Declared in backend/src/routes/branch.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /branches/my.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/branch.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-032 — GET /branches/next-code

Module: branch.routes.js

Route source: `backend/src/routes/branch.routes.js`

Controller/function: Route-bound handler export in branch.routes.js.

Middleware: Declared in backend/src/routes/branch.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /branches/next-code.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/branch.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-033 — POST /consultations

Module: consultation.routes.js

Route source: `backend/src/routes/consultation.routes.js`

Controller/function: Route-bound handler export in consultation.routes.js.

Middleware: Declared in backend/src/routes/consultation.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to POST /consultations.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/consultation.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-034 — GET /consultations/:id

Module: consultation.routes.js

Route source: `backend/src/routes/consultation.routes.js`

Controller/function: Route-bound handler export in consultation.routes.js.

Middleware: Declared in backend/src/routes/consultation.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /consultations/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/consultation.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-035 — DELETE /consultations/:id/images/:imageId

Module: consultation.routes.js

Route source: `backend/src/routes/consultation.routes.js`

Controller/function: Route-bound handler export in consultation.routes.js.

Middleware: Declared in backend/src/routes/consultation.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id, :imageId

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to DELETE /consultations/:id/images/:imageId.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/consultation.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-036 — PATCH /consultations/:id/reopen

Module: consultation.routes.js

Route source: `backend/src/routes/consultation.routes.js`

Controller/function: Route-bound handler export in consultation.routes.js.

Middleware: Declared in backend/src/routes/consultation.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to PATCH /consultations/:id/reopen.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/consultation.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-037 — POST /consultations/:id/responses

Module: consultation.routes.js

Route source: `backend/src/routes/consultation.routes.js`

Controller/function: Route-bound handler export in consultation.routes.js.

Middleware: Declared in backend/src/routes/consultation.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to POST /consultations/:id/responses.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/consultation.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-038 — GET /consultations/doctor-requests

Module: consultation.routes.js

Route source: `backend/src/routes/consultation.routes.js`

Controller/function: Route-bound handler export in consultation.routes.js.

Middleware: Declared in backend/src/routes/consultation.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /consultations/doctor-requests.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/consultation.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-039 — GET /consultations/my-history

Module: consultation.routes.js

Route source: `backend/src/routes/consultation.routes.js`

Controller/function: Route-bound handler export in consultation.routes.js.

Middleware: Declared in backend/src/routes/consultation.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /consultations/my-history.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/consultation.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-040 — GET /consultations/owner/all

Module: consultation.routes.js

Route source: `backend/src/routes/consultation.routes.js`

Controller/function: Route-bound handler export in consultation.routes.js.

Middleware: Declared in backend/src/routes/consultation.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /consultations/owner/all.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/consultation.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-041 — GET /dashboard/analytics

Module: dashboard.routes.js

Route source: `backend/src/routes/dashboard.routes.js`

Controller/function: Route-bound handler export in dashboard.routes.js.

Middleware: Declared in backend/src/routes/dashboard.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /dashboard/analytics.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/dashboard.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-042 — GET /dashboard/doctor

Module: dashboard.routes.js

Route source: `backend/src/routes/dashboard.routes.js`

Controller/function: Route-bound handler export in dashboard.routes.js.

Middleware: Declared in backend/src/routes/dashboard.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /dashboard/doctor.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/dashboard.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-043 — GET /dashboard/patient

Module: dashboard.routes.js

Route source: `backend/src/routes/dashboard.routes.js`

Controller/function: Route-bound handler export in dashboard.routes.js.

Middleware: Declared in backend/src/routes/dashboard.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /dashboard/patient.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/dashboard.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-044 — GET /dashboard/stats

Module: dashboard.routes.js

Route source: `backend/src/routes/dashboard.routes.js`

Controller/function: Route-bound handler export in dashboard.routes.js.

Middleware: Declared in backend/src/routes/dashboard.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /dashboard/stats.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/dashboard.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-045 — GET /doctors

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /doctors.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-046 — POST /doctors

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to POST /doctors.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-047 — DELETE /doctors/:id

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to DELETE /doctors/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-048 — GET /doctors/:id

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /doctors/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-049 — PUT /doctors/:id

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to PUT /doctors/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-050 — GET /doctors/me

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /doctors/me.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-051 — PUT /doctors/me

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to PUT /doctors/me.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-052 — GET /doctors/me/patients

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /doctors/me/patients.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-053 — GET /doctors/my-branches

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /doctors/my-branches.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-054 — GET /doctors/next-code

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /doctors/next-code.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-055 — GET /doctors/search

Module: doctor.routes.js

Route source: `backend/src/routes/doctor.routes.js`

Controller/function: Route-bound handler export in doctor.routes.js.

Middleware: Declared in backend/src/routes/doctor.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /doctors/search.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/doctor.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-056 — GET /api/earnings/history

Module: earnings-history.routes.js

Route source: `backend/src/routes/earnings-history.routes.js`

Controller/function: Route-bound handler export in earnings-history.routes.js.

Middleware: Declared in backend/src/routes/earnings-history.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /api/earnings/history.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/earnings-history.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-057 — GET /earnings/doctor/:doctorId

Module: earnings.routes.js

Route source: `backend/src/routes/earnings.routes.js`

Controller/function: Route-bound handler export in earnings.routes.js.

Middleware: Declared in backend/src/routes/earnings.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :doctorId

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /earnings/doctor/:doctorId.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/earnings.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-058 — POST /api/emr

Module: emr.routes.js

Route source: `backend/src/routes/emr.routes.js`

Controller/function: Route-bound handler export in emr.routes.js.

Middleware: Declared in backend/src/routes/emr.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to POST /api/emr.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/emr.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-059 — DELETE /api/emr/:id

Module: emr.routes.js

Route source: `backend/src/routes/emr.routes.js`

Controller/function: Route-bound handler export in emr.routes.js.

Middleware: Declared in backend/src/routes/emr.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to DELETE /api/emr/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/emr.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-060 — GET /api/emr/:id

Module: emr.routes.js

Route source: `backend/src/routes/emr.routes.js`

Controller/function: Route-bound handler export in emr.routes.js.

Middleware: Declared in backend/src/routes/emr.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /api/emr/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/emr.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-061 — PUT /api/emr/:id

Module: emr.routes.js

Route source: `backend/src/routes/emr.routes.js`

Controller/function: Route-bound handler export in emr.routes.js.

Middleware: Declared in backend/src/routes/emr.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to PUT /api/emr/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/emr.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-062 — GET /api/emr/patient/:patient_id

Module: emr.routes.js

Route source: `backend/src/routes/emr.routes.js`

Controller/function: Route-bound handler export in emr.routes.js.

Middleware: Declared in backend/src/routes/emr.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :patient_id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /api/emr/patient/:patient_id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/emr.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-063 — GET /holoramind/chats

Module: holoraMind.routes.js

Route source: `backend/src/routes/holoraMind.routes.js`

Controller/function: Route-bound handler export in holoraMind.routes.js.

Middleware: Declared in backend/src/routes/holoraMind.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /holoramind/chats.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/holoraMind.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-064 — GET /holoramind/chats/:chatId/messages

Module: holoraMind.routes.js

Route source: `backend/src/routes/holoraMind.routes.js`

Controller/function: Route-bound handler export in holoraMind.routes.js.

Middleware: Declared in backend/src/routes/holoraMind.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :chatId

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /holoramind/chats/:chatId/messages.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/holoraMind.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-065 — POST /holoramind/send

Module: holoraMind.routes.js

Route source: `backend/src/routes/holoraMind.routes.js`

Controller/function: Route-bound handler export in holoraMind.routes.js.

Middleware: Declared in backend/src/routes/holoraMind.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to POST /holoramind/send.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/holoraMind.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-066 — GET /notifications

Module: notification.routes.js

Route source: `backend/src/routes/notification.routes.js`

Controller/function: Route-bound handler export in notification.routes.js.

Middleware: Declared in backend/src/routes/notification.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: notification (legacy column compatibility applies)

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /notifications.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: RUNTIME_SCHEMA_MISMATCH
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/notification.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-067 — PATCH /notifications/:id/read

Module: notification.routes.js

Route source: `backend/src/routes/notification.routes.js`

Controller/function: Route-bound handler export in notification.routes.js.

Middleware: Declared in backend/src/routes/notification.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: notification (legacy column compatibility applies)

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to PATCH /notifications/:id/read.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: RUNTIME_SCHEMA_MISMATCH
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/notification.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-068 — PATCH /notifications/read-all

Module: notification.routes.js

Route source: `backend/src/routes/notification.routes.js`

Controller/function: Route-bound handler export in notification.routes.js.

Middleware: Declared in backend/src/routes/notification.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: notification (legacy column compatibility applies)

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to PATCH /notifications/read-all.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: RUNTIME_SCHEMA_MISMATCH
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/notification.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-069 — GET /patients

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /patients.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-070 — POST /patients

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to POST /patients.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-071 — DELETE /patients/:id

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to DELETE /patients/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-072 — GET /patients/:id

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /patients/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-073 — PUT /patients/:id

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: :id

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to PUT /patients/:id.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-074 — GET /patients/me

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: NONE

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to GET /patients/me.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-075 — PUT /patients/me

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless this route is declared before router authentication.

Authorization: Route/controller policy is preserved; no inferred access rule is added.

Path Params: NONE

Query Params: NONE unless controller consumes endpoint filters/defaults.

Request Body: JSON or multipart payload consumed by controller.

Validation: Legacy controller validation, coercion and error behavior.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: module tables/joins used by route-bound controller

Database Writes: Controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve partial-write semantics.

Side Effects: Controller audit/notification/file behavior where invoked.

External Integration: NONE unless route-bound controller invokes module integration.

Frontend Consumer: Frontend service/component mapped to PUT /patients/me.

Frontend Usage: Uses this endpoint's legacy response envelope and fields.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response, authorization and runtime behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-076 — GET /patients/me/branches

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /patients/me/branches.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-077 — GET /patients/me/doctors

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /patients/me/doctors.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-078 — GET /patients/me/stats

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /patients/me/stats.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-079 — GET /patients/my-branches

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /patients/my-branches.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-080 — GET /patients/next-code

Module: patient.routes.js

Route source: `backend/src/routes/patient.routes.js`

Controller/function: Route-bound handler export in patient.routes.js.

Middleware: Declared in backend/src/routes/patient.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /patients/next-code.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/patient.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-081 — POST /api/payments/appointments/:id/pay

Module: payment.routes.js

Route source: `backend/src/routes/payment.routes.js`

Controller/function: Route-bound handler export in payment.routes.js.

Middleware: Declared in backend/src/routes/payment.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /api/payments/appointments/:id/pay.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/payment.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-082 — GET /api/payments/appointments/:id/payment-status

Module: payment.routes.js

Route source: `backend/src/routes/payment.routes.js`

Controller/function: Route-bound handler export in payment.routes.js.

Middleware: Declared in backend/src/routes/payment.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /api/payments/appointments/:id/payment-status.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/payment.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-083 — GET /permissions

Module: permission.routes.js

Route source: `backend/src/routes/permission.routes.js`

Controller/function: Route-bound handler export in permission.routes.js.

Middleware: Declared in backend/src/routes/permission.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /permissions.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/permission.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-084 — POST /permissions

Module: permission.routes.js

Route source: `backend/src/routes/permission.routes.js`

Controller/function: Route-bound handler export in permission.routes.js.

Middleware: Declared in backend/src/routes/permission.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /permissions.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/permission.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-085 — DELETE /permissions/:id

Module: permission.routes.js

Route source: `backend/src/routes/permission.routes.js`

Controller/function: Route-bound handler export in permission.routes.js.

Middleware: Declared in backend/src/routes/permission.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to DELETE /permissions/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/permission.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-086 — GET /permissions/:id

Module: permission.routes.js

Route source: `backend/src/routes/permission.routes.js`

Controller/function: Route-bound handler export in permission.routes.js.

Middleware: Declared in backend/src/routes/permission.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /permissions/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/permission.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-087 — PUT /permissions/:id

Module: permission.routes.js

Route source: `backend/src/routes/permission.routes.js`

Controller/function: Route-bound handler export in permission.routes.js.

Middleware: Declared in backend/src/routes/permission.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to PUT /permissions/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/permission.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-088 — GET /permissions/modules/list

Module: permission.routes.js

Route source: `backend/src/routes/permission.routes.js`

Controller/function: Route-bound handler export in permission.routes.js.

Middleware: Declared in backend/src/routes/permission.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /permissions/modules/list.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/permission.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-089 — POST /prescriptions

Module: prescription.routes.js

Route source: `backend/src/routes/prescription.routes.js`

Controller/function: Route-bound handler export in prescription.routes.js.

Middleware: Declared in backend/src/routes/prescription.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: prescription, prescription_item, consultation/appointment/patient/doctor joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /prescriptions.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Prescription creation/items lifecycle is multi-write and partial writes are possible.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/prescription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-090 — GET /prescriptions/:id

Module: prescription.routes.js

Route source: `backend/src/routes/prescription.routes.js`

Controller/function: Route-bound handler export in prescription.routes.js.

Middleware: Declared in backend/src/routes/prescription.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: prescription, prescription_item, consultation/appointment/patient/doctor joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /prescriptions/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Prescription creation/items lifecycle is multi-write and partial writes are possible.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/prescription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-091 — PUT /prescriptions/:id

Module: prescription.routes.js

Route source: `backend/src/routes/prescription.routes.js`

Controller/function: Route-bound handler export in prescription.routes.js.

Middleware: Declared in backend/src/routes/prescription.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: prescription, prescription_item, consultation/appointment/patient/doctor joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to PUT /prescriptions/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Prescription creation/items lifecycle is multi-write and partial writes are possible.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/prescription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-092 — POST /prescriptions/:id/cancel

Module: prescription.routes.js

Route source: `backend/src/routes/prescription.routes.js`

Controller/function: Route-bound handler export in prescription.routes.js.

Middleware: Declared in backend/src/routes/prescription.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: prescription, prescription_item, consultation/appointment/patient/doctor joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /prescriptions/:id/cancel.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Prescription creation/items lifecycle is multi-write and partial writes are possible.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/prescription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-093 — POST /prescriptions/:id/issue

Module: prescription.routes.js

Route source: `backend/src/routes/prescription.routes.js`

Controller/function: Route-bound handler export in prescription.routes.js.

Middleware: Declared in backend/src/routes/prescription.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: prescription, prescription_item, consultation/appointment/patient/doctor joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /prescriptions/:id/issue.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Prescription creation/items lifecycle is multi-write and partial writes are possible.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/prescription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-094 — GET /prescriptions/appointment/:appointmentId

Module: prescription.routes.js

Route source: `backend/src/routes/prescription.routes.js`

Controller/function: Route-bound handler export in prescription.routes.js.

Middleware: Declared in backend/src/routes/prescription.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :appointmentId

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: prescription, prescription_item, consultation/appointment/patient/doctor joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /prescriptions/appointment/:appointmentId.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Prescription creation/items lifecycle is multi-write and partial writes are possible.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/prescription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-095 — GET /prescriptions/consultation/:consultationId

Module: prescription.routes.js

Route source: `backend/src/routes/prescription.routes.js`

Controller/function: Route-bound handler export in prescription.routes.js.

Middleware: Declared in backend/src/routes/prescription.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :consultationId

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: prescription, prescription_item, consultation/appointment/patient/doctor joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /prescriptions/consultation/:consultationId.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Prescription creation/items lifecycle is multi-write and partial writes are possible.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/prescription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-096 — GET /prescriptions/doctor/me

Module: prescription.routes.js

Route source: `backend/src/routes/prescription.routes.js`

Controller/function: Route-bound handler export in prescription.routes.js.

Middleware: Declared in backend/src/routes/prescription.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: prescription, prescription_item, consultation/appointment/patient/doctor joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /prescriptions/doctor/me.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Prescription creation/items lifecycle is multi-write and partial writes are possible.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/prescription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-097 — GET /prescriptions/patient/me

Module: prescription.routes.js

Route source: `backend/src/routes/prescription.routes.js`

Controller/function: Route-bound handler export in prescription.routes.js.

Middleware: Declared in backend/src/routes/prescription.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: prescription, prescription_item, consultation/appointment/patient/doctor joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /prescriptions/patient/me.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Prescription creation/items lifecycle is multi-write and partial writes are possible.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/prescription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-098 — POST /api/recurring-appointments/:recurring_id/cancel-all

Module: recurringAppointment.child.routes.js

Route source: `backend/src/routes/recurringAppointment.child.routes.js`

Controller/function: Route-bound handler export in recurringAppointment.child.routes.js.

Middleware: Declared in backend/src/routes/recurringAppointment.child.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :recurring_id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /api/recurring-appointments/:recurring_id/cancel-all.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/recurringAppointment.child.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-099 — GET /api/recurring-appointments/:recurring_id/children

Module: recurringAppointment.child.routes.js

Route source: `backend/src/routes/recurringAppointment.child.routes.js`

Controller/function: Route-bound handler export in recurringAppointment.child.routes.js.

Middleware: Declared in backend/src/routes/recurringAppointment.child.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :recurring_id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /api/recurring-appointments/:recurring_id/children.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/recurringAppointment.child.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-100 — POST /api/recurring-appointments/children/:id/cancel

Module: recurringAppointment.child.routes.js

Route source: `backend/src/routes/recurringAppointment.child.routes.js`

Controller/function: Route-bound handler export in recurringAppointment.child.routes.js.

Middleware: Declared in backend/src/routes/recurringAppointment.child.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /api/recurring-appointments/children/:id/cancel.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/recurringAppointment.child.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-101 — POST /api/recurring-appointments

Module: recurringAppointment.routes.js

Route source: `backend/src/routes/recurringAppointment.routes.js`

Controller/function: Route-bound handler export in recurringAppointment.routes.js.

Middleware: Declared in backend/src/routes/recurringAppointment.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /api/recurring-appointments.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/recurringAppointment.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-102 — DELETE /api/recurring-appointments/:id

Module: recurringAppointment.routes.js

Route source: `backend/src/routes/recurringAppointment.routes.js`

Controller/function: Route-bound handler export in recurringAppointment.routes.js.

Middleware: Declared in backend/src/routes/recurringAppointment.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to DELETE /api/recurring-appointments/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/recurringAppointment.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-103 — GET /api/recurring-appointments/:id

Module: recurringAppointment.routes.js

Route source: `backend/src/routes/recurringAppointment.routes.js`

Controller/function: Route-bound handler export in recurringAppointment.routes.js.

Middleware: Declared in backend/src/routes/recurringAppointment.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /api/recurring-appointments/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/recurringAppointment.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-104 — PUT /api/recurring-appointments/:id

Module: recurringAppointment.routes.js

Route source: `backend/src/routes/recurringAppointment.routes.js`

Controller/function: Route-bound handler export in recurringAppointment.routes.js.

Middleware: Declared in backend/src/routes/recurringAppointment.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to PUT /api/recurring-appointments/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/recurringAppointment.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-105 — GET /api/recurring-appointments/doctor/:doctor_id

Module: recurringAppointment.routes.js

Route source: `backend/src/routes/recurringAppointment.routes.js`

Controller/function: Route-bound handler export in recurringAppointment.routes.js.

Middleware: Declared in backend/src/routes/recurringAppointment.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :doctor_id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /api/recurring-appointments/doctor/:doctor_id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/recurringAppointment.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-106 — GET /api/recurring-appointments/patient/:patient_id

Module: recurringAppointment.routes.js

Route source: `backend/src/routes/recurringAppointment.routes.js`

Controller/function: Route-bound handler export in recurringAppointment.routes.js.

Middleware: Declared in backend/src/routes/recurringAppointment.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :patient_id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: Module tables and joins used by the route-bound controller.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /api/recurring-appointments/patient/:patient_id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/recurringAppointment.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-107 — POST /reviews

Module: review.routes.js

Route source: `backend/src/routes/review.routes.js`

Controller/function: Route-bound handler export in review.routes.js.

Middleware: Declared in backend/src/routes/review.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: review with appointment/doctor/patient joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /reviews.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Public list/summary route ordering precedes router authentication; mutations retain legacy ownership/moderation policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/review.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-108 — DELETE /reviews/:id

Module: review.routes.js

Route source: `backend/src/routes/review.routes.js`

Controller/function: Route-bound handler export in review.routes.js.

Middleware: Declared in backend/src/routes/review.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: review with appointment/doctor/patient joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to DELETE /reviews/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Public list/summary route ordering precedes router authentication; mutations retain legacy ownership/moderation policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/review.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-109 — PUT /reviews/:id

Module: review.routes.js

Route source: `backend/src/routes/review.routes.js`

Controller/function: Route-bound handler export in review.routes.js.

Middleware: Declared in backend/src/routes/review.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: review with appointment/doctor/patient joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to PUT /reviews/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Public list/summary route ordering precedes router authentication; mutations retain legacy ownership/moderation policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/review.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-110 — PATCH /reviews/:id/moderate

Module: review.routes.js

Route source: `backend/src/routes/review.routes.js`

Controller/function: Route-bound handler export in review.routes.js.

Middleware: Declared in backend/src/routes/review.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: review with appointment/doctor/patient joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to PATCH /reviews/:id/moderate.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Public list/summary route ordering precedes router authentication; mutations retain legacy ownership/moderation policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/review.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-111 — GET /reviews/admin

Module: review.routes.js

Route source: `backend/src/routes/review.routes.js`

Controller/function: Route-bound handler export in review.routes.js.

Middleware: Declared in backend/src/routes/review.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: review with appointment/doctor/patient joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /reviews/admin.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Public list/summary route ordering precedes router authentication; mutations retain legacy ownership/moderation policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/review.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-112 — GET /reviews/check

Module: review.routes.js

Route source: `backend/src/routes/review.routes.js`

Controller/function: Route-bound handler export in review.routes.js.

Middleware: Declared in backend/src/routes/review.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: review with appointment/doctor/patient joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /reviews/check.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Public list/summary route ordering precedes router authentication; mutations retain legacy ownership/moderation policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/review.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-113 — GET /reviews/doctor/:doctorId

Module: review.routes.js

Route source: `backend/src/routes/review.routes.js`

Controller/function: Route-bound handler export in review.routes.js.

Middleware: Declared in backend/src/routes/review.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :doctorId

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: review with appointment/doctor/patient joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /reviews/doctor/:doctorId.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Public list/summary route ordering precedes router authentication; mutations retain legacy ownership/moderation policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/review.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-114 — GET /reviews/doctor/:doctorId/summary

Module: review.routes.js

Route source: `backend/src/routes/review.routes.js`

Controller/function: Route-bound handler export in review.routes.js.

Middleware: Declared in backend/src/routes/review.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :doctorId

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: review with appointment/doctor/patient joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /reviews/doctor/:doctorId/summary.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Public list/summary route ordering precedes router authentication; mutations retain legacy ownership/moderation policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/review.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-115 — GET /reviews/me

Module: review.routes.js

Route source: `backend/src/routes/review.routes.js`

Controller/function: Route-bound handler export in review.routes.js.

Middleware: Declared in backend/src/routes/review.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: review with appointment/doctor/patient joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /reviews/me.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Public list/summary route ordering precedes router authentication; mutations retain legacy ownership/moderation policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/review.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-116 — GET /reviews/received

Module: review.routes.js

Route source: `backend/src/routes/review.routes.js`

Controller/function: Route-bound handler export in review.routes.js.

Middleware: Declared in backend/src/routes/review.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: review with appointment/doctor/patient joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /reviews/received.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Public list/summary route ordering precedes router authentication; mutations retain legacy ownership/moderation policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/review.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-117 — GET /roles

Module: role.routes.js

Route source: `backend/src/routes/role.routes.js`

Controller/function: Route-bound handler export in role.routes.js.

Middleware: Declared in backend/src/routes/role.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /roles.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/role.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-118 — POST /roles

Module: role.routes.js

Route source: `backend/src/routes/role.routes.js`

Controller/function: Route-bound handler export in role.routes.js.

Middleware: Declared in backend/src/routes/role.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /roles.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/role.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-119 — DELETE /roles/:id

Module: role.routes.js

Route source: `backend/src/routes/role.routes.js`

Controller/function: Route-bound handler export in role.routes.js.

Middleware: Declared in backend/src/routes/role.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to DELETE /roles/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/role.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-120 — GET /roles/:id

Module: role.routes.js

Route source: `backend/src/routes/role.routes.js`

Controller/function: Route-bound handler export in role.routes.js.

Middleware: Declared in backend/src/routes/role.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /roles/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/role.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-121 — PUT /roles/:id

Module: role.routes.js

Route source: `backend/src/routes/role.routes.js`

Controller/function: Route-bound handler export in role.routes.js.

Middleware: Declared in backend/src/routes/role.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to PUT /roles/:id.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/role.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-122 — GET /roles/:id/permissions

Module: role.routes.js

Route source: `backend/src/routes/role.routes.js`

Controller/function: Route-bound handler export in role.routes.js.

Middleware: Declared in backend/src/routes/role.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: :id

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /roles/:id/permissions.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/role.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-123 — POST /roles/permissions/assign

Module: role.routes.js

Route source: `backend/src/routes/role.routes.js`

Controller/function: Route-bound handler export in role.routes.js.

Middleware: Declared in backend/src/routes/role.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /roles/permissions/assign.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/role.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-124 — POST /roles/permissions/remove

Module: role.routes.js

Route source: `backend/src/routes/role.routes.js`

Controller/function: Route-bound handler export in role.routes.js.

Middleware: Declared in backend/src/routes/role.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed and validated by controller.

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: permission, role and role_permission data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE behavior where applicable.

Side Effects: Audit, notification, generated-child or file behavior where invoked by controller.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /roles/permissions/remove.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Authorization is inherited admin/super_admin app mount policy.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/role.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-125 — GET /schedules

Module: schedule.routes.js

Route source: `backend/src/routes/schedule.routes.js`

Controller/function: Route-bound handler export in schedule.routes.js.

Middleware: Declared in backend/src/routes/schedule.routes.js and app mount.

Authentication: REQUIRED unless route declaration precedes router authentication.

Authorization: Legacy route/controller policy preserved; inherited admin/role/ownership policy applies where declared.

Path Params: NONE

Query Params: Endpoint-specific filters, pagination and defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve controller required/optional fields, coercion, lifecycle and error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape, including pagination/meta where returned.

Error Responses: Legacy controller status/message/envelope; no normalization.

Database Reads: doctor_schedule and doctor/branch joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /schedules.

Frontend Usage: Uses legacy response fields, statuses and endpoint path. Schedule collection mutations may partially complete; preserve legacy behavior.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Preserve legacy response envelope, authorization and client-observed behavior.

Evidence: backend/src/routes/schedule.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-126 — POST /schedules

Module: schedule.routes.js

Route source: `backend/src/routes/schedule.routes.js`

Controller/function: Route-bound handler export in schedule.routes.js.

Middleware: Declared in backend/src/routes/schedule.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: Module tables and joins used by route-bound controller.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /schedules.

Frontend Usage: Uses legacy envelope, statuses and fields. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/schedule.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-127 — DELETE /schedules/:id

Module: schedule.routes.js

Route source: `backend/src/routes/schedule.routes.js`

Controller/function: Route-bound handler export in schedule.routes.js.

Middleware: Declared in backend/src/routes/schedule.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: Module tables and joins used by route-bound controller.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to DELETE /schedules/:id.

Frontend Usage: Uses legacy envelope, statuses and fields. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/schedule.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-128 — PUT /schedules/:id

Module: schedule.routes.js

Route source: `backend/src/routes/schedule.routes.js`

Controller/function: Route-bound handler export in schedule.routes.js.

Middleware: Declared in backend/src/routes/schedule.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: Module tables and joins used by route-bound controller.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to PUT /schedules/:id.

Frontend Usage: Uses legacy envelope, statuses and fields. 

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/schedule.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-129 — GET /specialties

Module: specialty.routes.js

Route source: `backend/src/routes/specialty.routes.js`

Controller/function: Route-bound handler export in specialty.routes.js.

Middleware: Declared in backend/src/routes/specialty.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: specialty and doctor hierarchy data.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /specialties.

Frontend Usage: Uses legacy envelope, statuses and fields. Specialty hierarchy/reassign-delete is multi-step non-transactional.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/specialty.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-130 — POST /specialties

Module: specialty.routes.js

Route source: `backend/src/routes/specialty.routes.js`

Controller/function: Route-bound handler export in specialty.routes.js.

Middleware: Declared in backend/src/routes/specialty.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: specialty and doctor hierarchy data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /specialties.

Frontend Usage: Uses legacy envelope, statuses and fields. Specialty hierarchy/reassign-delete is multi-step non-transactional.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/specialty.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-131 — DELETE /specialties/:id

Module: specialty.routes.js

Route source: `backend/src/routes/specialty.routes.js`

Controller/function: Route-bound handler export in specialty.routes.js.

Middleware: Declared in backend/src/routes/specialty.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: specialty and doctor hierarchy data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to DELETE /specialties/:id.

Frontend Usage: Uses legacy envelope, statuses and fields. Specialty hierarchy/reassign-delete is multi-step non-transactional.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/specialty.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-132 — GET /specialties/:id

Module: specialty.routes.js

Route source: `backend/src/routes/specialty.routes.js`

Controller/function: Route-bound handler export in specialty.routes.js.

Middleware: Declared in backend/src/routes/specialty.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: specialty and doctor hierarchy data.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /specialties/:id.

Frontend Usage: Uses legacy envelope, statuses and fields. Specialty hierarchy/reassign-delete is multi-step non-transactional.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/specialty.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-133 — PUT /specialties/:id

Module: specialty.routes.js

Route source: `backend/src/routes/specialty.routes.js`

Controller/function: Route-bound handler export in specialty.routes.js.

Middleware: Declared in backend/src/routes/specialty.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: specialty and doctor hierarchy data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to PUT /specialties/:id.

Frontend Usage: Uses legacy envelope, statuses and fields. Specialty hierarchy/reassign-delete is multi-step non-transactional.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/specialty.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-134 — PATCH /specialties/:id/parent

Module: specialty.routes.js

Route source: `backend/src/routes/specialty.routes.js`

Controller/function: Route-bound handler export in specialty.routes.js.

Middleware: Declared in backend/src/routes/specialty.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: specialty and doctor hierarchy data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to PATCH /specialties/:id/parent.

Frontend Usage: Uses legacy envelope, statuses and fields. Specialty hierarchy/reassign-delete is multi-step non-transactional.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/specialty.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-135 — POST /specialties/:id/reassign-delete

Module: specialty.routes.js

Route source: `backend/src/routes/specialty.routes.js`

Controller/function: Route-bound handler export in specialty.routes.js.

Middleware: Declared in backend/src/routes/specialty.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: specialty and doctor hierarchy data.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /specialties/:id/reassign-delete.

Frontend Usage: Uses legacy envelope, statuses and fields. Specialty hierarchy/reassign-delete is multi-step non-transactional.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/specialty.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-136 — POST /subscriptions/activate

Module: subscription.routes.js

Route source: `backend/src/routes/subscription.routes.js`

Controller/function: Route-bound handler export in subscription.routes.js.

Middleware: Declared in backend/src/routes/subscription.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: subscription_plan, entitlement, provider_subscription, payment_order.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: Simulated payment-order flow; no gateway/webhook.

Frontend Consumer: Frontend service/component mapped to POST /subscriptions/activate.

Frontend Usage: Uses legacy envelope, statuses and fields. Payment-order confirmation is simulated; status envelope is client contract.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/subscription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-137 — POST /subscriptions/confirm-payment

Module: subscription.routes.js

Route source: `backend/src/routes/subscription.routes.js`

Controller/function: Route-bound handler export in subscription.routes.js.

Middleware: Declared in backend/src/routes/subscription.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: subscription_plan, entitlement, provider_subscription, payment_order.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: Simulated payment-order flow; no gateway/webhook.

Frontend Consumer: Frontend service/component mapped to POST /subscriptions/confirm-payment.

Frontend Usage: Uses legacy envelope, statuses and fields. Payment-order confirmation is simulated; status envelope is client contract.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/subscription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-138 — POST /subscriptions/create-payment

Module: subscription.routes.js

Route source: `backend/src/routes/subscription.routes.js`

Controller/function: Route-bound handler export in subscription.routes.js.

Middleware: Declared in backend/src/routes/subscription.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: subscription_plan, entitlement, provider_subscription, payment_order.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: Simulated payment-order flow; no gateway/webhook.

Frontend Consumer: Frontend service/component mapped to POST /subscriptions/create-payment.

Frontend Usage: Uses legacy envelope, statuses and fields. Payment-order confirmation is simulated; status envelope is client contract.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/subscription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-139 — GET /subscriptions/me

Module: subscription.routes.js

Route source: `backend/src/routes/subscription.routes.js`

Controller/function: Route-bound handler export in subscription.routes.js.

Middleware: Declared in backend/src/routes/subscription.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: subscription_plan, entitlement, provider_subscription, payment_order.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: Simulated payment-order flow; no gateway/webhook.

Frontend Consumer: Frontend service/component mapped to GET /subscriptions/me.

Frontend Usage: Uses legacy envelope, statuses and fields. Payment-order confirmation is simulated; status envelope is client contract.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/subscription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-140 — GET /subscriptions/payment-history

Module: subscription.routes.js

Route source: `backend/src/routes/subscription.routes.js`

Controller/function: Route-bound handler export in subscription.routes.js.

Middleware: Declared in backend/src/routes/subscription.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: subscription_plan, entitlement, provider_subscription, payment_order.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: Simulated payment-order flow; no gateway/webhook.

Frontend Consumer: Frontend service/component mapped to GET /subscriptions/payment-history.

Frontend Usage: Uses legacy envelope, statuses and fields. Payment-order confirmation is simulated; status envelope is client contract.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/subscription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-141 — GET /subscriptions/plans

Module: subscription.routes.js

Route source: `backend/src/routes/subscription.routes.js`

Controller/function: Route-bound handler export in subscription.routes.js.

Middleware: Declared in backend/src/routes/subscription.routes.js and app mount.

Authentication: NOT_REQUIRED — public route.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: subscription_plan, entitlement, provider_subscription, payment_order.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: Simulated payment-order flow; no gateway/webhook.

Frontend Consumer: Frontend service/component mapped to GET /subscriptions/plans.

Frontend Usage: Uses legacy envelope, statuses and fields. Payment-order confirmation is simulated; status envelope is client contract.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/subscription.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-142 — POST /upload

Module: upload.routes.js

Route source: `backend/src/routes/upload.routes.js`

Controller/function: Route-bound handler export in upload.routes.js.

Middleware: Declared in backend/src/routes/upload.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: NONE

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /upload.

Frontend Usage: Uses legacy envelope, statuses and fields. Multipart attachments max 5; local disk storage returns public URL metadata.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/upload.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-143 — GET /users

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /users.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-144 — POST /users

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /users.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-145 — DELETE /users/:id

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to DELETE /users/:id.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-146 — GET /users/:id

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /users/:id.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-147 — PUT /users/:id

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to PUT /users/:id.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-148 — POST /users/:id/force-logout

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /users/:id/force-logout.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-149 — GET /users/:id/login-history

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /users/:id/login-history.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-150 — GET /users/:id/sessions

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /users/:id/sessions.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-151 — DELETE /users/:id/sessions/:sessionId

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :id, :sessionId

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to DELETE /users/:id/sessions/:sessionId.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-152 — GET /users/:user_id/available-roles

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :user_id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /users/:user_id/available-roles.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-153 — GET /users/:user_id/roles

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: :user_id

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: NONE

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: NONE

Transaction: NO — READ_ONLY

Side Effects: NONE_OBSERVED

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to GET /users/:user_id/roles.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-154 — POST /users/assign-role

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /users/assign-role.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES

### API-155 — POST /users/remove-role

Module: user.routes.js

Route source: `backend/src/routes/user.routes.js`

Controller/function: Route-bound handler export in user.routes.js.

Middleware: Declared in backend/src/routes/user.routes.js and app mount.

Authentication: REQUIRED — inherited route/app authentication.

Authorization: Legacy route/controller ownership, entitlement and inherited admin/super_admin policy preserved.

Path Params: NONE

Query Params: Endpoint-specific filters/defaults consumed by controller; NONE when absent.

Request Body: JSON or multipart payload consumed by controller.

Validation: Preserve legacy required/optional fields, coercion and lifecycle error branches.

Success Status: Legacy handler status.

Success Response: Legacy endpoint-specific JSON envelope/data shape.

Error Responses: Legacy status/message/envelope; no normalization.

Database Reads: users, user_role, role, refresh_tokens and audit/session joins.

Database Writes: Legacy controller mutation(s) for this endpoint.

Transaction: NO explicit transaction observed; preserve MULTI_WRITE_NON_TRANSACTIONAL/PARTIAL_WRITE_POSSIBLE semantics.

Side Effects: FIRE_AND_FORGET audit and controller side effects where invoked.

External Integration: NONE_OBSERVED

Frontend Consumer: Frontend service/component mapped to POST /users/remove-role.

Frontend Usage: Uses legacy envelope, statuses and fields. Admin/super_admin inherited authorization; role/session mutations audit fire-and-forget.

Compatibility: API_COMPATIBILITY_CRITICAL
Reason: Legacy response, authorization and client-observed behavior must be preserved.

Evidence: backend/src/routes/user.routes.js; backend controller module; historical controller-level enrichment; frontend service mapping; database contract.

NEED_VERIFY: NONE

TRACE_COMPLETE: YES
