# Authentication and authorization contract

## Login

- `POST /auth/login` accepts `{ email, password }`. Missing credentials have no explicit pre-query validation; unknown/wrong credentials return `401 { message: "Invalid email or password" }`, inactive accounts return `403 { message: "Account is not active" }`.
- Login signs HS256 JWT with `JWT_SECRET`, 15-minute expiry, and claims `{ id, email, username, role, roles }`.
- Client stores `token`, `refreshToken`, and `user` in localStorage. Axios sends the token as bearer and retries once after `401/TOKEN_EXPIRED` by posting `{ refreshToken }` to `/auth/refresh`.
- Success response is `{ message: "Login successful", token, refreshToken, user: { id, full_name, username, email, auth_provider, status, role, roles } }`.

## Register and Google login

- `POST /auth/register` requires `full_name`, `username`, `email`, `password`; returns `400` if missing, `409` on active duplicate email/username, and **does not return access/refresh tokens**. Success is `201 { message, user_id, role, account_type }`.
- `account_type=provider` assigns `clinic_owner`; any other value becomes `patient`. Patient registration creates a patient profile; provider HOLORA_FREE assignment is fire-and-forget.
- `POST /auth/google` requires body field `credential`. It validates the Google ID token against `GOOGLE_CLIENT_ID`, requires verified email, and creates a local user, patient role and patient profile for a new account. Its successful response is the login token payload.

## Refresh token, logout and password flows

- Refresh tokens are `randomBytes(40)` hex values, SHA-256 hashed in `refresh_tokens`, valid seven days. Rotation revokes the old token and records `replaced_by_hash`.
- Reuse of a revoked refresh token revokes all active tokens for that user. Logout revokes supplied refresh token; logout-all requires bearer auth.
- Missing refresh token returns `400 { message: "Refresh token is required" }`; invalid, expired and reuse cases return `401`; inactive user returns `403`. Refresh success returns `{ token, refreshToken, user }` (the refreshed `user` omits `auth_provider`).
- `POST /auth/logout` is public but requires `{ refreshToken }`; it revokes matching active token and returns `{ message: "Logged out successfully" }`. `logout-all` revokes all active refresh tokens for authenticated user.
- Passwords are bcrypt hashes with cost `10`. Google-auth accounts cannot use local password change.
- Password reset current behavior: a 32-byte random **plaintext** token is stored in `users.reset_password_token`, expires after one hour in `reset_password_expires`, and the reset URL is written to console. It does **not** send SMTP email. Reset/change-password require a new password of at least six characters.

## Middleware error contract and authorization

`authenticateToken` only verifies HS256 JWT and sets `req.user`. Missing access token is `401 { message: "Access token is required" }`; expired token is `401 { message: "Token expired", code: "TOKEN_EXPIRED" }`; invalid token is `403 { message: "Invalid token", code: "INVALID_TOKEN" }`. `authorizeRole` then queries `users -> user_role -> role` by `role.code`; it returns 401 when absent, 403 with allowed/current roles when unauthorized. `provider.middleware` separately resolves provider roles, ownership, entitlement scope and plan limits. Permission records are administrable but there is no observed permission-code enforcement middleware.

## Laravel parity implications

Do not replace this with Sanctum/Passport by default. Implement a compatible custom JWT guard/middleware first, accept only HS256, keep claim names/expiry/error body/status, and retain DB-backed hashed refresh tokens and rotation/reuse behavior. Preserve role-code checks and controller-level ownership checks. Google verification remains against `GOOGLE_CLIENT_ID`.

`NEED_VERIFY`: exact bcrypt cost and every login/register response field should be fixture-captured from Node before implementation.
