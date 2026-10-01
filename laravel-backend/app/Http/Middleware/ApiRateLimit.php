<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class ApiRateLimit
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }
        $auth = $request->is('auth/login', 'auth/register', 'auth/google', 'auth/forgot-password', 'auth/reset-password');
        $key = ($auth ? 'auth:' : 'api:').$request->ip();
        $limit = $auth ? 10 : 180;
        if (RateLimiter::tooManyAttempts($key, $limit)) {
            return response()->json(['message' => 'Too many requests'], 429)->header('Retry-After', RateLimiter::availableIn($key));
        }
        RateLimiter::hit($key, 60);

        return $next($request);
    }
}
