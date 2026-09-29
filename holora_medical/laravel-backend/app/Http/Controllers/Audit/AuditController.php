<?php

namespace App\Http\Controllers\Audit;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditController extends Controller
{
    private function jsIntOrDefault($value, int $default): int
    {
        if (! preg_match('/^[\s]*([+-]?\d+)/', (string) $value, $matches)) {
            return $default;
        }

        $parsed = (int) $matches[1];
        return $parsed ?: $default;
    }

    public function index(Request $request)
    {
        try {
            $page = max(1, $this->jsIntOrDefault($request->query('page'), 1));
            $limit = min(100, max(1, $this->jsIntOrDefault($request->query('limit'), 25)));
            $offset = ($page - 1) * $limit;

            $base = DB::table('audit_logs as a');
            if ($request->query('action')) {
                $base->where('a.action', $request->query('action'));
            }
            if ($request->query('entity_type')) {
                $base->where('a.entity_type', $request->query('entity_type'));
            }
            if ($request->query('user_id')) {
                $base->where('a.user_id', (int) $request->query('user_id'));
            }
            if ($request->query('from')) {
                $base->where('a.created_at', '>=', $request->query('from'));
            }
            if ($request->query('to')) {
                $base->where('a.created_at', '<=', $request->query('to'));
            }

            $total = $base->count();
            $rows = $base
                ->leftJoin('users as u', 'u.id', '=', 'a.user_id')
                ->select(
                    'a.id',
                    'a.user_id',
                    'a.action',
                    'a.entity_type',
                    'a.entity_id',
                    'a.details',
                    'a.ip_address',
                    'a.user_agent',
                    'a.created_at',
                    'u.full_name as user_name',
                    'u.email as user_email'
                )
                ->orderByDesc('a.created_at')
                ->offset($offset)
                ->limit($limit)
                ->get();

            foreach ($rows as $row) {
                $row->details = $row->details ? json_decode($row->details) : null;
            }

            return response()->json([
                'data' => $rows,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => (int) ceil($total / $limit),
                ],
            ]);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Failed to fetch audit logs'], 500);
        }
    }

    public function actions()
    {
        try {
            $rows = DB::table('audit_logs')->distinct()->orderBy('action')->pluck('action')->all();

            return response()->json(['data' => $rows]);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Failed to fetch audit actions'], 500);
        }
    }

    public function entityTypes()
    {
        try {
            $rows = DB::table('audit_logs')->whereNotNull('entity_type')->distinct()->orderBy('entity_type')->pluck('entity_type')->all();

            return response()->json(['data' => $rows]);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Failed to fetch entity types'], 500);
        }
    }
}
