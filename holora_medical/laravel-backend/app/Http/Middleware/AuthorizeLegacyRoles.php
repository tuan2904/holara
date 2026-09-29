<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthorizeLegacyRoles
{
    public function handle(Request $request, Closure $next, ...$allowedRoles)
    {
        $authUser = $request->attributes->get('legacy_auth_user');
        if (! $authUser?->id) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }
        try {
            $userRoles = DB::table('users as u')->leftJoin('user_role as ur', 'u.id', '=', 'ur.user_id')->leftJoin('role as r', 'ur.role_id', '=', 'r.id')
                ->where('u.id', $authUser->id)->whereNull('u.deleted_at')->pluck('r.code')->filter()->values()->all();
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Database error', 'error' => $exception->getMessage()], 500);
        }
        if (! array_intersect($allowedRoles, $userRoles)) {
            return response()->json(['message' => 'You do not have permission to access this resource', 'requiredRoles' => $allowedRoles, 'userRoles' => $userRoles], 403);
        }
        $request->attributes->set('legacy_user_roles', $userRoles);
        return $next($request);
    }
}
