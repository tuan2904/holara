<?php

namespace App\Http\Controllers\Branch;

use App\Http\Controllers\Controller;
use App\Services\LegacyMedicalCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BranchController extends Controller
{
    public function __construct(private LegacyMedicalCodeService $codes) {}

    private function db($e)
    {
        return response()->json(['message' => 'Database error', 'error' => $e->getMessage()], 500);
    }

    public function index()
    {
        try {
            return response()->json(['message' => 'Branches fetched successfully', 'data' => DB::table('branch')->whereNull('deleted_at')->orderByDesc('created_at')->get()]);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function show($id)
    {
        try {
            $b = DB::table('branch')->where('id', $id)->whereNull('deleted_at')->first();

            return $b ? response()->json(['message' => 'Branch fetched successfully', 'data' => $b]) : response()->json(['message' => 'Branch not found'], 404);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function nextCode()
    {
        try {
            return response()->json(['message' => 'Next branch code generated successfully', 'data' => ['code' => $this->codes->next('branch')]]);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function mine(Request $r)
    {
        $id = $r->attributes->get('legacy_auth_user')->id;
        try {
            $data = DB::select('SELECT b.*,COUNT(DISTINCT db.doctor_id) AS doctor_count FROM branch b LEFT JOIN doctor_branch db ON db.branch_id=b.id WHERE b.owner_user_id=? AND b.deleted_at IS NULL GROUP BY b.id ORDER BY b.created_at DESC', [$id]);

            return response()->json(['message' => 'Branches fetched successfully', 'data' => $data]);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function store(Request $r)
    {
        if (! $r->input('name') || ! $r->input('address')) {
            return response()->json(['message' => 'Name and address are required'], 400);
        }try {
            $code = $this->codes->next('branch');
            $data = $this->data($r) + ['code' => $code, 'owner_user_id' => $r->attributes->get('legacy_auth_user')->id];
            $id = DB::table('branch')->insertGetId($data);

            return response()->json(['message' => 'Branch created successfully', 'data' => (object) (['id' => $id] + $data)], 201);
        } catch (\Throwable $e) {
            if (str_contains($e->getMessage(), 'Duplicate')) {
                return response()->json(['message' => 'Branch code already exists'], 409);
            }

            return $this->db($e);
        }
    }

    public function update(Request $r, $id)
    {
        if (! $r->input('name') || ! $r->input('address')) {
            return response()->json(['message' => 'Name and address are required'], 400);
        }try {
            $n = DB::table('branch')->where('id', $id)->whereNull('deleted_at')->update($this->data($r) + ['updated_at' => now()]);
            if (! $n) {
                return response()->json(['message' => 'Branch not found'], 404);
            }

            return response()->json(['message' => 'Branch updated successfully', 'data' => DB::table('branch')->where('id', $id)->first()]);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    public function destroy($id)
    {
        try {
            $n = DB::table('branch')->where('id', $id)->whereNull('deleted_at')->update(['deleted_at' => now(), 'updated_at' => now()]);

            return $n ? response()->json(['message' => 'Branch deleted successfully']) : response()->json(['message' => 'Branch not found'], 404);
        } catch (\Throwable $e) {
            return $this->db($e);
        }
    }

    private function data($r)
    {
        return ['name' => $r->input('name'), 'phone' => $r->input('phone') ?: null, 'email' => $r->input('email') ?: null, 'address' => $r->input('address'), 'city' => $r->input('city') ?: null, 'description' => $r->input('description') ?: null, 'status' => $r->input('status', 'active')];
    }
}
