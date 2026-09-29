# 05 - API inventory

Ghi chú auth: Public là không có `authenticateToken` ở route mount. Auth là cần token. Admin là route/mount admin/super_admin. Owner là scope `clinic_owner`. Patient/Doctor là role middleware hoặc controller role check.

## Auth

| Method | Endpoint | Auth | Controller function |
|---|---|---|---|
| POST | `/auth/register` | Public, rate-limited | `register` |
| POST | `/auth/login` | Public, rate-limited | `login` |
| POST | `/auth/google` | Public, rate-limited | `googleAuth` |
| POST | `/auth/doctor-invite/accept` | Public | `acceptDoctorInvite` |
| POST | `/auth/forgot-password` | Public, strict rate-limited | `forgotPassword` |
| POST | `/auth/reset-password` | Public, strict rate-limited | `resetPassword` |
| POST | `/auth/refresh` | Public | `refreshToken` |
| POST | `/auth/logout` | Public, body có refresh token | `logoutUser` |
| POST | `/auth/logout-all` | Auth | `logoutAll` |
| POST | `/auth/change-password` | Auth | `changePassword` |

## Admin RBAC

Các route `/users`, `/roles`, `/permissions` được mount với auth+admin.

| Method | Endpoint | Auth | Controller |
|---|---|---|---|
| GET/POST | `/users`, `/roles`, `/permissions` | Admin | list/create |
| GET/PUT/DELETE | `/users/:id`, `/roles/:id`, `/permissions/:id` | Admin | read/update/delete |
| GET | `/users/:id/sessions`, `/users/:id/login-history` | Admin | session/history |
| POST | `/users/assign-role`, `/users/remove-role`, `/users/:id/force-logout` | Admin | role/session actions |
| DELETE | `/users/:id/sessions/:sessionId` | Admin | revoke session |
| GET | `/roles/:id/permissions` | Admin | role permissions |
| POST | `/roles/permissions/assign`, `/roles/permissions/remove` | Admin | RBAC mapping |
| GET | `/permissions/modules/list` | Admin | permission modules |

## Medical domain

| Method | Endpoint | Auth | Controller function |
|---|---|---|---|
| GET | `/patients/me`, `/patients/me/stats`, `/patients/me/doctors`, `/patients/me/branches` | Auth | patient self |
| GET | `/patients/my-branches` | Auth provider | `getPatientsByOwnerBranches` |
| GET/POST | `/patients`, `/patients/next-code` | Admin | patient admin |
| GET/PUT/DELETE | `/patients/:id` | Admin | patient admin |
| GET | `/doctors`, `/doctors/search`, `/doctors/next-code`, `/doctors/:id` | Public | doctor directory |
| GET/PUT | `/doctors/me` | Auth | doctor self |
| GET | `/doctors/me/patients` | Auth | `getMyPatients` |
| GET | `/doctors/my-branches` | Auth provider | owner doctors |
| POST/PUT/DELETE | `/doctors`, `/doctors/:id` | Admin/Owner theo route định nghĩa | doctor mutation |
| GET/POST/PUT/DELETE | `/branches`, `/branches/:id` | Mixed public/admin/provider | branch controller |
| GET | `/branches/next-code`, `/branches/my` | Public/Auth provider | branch controller |
| GET | `/specialties`, `/specialties/:id` | Public | specialty read |
| POST/PUT/PATCH/DELETE | `/specialties/*` | Admin | specialty mutation |
| GET/POST/PUT/DELETE | `/schedules`, `/schedules/:id` | Auth, write admin/doctor | schedule controller |
| GET | `/appointments/available-slots` | Public | `getAvailableSlots` |
| POST | `/appointments` | Auth patient | `bookAppointment` |
| GET | `/appointments` | Auth | `getMyAppointments` |
| GET | `/appointments/admin/all` | Admin | admin list |
| GET | `/appointments/owner/all` | Owner | owner list |
| GET | `/appointments/:id`, `/appointments/:id/consultation` | Auth | appointment reads |
| PUT | `/appointments/:id/status` | Admin/Doctor/Owner | status update |

## Consultation, AI, Prescription

| Method | Endpoint | Auth | Controller function |
|---|---|---|---|
| POST | `/consultations` | Auth | `createConsultation` |
| GET | `/consultations/doctor-requests` | Auth | `getDoctorConsultations` |
| GET | `/consultations/owner/all` | Owner | `getOwnerConsultations` |
| GET | `/consultations/my-history` | Auth | `getPatientConsultations` |
| GET | `/consultations/:id` | Auth | `getConsultationDetails` |
| POST | `/consultations/:id/responses` | Auth + upload | `addConsultationResponse` |
| PATCH | `/consultations/:id/reopen` | Auth | `reopenConsultation` |
| DELETE | `/consultations/:id/images/:imageId` | Auth | `deleteConsultationImage` |
| POST | `/ai/analyze` | Auth | `requestAnalysis` |
| GET | `/ai/consultation/:consultation_id` | Auth | `getAIAnalysisForConsultation` |
| PATCH | `/ai/review/:requestId` | Auth | `reviewAIResult` |
| POST | `/prescriptions` | Auth | `createPrescription` |
| GET | `/prescriptions/doctor/me`, `/prescriptions/patient/me` | Auth | prescription list |
| GET | `/prescriptions/consultation/:consultationId`, `/prescriptions/appointment/:appointmentId`, `/prescriptions/:id` | Auth | prescription reads |
| PUT | `/prescriptions/:id` | Auth doctor | `updatePrescription` |
| POST | `/prescriptions/:id/issue`, `/prescriptions/:id/cancel` | Auth doctor | status actions |

## Commercial, support, misc

| Method | Endpoint | Auth | Controller function |
|---|---|---|---|
| GET | `/subscriptions/plans` | Public | `getPlans` |
| GET | `/subscriptions/me` | Auth | `getMySubscriptions` |
| POST | `/subscriptions/activate`, `/subscriptions/payments`, `/subscriptions/payments/confirm` | Auth provider/user | subscription mutation |
| GET | `/subscriptions/payments/history` | Auth | payment history |
| POST | `/api/payments/appointments/:id/pay` | Auth patient | mock pay |
| GET | `/api/payments/appointments/:id/payment-status` | Auth | payment status |
| GET/POST/PUT/DELETE | `/reviews/*` | Mixed public/auth/admin | review controller |
| GET/PATCH | `/notifications/*` | Auth | notifications |
| GET/POST | `/holoramind/*` | Auth | chats/messages |
| GET | `/dashboard/stats`, `/dashboard/analytics` | Auth admin/owner/accountant | dashboard |
| GET | `/dashboard/doctor`, `/dashboard/patient` | Auth role | dashboard |
| GET | `/audit-logs`, `/audit-logs/actions`, `/audit-logs/entity-types` | Auth | audit controller |
| GET | `/earnings/doctor/:doctorId`, `/api/earnings/history` | Auth | earnings |
| POST | `/upload` | Auth + multipart | `uploadFiles` |
| GET/POST/PUT/DELETE | `/api/emr/*` | Auth | EMR CRUD |
| GET/POST/PUT/DELETE | `/api/recurring-appointments/*` | Admin | recurring appointment CRUD/children |

Webhook/callback: không thấy route webhook external thật. Comment trong `confirmPayment` nói production gateway callback là future, nhưng hiện tại route là authenticated client-driven.

