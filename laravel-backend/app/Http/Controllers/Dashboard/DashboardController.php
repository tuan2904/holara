<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        try {
            return response()->json([
                'users' => DB::table('users')->whereNull('deleted_at')->count(),
                'patients' => DB::table('patient')->where('status', '!=', 'blocked')->count(),
                'doctors' => DB::table('doctor')->where('status', '<>', 'deleted')->count(),
                'appointments' => DB::table('appointment')->count(),
                'consultations' => DB::table('consultation')->count(),
            ]);
        } catch (\Throwable $exception) {
            return response()->json(['error' => $exception->getMessage()], 500);
        }
    }

    public function analytics()
    {
        try {
            return response()->json([
                'appointmentsByMonth' => DB::table('appointment')
                    ->where('appointment_date', '>=', DB::raw('DATE_SUB(CURDATE(), INTERVAL 6 MONTH)'))
                    ->selectRaw("DATE_FORMAT(appointment_date, '%Y-%m') AS month, COUNT(*) AS count")
                    ->groupBy('month')
                    ->orderBy('month')
                    ->get(),
                'appointmentsByStatus' => DB::table('appointment')
                    ->selectRaw('status, COUNT(*) AS count')
                    ->groupBy('status')
                    ->orderByDesc('count')
                    ->get(),
                'consultationsByStatus' => DB::table('consultation')
                    ->selectRaw('status, COUNT(*) AS count')
                    ->groupBy('status')
                    ->orderByDesc('count')
                    ->get(),
                'topSpecialties' => DB::table('specialty as s')
                    ->leftJoin('doctor as d', function ($join) {
                        $join->on('d.specialty_id', '=', 's.id')->where('d.status', '<>', 'deleted');
                    })
                    ->where('s.status', 'active')
                    ->selectRaw('s.name, COUNT(d.id) AS count')
                    ->groupBy('s.id', 's.name')
                    ->orderByDesc('count')
                    ->limit(5)
                    ->get(),
            ]);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Database error', 'error' => $exception->getMessage()], 500);
        }
    }

    public function doctor(Request $request)
    {
        $userId = $request->attributes->get('legacy_auth_user')?->id;
        if (! $userId) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        try {
            $doctor = DB::table('doctor')
                ->where('user_id', $userId)
                ->where('status', '<>', 'deleted')
                ->select('id', 'full_name', 'doctor_code', 'avatar_url', 'specialty_id')
                ->first();
            if (! $doctor) {
                return response()->json(['message' => 'Doctor profile not found for this user'], 404);
            }

            $doctorId = $doctor->id;
            $today = now()->toDateString();
            $specialty = DB::table('specialty')->where('id', $doctor->specialty_id)->value('name');
            $branchNames = DB::table('branch as b')
                ->join('doctor_branch as db', function ($join) {
                    $join->on('db.branch_id', '=', 'b.id')->whereNull('db.deleted_at');
                })
                ->where('db.doctor_id', $doctorId)
                ->whereNull('b.deleted_at')
                ->pluck('b.name')
                ->all();

            return response()->json([
                'doctor' => [
                    'id' => $doctorId,
                    'full_name' => $doctor->full_name,
                    'doctor_code' => $doctor->doctor_code,
                    'avatar_url' => $doctor->avatar_url,
                    'specialty_name' => $specialty ?: null,
                    'branch_names' => $branchNames,
                ],
                'stats' => [
                    'today_appointments' => DB::table('appointment')->where('doctor_id', $doctorId)->whereDate('appointment_date', $today)->whereNotIn('status', ['cancelled', 'no_show'])->count(),
                    'total_appointments' => DB::table('appointment')->where('doctor_id', $doctorId)->count(),
                    'pending_consultations' => DB::table('consultation')->where(function ($query) use ($doctorId) {
                        $query->where('doctor_id', $doctorId)->orWhere(function ($nested) {
                            $nested->whereNull('doctor_id')->where('status', 'pending');
                        });
                    })->whereIn('status', ['pending', 'in_progress'])->count(),
                    'total_consultations' => DB::table('consultation')->where('doctor_id', $doctorId)->count(),
                    'total_patients' => DB::table('appointment')->where('doctor_id', $doctorId)->distinct('patient_id')->count('patient_id'),
                ],
                'upcoming_schedules' => DB::table('doctor_schedule')
                    ->where('doctor_id', $doctorId)
                    ->where('work_date', '>=', $today)
                    ->select('id', 'work_date', 'start_time', 'end_time', 'slot_duration', 'status')
                    ->orderBy('work_date')
                    ->orderBy('start_time')
                    ->limit(5)
                    ->get(),
                'recent_appointments' => DB::table('appointment as a')
                    ->leftJoin('patient as p', 'p.id', '=', 'a.patient_id')
                    ->where('a.doctor_id', $doctorId)
                    ->select('a.id', 'a.appointment_code', 'a.appointment_date', 'a.start_time', 'a.end_time', 'a.status', 'a.appointment_type', 'a.reason', 'p.full_name as patient_name')
                    ->orderByDesc('a.appointment_date')
                    ->orderByDesc('a.start_time')
                    ->limit(5)
                    ->get(),
                'appointments_by_status' => DB::table('appointment')->where('doctor_id', $doctorId)->selectRaw('status, COUNT(*) AS count')->groupBy('status')->get(),
            ]);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Database error', 'error' => $exception->getMessage()], 500);
        }
    }

    public function patient(Request $request)
    {
        $userId = $request->attributes->get('legacy_auth_user')?->id;
        if (! $userId) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        try {
            $patient = DB::table('patient as p')
                ->leftJoin('users as u', 'u.id', '=', 'p.user_id')
                ->where('p.user_id', $userId)
                ->where(function ($query) {
                    $query->where('p.status', '!=', 'blocked')->orWhereNull('p.status');
                })
                ->select('p.id', 'p.full_name', 'p.patient_code', 'p.phone', 'p.email', 'p.gender', 'p.date_of_birth', 'p.address', 'p.blood_group', 'p.allergies', 'p.medical_history', 'p.avatar_url', 'u.email as user_email')
                ->first();
            if (! $patient) {
                return response()->json(['message' => 'Patient profile not found'], 404);
            }

            $patientId = $patient->id;
            $today = now()->toDateString();
            $fields = ['full_name', 'phone', 'email', 'gender', 'date_of_birth', 'address', 'blood_group', 'allergies', 'emergency_contact_name'];
            $filled = count(array_filter($fields, fn ($field) => ! empty(trim((string) ($patient->{$field} ?? '')))));
            $profilePercent = round(($filled / count($fields)) * 100);

            return response()->json([
                'patient' => [
                    'id' => $patientId,
                    'full_name' => $patient->full_name,
                    'patient_code' => $patient->patient_code,
                    'avatar_url' => $patient->avatar_url,
                    'email' => $patient->email ?: $patient->user_email,
                    'phone' => $patient->phone,
                    'gender' => $patient->gender,
                    'blood_group' => $patient->blood_group,
                    'profile_percent' => $profilePercent,
                ],
                'stats' => [
                    'upcoming_appointments' => DB::table('appointment')->where('patient_id', $patientId)->where('appointment_date', '>=', $today)->whereIn('status', ['confirmed', 'scheduled'])->count(),
                    'total_appointments' => DB::table('appointment')->where('patient_id', $patientId)->count(),
                    'pending_consultations' => DB::table('consultation')->where('patient_id', $patientId)->whereIn('status', ['pending', 'in_progress'])->count(),
                    'completed_consultations' => DB::table('consultation')->where('patient_id', $patientId)->where('status', 'completed')->count(),
                    'total_consultations' => DB::table('consultation')->where('patient_id', $patientId)->count(),
                ],
                'next_appointment' => DB::table('appointment as a')
                    ->leftJoin('doctor as d', 'd.id', '=', 'a.doctor_id')
                    ->leftJoin('specialty as s', 's.id', '=', 'd.specialty_id')
                    ->leftJoin('branch as b', 'b.id', '=', 'a.branch_id')
                    ->where('a.patient_id', $patientId)
                    ->where('a.appointment_date', '>=', $today)
                    ->whereIn('a.status', ['confirmed', 'scheduled'])
                    ->select('a.id', 'a.appointment_code', 'a.appointment_date', 'a.start_time', 'a.end_time', 'a.status', 'a.appointment_type', 'd.full_name as doctor_name', 's.name as specialty_name', 'b.name as branch_name')
                    ->orderBy('a.appointment_date')
                    ->orderBy('a.start_time')
                    ->first(),
                'recent_appointments' => DB::table('appointment as a')
                    ->leftJoin('doctor as d', 'd.id', '=', 'a.doctor_id')
                    ->leftJoin('specialty as s', 's.id', '=', 'd.specialty_id')
                    ->where('a.patient_id', $patientId)
                    ->select('a.id', 'a.appointment_code', 'a.appointment_date', 'a.start_time', 'a.end_time', 'a.status', 'a.appointment_type', 'a.reason', 'd.full_name as doctor_name', 's.name as specialty_name')
                    ->orderByDesc('a.appointment_date')
                    ->orderByDesc('a.start_time')
                    ->limit(5)
                    ->get(),
                'recent_consultations' => DB::table('consultation as c')
                    ->leftJoin('doctor as d', 'd.id', '=', 'c.doctor_id')
                    ->where('c.patient_id', $patientId)
                    ->select('c.id', 'c.chief_complaint', 'c.status', 'c.created_at', 'd.full_name as doctor_name')
                    ->orderByDesc('c.created_at')
                    ->limit(5)
                    ->get(),
                'appointments_by_status' => DB::table('appointment')->where('patient_id', $patientId)->selectRaw('status, COUNT(*) AS count')->groupBy('status')->get(),
            ]);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Database error', 'error' => $exception->getMessage()], 500);
        }
    }
}
