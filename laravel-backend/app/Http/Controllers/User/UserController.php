<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\Auth\LegacyAuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function __construct(private readonly LegacyAuditService $audit) {}

    public function index()
    {
        try {
            $rows = DB::select("SELECT u.id,u.full_name,u.username,u.email,u.phone,u.avatar_url,u.gender,u.date_of_birth,u.status,u.email_verified_at,u.last_login_at,u.created_at,u.updated_at,GROUP_CONCAT(r.name SEPARATOR ', ') AS roles FROM users u LEFT JOIN user_role ur ON u.id=ur.user_id LEFT JOIN role r ON ur.role_id=r.id WHERE u.deleted_at IS NULL GROUP BY u.id,u.full_name,u.username,u.email,u.phone,u.avatar_url,u.gender,u.date_of_birth,u.status,u.email_verified_at,u.last_login_at,u.created_at,u.updated_at ORDER BY u.created_at DESC");

            return response()->json(['message' => 'Users fetched successfully', 'data' => $rows]);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function show($id)
    {
        try {
            $rows = DB::select("SELECT u.id,u.full_name,u.username,u.email,u.phone,u.avatar_url,u.gender,u.date_of_birth,u.status,u.email_verified_at,u.last_login_at,u.created_at,u.updated_at,GROUP_CONCAT(r.code SEPARATOR ', ') AS roles FROM users u LEFT JOIN user_role ur ON u.id=ur.user_id LEFT JOIN role r ON ur.role_id=r.id WHERE u.id=? AND u.deleted_at IS NULL GROUP BY u.id,u.full_name,u.username,u.email,u.phone,u.avatar_url,u.gender,u.date_of_birth,u.status,u.email_verified_at,u.last_login_at,u.created_at,u.updated_at", [$id]);

            return $rows ? response()->json(['message' => 'User fetched successfully', 'data' => $rows[0]]) : response()->json(['message' => 'User not found'], 404);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function store(Request $r)
    {
        $full = $r->input('full_name');
        $username = $r->input('username');
        $email = $r->input('email');
        $password = $r->input('password');
        if (! $full || ! $username || ! $email || ! $password) {
            return response()->json(['message' => 'Full name, username, email, and password are required'], 400);
        }try {
            if (DB::table('users')->whereNull('deleted_at')->where(fn ($q) => $q->where('email', $email)->orWhere('username', $username))->exists()) {
                return response()->json(['message' => 'Email or username already exists'], 409);
            }$id = DB::table('users')->insertGetId(['full_name' => $full, 'username' => $username, 'email' => $email, 'password_hash' => password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]), 'phone' => $r->input('phone') ?: null, 'status' => $r->input('status', 'active')]);
            $code = $r->input('role_code', 'patient');
            $role = DB::table('role')->where('code', $code)->where('status', 'active')->first();
            if ($r->input('role_code') && ! $role) {
                return response()->json(['message' => 'Create user failed', 'error' => 'Role not found'], 500);
            }if ($role) {
                DB::table('user_role')->insert(['user_id' => $id, 'role_id' => $role->id, 'assigned_at' => now()]);
            }$this->audit->log($r, 'USER_CREATE', 'user', $id, ['email' => $email, 'role_id' => $role?->id]);

            return response()->json(['message' => 'User created successfully', 'data' => ['id' => $id]], 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Create user failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $r, $id)
    {
        $full = $r->input('full_name');
        $email = $r->input('email');
        if (! $id || ! $full || ! $email) {
            return response()->json(['message' => 'User ID, full name, and email are required'], 400);
        }try {
            $data = ['full_name' => $full, 'email' => $email, 'phone' => $r->input('phone') ?: null, 'status' => $r->input('status'), 'updated_at' => now()];
            if ($r->input('password')) {
                $data['password_hash'] = password_hash($r->input('password'), PASSWORD_BCRYPT, ['cost' => 10]);
            }$n = DB::table('users')->where('id', $id)->whereNull('deleted_at')->update($data);
            if (! $n) {
                return response()->json(['message' => 'User not found'], 404);
            }$this->audit->log($r, 'USER_UPDATE', 'user', (int) $id, ['full_name' => $full, 'email' => $email, 'status' => $r->input('status')]);

            return response()->json(['message' => 'User updated successfully']);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function destroy(Request $r, $id)
    {
        if (! $id) {
            return response()->json(['message' => 'User ID is required'], 400);
        }try {
            $n = DB::table('users')->where('id', $id)->whereNull('deleted_at')->update(['deleted_at' => now(), 'updated_at' => now()]);
            if (! $n) {
                return response()->json(['message' => 'User not found'], 404);
            }$this->audit->log($r, 'USER_DELETE', 'user', (int) $id);

            return response()->json(['message' => 'User deleted successfully']);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function assignRole(Request $r)
    {
        $uid = $r->input('user_id');
        $rid = $r->input('role_id');
        if (! $uid || ! $rid) {
            return response()->json(['message' => 'User ID and role ID are required'], 400);
        }try {
            if (! DB::table('users')->where('id', $uid)->whereNull('deleted_at')->exists()) {
                return response()->json(['message' => 'User not found'], 404);
            }if (! DB::table('role')->where('id', $rid)->where('status', 'active')->exists()) {
                return response()->json(['message' => 'Role not found'], 404);
            }if (DB::table('user_role')->where('user_id', $uid)->where('role_id', $rid)->exists()) {
                return response()->json(['message' => 'User already has this role'], 400);
            }$admin = (int) ($r->attributes->get('legacy_auth_user')->id ?? 1);
            DB::table('user_role')->insert(['user_id' => $uid, 'role_id' => $rid, 'assigned_at' => now(), 'assigned_by' => $admin]);
            $this->audit->log($r, 'ROLE_ASSIGN', 'user', (int) $uid, ['role_id' => (int) $rid]);

            return response()->json(['message' => 'Role assigned successfully', 'data' => ['user_id' => $uid, 'role_id' => $rid]]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Assign role failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function removeRole(Request $r)
    {
        $uid = $r->input('user_id');
        $rid = $r->input('role_id');
        if (! $uid || ! $rid) {
            return response()->json(['message' => 'User ID and role ID are required'], 400);
        }try {
            $n = DB::table('user_role')->where('user_id', $uid)->where('role_id', $rid)->delete();
            if (! $n) {
                return response()->json(['message' => 'User role assignment not found'], 404);
            }$this->audit->log($r, 'ROLE_REMOVE', 'user', (int) $uid, ['role_id' => (int) $rid]);

            return response()->json(['message' => 'Role removed successfully', 'data' => ['user_id' => $uid, 'role_id' => $rid]]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Remove role failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function roles($id)
    {
        try {
            $rows = DB::select('SELECT r.id,r.code,r.name,r.description,r.status,ur.assigned_at,ur.assigned_by,admin.full_name AS assigned_by_name FROM user_role ur JOIN role r ON ur.role_id=r.id LEFT JOIN users admin ON ur.assigned_by=admin.id WHERE ur.user_id=? ORDER BY ur.assigned_at DESC', [$id]);

            return response()->json(['message' => 'User roles fetched successfully', 'data' => $rows]);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function availableRoles($id)
    {
        try {
            $rows = DB::select('SELECT r.id,r.code,r.name,r.description,r.status,CASE WHEN ur.user_id IS NOT NULL THEN true ELSE false END AS is_assigned FROM role r LEFT JOIN user_role ur ON r.id=ur.role_id AND ur.user_id=? WHERE r.status=? ORDER BY r.name', [$id, 'active']);

            return response()->json(['message' => 'Available roles fetched successfully', 'data' => $rows]);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function sessions($id)
    {
        try {
            $rows = DB::table('refresh_tokens')->select('id', 'ip_address', 'user_agent', 'created_at', 'expires_at')->where('user_id', $id)->whereNull('revoked_at')->where('expires_at', '>', now())->orderByDesc('created_at')->get();

            return response()->json(['message' => 'Sessions fetched successfully', 'data' => $rows]);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function forceLogout($id)
    {
        try {
            $n = DB::table('refresh_tokens')->where('user_id', $id)->whereNull('revoked_at')->update(['revoked_at' => now()]);

            return response()->json(['message' => 'User forcefully logged out from all sessions', 'revokedCount' => $n]);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function revokeSession($id, $sessionId)
    {
        try {
            $n = DB::table('refresh_tokens')->where('id', $sessionId)->where('user_id', $id)->whereNull('revoked_at')->update(['revoked_at' => now()]);

            return $n ? response()->json(['message' => 'Session revoked successfully']) : response()->json(['message' => 'Session not found or already revoked'], 404);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function loginHistory(Request $r, $id)
    {
        try {
            $limit = min((int) ($r->query('limit') ?: 50), 200);
            $rows = DB::select("SELECT id,ip_address,user_agent,created_at,expires_at,revoked_at,CASE WHEN revoked_at IS NOT NULL THEN 'revoked' WHEN expires_at < NOW() THEN 'expired' ELSE 'active' END AS status FROM refresh_tokens WHERE user_id=? ORDER BY created_at DESC LIMIT ?", [$id, $limit]);

            return response()->json(['message' => 'Login history fetched successfully', 'data' => $rows]);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    private function db(\Throwable $e)
    {
        return response()->json(['message' => 'Database error', 'error' => $e->getMessage()], 500);
    }
}
