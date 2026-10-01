<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecurringAppointmentController extends Controller
{
    public function create(Request $request, BookingService $booking)
    {
        $request->validate(['patient_id' => 'required|integer|exists:patient,id']);
        $data = $request->all();
        $data['recurring'] = true;
        $data['appointment_date'] = $data['appointment_date'] ?? $data['start_date'] ?? null;
        $data['recurring_type'] = $data['recurring_type'] ?? $data['repeat_type'] ?? 'weekly';
        $data['recurring_interval'] = $data['recurring_interval'] ?? $data['repeat_interval'] ?? 1;
        $data['recurring_until'] = $data['recurring_until'] ?? $data['end_date'] ?? null;
        $data['recurring_days'] = $data['recurring_days'] ?? $data['repeat_days'] ?? [];

        return response()->json($booking->book($data, (int) $request->input('patient_id')), 201);
    }

    public function show($id)
    {
        $row = DB::table('recurring_appointments')->where('id', $id)->first();
        abort_unless($row, 404);

        return response()->json($row);
    }

    public function update(Request $request, $id)
    {
        // Generated dates are immutable; cancel and rebook to change the schedule.
        $data = $request->validate(['note' => 'nullable|string|max:2000']);
        DB::table('recurring_appointments')->where('id', $id)->update($data + ['updated_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        return $this->cancelAll($id);
    }

    public function patient($id)
    {
        return response()->json(DB::table('recurring_appointments')->where('patient_id', $id)->get());
    }

    public function doctor($id)
    {
        return response()->json(DB::table('recurring_appointments')->where('doctor_id', $id)->get());
    }

    public function children($id)
    {
        return response()->json(DB::table('appointment')->where('recurring_id', $id)->orderBy('appointment_date')->get());
    }

    public function cancelChild($id)
    {
        return DB::transaction(function () use ($id) {
            $row = DB::table('appointment')->where('id', $id)->lockForUpdate()->first();
            abort_unless($row, 404);
            abort_if(in_array($row->status, ['completed', 'cancelled', 'no_show']) || Carbon::parse($row->start_time)->lte(now()->addHours(2)), 409, 'Appointment cannot be cancelled');
            DB::table('appointment')->where('id', $id)->update(['status' => 'cancelled']);

            return response()->json(['success' => true]);
        });
    }

    public function cancelAll($id)
    {
        return DB::transaction(function () use ($id) {
            $rows = DB::table('appointment')->where('recurring_id', $id)->whereNotIn('status', ['completed', 'cancelled', 'no_show'])->lockForUpdate()->get();
            foreach ($rows as $row) {
                abort_if(Carbon::parse($row->start_time)->lte(now()->addHours(2)), 409, 'Series contains an appointment too close to its start');
            }
            DB::table('appointment')->whereIn('id', $rows->pluck('id'))->update(['status' => 'cancelled']);
            DB::table('recurring_appointments')->where('id', $id)->update(['status' => 'inactive']);

            return response()->json(['success' => true]);
        });
    }
}
