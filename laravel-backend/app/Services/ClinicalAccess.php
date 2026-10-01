<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClinicalAccess
{
    public function admin(object $user): bool
    {
        return (bool) array_intersect(['admin', 'super_admin'], $user->roles ?? [$user->role]);
    }

    public function doctor(object $user): ?int
    {
        return DB::table('doctor')->where('user_id', $user->id)->where('status', '<>', 'deleted')->value('id');
    }

    public function patient(object $user): ?int
    {
        return DB::table('patient')->where('user_id', $user->id)->value('id');
    }

    public function consultation(object $user, $id, bool $doctorOnly = false): object
    {
        $row = DB::table('consultation')->where('id', $id)->first();
        abort_unless($row, 404, 'Consultation not found');
        if ($this->admin($user)) {
            return $row;
        }
        $doctor = $this->doctor($user);
        $patient = $this->patient($user);
        $assigned = $doctor && ($row->doctor_id == $doctor || (! $row->doctor_id && $row->status === 'pending'));
        abort_unless($assigned || (! $doctorOnly && $patient && $patient == $row->patient_id), 403, 'Consultation access denied');

        return $row;
    }

    public function appointment(object $user, $id, bool $staffOnly = false): object
    {
        $row = DB::table('appointment')->where('id', $id)->first();
        abort_unless($row, 404, 'Appointment not found');
        if ($this->admin($user)) {
            return $row;
        }
        $owner = DB::table('branch')->where('id', $row->branch_id)->where('owner_user_id', $user->id)->whereNull('deleted_at')->exists();
        $doctor = $this->doctor($user);
        $patient = $this->patient($user);
        abort_unless($owner || ($doctor && $row->doctor_id == $doctor) || (! $staffOnly && $patient && $row->patient_id == $patient), 403, 'Appointment access denied');

        return $row;
    }

    public function authorize(Request $request, object $user): void
    {
        $path = trim($request->path(), '/');
        $write = ! $request->isMethod('GET');
        $admin = $this->admin($user);
        $recurringPath = preg_replace('~^api/~', '', $path);
        if (str_starts_with($recurringPath, 'recurring-appointments') && ! $admin) {
            if (preg_match('~^recurring-appointments/children/(\d+)/cancel$~', $recurringPath, $match)) {
                $this->appointment($user, $match[1]);
            } elseif (preg_match('~^recurring-appointments/(\d+)(?:/(children|cancel-all))?$~', $recurringPath, $match)) {
                abort_if($write && ($match[2] ?? '') !== 'cancel-all', 403);
                $series = DB::table('recurring_appointments')->where('id', $match[1])->first();
                abort_unless($series, 404);
                $patient = $this->patient($user);
                $doctor = $this->doctor($user);
                abort_unless(($patient && $series->patient_id == $patient) || ($doctor && $series->doctor_id == $doctor), 403);
            } elseif (preg_match('~^recurring-appointments/(patient|doctor)/(\d+)$~', $recurringPath, $match) && ! $write) {
                abort_unless($match[2] == $this->{$match[1]}($user), 403);
            } else {
                abort(403, 'Use the patient booking endpoint');
            }
        }
        if (str_starts_with($path, 'audit-logs')) {
            abort_unless($admin, 403, 'Administrator access required');
        }
        if (preg_match('~^consultations/(\d+)(?:/(.*))?$~', $path, $m)) {
            $action = $m[2] ?? '';
            $row = $this->consultation($user, $m[1], $action === 'reopen');
            if (str_starts_with($action, 'images/') && $write) {
                abort_unless($admin || $this->patient($user) == $row->patient_id, 403);
                abort_if(DB::table('ai_analysis_request')->where('consultation_image_id', $request->route('imageId'))->exists(), 409, 'An analyzed image cannot be deleted');
            }
        }
        if ($path === 'ai/analyze') {
            $this->consultation($user, $request->input('consultation_id'), true);
        }
        if (preg_match('~^ai/consultation/(\d+)$~', $path, $m)) {
            $this->consultation($user, $m[1]);
        }
        if (preg_match('~^ai/review/(\d+)$~', $path, $m)) {
            $id = DB::table('ai_analysis_request')->where('id', $m[1])->value('consultation_id');
            abort_unless($id, 404);
            $this->consultation($user, $id, true);
        }
        if (preg_match('~^appointments/(\d+)(?:/(.*))?$~', $path, $m)) {
            $this->appointment($user, $m[1], $write);
        }
        if ($path === 'appointments' && ! $write && ! $admin) {
            abort_unless(in_array($user->role, ['patient', 'doctor', 'clinic_owner'], true), 403);
        }
        if (preg_match('~^schedules/(\d+)$~', $path, $m) && $write && ! $admin) {
            $doctor = $this->doctor($user);
            abort_unless($doctor && DB::table('doctor_schedule')->where('id', $m[1])->where('doctor_id', $doctor)->exists(), 403, 'Schedule access denied');
        }
        if (preg_match('~^holoramind/chats/(\d+)/messages$~', $path, $m)) {
            $this->chat($user, $m[1]);
        }
        if ($path === 'holoramind/send' && $request->input('chatId')) {
            $this->chat($user, $request->input('chatId'));
        }
        if (preg_match('~^prescriptions/(consultation|appointment)/(\d+)$~', $path, $m)) {
            $this->{$m[1]}($user, $m[2]);
        }
        if ($path === 'prescriptions' && $write) {
            abort_unless($this->doctor($user), 403, 'Doctor required');
            $consultation = $request->input('consultation_id');
            $appointment = $request->input('appointment_id');
            abort_unless($consultation || $appointment, 422, 'A consultation or appointment is required');
            foreach (['consultation' => $consultation, 'appointment' => $appointment] as $type => $id) {
                if (! $id) {
                    continue;
                }
                $row = $this->{$type}($user, $id, true);
                abort_unless($row->patient_id == $request->input('patient_id'), 422, 'Patient does not match the clinical record');
                abort_unless($row->doctor_id == $this->doctor($user), 403, 'Doctor must be assigned before prescribing');
            }
        }
        if (preg_match('~^doctors/(\d+)$~', $path, $m) && $write && ! $admin) {
            $branches = DB::table('doctor_branch')->where('doctor_id', $m[1])->whereNull('deleted_at')->pluck('branch_id');
            abort_if($branches->isEmpty(), 403, 'Doctor is not in your branches');
            foreach ($branches as $branch) {
                abort_unless(DB::table('branch')->where('id', $branch)->where('owner_user_id', $user->id)->whereNull('deleted_at')->exists(), 403, 'Doctor is shared with another owner');
            }
        }
    }

    private function chat(object $user, $id): void
    {
        abort_unless(DB::table('holora_mind_chats')->where('id', $id)->where('user_id', $user->id)->whereNull('deleted_at')->exists(), 403, 'Chat access denied');
    }
}
