<?php

namespace App\Services\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LegacyAuthService
{
    public function __construct(private readonly LegacyJwtService $jwt) {}

    public function roles(int $userId): array
    {
        return DB::table('user_role as ur')->join('role as r', 'ur.role_id', '=', 'r.id')
            ->where('ur.user_id', $userId)->where('r.status', 'active')->orderByRaw("CASE r.code WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1 WHEN 'clinic_owner' THEN 2 WHEN 'doctor' THEN 3 ELSE 4 END")->pluck('r.code')->all();
    }

    public function issue(object $user, Request $request, bool $includeMessage = true): array
    {
        $roles = $this->roles((int) $user->id);
        $refreshToken = $this->createRefreshToken((int) $user->id, $request);
        $payload = [
            'token' => $this->jwt->issue($user, $roles, hash('sha256', $refreshToken)),
            'refreshToken' => $refreshToken,
            'user' => $this->userPayload($user, $roles, $includeMessage),
        ];

        return $includeMessage ? ['message' => 'Login successful'] + $payload : $payload;
    }

    public function userPayload(object $user, array $roles, bool $withProvider): array
    {
        $payload = [
            'id' => (int) $user->id,
            'full_name' => $user->full_name,
            'username' => $user->username,
            'email' => $user->email,
        ];
        if ($withProvider) {
            $payload['auth_provider'] = $user->auth_provider ?: 'local';
        }
        $payload['status'] = $user->status;
        $payload['role'] = $roles[0] ?? 'patient';
        $payload['roles'] = array_values($roles);

        return $payload;
    }

    public function createRefreshToken(int $userId, Request $request): string
    {
        $raw = bin2hex(random_bytes(40));
        DB::table('refresh_tokens')->insert([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $raw),
            'ip_address' => $this->clientIp($request),
            'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
            'expires_at' => now()->addDays(7),
        ]);

        return $raw;
    }

    public function clientIp(Request $request): ?string
    {
        return $request->ip();
    }

    public function ensureFreeProviderSubscription(int $userId): void
    {
        $plan = DB::table('subscription_plan')->where('code', 'HOLORA_FREE')->where('status', 'active')->whereNull('deleted_at')->first();
        if (! $plan || DB::table('provider_subscription')->where('scope_type', 'account')->where('scope_id', $userId)->where('owner_user_id', $userId)->whereNull('deleted_at')->exists()) {
            return;
        }
        DB::table('provider_subscription')->insert([
            'plan_id' => $plan->id, 'scope_type' => 'account', 'scope_id' => $userId, 'owner_user_id' => $userId,
            'status' => 'active', 'starts_at' => now(), 'ends_at' => null, 'trial_ends_at' => null, 'auto_renew' => false,
        ]);
    }
}
