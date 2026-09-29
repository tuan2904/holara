<?php

namespace App\Http\Middleware;

use App\Services\Provider\ProviderAccessService;
use Closure;
use Illuminate\Http\Request;

class RequireProviderEntitlement
{
    public function __construct(private readonly ProviderAccessService $provider) {}
    public function handle(Request $request, Closure $next, string $feature)
    {
        $user = $request->attributes->get('legacy_auth_user');
        if (! $user?->id) return response()->json(['message' => 'User not authenticated'], 401);
        $branch = filter_var($request->input('branch_id', $request->route('branch_id') ?? $request->route('id')), FILTER_VALIDATE_INT) ?: null;
        $doctor = filter_var($request->input('doctor_id'), FILTER_VALIDATE_INT) ?: null;
        $candidates = $this->provider->candidates((int) $user->id, ['account', 'branch', 'doctor'], $branch, $doctor);
        if (! $candidates) return response()->json(['message' => 'Unable to determine subscription scope. Provide branch_id or doctor context.'], 400);
        $grant = $this->provider->entitled((int) $user->id, $feature, ['account', 'branch', 'doctor'], $branch, $doctor);
        if (! $grant) return response()->json(['message' => 'Active subscription required', 'requiredFeature' => $feature, 'scopeCandidates' => $candidates], 402);
        $request->attributes->set('subscription_grant', $grant);
        return $next($request);
    }
}
