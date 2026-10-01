<?php

namespace App\Http\Controllers\Review;

use App\Http\Controllers\Controller;
use App\Services\Auth\LegacyAuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function __construct(private LegacyAuditService $audit) {}

    private function p($r)
    {
        return DB::table('patient')->where('user_id', $r->attributes->get('legacy_auth_user')->id)->value('id');
    }

    private function pageLimit(Request $r, int $defaultLimit, int $maxLimit): array
    {
        $page = max(1, $this->jsParseIntOrDefault($r->query('page'), 1));
        $limit = min($maxLimit, max(1, $this->jsParseIntOrDefault($r->query('limit'), $defaultLimit)));

        return [$page, $limit, ($page - 1) * $limit];
    }

    private function jsParseIntOrDefault($value, int $default): int
    {
        if (! preg_match('/^[\s]*([+-]?\d+)/', (string) $value, $matches)) {
            return $default;
        }

        $parsed = (int) $matches[1];

        return $parsed ?: $default;
    }

    public function doctor(Request $r, $id)
    {
        [$page, $limit, $offset] = $this->pageLimit($r, 10, 50);

        $total = DB::table('review')->where('doctor_id', $id)->where('status', 'approved')->count();
        $rows = DB::table('review as r')
            ->join('patient as p', 'r.patient_id', '=', 'p.id')
            ->where('r.doctor_id', $id)
            ->where('r.status', 'approved')
            ->select(
                'r.id',
                'r.rating',
                'r.title',
                'r.comment',
                'r.is_anonymous',
                'r.created_at',
                DB::raw('CASE WHEN r.is_anonymous = 1 THEN NULL ELSE p.full_name END as patient_name'),
                DB::raw('CASE WHEN r.is_anonymous = 1 THEN NULL ELSE p.avatar_url END as patient_avatar')
            )
            ->orderByDesc('r.created_at')
            ->offset($offset)
            ->limit($limit)
            ->get();

        return response()->json([
            'message' => 'OK',
            'data' => $rows,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)],
        ]);
    }

    public function summary($id)
    {
        $row = DB::table('review')
            ->where('doctor_id', $id)
            ->where('status', 'approved')
            ->selectRaw('
                COUNT(*) as total_reviews,
                ROUND(AVG(rating), 1) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as star_5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as star_4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as star_3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as star_2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as star_1
            ')
            ->first();

        return response()->json([
            'message' => 'OK',
            'data' => [
                'total_reviews' => $row->total_reviews ?: 0,
                'average_rating' => (float) ($row->average_rating ?: 0),
                'distribution' => [
                    5 => $row->star_5 ?: 0,
                    4 => $row->star_4 ?: 0,
                    3 => $row->star_3 ?: 0,
                    2 => $row->star_2 ?: 0,
                    1 => $row->star_1 ?: 0,
                ],
            ],
        ]);
    }

    public function create(Request $r)
    {
        $doctor = $r->input('doctor_id');
        $rating = $r->input('rating');
        if (! $doctor || ! $rating || $rating < 1 || $rating > 5) {
            return response()->json(['message' => 'doctor_id và rating (1-5) là bắt buộc.'], 400);
        }
        if (! ($p = $this->p($r))) {
            return response()->json(['message' => 'Không tìm thấy hồ sơ bệnh nhân.'], 404);
        }
        if (! DB::table('doctor')->where('id', $doctor)->exists()) {
            return response()->json(['message' => 'Không tìm thấy bác sĩ.'], 404);
        }
        $a = $r->input('appointment_id');
        if ($a) {
            $x = DB::table('appointment')->where('id', $a)->where('patient_id', $p)->first();
            if (! $x) {
                return response()->json(['message' => 'Không tìm thấy lịch hẹn.'], 404);
            }
            if ($x->status !== 'completed') {
                return response()->json(['message' => 'Chỉ đánh giá được khi lịch hẹn đã hoàn thành.'], 400);
            }
        } elseif (! DB::table('consultation')->where('patient_id', $p)->where('doctor_id', $doctor)->where('status', 'completed')->exists()) {
            return response()->json(['message' => 'Bạn cần có ít nhất 1 phiên tư vấn hoàn thành với bác sĩ này.'], 400);
        }
        $q = DB::table('review')->where('patient_id', $p)->where('doctor_id', $doctor);
        $a ? $q->where('appointment_id', $a) : $q->whereNull('appointment_id');
        if ($q->exists()) {
            return response()->json(['message' => 'Bạn đã đánh giá bác sĩ này cho phiên này rồi.'], 409);
        }
        $id = DB::table('review')->insertGetId([
            'patient_id' => $p,
            'doctor_id' => $doctor,
            'appointment_id' => $a ?: null,
            'rating' => $rating,
            'title' => $r->input('title') ?: null,
            'comment' => $r->input('comment') ?: null,
            'is_anonymous' => $r->boolean('is_anonymous'),
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->audit->log($r, 'REVIEW_CREATE', 'review', $id, ['doctor_id' => $doctor, 'rating' => $rating, 'appointment_id' => $a ?: null]);

        return response()->json(['message' => 'Gửi đánh giá thành công. Đánh giá sẽ được duyệt trước khi hiển thị.', 'review_id' => $id], 201);
    }

    public function mine(Request $r)
    {
        $rows = DB::table('review as r')
            ->join('patient as p', 'r.patient_id', '=', 'p.id')
            ->join('doctor as d', 'r.doctor_id', '=', 'd.id')
            ->where('p.user_id', $r->attributes->get('legacy_auth_user')->id)
            ->select('r.*', 'd.full_name as doctor_name', 'd.avatar_url as doctor_avatar', 'd.doctor_code')
            ->orderByDesc('r.created_at')
            ->get();

        return response()->json(['message' => 'OK', 'data' => $rows]);
    }

    public function check(Request $r)
    {
        $doctor = $r->query('doctor_id');
        if (! $doctor) {
            return response()->json(['message' => 'doctor_id là bắt buộc.'], 400);
        }
        $p = $this->p($r);
        if (! $p) {
            return response()->json(['data' => ['exists' => false]]);
        }
        $q = DB::table('review')->where('patient_id', $p)->where('doctor_id', $doctor);
        $a = $r->query('appointment_id');
        $a ? $q->where('appointment_id', $a) : $q->whereNull('appointment_id');
        $x = $q->select('id', 'rating', 'status')->first();

        return response()->json(['data' => $x ? ['exists' => true, 'review' => $x] : ['exists' => false]]);
    }

    public function update(Request $r, $id)
    {
        if ($r->input('rating') && ($r->input('rating') < 1 || $r->input('rating') > 5)) {
            return response()->json(['message' => 'Rating phải từ 1 đến 5.'], 400);
        }
        $p = $this->p($r);
        $x = DB::table('review')->where('id', $id)->where('patient_id', $p)->first();
        if (! $x) {
            return response()->json(['message' => 'Không tìm thấy đánh giá.'], 404);
        }
        if ($x->status !== 'pending') {
            return response()->json(['message' => 'Chỉ sửa được đánh giá chưa duyệt.'], 400);
        }
        $d = [];
        foreach (['rating', 'title', 'comment', 'is_anonymous'] as $k) {
            if (($k === 'rating' && $r->input('rating')) || ($k !== 'rating' && $r->has($k))) {
                $d[$k] = $k === 'is_anonymous' ? $r->boolean($k) : $r->input($k);
            }
        }
        if (! $d) {
            return response()->json(['message' => 'Không có thông tin cập nhật.'], 400);
        }
        DB::table('review')->where('id', $id)->update($d + ['updated_at' => now()]);
        $this->audit->log($r, 'REVIEW_UPDATE', 'review', (int) $id, ['rating' => $r->input('rating'), 'title' => $r->input('title')]);

        return response()->json(['message' => 'Cập nhật đánh giá thành công.']);
    }

    public function delete(Request $r, $id)
    {
        $x = DB::table('review')->where('id', $id)->where('patient_id', $this->p($r))->first();
        if (! $x) {
            return response()->json(['message' => 'Không tìm thấy đánh giá.'], 404);
        }
        DB::table('review')->where('id', $id)->delete();
        $this->audit->log($r, 'REVIEW_DELETE', 'review', (int) $id, []);

        return response()->json(['message' => 'Xóa đánh giá thành công.']);
    }

    public function received(Request $r)
    {
        [$page, $limit, $offset] = $this->pageLimit($r, 10, 50);
        $doctorId = DB::table('doctor')->where('user_id', $r->attributes->get('legacy_auth_user')->id)->value('id');
        if (! $doctorId) {
            return response()->json(['message' => 'Không tìm thấy hồ sơ bác sĩ.'], 404);
        }

        $validStatuses = ['pending', 'approved', 'rejected', 'hidden'];
        $status = $r->query('status');
        $base = DB::table('review as r')->where('r.doctor_id', $doctorId);
        if ($status && in_array($status, $validStatuses, true)) {
            $base->where('r.status', $status);
        }

        $total = $base->count();
        $rows = DB::table('review as r')
            ->join('patient as p', 'r.patient_id', '=', 'p.id')
            ->where('r.doctor_id', $doctorId)
            ->when($status && in_array($status, $validStatuses, true), fn ($q) => $q->where('r.status', $status))
            ->select('r.*', DB::raw('CASE WHEN r.is_anonymous = 1 THEN NULL ELSE p.full_name END as patient_name'))
            ->orderByDesc('r.created_at')
            ->offset($offset)
            ->limit($limit)
            ->get();

        return response()->json([
            'message' => 'OK',
            'data' => $rows,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)],
        ]);
    }

    public function admin(Request $r)
    {
        $page = max(1, (int) $r->query('page', 1));
        $limit = min(100, max(1, (int) $r->query('limit', 25)));
        $q = DB::table('review as r');
        if ($r->query('status') && in_array($r->query('status'), ['pending', 'approved', 'rejected', 'hidden'], true)) {
            $q->where('r.status', $r->query('status'));
        }
        if ($r->query('doctor_id')) {
            $q->where('r.doctor_id', $r->query('doctor_id'));
        }
        if ($r->query('rating')) {
            $q->where('r.rating', (int) $r->query('rating'));
        }
        $total = $q->count();
        $rows = $q->join('patient as p', 'r.patient_id', '=', 'p.id')
            ->join('doctor as d', 'r.doctor_id', '=', 'd.id')
            ->select('r.*', 'p.full_name as patient_name', 'd.full_name as doctor_name', 'd.doctor_code')
            ->orderByRaw("CASE r.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'hidden' THEN 2 ELSE 3 END")
            ->orderByDesc('r.created_at')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get();

        return response()->json(['message' => 'OK', 'data' => $rows, 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)]]);
    }

    public function moderate(Request $r, $id)
    {
        $s = $r->input('status');
        if (! in_array($s, ['approved', 'rejected', 'hidden'])) {
            return response()->json(['message' => 'Status phải là approved, rejected hoặc hidden.'], 400);
        }
        $x = DB::table('review')->where('id', $id)->first();
        if (! $x) {
            return response()->json(['message' => 'Không tìm thấy đánh giá.'], 404);
        }
        $oldStatus = $x->status;
        DB::table('review')->where('id', $id)->update(['status' => $s, 'updated_at' => now()]);
        $this->audit->log($r, 'REVIEW_MODERATE', 'review', (int) $id, ['old_status' => $oldStatus, 'new_status' => $s]);
        $m = $s === 'approved' ? 'duyệt' : ($s === 'rejected' ? 'từ chối' : 'ẩn');

        return response()->json(['message' => "Đánh giá đã được $m."]);
    }
}
