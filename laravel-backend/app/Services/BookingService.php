<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BookingService
{
    public function book(array $input, int $patientId): array
    {
        $data = Validator::make($input, [
            'doctor_id' => 'required|integer|min:1', 'branch_id' => 'required|integer|min:1',
            'appointment_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'start_time' => 'required|date_format:H:i', 'duration_minutes' => 'required|integer|min:5|max:240',
            'appointment_type' => 'nullable|in:online,offline', 'reason' => 'nullable|string|max:4000',
            'recurring' => 'nullable|boolean', 'recurring_type' => 'nullable|in:daily,weekly,monthly',
            'recurring_interval' => 'nullable|integer|min:1|max:12', 'recurring_count' => 'nullable|integer|min:1|max:30',
            'recurring_until' => 'nullable|date_format:Y-m-d|after_or_equal:appointment_date',
            'recurring_days' => 'nullable|array|max:7', 'recurring_days.*' => 'integer|between:0,6',
        ])->validate();

        return DB::transaction(function () use ($data, $patientId) {
            // All booking paths lock the same doctor before checking overlaps.
            $doctor = DB::table('doctor')->where('id', $data['doctor_id'])->where('status', 'active')->lockForUpdate()->first();
            abort_unless($doctor, 422, 'Doctor is not available');
            abort_unless(DB::table('doctor_branch')->where('doctor_id', $doctor->id)->where('branch_id', $data['branch_id'])->whereNull('deleted_at')->exists(), 422, 'Doctor does not work at this branch');
            $dates = $this->dates($data);
            $series = null;
            if (! empty($data['recurring'])) {
                $series = DB::table('recurring_appointments')->insertGetId([
                    'patient_id' => $patientId, 'doctor_id' => $doctor->id, 'branch_id' => $data['branch_id'],
                    'repeat_type' => $data['recurring_type'] ?? 'weekly', 'repeat_interval' => $data['recurring_interval'] ?? 1,
                    'repeat_days' => json_encode($data['recurring_days'] ?? []), 'start_date' => $dates[0],
                    'end_date' => end($dates), 'status' => 'active', 'note' => $data['reason'] ?? null,
                ]);
            }
            $ids = [];
            foreach ($dates as $date) {
                $start = Carbon::parse($date.' '.$data['start_time']);
                $end = $start->copy()->addMinutes($data['duration_minutes']);
                abort_unless($start->isFuture() && $start->isSameDay($end), 422, 'Appointment must be in the future and within one day');
                $shifts = DB::table('doctor_schedule')->where('doctor_id', $doctor->id)->where('work_date', $date)->where('status', 'active')->get();
                $fits = $shifts->contains(function ($shift) use ($date, $start, $end) {
                    $from = Carbon::parse($date.' '.$shift->start_time);
                    $to = Carbon::parse($date.' '.$shift->end_time);
                    $slot = max(1, (int) $shift->slot_duration);

                    return $start->gte($from) && $end->lte($to) && ((int) $from->diffInMinutes($start) % $slot === 0);
                });
                abort_unless($fits, 422, 'Time is outside the doctor schedule: '.$date);
                $overlap = DB::table('appointment')->where('doctor_id', $doctor->id)->whereNotIn('status', ['cancelled', 'completed', 'no_show'])->where('start_time', '<', $end)->where('end_time', '>', $start)->lockForUpdate()->first();
                abort_if($overlap, 409, 'This time has already been booked: '.$date);
                $ids[] = DB::table('appointment')->insertGetId([
                    'patient_id' => $patientId, 'doctor_id' => $doctor->id, 'branch_id' => $data['branch_id'], 'specialty_id' => $doctor->specialty_id,
                    'appointment_code' => 'APP'.str_replace('-', '', (string) Str::uuid()), 'appointment_date' => $date,
                    'start_time' => $start, 'end_time' => $end, 'appointment_type' => $data['appointment_type'] ?? 'online',
                    'reason' => $data['reason'] ?? null, 'status' => 'scheduled', 'recurring_id' => $series,
                ]);
            }

            return ['appointment_id' => $ids[0], 'appointment_ids' => $ids, 'recurring_id' => $series, 'count' => count($ids)];
        }, 3);
    }

    public function dates(array $data): array
    {
        $first = Carbon::parse($data['appointment_date'])->startOfDay();
        if (empty($data['recurring'])) {
            return [$first->toDateString()];
        }
        $last = isset($data['recurring_until']) ? Carbon::parse($data['recurring_until']) : $first->copy()->addMonthsNoOverflow(6);
        abort_if($last->gt($first->copy()->addYear()), 422, 'Recurring period cannot exceed one year');
        $limit = (int) ($data['recurring_count'] ?? 30);
        $step = (int) ($data['recurring_interval'] ?? 1);
        $type = $data['recurring_type'] ?? 'weekly';
        $days = $data['recurring_days'] ?? [];
        $dates = [];
        for ($day = $first->copy(); $day->lte($last) && count($dates) < $limit; $day->addDay()) {
            $elapsed = (int) $first->diffInDays($day);
            $match = match ($type) {
                'daily' => $elapsed % $step === 0,
                'monthly' => ($day->year * 12 + $day->month - $first->year * 12 - $first->month) % $step === 0 && $day->day === min($first->day, $day->daysInMonth),
                default => intdiv($elapsed, 7) % $step === 0 && in_array($day->dayOfWeek, $days ?: [$first->dayOfWeek]),
            };
            if ($match) {
                $dates[] = $day->toDateString();
            }
        }
        abort_unless($dates, 422, 'No dates match the recurring schedule');

        return $dates;
    }
}
