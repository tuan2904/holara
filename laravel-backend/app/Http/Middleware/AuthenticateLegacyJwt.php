<?php

namespace App\Http\Middleware;

use App\Services\Auth\LegacyAuthService;
use App\Services\Auth\LegacyJwtService;
use App\Services\ClinicalAccess;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthenticateLegacyJwt
{
    public function __construct(private readonly LegacyJwtService $jwt) {}

    public function handle(Request $request, Closure $next)
    {
        $parts = explode(' ', (string) $request->header('Authorization'));
        $token = $parts[1] ?? null;

        if (! $token) {
            return response()->json(['message' => 'Access token is required'], 401);
        }

        try {
            $request->attributes->set('legacy_auth_user', $this->jwt->decode($token));
        } catch (\Throwable $exception) {
            if ($this->jwt->isExpired($exception)) {
                return response()->json(['message' => 'Token expired', 'code' => 'TOKEN_EXPIRED'], 401);
            }

            return response()->json(['message' => 'Invalid token', 'code' => 'INVALID_TOKEN'], 403);
        }

        $user = $request->attributes->get('legacy_auth_user');
        $account = DB::table('users')->where('id', $user->id)->whereNull('deleted_at')->first();
        if (! $account || $account->status !== 'active') {
            return response()->json(['message' => 'Account is inactive'], 401);
        }
        $user->roles = app(LegacyAuthService::class)->roles((int) $user->id);
        $user->role = $user->roles[0] ?? 'patient';
        if (! isset($user->sid) || ! DB::table('refresh_tokens')->where('user_id', $user->id)->where('token_hash', $user->sid)->whereNull('revoked_at')->where('expires_at', '>', now())->exists()) {
            return response()->json(['message' => 'Session revoked. Please sign in again.'], 401);
        }
        app(ClinicalAccess::class)->authorize($request, $user);

        return $next($request);
    }
}
