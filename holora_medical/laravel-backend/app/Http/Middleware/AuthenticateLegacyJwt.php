<?php

namespace App\Http\Middleware;

use App\Services\Auth\LegacyJwtService;
use Closure;
use Illuminate\Http\Request;

class AuthenticateLegacyJwt
{
    public function __construct(private readonly LegacyJwtService $jwt)
    {
    }

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

        return $next($request);
    }
}
