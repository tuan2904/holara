<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Services\Auth\LegacyAuditService;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    public function __construct(private LegacyAuditService $audit) {}

    private function uid($r)
    {
        return $r->attributes->get('legacy_auth_user')->id;
    }

    private function patient($u)
    {
        return DB::table('patient')->where('user_id', $u)->value('id');
    }

    private function doctor($u)
    {
        return DB::table('doctor')->where('user_id', $u)->value('id');
    }

    private function rows($q)
    {
        return $q->select('a.*', 'd.full_name as doctor_name', 'd.avatar_url as doctor_avatar', 's.name as specialty_name', 'p.full_name as patient_name', 'p.phone as patient_phone', 'b.name as branch_name', 'b.code as branch_code')->from('appointment as a')->leftJoin('doctor as d', 'a.doctor_id', '=', 'd.id')->leftJoin('specialty as s', 'd.specialty_id', '=', 's.id')->leftJoin('patient as p', 'a.patient_id', '=', 'p.id')->leftJoin('branch as b', 'a.branch_id', '=', 'b.id');
    }

    public function slots(Request $r)
    {
        $r->validate(['doctor_id' => 'required|integer|min:1', 'date' => 'required|date_format:Y-m-d|after_or_equal:today', 'duration_minutes' => 'nullable|integer|min:5|max:240']);
        $d = $r->query('doctor_id');
        $date = $r->query('date');
        if (! $d || ! $date) {
            return response()->json(['message' => 'Missing doctor_id or date'], 400);
        }if ($r->query('branch_id') && ! DB::table('doctor_branch')->where('doctor_id', $d)->where('branch_id', $r->query('branch_id'))->whereNull('deleted_at')->exists()) {
            return response()->json(['message' => 'Doctor does not work at selected branch'], 400);
        }try {
            $s = DB::table('doctor_schedule')->where('doctor_id', $d)->where('work_date', $date)->where('status', 'active')->get();
            if ($s->isEmpty()) {
                return response()->json([]);
            }$book = DB::table('appointment')->where('doctor_id', $d)->whereDate('start_time', $date)->whereNotIn('status', ['cancelled', 'completed', 'no_show'])->get(['start_time', 'end_time']);
            $duration = (int) $r->query('duration_minutes', 30);
            $out = [];
            foreach ($s as $shift) {
                $start = (int) substr($shift->start_time, 0, 2) * 60 + (int) substr($shift->start_time, 3, 2);
                $end = (int) substr($shift->end_time, 0, 2) * 60 + (int) substr($shift->end_time, 3, 2);
                for ($t = $start; $t + $duration <= $end; $t += max(1, (int) ($shift->slot_duration ?: 30))) {
                    $conf = false;
                    foreach ($book as $b) {
                        $bs = Carbon::parse($b->start_time)->hour * 60 + Carbon::parse($b->start_time)->minute;
                        $be = Carbon::parse($b->end_time)->hour * 60 + Carbon::parse($b->end_time)->minute;
                        if ($t < $be && $t + $duration > $bs) {
                            $conf = true;
                            break;
                        }
                    }if (! $conf && Carbon::parse($date.' '.sprintf('%02d:%02d', intdiv($t, 60), $t % 60))->isFuture()) {
                        $out[] = sprintf('%02d:%02d', intdiv($t, 60), $t % 60);
                    }
                }
            }$out = array_values(array_unique($out));
            sort($out);

            return response()->json($out);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Error fetching schedule', 'error' => $e->getMessage()], 500);
        }
    }

    public function book(Request $r)
    {
        $u = $this->uid($r);
        $pid = $this->patient($u);
        if (! $pid) {
            return response()->json(['message' => 'Only patients can book appointments. Profile not found.'], 403);
        }
        $result = app(BookingService::class)->book($r->all(), (int) $pid);
        $this->audit->log($r, 'APPOINTMENT_CREATE', 'appointment', $result['appointment_id']);

        return response()->json(['message' => 'Booking successful'] + $result, 201);
    }

    public function mine(Request $r)
    {
        $u = $this->uid($r);
        $role = $r->attributes->get('legacy_auth_user')->role;
        $q = $this->rows(DB::query());
        if ($role === 'patient') {
            if (! ($p = $this->patient($u))) {
                return response()->json(['message' => 'Patient profile not found.'], 403);
            }$q->where('a.patient_id', $p);
        } elseif ($role === 'clinic_owner') {
            return $this->owner($r);
        } elseif ($role === 'doctor') {
            if (! ($d = $this->doctor($u))) {
                return response()->json(['message' => 'Doctor profile not found.'], 403);
            }$q->where('a.doctor_id', $d);
        }

        return response()->json($q->orderByDesc('a.appointment_date')->orderByDesc('a.start_time')->get());
    }

    public function admin(Request $r)
    {
        return response()->json($this->filtered($r, $this->rows(DB::query()))->get());
    }

    public function owner(Request $r)
    {
        $q = $this->rows(DB::query())->join('branch as own', 'a.branch_id', '=', 'own.id')->where('own.owner_user_id', $this->uid($r))->whereNull('own.deleted_at');

        return response()->json($this->filtered($r, $q, true)->get());
    }

    private function filtered($r, $q, $owner = false)
    {
        foreach (['status' => 'a.status', 'branch_id' => 'a.branch_id', 'doctor_id' => 'a.doctor_id'] as $in => $col) {
            if ($r->query($in)) {
                $q->where($col, $r->query($in));
            }
        }if ($r->query('start_date')) {
            $q->where('a.appointment_date', '>=', $r->query('start_date'));
        }if ($r->query('end_date')) {
            $q->where('a.appointment_date', '<=', $r->query('end_date'));
        }if ($r->query('search')) {
            $v = '%'.$r->query('search').'%';
            $q->where(fn ($x) => $x->where('p.full_name', 'like', $v)->orWhere('a.appointment_code', 'like', $v)->orWhere('d.full_name', 'like', $v));
        }

        return $q->orderByDesc('a.appointment_date')->orderByDesc('a.start_time');
    }

    public function consultation($id)
    {
        $x = DB::table('consultation')->select('id', 'status', 'chief_complaint', 'appointment_id', 'created_at')->where('appointment_id', $id)->first();

        return $x ? response()->json(['message' => 'OK', 'data' => $x]) : response()->json(['message' => 'Chưa có tư vấn liên kết với lịch hẹn này.'], 404);
    }

    public function show(Request $r, $id)
    {
        $x = $this->rows(DB::query())->where('a.id', $id)->first();
        if (! $x) {
            return response()->json(['message' => 'Không tìm thấy lịch khám!'], 404);
        }$role = $r->attributes->get('legacy_auth_user')->role;
        $u = $this->uid($r);
        if (($role === 'patient' && $x->patient_id != $this->patient($u)) || ($role === 'doctor' && $x->doctor_id != $this->doctor($u))) {
            return response()->json(['message' => 'Bạn không có quyền truy cập Video Call của lịch hẹn này!'], 403);
        }

        return response()->json($x);
    }

    public function status(Request $r, $id)
    {
        $r->validate(['status' => 'required|in:scheduled,confirmed,checked_in,in_progress,completed,cancelled,no_show', 'cancellation_reason' => 'nullable|string|max:2000']);
        $current = DB::table('appointment')->where('id', $id)->first();
        abort_unless($current, 404);
        abort_if(in_array($current->status, ['completed', 'cancelled', 'no_show'], true), 409, 'Appointment is already closed');
        $status = $r->input('status');
        if ($status === 'cancelled') {
            $x = DB::table('appointment')->where('id', $id)->first();
            if (! $x) {
                return response()->json(['message' => 'Appointment not found'], 404);
            }if (Carbon::parse($x->start_time)->diffInMinutes(now(), false) > -120) {
                return response()->json(['message' => 'Không thể hủy lịch trong vòng 2 giờ trước khi bắt đầu. Vui lòng liên hệ phòng khám.'], 400);
            }
        }try {
            DB::table('appointment')->where('id', $id)->update(['status' => $status, 'cancellation_reason' => $r->input('cancellation_reason'), 'updated_at' => now()]);
            $this->audit->log($r, 'APPOINTMENT_STATUS_CHANGE', 'appointment', (int) $id, ['status' => $status, 'cancellation_reason' => $r->input('cancellation_reason')]);

            return response()->json(['message' => $status === 'cancelled' ? 'Đã hủy lịch thành công!' : 'Đã cập nhật trạng thái ca khám!']);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
