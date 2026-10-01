<?php

namespace App\Http\Controllers\Prescription;

use App\Http\Controllers\Controller;
use App\Services\Auth\LegacyAuditService;
use App\Services\LegacyMedicalCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PrescriptionController extends Controller
{
    public function __construct(private LegacyAuditService $audit, private LegacyMedicalCodeService $codes) {}

    private function doctor(Request $r)
    {
        return DB::table('doctor')->where('user_id', $r->attributes->get('legacy_auth_user')->id)->value('id');
    }

    private function patient(Request $r)
    {
        return DB::table('patient')->where('user_id', $r->attributes->get('legacy_auth_user')->id)->value('id');
    }

    private function attachItems($rows): void
    {
        if ($rows->isEmpty()) {
            return;
        }

        $items = DB::table('prescription_item')
            ->whereIn('prescription_id', $rows->pluck('id')->all())
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->groupBy('prescription_id');

        foreach ($rows as $row) {
            $row->items = $items->get($row->id, collect())->values();
        }
    }

    public function create(Request $r)
    {
        if (! $r->input('patient_id')) {
            return response()->json(['message' => 'patient_id là bắt buộc.'], 400);
        }

        $items = $r->input('items');
        if (! is_array($items) || ! $items) {
            return response()->json(['message' => 'Toa thuốc phải có ít nhất 1 dòng thuốc.'], 400);
        }
        foreach ($items as $x) {
            if (empty(trim($x['medication_name'] ?? ''))) {
                return response()->json(['message' => 'Tên thuốc không được để trống.'], 400);
            }
        }

        if (! ($doctorId = $this->doctor($r))) {
            return response()->json(['message' => 'Chỉ bác sĩ mới có thể kê toa.'], 403);
        }

        $code = $this->codes->next('prescription');
        $id = DB::table('prescription')->insertGetId([
            'consultation_id' => $r->input('consultation_id') ?: null,
            'appointment_id' => $r->input('appointment_id') ?: null,
            'doctor_id' => $doctorId,
            'patient_id' => $r->input('patient_id'),
            'prescription_code' => $code,
            'diagnosis' => $r->input('diagnosis') ?: null,
            'notes' => $r->input('notes') ?: null,
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($items as $n => $x) {
            DB::table('prescription_item')->insert([
                'prescription_id' => $id,
                'medication_name' => trim($x['medication_name']),
                'dosage' => $x['dosage'] ?? null,
                'frequency' => $x['frequency'] ?? null,
                'duration' => $x['duration'] ?? null,
                'quantity' => $x['quantity'] ?? null,
                'unit' => $x['unit'] ?? null,
                'route' => $x['route'] ?? null,
                'instructions' => $x['instructions'] ?? null,
                'sort_order' => $x['sort_order'] ?? $n,
            ]);
        }

        $this->audit->log($r, 'PRESCRIPTION_CREATE', 'prescription', $id, [
            'patient_id' => $r->input('patient_id'),
            'consultation_id' => $r->input('consultation_id'),
            'items' => count($items),
        ]);

        return response()->json(['message' => 'Tạo toa thuốc thành công.', 'prescription_id' => $id, 'prescription_code' => $code], 201);
    }

    public function show(Request $r, $id)
    {
        $x = DB::table('prescription as p')
            ->join('doctor as d', 'p.doctor_id', '=', 'd.id')
            ->join('users as u_doc', 'd.user_id', '=', 'u_doc.id')
            ->join('patient as pt', 'p.patient_id', '=', 'pt.id')
            ->join('users as u_pat', 'pt.user_id', '=', 'u_pat.id')
            ->where('p.id', $id)
            ->select('p.*', 'd.user_id as doctor_user_id', 'u_doc.full_name as doctor_name', 'pt.user_id as patient_user_id', 'u_pat.full_name as patient_name')
            ->first();

        if (! $x) {
            return response()->json(['message' => 'Không tìm thấy toa thuốc.'], 404);
        }

        $user = $r->attributes->get('legacy_auth_user');
        $isAdmin = in_array($user->role, ['admin', 'super_admin'], true);
        if (! $isAdmin && $x->doctor_user_id != $user->id && $x->patient_user_id != $user->id) {
            return response()->json(['message' => 'Bạn không có quyền xem toa thuốc này.'], 403);
        }

        $x->items = DB::table('prescription_item')->where('prescription_id', $id)->orderBy('sort_order')->orderBy('id')->get();

        return response()->json(['message' => 'Thành công', 'data' => $x]);
    }

    public function list($field, $id)
    {
        $x = DB::table('prescription as p')
            ->join('doctor as d', 'p.doctor_id', '=', 'd.id')
            ->join('users as u_doc', 'd.user_id', '=', 'u_doc.id')
            ->where('p.'.$field, $id)
            ->select('p.*', 'u_doc.full_name as doctor_name')
            ->orderByDesc('p.created_at')
            ->get();

        $this->attachItems($x);

        return response()->json(['message' => 'Thành công', 'data' => $x]);
    }

    public function update(Request $r, $id)
    {
        if (! ($d = $this->doctor($r))) {
            return response()->json(['message' => 'Chỉ bác sĩ mới có thể sửa toa.'], 403);
        }
        $p = DB::table('prescription')->where('id', $id)->first();
        if (! $p) {
            return response()->json(['message' => 'Không tìm thấy toa thuốc.'], 404);
        }
        if ($p->doctor_id != $d) {
            return response()->json(['message' => 'Bạn không có quyền sửa toa thuốc này.'], 403);
        }
        if ($p->status !== 'draft') {
            return response()->json(['message' => 'Chỉ có thể sửa toa thuốc ở trạng thái nháp.'], 400);
        }

        $items = $r->input('items');
        DB::table('prescription')->where('id', $id)->update([
            'diagnosis' => $r->input('diagnosis') ?: null,
            'notes' => $r->input('notes') ?: null,
            'updated_at' => now(),
        ]);

        if (is_array($items) && count($items)) {
            DB::table('prescription_item')->where('prescription_id', $id)->delete();
            foreach ($items as $n => $x) {
                DB::table('prescription_item')->insert([
                    'prescription_id' => $id,
                    'medication_name' => trim($x['medication_name']),
                    'dosage' => $x['dosage'] ?? null,
                    'frequency' => $x['frequency'] ?? null,
                    'duration' => $x['duration'] ?? null,
                    'quantity' => $x['quantity'] ?? null,
                    'unit' => $x['unit'] ?? null,
                    'route' => $x['route'] ?? null,
                    'instructions' => $x['instructions'] ?? null,
                    'sort_order' => $x['sort_order'] ?? $n,
                ]);
            }
            $this->audit->log($r, 'PRESCRIPTION_UPDATE', 'prescription', (int) $id, ['items' => count($items)]);
        } else {
            $this->audit->log($r, 'PRESCRIPTION_UPDATE', 'prescription', (int) $id, []);
        }

        return response()->json(['message' => 'Cập nhật toa thuốc thành công.']);
    }

    private function writable(Request $r, $id, $verb)
    {
        if (! ($d = $this->doctor($r))) {
            return [null, response()->json(['message' => "Chỉ bác sĩ mới có thể $verb toa."], 403)];
        }
        $p = DB::table('prescription')->where('id', $id)->first();
        if (! $p) {
            return [null, response()->json(['message' => 'Không tìm thấy toa thuốc.'], 404)];
        }
        if ($p->doctor_id != $d) {
            return [null, response()->json(['message' => "Bạn không có quyền $verb toa thuốc này."], 403)];
        }

        return [$p, null];
    }

    public function issue(Request $r, $id)
    {
        [$p, $e] = $this->writable($r, $id, 'phát hành');
        if ($e) {
            return $e;
        }
        if ($p->status !== 'draft') {
            return response()->json(['message' => 'Chỉ có thể phát hành toa thuốc nháp.'], 400);
        }
        DB::table('prescription')->where('id', $id)->update(['status' => 'issued', 'issued_at' => now(), 'updated_at' => now()]);
        $this->audit->log($r, 'PRESCRIPTION_ISSUE', 'prescription', (int) $id, []);

        return response()->json(['message' => 'Phát hành toa thuốc thành công.']);
    }

    public function cancel(Request $r, $id)
    {
        [$p, $e] = $this->writable($r, $id, 'hủy');
        if ($e) {
            return $e;
        }
        if ($p->status === 'cancelled') {
            return response()->json(['message' => 'Toa thuốc đã bị hủy.'], 400);
        }
        DB::table('prescription')->where('id', $id)->update(['status' => 'cancelled', 'updated_at' => now()]);
        $this->audit->log($r, 'PRESCRIPTION_CANCEL', 'prescription', (int) $id, []);

        return response()->json(['message' => 'Đã hủy toa thuốc.']);
    }

    public function mine(Request $r, $type)
    {
        $id = $type === 'doctor' ? $this->doctor($r) : $this->patient($r);
        if (! $id) {
            return response()->json(['message' => $type === 'doctor' ? 'Không tìm thấy hồ sơ bác sĩ.' : 'Không tìm thấy hồ sơ bệnh nhân.'], 403);
        }

        $page = $r->query('page', 1);
        $limit = $r->query('limit', 20);
        $offset = ($page - 1) * $limit;
        $q = DB::table('prescription as p')->where('p.'.$type.'_id', $id);
        if ($r->query('status')) {
            $q->where('p.status', $r->query('status'));
        }
        $total = $q->count();

        if ($type === 'doctor') {
            $rows = $q->join('patient as pt', 'p.patient_id', '=', 'pt.id')
                ->join('users as u', 'pt.user_id', '=', 'u.id')
                ->select('p.*', 'u.full_name as patient_name')
                ->orderByDesc('p.created_at')
                ->offset($offset)
                ->limit($limit)
                ->get();
        } else {
            $rows = $q->join('doctor as d', 'p.doctor_id', '=', 'd.id')
                ->join('users as u', 'd.user_id', '=', 'u.id')
                ->select('p.*', 'u.full_name as doctor_name')
                ->orderByDesc('p.created_at')
                ->offset($offset)
                ->limit($limit)
                ->get();
        }

        if ($type === 'patient') {
            $this->attachItems($rows);
        }

        return response()->json(['message' => 'Thành công', 'data' => $rows, 'pagination' => ['total' => $total, 'page' => (int) $page, 'limit' => (int) $limit]]);
    }
}
