<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Legacy Node backend serializes MySQL DATE/DATETIME/TIMESTAMP columns through
 * mysql2, which turns them into JS Date objects that JSON.stringify emits as
 * ISO-8601 with milliseconds and a trailing Z (verified against the running
 * Node service):
 *
 *   DATETIME  "2026-09-28 18:20:57" -> "2026-09-28T18:20:57.000Z"
 *   DATE      "2026-03-30"          -> "2026-03-30T00:00:00.000Z"
 *   TIME      "08:00:00"            -> "08:00:00" (unchanged)
 *
 * Laravel Query Builder returns the raw driver strings, so responses would
 * otherwise expose "Y-m-d H:i:s". This middleware is the single compatibility
 * boundary where that serialization difference is reconciled: it only rewrites
 * strings that are structurally indistinguishable from a DB date/datetime
 * literal (exact pattern + real calendar value), and DATE-only values are only
 * rewritten for date-shaped keys so free-text fields are never touched.
 */
class LegacyDatetimeSerialization
{
    private const DATE_KEYS = [
        'appointment_date', 'work_date', 'date_of_birth',
        'start_date', 'end_date', 'last_appointment_date',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $response instanceof Response || ! $this->isJson($response)) {
            return $response;
        }

        $content = $response->getContent();
        if (! is_string($content) || $content === '' || $content[0] !== '{' && $content[0] !== '[') {
            return $response;
        }

        $decoded = json_decode($content);
        if (json_last_error() !== JSON_ERROR_NONE || (! is_object($decoded) && ! is_array($decoded))) {
            return $response;
        }

        if (! $this->convert($decoded, null)) {
            return $response;
        }

        $options = $response instanceof JsonResponse ? $response->getEncodingOptions() : 15;
        $encoded = json_encode($decoded, $options);
        if ($encoded === false) {
            return $response;
        }

        $response->setContent($encoded);

        return $response;
    }

    private function isJson(Response $response): bool
    {
        if ($response instanceof JsonResponse) {
            return true;
        }

        return str_contains((string) $response->headers->get('Content-Type'), 'json');
    }

    private function convert(mixed $value, ?string $key): bool
    {
        $changed = false;

        if (is_object($value)) {
            foreach ($value as $name => $item) {
                $converted = $this->format((string) $name, $item);
                if ($converted !== $item) {
                    $value->{$name} = $converted;
                    $changed = true;
                } elseif (is_object($item) || is_array($item)) {
                    $changed = $this->convert($item, (string) $name) || $changed;
                }
            }

            return $changed;
        }

        if (is_array($value)) {
            foreach ($value as $name => $item) {
                if (is_object($item) || is_array($item)) {
                    $changed = $this->convert($item, is_string($name) ? $name : $key) || $changed;
                } elseif (is_string($name)) {
                    $converted = $this->format($name, $item);
                    if ($converted !== $item) {
                        $value[$name] = $converted;
                        $changed = true;
                    }
                } else {
                    $converted = $this->format((string) $key, $item);
                    if ($converted !== $item) {
                        $value[$name] = $converted;
                        $changed = true;
                    }
                }
            }

            return $changed;
        }

        return false;
    }

    private function format(?string $key, mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        if (preg_match('/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/', $value, $m) === 1) {
            if (! $this->isRealDate($m[1])) {
                return $value;
            }

            return $m[1].'T'.$m[2].'.000Z';
        }

        if ($key !== null
            && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1
            && $this->isDateKey($key)
            && $this->isRealDate($value)) {
            return $value.'T00:00:00.000Z';
        }

        return $value;
    }

    private function isDateKey(string $key): bool
    {
        return in_array($key, self::DATE_KEYS, true) || str_ends_with($key, '_date');
    }

    private function isRealDate(string $date): bool
    {
        [$year, $month, $day] = array_map('intval', explode('-', $date));

        return checkdate($month, $day, $year);
    }
}
