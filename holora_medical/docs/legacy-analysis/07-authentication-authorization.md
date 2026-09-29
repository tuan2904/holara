# 07 - Authentication và authorization

## Login trace

```text
POST /auth/login
  -> auth.controller.login
  -> SELECT user by email and deleted_at IS NULL
  -> reject inactive
  -> bcrypt.compare(password, password_hash)
  -> SELECT roles through user_role/role
  -> jwt.sign({ id, email, username, role, roles }, JWT_SECRET, 15m)
  -> INSERT refresh_tokens hashed random token, 7-day expiry
  -> logAudit AUTH_LOGIN
```

Source: `backend/src/controllers/auth.controller.js`.

## Token model

- Access token: JWT HS256, `15m`, decode bởi `authenticateToken`.
- Refresh token: random 40-byte hex, lưu SHA-256 hash trong DB, hết hạn sau 7 ngày.
- Refresh rotation: token cũ bị revoke và link sang token mới qua `replaced_by_hash`.
- Reuse detection: nếu dùng refresh token đã revoked, toàn bộ active tokens của user bị revoke.
- Logout: revoke theo token; logout-all revoke mọi active token của authenticated user.

## Authorization model

- Cơ chế route-level chính: `authorizeRole(...roleCodes)` query `users -> user_role -> role` và so sánh `role.code`.
- JWT cũng lưu một primary `role` và mảng `roles`; nhiều controller dùng trực tiếp `req.user.role`.
- Permission table tồn tại, nhưng chưa thấy enforcement bằng permission-code middleware; permission system chủ yếu là dữ liệu admin-managed.
- Nhiều ownership check nằm rải trong controller: appointment patient/doctor matching, prescription doctor/patient/admin, owner branch joins, patient profile lookup.

## Tóm tắt protected routes

- Admin mount: `/users`, `/roles`, `/permissions`.
- Admin recurring mount: `/api/recurring-appointments`.
- Public reads: doctors directory, specialty reads, branch reads, appointment available slots, subscription plans, public reviews.
- Auth-only modules: consultations, AI, upload, schedules, appointments sau `/available-slots`, prescriptions, notifications, HoloraMind, EMR, audit, earnings.
- Role-specific endpoints: patient booking/payments, doctor schedules/prescriptions, admin dashboards/reviews/specialty mutation, clinic_owner owner reports.

## Unknown quan trọng

- Chưa thấy permission-code middleware dù có permission tables.
- Không có CSRF/session cookie; đây là bearer-token API.
- Password reset hiện log reset link ra console; chưa thấy production email send trong source.

