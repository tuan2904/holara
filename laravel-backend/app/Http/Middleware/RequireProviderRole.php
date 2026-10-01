<?php

namespace App\Http\Middleware;

use App\Services\Provider\ProviderAccessService;
use Closure;
use Illuminate\Http\Request;

class RequireProviderRole
{
    public function __construct(private readonly ProviderAccessService $provider) {}

    public function handle(Request $request, Closure $next)
    {
        $user = $request->attributes->get('legacy_auth_user');
        if (! $user?->id) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }
        $roles = $this->provider->roles((int) $user->id);
        if (! array_intersect(ProviderAccessService::ROLES, $roles)) {
            return response()->json(['message' => 'Provider access required', 'requiredRoles' => ProviderAccessService::ROLES, 'userRoles' => $roles], 403);
        }
        $request->attributes->set('legacy_user_roles', $roles);

        return $next($request);
    }
}
