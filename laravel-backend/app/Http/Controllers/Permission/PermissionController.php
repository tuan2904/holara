<?php

namespace App\Http\Controllers\Permission;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        try {
            $q = DB::table('permission');
            if ($request->query('module_name')) {
                $q->where('module_name', $request->query('module_name'));
            } if ($request->query('status')) {
                $q->where('status', $request->query('status'));
            }

            return response()->json(['message' => 'Permissions fetched successfully', 'data' => $q->orderBy('module_name')->orderByDesc('created_at')->get()]);
        } catch (\Throwable $e) {
            return $this->dbError($e);
        }
    }

    public function modules()
    {
        try {
            return response()->json(['message' => 'Modules fetched successfully', 'data' => DB::table('permission')->whereNotNull('module_name')->distinct()->orderBy('module_name')->pluck('module_name')->all()]);
        } catch (\Throwable $e) {
            return $this->dbError($e);
        }
    }

    public function show($id)
    {
        try {
            $row = DB::table('permission')->where('id', $id)->first();

            return $row ? response()->json(['message' => 'Permission fetched successfully', 'data' => $row]) : response()->json(['message' => 'Permission not found'], 404);
        } catch (\Throwable $e) {
            return $this->dbError($e);
        }
    }

    public function store(Request $r)
    {
        $name = $r->input('name');
        $code = $r->input('code');
        if (! $name || ! $code) {
            return response()->json(['message' => 'Permission name and code are required'], 400);
        } try {
            if (DB::table('permission')->where('code', $code)->exists()) {
                return response()->json(['message' => 'Permission code already exists'], 409);
            } $data = ['name' => $name, 'code' => $code, 'module_name' => $r->input('module_name'), 'description' => $r->input('description'), 'status' => $r->input('status', 'active')];
            $id = DB::table('permission')->insertGetId($data);

            return response()->json(['message' => 'Permission created successfully', 'data' => ['id' => $id] + $data], 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to create permission', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $r, $id)
    {
        if (! $r->input('name')) {
            return response()->json(['message' => 'Permission name is required'], 400);
        }try {
            $n = DB::table('permission')->where('id', $id)->update(['name' => $r->input('name'), 'module_name' => $r->input('module_name'), 'description' => $r->input('description'), 'status' => $r->input('status'), 'updated_at' => now()]);

            return $n ? response()->json(['message' => 'Permission updated successfully']) : response()->json(['message' => 'Permission not found'], 404);
        } catch (\Throwable $e) {
            return $this->dbError($e);
        }
    }

    public function destroy($id)
    {
        try {
            if (DB::table('role_permission')->where('permission_id', $id)->count() > 0) {
                return response()->json(['message' => 'Cannot delete permission that is assigned to roles'], 400);
            }$n = DB::table('permission')->where('id', $id)->update(['status' => 'inactive', 'updated_at' => now()]);

            return $n ? response()->json(['message' => 'Permission deleted successfully']) : response()->json(['message' => 'Permission not found'], 404);
        } catch (\Throwable $e) {
            return $this->dbError($e);
        }
    }

    private function dbError(\Throwable $e)
    {
        return response()->json(['message' => 'Database error', 'error' => $e->getMessage()], 500);
    }
}
