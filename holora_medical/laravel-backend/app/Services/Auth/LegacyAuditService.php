<?php

namespace App\Services\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LegacyAuditService
{
    public function log(Request $request, string $action, ?string $entityType = null, ?int $entityId = null, ?array $details = null, ?int $userId = null): void
    {
        app()->terminating(function () use ($request, $action, $entityType, $entityId, $details, $userId): void {
            try {
                $forwarded = $request->header('X-Forwarded-For');
                $ip = $forwarded ? trim(explode(',', $forwarded)[0]) : $request->ip();
                DB::table('audit_logs')->insert([
                    'user_id' => $userId,
                    'action' => $action,
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                    'details' => $details === null ? null : json_encode($details),
                    'ip_address' => $ip,
                    'user_agent' => $request->userAgent(),
                ]);
            } catch (\Throwable $exception) {
                logger()->warning('[AuditLog] Failed to write: '.$exception->getMessage());
            }
        });
    }
}
