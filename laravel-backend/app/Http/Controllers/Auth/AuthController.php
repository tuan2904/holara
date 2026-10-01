<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\LegacyAuditService;
use App\Services\Auth\LegacyAuthService;
use App\Services\Auth\LegacyJwtService;
use Google\Client as GoogleClient;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(private readonly LegacyAuthService $auth, private readonly LegacyAuditService $audit) {}

    public function register(Request $request)
    {
        $fullName = $request->input('full_name');
        $username = $request->input('username');
        $email = $request->input('email');
        $password = $request->input('password');
        $phone = $request->input('phone');
        $accountType = $request->input('account_type') === 'provider' ? 'provider' : 'patient';
        $roleCode = $accountType === 'provider' ? 'clinic_owner' : 'patient';

        if (! $fullName || ! $username || ! $email || ! $password) {
            return response()->json(['message' => 'Full name, username, email and password are required.'], 400);
        }

        try {
            if (DB::table('users')->whereNull('deleted_at')->where(fn ($query) => $query->where('email', $email)->orWhere('username', $username))->exists()) {
                return response()->json(['message' => 'Email or username already exists.'], 409);
            }
            $userId = DB::table('users')->insertGetId([
                'full_name' => $fullName, 'username' => $username, 'email' => $email,
                'password_hash' => password_hash((string) $password, PASSWORD_BCRYPT, ['cost' => 10]),
                'phone' => $phone ?: null, 'auth_provider' => 'local', 'status' => 'active',
            ]);
            $role = DB::table('role')->where('code', $roleCode)->where('status', 'active')->first();
            if (! $role) {
                return response()->json(['message' => "{$roleCode} role not found. Please seed role table first."], 500);
            }
            DB::table('user_role')->insert(['user_id' => $userId, 'role_id' => $role->id, 'assigned_at' => now(), 'assigned_by' => null]);

            if ($accountType === 'provider') {
                app()->terminating(function () use ($userId): void {
                    try {
                        $this->auth->ensureFreeProviderSubscription($userId);
                    } catch (\Throwable $exception) {
                        logger()->warning('Auto-assign HOLORA_FREE failed: '.$exception->getMessage());
                    }
                });
                $this->audit->log($request, 'AUTH_REGISTER', 'user', $userId, ['email' => $email, 'role' => 'clinic_owner']);

                return response()->json(['message' => 'Provider register successful. Please login.', 'user_id' => $userId, 'role' => 'clinic_owner', 'account_type' => 'provider'], 201);
            }

            DB::table('patient')->insert([
                'user_id' => $userId, 'patient_code' => 'PAT'.str_pad((string) $userId, 6, '0', STR_PAD_LEFT),
                'full_name' => $fullName, 'phone' => $phone ?: '', 'email' => $email, 'status' => 'active',
            ]);
            $this->audit->log($request, 'AUTH_REGISTER', 'user', $userId, ['email' => $email, 'role' => 'patient']);

            return response()->json(['message' => 'Register successful. Please login.', 'user_id' => $userId, 'role' => 'patient', 'account_type' => 'patient'], 201);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Register failed', 'error' => $exception->getMessage()], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            $user = DB::table('users')->where('email', $request->input('email'))->whereNull('deleted_at')->first();
            if (! $user) {
                $this->audit->log($request, 'AUTH_LOGIN_FAILED', 'user', null, ['email' => $request->input('email'), 'reason' => 'user_not_found']);

                return response()->json(['message' => 'Invalid email or password'], 401);
            }
            if ($user->status !== 'active') {
                $this->audit->log($request, 'AUTH_LOGIN_FAILED', 'user', $user->id, ['email' => $request->input('email'), 'reason' => 'account_inactive']);

                return response()->json(['message' => 'Account is not active'], 403);
            }
            if (! password_verify((string) $request->input('password'), $user->password_hash)) {
                $this->audit->log($request, 'AUTH_LOGIN_FAILED', 'user', $user->id, ['email' => $request->input('email'), 'reason' => 'wrong_password']);

                return response()->json(['message' => 'Invalid email or password'], 401);
            }
            $response = $this->auth->issue($user, $request);
            $this->audit->log($request, 'AUTH_LOGIN', 'user', $user->id, ['email' => $user->email]);

            return response()->json($response);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Login failed', 'error' => $exception->getMessage()], 500);
        }
    }

    public function google(Request $request)
    {
        $credential = $request->input('credential');
        if (! $credential) {
            return response()->json(['message' => 'Google credential is required'], 400);
        }
        $clientId = (string) config('legacy.google_client_id');
        if ($clientId === '') {
            return response()->json(['message' => 'GOOGLE_CLIENT_ID is not configured'], 500);
        }
        try {
            $client = new GoogleClient(['client_id' => $clientId]);
            $payload = $client->verifyIdToken($credential);
            if (! $payload) {
                throw new \RuntimeException('Invalid Google token');
            }
            $email = $payload['email'] ?? null;
            if (! $email || empty($payload['email_verified'])) {
                return response()->json(['message' => 'Google account email is not verified'], 401);
            }
            $user = DB::table('users')->where('email', $email)->whereNull('deleted_at')->first();
            if ($user) {
                if ($user->status !== 'active') {
                    return response()->json(['message' => 'Account is not active'], 403);
                }

                return response()->json($this->auth->issue($user, $request));
            }
            $fullName = $payload['name'] ?? 'Google User';
            $base = substr(preg_replace('/[^a-z0-9_]/', '', strtolower(explode('@', $email)[0])) ?: 'user', 0, 18);
            $username = $base.'_'.substr((string) round(microtime(true) * 1000), -6);
            $userId = DB::table('users')->insertGetId([
                'full_name' => $fullName, 'username' => $username, 'email' => $email,
                'password_hash' => password_hash('google_'.bin2hex(random_bytes(16)), PASSWORD_BCRYPT, ['cost' => 10]),
                'auth_provider' => 'google', 'google_id' => $payload['sub'] ?? null, 'status' => 'active', 'email_verified_at' => now(),
            ]);
            $role = DB::table('role')->where('code', 'patient')->where('status', 'active')->first();
            if (! $role) {
                return response()->json(['message' => 'Google auth failed', 'error' => 'Patient role not found'], 500);
            }
            DB::table('user_role')->insert(['user_id' => $userId, 'role_id' => $role->id, 'assigned_at' => now(), 'assigned_by' => null]);
            DB::table('patient')->insert(['user_id' => $userId, 'patient_code' => 'PAT'.str_pad((string) $userId, 6, '0', STR_PAD_LEFT), 'full_name' => $fullName, 'phone' => '', 'email' => $email, 'status' => 'active']);
            $user = DB::table('users')->where('id', $userId)->first();

            return response()->json($this->auth->issue($user, $request));
        } catch (QueryException $exception) {
            return response()->json(['message' => 'Google auth failed', 'error' => $exception->getMessage()], 500);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Invalid Google token'], 401);
        }
    }

    public function acceptDoctorInvite(Request $request)
    {
        $token = $request->input('token');
        $password = $request->input('password');
        if (! $token || ! $password) {
            return response()->json(['message' => 'token and password are required'], 400);
        }
        if (strlen((string) $password) < 6) {
            return response()->json(['message' => 'Password must be at least 6 characters'], 400);
        }
        try {
            $invite = DB::table('doctor_invite')->where('token_hash', hash('sha256', $token))->first();
            if (! $invite) {
                return response()->json(['message' => 'Invite not found'], 404);
            }
            if ($invite->revoked_at) {
                return response()->json(['message' => 'Invite was revoked'], 410);
            }
            if ($invite->used_at) {
                return response()->json(['message' => 'Invite has already been used'], 410);
            }
            if (strtotime($invite->expires_at) < time()) {
                return response()->json(['message' => 'Invite has expired'], 410);
            }
            DB::table('users')->where('id', $invite->user_id)->update(['password_hash' => password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]), 'updated_at' => now()]);
            DB::table('doctor_invite')->where('id', $invite->id)->update(['used_at' => now(), 'updated_at' => now()]);

            return response()->json(['message' => 'Doctor account is ready. Please login.', 'data' => ['email' => $invite->email, 'doctor_id' => $invite->doctor_id]]);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Failed to accept doctor invite', 'error' => $exception->getMessage()], 500);
        }
    }

    public function forgotPassword(Request $request)
    {
        $email = $request->input('email');
        if (! $email) {
            return response()->json(['message' => 'Vui lòng nhập Email của bạn'], 400);
        }
        try {
            $user = DB::table('users')->where('email', $email)->whereNull('deleted_at')->first();
            if (! $user) {
                return response()->json(['message' => 'Nếu Email hợp lệ, thư khôi phục đã được gửi đi.']);
            }
            $token = bin2hex(random_bytes(32));
            DB::table('users')->where('id', $user->id)->update(['reset_password_token' => hash('sha256', $token), 'reset_password_expires' => now()->addHour(), 'updated_at' => now()]);
            Mail::raw('Reset your password: '.rtrim(config('legacy.frontend_url'), '/').'/reset-password?token='.$token, function ($mail) use ($email) {
                $mail->to($email)->subject('MeDecode password reset');
            });
            $this->audit->log($request, 'AUTH_FORGOT_PASSWORD', 'user', $user->id, ['email' => $email]);

            return response()->json(['message' => 'Thư khôi phục đã được gửi vào Email của bạn!']);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Lỗi Server, không thể gửi yêu cầu', 'error' => $exception->getMessage()], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        $token = $request->input('token');
        $password = $request->input('new_password');
        if (! $token || ! $password) {
            return response()->json(['message' => 'Token và Mật khẩu mới là bắt buộc.'], 400);
        }
        if (strlen((string) $password) < 6) {
            return response()->json(['message' => 'Mật khẩu mới phải có ít nhất 6 ký tự.'], 400);
        }
        try {
            return DB::transaction(function () use ($request, $token, $password) {
                $user = DB::table('users')->where('reset_password_token', hash('sha256', $token))->where('reset_password_expires', '>', now())->lockForUpdate()->first();
                if (! $user) {
                    return response()->json(['message' => 'Yêu cầu khôi phục không hợp lệ hoặc đã hết hạn.'], 400);
                }
                DB::table('users')->where('id', $user->id)->update(['password_hash' => password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]), 'reset_password_token' => null, 'reset_password_expires' => null, 'updated_at' => now()]);
                DB::table('refresh_tokens')->where('user_id', $user->id)->whereNull('revoked_at')->update(['revoked_at' => now()]);
                $this->audit->log($request, 'AUTH_RESET_PASSWORD', 'user', $user->id);

                return response()->json(['message' => 'Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập ngay!']);
            });
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Lỗi khi đổi mật khẩu mới', 'error' => $exception->getMessage()], 500);
        }
    }

    public function refresh(Request $request)
    {
        $raw = $request->input('refreshToken');
        if (! $raw) {
            return response()->json(['message' => 'Refresh token is required'], 400);
        }

        return DB::transaction(function () use ($request, $raw) {
            try {
                $record = DB::table('refresh_tokens as rt')->join('users as u', function ($join) {
                    $join->on('u.id', '=', 'rt.user_id')->whereNull('u.deleted_at');
                })
                    ->where('rt.token_hash', hash('sha256', $raw))->select('rt.*', 'u.full_name', 'u.username', 'u.email', 'u.status')->lockForUpdate()->first();
                if (! $record) {
                    return response()->json(['message' => 'Invalid refresh token'], 401);
                }
                if ($record->revoked_at) {
                    DB::table('refresh_tokens')->where('user_id', $record->user_id)->whereNull('revoked_at')->update(['revoked_at' => now()]);

                    return response()->json(['message' => 'Refresh token reuse detected. All sessions revoked.'], 401);
                }
                if (strtotime($record->expires_at) < time()) {
                    DB::table('refresh_tokens')->where('id', $record->id)->update(['revoked_at' => now()]);

                    return response()->json(['message' => 'Refresh token expired'], 401);
                }
                if ($record->status !== 'active') {
                    return response()->json(['message' => 'Account is not active'], 403);
                }
                $newRaw = bin2hex(random_bytes(40));
                $newHash = hash('sha256', $newRaw);
                DB::table('refresh_tokens')->where('id', $record->id)->update(['revoked_at' => now(), 'replaced_by_hash' => $newHash]);
                DB::table('refresh_tokens')->insert(['user_id' => $record->user_id, 'token_hash' => $newHash, 'ip_address' => $this->auth->clientIp($request), 'user_agent' => Str::limit((string) $request->userAgent(), 500, ''), 'expires_at' => now()->addDays(7)]);
                $user = (object) ['id' => $record->user_id, 'full_name' => $record->full_name, 'username' => $record->username, 'email' => $record->email, 'status' => $record->status];
                $roles = $this->auth->roles((int) $record->user_id);

                return response()->json(['token' => app(LegacyJwtService::class)->issue($user, $roles, $newHash), 'refreshToken' => $newRaw, 'user' => $this->auth->userPayload($user, $roles, false)]);
            } catch (\Throwable $exception) {
                throw $exception;
            }
        });
    }

    public function logout(Request $request)
    {
        $raw = $request->input('refreshToken');
        if (! $raw) {
            return response()->json(['message' => 'Refresh token is required'], 400);
        }
        try {
            DB::table('refresh_tokens')->where('token_hash', hash('sha256', $raw))->whereNull('revoked_at')->update(['revoked_at' => now()]);
            $this->audit->log($request, 'AUTH_LOGOUT', 'user');

            return response()->json(['message' => 'Logged out successfully']);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Logout failed', 'error' => $exception->getMessage()], 500);
        }
    }

    public function logoutAll(Request $request)
    {
        $userId = (int) ($request->attributes->get('legacy_auth_user')->id ?? 0);
        if (! $userId) {
            return response()->json(['message' => 'Authentication required'], 401);
        }
        try {
            $count = DB::table('refresh_tokens')->where('user_id', $userId)->whereNull('revoked_at')->update(['revoked_at' => now()]);
            $this->audit->log($request, 'AUTH_LOGOUT_ALL', 'user', $userId, ['revokedCount' => $count]);

            return response()->json(['message' => 'All sessions revoked', 'revokedCount' => $count]);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Failed to revoke sessions', 'error' => $exception->getMessage()], 500);
        }
    }

    public function changePassword(Request $request)
    {
        $current = $request->input('current_password');
        $new = $request->input('new_password');
        $userId = (int) $request->attributes->get('legacy_auth_user')->id;
        if (! $current || ! $new) {
            return response()->json(['message' => 'Vui lòng nhập đầy đủ mật khẩu cũ và mới'], 400);
        }
        if (strlen((string) $new) < 6) {
            return response()->json(['message' => 'Mật khẩu mới phải có ít nhất 6 ký tự'], 400);
        }
        try {
            $user = DB::table('users')->where('id', $userId)->whereNull('deleted_at')->first();
            if (! $user) {
                return response()->json(['message' => 'Người dùng không tồn tại'], 404);
            }
            if ($user->auth_provider === 'google') {
                return response()->json(['message' => 'Tài khoản Google không thể đổi mật khẩu tại đây'], 400);
            }
            if (! password_verify((string) $current, $user->password_hash)) {
                return response()->json(['message' => 'Mật khẩu hiện tại không chính xác'], 400);
            }
            DB::transaction(function () use ($userId, $new) {
                DB::table('users')->where('id', $userId)->update(['password_hash' => password_hash($new, PASSWORD_BCRYPT, ['cost' => 10]), 'updated_at' => now()]);
                DB::table('refresh_tokens')->where('user_id', $userId)->whereNull('revoked_at')->update(['revoked_at' => now()]);
            });
            $this->audit->log($request, 'AUTH_CHANGE_PASSWORD', 'user', $userId);

            return response()->json(['message' => 'Đổi mật khẩu thành công!']);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Lỗi Server khi đổi mật khẩu', 'error' => $exception->getMessage()], 500);
        }
    }
}
