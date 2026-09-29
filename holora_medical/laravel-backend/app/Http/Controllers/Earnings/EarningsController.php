<?php

namespace App\Http\Controllers\Earnings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EarningsController extends Controller
{
    public function doctor($doctorId)
    {
        try {
            $row = DB::table('payment')
                ->where('doctor_id', $doctorId)
                ->selectRaw('IFNULL(SUM(amount),0) as total_earnings, COUNT(*) as payment_count')
                ->first();

            return response()->json([
                'doctorId' => $doctorId,
                'totalEarnings' => $row->total_earnings,
                'paymentCount' => $row->payment_count,
            ]);
        } catch (\Throwable $exception) {
            return response()->json(['error' => 'Database error', 'details' => $exception->getMessage()], 500);
        }
    }

    public function history(Request $request)
    {
        $doctorId = $request->attributes->get('legacy_auth_user')->id;

        try {
            $query = DB::table('payment')
                ->where('doctor_id', $doctorId)
                ->select('id', 'appointment_id', 'amount', 'paid_at', 'note');

            if ($request->query('from')) {
                $query->where('paid_at', '>=', $request->query('from'));
            }
            if ($request->query('to')) {
                $query->where('paid_at', '<=', $request->query('to'));
            }

            return response()->json($query->orderByDesc('paid_at')->get());
        } catch (\Throwable $exception) {
            return response()->json(['error' => 'Database error', 'details' => $exception->getMessage()], 500);
        }
    }
}
