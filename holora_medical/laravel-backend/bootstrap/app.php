<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\LegacyCorsMiddleware::class);
        $middleware->append(\App\Http\Middleware\LegacyDatetimeSerialization::class);

        // Legacy Node backend is a stateless bearer-token JSON API with no browser
        // CSRF/session state (docs/legacy-analysis/07-authentication-authorization.md).
        // These prefixes are the migrated API route groups: CSRF must never intercept
        // a request before legacy JWT/application authentication runs.
        $statelessApiPrefixes = [
            'ai', 'appointments', 'auth', 'branches', 'consultations', 'doctors',
            'earnings', 'holoramind', 'notifications', 'patients', 'permissions',
            'prescriptions', 'reviews', 'roles', 'schedules', 'specialties',
            'subscriptions', 'upload', 'users',
            'recurring-appointments', 'api/recurring-appointments',
        ];

        $csrfExcept = ['recurring-appointments/*', 'api/recurring-appointments/*'];
        foreach ($statelessApiPrefixes as $prefix) {
            $csrfExcept[] = $prefix;
            $csrfExcept[] = $prefix.'/*';
        }

        $middleware->validateCsrfTokens(except: $csrfExcept);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(static fn (): bool => true);
    })->create();
