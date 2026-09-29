<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleController extends Controller
{
    private const TABLE_MISSING_MESSAGE = 'doctor_schedule table is missing. Please run schedule migration (npm run migrate:schedule).';

    private function doctorIdForUser($userId)
    {
        if (! $userId) {
            return null;
        }

        return DB::table('doctor')->where('user_id', $userId)->value('id');
    }

    private function dbError(\Throwable $exception, string $message)
    {
        if (str_contains($exception->getMessage(), 'doctor_schedule')) {
            return response()->json(['message' => self::TABLE_MISSING_MESSAGE, 'error' => $exception->getMessage()], 500);
        }

        return response()->json(['message' => $message, 'error' => $exception->getMessage()], 500);
    }

    public function index(Request $request)
    {
        $role = $request->attributes->get('legacy_auth_user')?->role;
        $isAdmin = in_array($role, ['super_admin', 'admin'], true);

        try {
            $effectiveDoctorId = $request->query('doctor_id') ?: null;
            if ($role === 'doctor') {
                $effectiveDoctorId = $this->doctorIdForUser($request->attributes->get('legacy_auth_user')->id);
                if (! $effectiveDoctorId) {
                    return response()->json(['message' => 'This account is not linked to a doctor profile.'], 400);
                }
            }

            if ($isAdmin) {
                $query = DB::table('doctor_schedule as ds')
                    ->leftJoin('doctor as d', 'ds.doctor_id', '=', 'd.id')
                    ->leftJoin('specialty as s', 'd.specialty_id', '=', 's.id')
                    ->leftJoin('doctor_branch as db', function ($join) {
                        $join->on('db.doctor_id', '=', 'd.id')->whereNull('db.deleted_at');
                    })
                    ->leftJoin('branch as b', function ($join) {
                        $join->on('b.id', '=', 'db.branch_id')->whereNull('b.deleted_at');
                    })
                    ->selectRaw("ds.*, d.full_name AS doctor_name, d.doctor_code, d.avatar_url AS doctor_avatar, s.name AS specialty_name, GROUP_CONCAT(DISTINCT b.name ORDER BY b.name SEPARATOR ', ') AS branch_names");
            } else {
                $query = DB::table('doctor_schedule as ds')->select('ds.*');
            }

            if ($effectiveDoctorId) {
                $query->where('ds.doctor_id', $effectiveDoctorId);
            }
            if ($request->query('start_date')) {
                $query->where('ds.work_date', '>=', $request->query('start_date'));
            }
            if ($request->query('end_date')) {
                $query->where('ds.work_date', '<=', $request->query('end_date'));
            }

            if ($isAdmin) {
                $query->groupBy('ds.id')->orderByDesc('ds.work_date')->orderByDesc('ds.start_time');
            } else {
                $query->orderBy('ds.work_date')->orderBy('ds.start_time');
            }

            return response()->json($query->get());
        } catch (\Throwable $exception) {
            return $this->dbError($exception, 'Error fetching schedules');
        }
    }

    public function store(Request $request)
    {
        $schedules = $request->input('schedules');
        if (! $schedules || ! is_array($schedules) || count($schedules) === 0) {
            return response()->json(['message' => 'Invalid data format. Expected array of schedules.'], 400);
        }

        try {
            $effectiveDoctorId = $request->input('doctor_id') ?: null;
            if ($request->attributes->get('legacy_auth_user')?->role === 'doctor') {
                $effectiveDoctorId = $this->doctorIdForUser($request->attributes->get('legacy_auth_user')->id);
            }
            if (! $effectiveDoctorId) {
                return response()->json(['message' => 'This account is not linked to a doctor profile.'], 400);
            }

            $values = array_map(fn ($schedule) => [
                'doctor_id' => $effectiveDoctorId,
                'work_date' => $schedule['work_date'] ?? null,
                'start_time' => $schedule['start_time'] ?? null,
                'end_time' => $schedule['end_time'] ?? null,
                'slot_duration' => $schedule['slot_duration'] ?? 30,
                'status' => 'active',
            ], $schedules);

            DB::table('doctor_schedule')->insert($values);

            return response()->json(['message' => 'Schedules bulk-created successfully!', 'affectedRows' => count($values)], 201);
        } catch (\Throwable $exception) {
            return $this->dbError($exception, 'Error adding schedules');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $affected = DB::table('doctor_schedule')->where('id', $id)->update([
                'work_date' => $request->input('work_date'),
                'start_time' => $request->input('start_time'),
                'end_time' => $request->input('end_time'),
                'slot_duration' => $request->input('slot_duration') ?: 30,
                'status' => $request->input('status') ?: 'active',
            ]);

            if ($affected === 0) {
                return response()->json(['message' => 'Schedule not found'], 404);
            }

            return response()->json(['message' => 'Schedule updated successfully']);
        } catch (\Throwable $exception) {
            return $this->dbError($exception, 'Error updating schedule');
        }
    }

    public function destroy($id)
    {
        try {
            $affected = DB::table('doctor_schedule')->where('id', $id)->delete();
            if ($affected === 0) {
                return response()->json(['message' => 'Schedule not found'], 404);
            }

            return response()->json(['message' => 'Schedule deleted successfully']);
        } catch (\Throwable $exception) {
            return $this->dbError($exception, 'Error deleting schedule');
        }
    }
}
