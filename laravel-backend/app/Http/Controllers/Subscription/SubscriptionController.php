<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    private function positiveNumber($value, ?int $fallback = null): ?int
    {
        if (! is_numeric($value)) {
            return $fallback;
        }

        $number = (float) $value;
        if ((int) $number != $number || $number <= 0) {
            return $fallback;
        }

        return (int) $number;
    }

    private function doctorId(int $userId): ?int
    {
        return DB::table('doctor')
            ->where('user_id', $userId)
            ->where('status', '<>', 'deleted')
            ->orderByDesc('id')
            ->value('id');
    }

    public function plans()
    {
        try {
            $rows = DB::table('subscription_plan as p')
                ->leftJoin('subscription_entitlement as e', 'e.plan_id', '=', 'p.id')
                ->whereNull('p.deleted_at')
                ->where('p.status', 'active')
                ->select(
                    'p.id',
                    'p.code',
                    'p.name',
                    'p.scope_type',
                    'p.billing_cycle',
                    'p.price_cents',
                    'p.currency',
                    'p.status',
                    'e.feature_code',
                    'e.is_enabled',
                    'e.limit_value'
                )
                ->orderBy('p.scope_type')
                ->orderBy('p.price_cents')
                ->orderBy('e.feature_code')
                ->get();

            $grouped = [];
            foreach ($rows as $row) {
                if (! isset($grouped[$row->id])) {
                    $grouped[$row->id] = [
                        'id' => $row->id,
                        'code' => $row->code,
                        'name' => $row->name,
                        'scope_type' => $row->scope_type,
                        'billing_cycle' => $row->billing_cycle,
                        'price_cents' => $row->price_cents,
                        'currency' => $row->currency,
                        'status' => $row->status,
                        'entitlements' => [],
                    ];
                }

                if ($row->feature_code) {
                    $grouped[$row->id]['entitlements'][] = [
                        'feature_code' => $row->feature_code,
                        'is_enabled' => (bool) $row->is_enabled,
                        'limit_value' => $row->limit_value,
                    ];
                }
            }

            return response()->json(['message' => 'Subscription plans fetched successfully', 'data' => array_values($grouped)]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Database error', 'error' => $e->getMessage()], 500);
        }
    }

    public function me(Request $r)
    {
        $userId = $r->attributes->get('legacy_auth_user')?->id;
        if (! $userId) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        try {
            $doctorId = $this->doctorId((int) $userId);
            $q = DB::table('provider_subscription as ps')
                ->join('subscription_plan as p', 'p.id', '=', 'ps.plan_id')
                ->whereNull('ps.deleted_at')
                ->where(function ($query) use ($userId, $doctorId) {
                    $query->where('ps.owner_user_id', $userId);
                    if ($doctorId) {
                        $query->orWhere(function ($nested) use ($doctorId) {
                            $nested->where('ps.scope_type', 'doctor')->where('ps.scope_id', $doctorId);
                        });
                    }
                })
                ->select(
                    'ps.id',
                    'ps.scope_type',
                    'ps.scope_id',
                    'ps.status',
                    'ps.starts_at',
                    'ps.ends_at',
                    'ps.trial_ends_at',
                    'ps.auto_renew',
                    'ps.created_at',
                    'ps.updated_at',
                    'p.code as plan_code',
                    'p.name as plan_name',
                    'p.billing_cycle',
                    'p.price_cents',
                    'p.currency'
                )
                ->orderByDesc('ps.created_at')
                ->get();

            return response()->json(['message' => 'Subscriptions fetched successfully', 'data' => $q]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Database error', 'error' => $e->getMessage()], 500);
        }
    }

    public function activate(Request $r)
    {
        $r->validate(['months' => 'nullable|integer|min:1|max:12']);
        $userId = $r->attributes->get('legacy_auth_user')?->id;
        if (! $userId) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        $planCode = $r->input('plan_code');
        $scopeType = $r->input('scope_type');
        $scopeId = $r->input('scope_id');
        $durationMonths = $this->positiveNumber($r->input('months'), 1);

        if (! $planCode || ! $scopeType || ! $scopeId) {
            return response()->json(['message' => 'plan_code, scope_type and scope_id are required'], 400);
        }
        if (! in_array($scopeType, ['doctor', 'branch', 'account'], true)) {
            return response()->json(['message' => 'scope_type must be doctor, branch, or account'], 400);
        }

        $resolvedScopeId = $scopeType === 'account' ? (int) $userId : $this->positiveNumber($scopeId);
        if (! $resolvedScopeId) {
            return response()->json(['message' => 'scope_id must be a positive number'], 400);
        }

        try {
            $plan = DB::table('subscription_plan')
                ->where('code', $planCode)
                ->where('status', 'active')
                ->whereNull('deleted_at')
                ->select('id', 'code', 'name', 'scope_type', 'price_cents')
                ->first();
            if (! $plan) {
                return response()->json(['message' => 'Plan not found'], 404);
            }
            if ($plan->scope_type !== $scopeType) {
                return response()->json(['message' => "Plan {$plan->code} does not support scope_type {$scopeType}"], 400);
            }

            abort_if((int) $plan->price_cents > 0, 403, 'Paid plans require the explicit demo payment flow');
            if ($scopeType === 'branch') {
                abort_unless(DB::table('branch')->where('id', $resolvedScopeId)->where('owner_user_id', $userId)->exists(), 403);
            }
            if ($scopeType === 'doctor') {
                abort_unless(DB::table('doctor')->where('id', $resolvedScopeId)->where('user_id', $userId)->exists(), 403);
            }

            $startsAt = now();
            $endsAt = $scopeType === 'account' ? null : $startsAt->copy()->addMonths($durationMonths);
            $existingId = DB::table('provider_subscription')
                ->where('scope_type', $scopeType)
                ->where('scope_id', $resolvedScopeId)
                ->where('owner_user_id', $userId)
                ->whereNull('deleted_at')
                ->orderByDesc('id')
                ->value('id');

            if ($existingId) {
                DB::table('provider_subscription')->where('id', $existingId)->update([
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                    'trial_ends_at' => null,
                    'auto_renew' => 1,
                    'updated_at' => now(),
                ]);

                return response()->json(['message' => 'Subscription activated successfully', 'data' => [
                    'subscription_id' => $existingId,
                    'plan_code' => $plan->code,
                    'scope_type' => $scopeType,
                    'scope_id' => $resolvedScopeId,
                    'status' => 'active',
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                ]]);
            }

            $id = DB::table('provider_subscription')->insertGetId([
                'plan_id' => $plan->id,
                'scope_type' => $scopeType,
                'scope_id' => $resolvedScopeId,
                'owner_user_id' => $userId,
                'status' => 'active',
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'trial_ends_at' => null,
                'auto_renew' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json(['message' => 'Subscription activated successfully', 'data' => [
                'subscription_id' => $id,
                'plan_code' => $plan->code,
                'scope_type' => $scopeType,
                'scope_id' => $resolvedScopeId,
                'status' => 'active',
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
            ]], 201);
        } catch (\Throwable $e) {
            throw $e;
        }
    }

    public function createPayment(Request $r)
    {
        abort_unless(config('legacy.demo_payments'), 403, 'Demo payments are disabled');
        $r->validate(['months' => 'nullable|integer|min:1|max:12', 'scope_type' => 'nullable|in:account']);
        $userId = $r->attributes->get('legacy_auth_user')?->id;
        if (! $userId) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        $planCode = $r->input('plan_code');
        $scopeType = $r->input('scope_type', 'account');
        $durationMonths = $this->positiveNumber($r->input('months', 1), 1);
        $paymentMethod = $r->input('payment_method');

        if (! $planCode) {
            return response()->json(['message' => 'plan_code is required'], 400);
        }
        if (! $paymentMethod) {
            return response()->json(['message' => 'payment_method is required'], 400);
        }
        if (! in_array($paymentMethod, ['vnpay', 'momo', 'zalopay', 'bank_transfer'], true)) {
            return response()->json(['message' => 'Invalid payment_method'], 400);
        }

        try {
            $plan = DB::table('subscription_plan')
                ->where('code', $planCode)
                ->where('status', 'active')
                ->whereNull('deleted_at')
                ->where('scope_type', 'account')->select('id', 'code', 'name', 'price_cents', 'currency')
                ->first();
            if (! $plan) {
                return response()->json(['message' => 'Plan not found'], 404);
            }
            if ((int) $plan->price_cents === 0) {
                return response()->json(['message' => 'Free plans do not require payment'], 400);
            }

            $amountCents = (int) $plan->price_cents * $durationMonths;
            $token = bin2hex(random_bytes(32));
            $expiresAt = now()->addMinutes(15);
            $id = DB::table('payment_order')->insertGetId([
                'user_id' => $userId,
                'plan_code' => $planCode,
                'scope_type' => $scopeType,
                'months' => $durationMonths,
                'amount_cents' => $amountCents,
                'currency' => $plan->currency ?: 'VND',
                'payment_method' => $paymentMethod,
                'status' => 'pending',
                'token' => $token,
                'expires_at' => $expiresAt,
            ]);

            return response()->json(['message' => 'DEMO ONLY: no money is charged', 'demo' => true, 'data' => [
                'order_id' => $id,
                'plan_code' => $planCode,
                'plan_name' => $plan->name,
                'amount_cents' => $amountCents,
                'currency' => $plan->currency ?: 'VND',
                'payment_method' => $paymentMethod,
                'token' => $token,
                'expires_at' => $expiresAt,
            ]], 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Database error', 'error' => $e->getMessage()], 500);
        }
    }

    public function paymentHistory(Request $r)
    {
        $userId = $r->attributes->get('legacy_auth_user')?->id;
        if (! $userId) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        try {
            $rows = DB::table('payment_order as po')
                ->leftJoin('subscription_plan as sp', function ($join) {
                    $join->on('sp.code', '=', 'po.plan_code')->whereNull('sp.deleted_at');
                })
                ->where('po.user_id', $userId)
                ->select(
                    'po.id',
                    'po.plan_code',
                    'po.scope_type',
                    'po.months',
                    'po.amount_cents',
                    'po.currency',
                    'po.payment_method',
                    'po.status',
                    'po.invoice_number',
                    'po.paid_at',
                    'po.description',
                    'po.created_at',
                    'sp.name as plan_name'
                )
                ->orderByDesc('po.created_at')
                ->get();

            return response()->json(['message' => 'Payment history fetched', 'data' => $rows]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Database error', 'error' => $e->getMessage()], 500);
        }
    }

    public function confirmPayment(Request $r)
    {
        abort_unless(config('legacy.demo_payments'), 403, 'Demo payments are disabled');
        $userId = $r->attributes->get('legacy_auth_user')?->id;
        if (! $userId) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        $token = $r->input('token');
        if (! $token) {
            return response()->json(['message' => 'token is required'], 400);
        }

        return DB::transaction(function () use ($token, $userId) {
            try {
                DB::table('users')->where('id', $userId)->lockForUpdate()->first();
                $order = DB::table('payment_order')->where('token', $token)->where('user_id', $userId)->lockForUpdate()->first();
                if (! $order) {
                    return response()->json(['message' => 'Payment order not found'], 404);
                }
                if ($order->status === 'paid') {
                    return response()->json(['message' => 'Payment already processed'], 400);
                }
                if ($order->status !== 'pending') {
                    return response()->json(['message' => 'Payment order is no longer valid'], 400);
                }
                if (now()->gt(Carbon::parse($order->expires_at))) {
                    DB::table('payment_order')->where('id', $order->id)->update(['status' => 'expired', 'updated_at' => now()]);

                    return response()->json(['message' => 'Payment order has expired. Please try again.'], 400);
                }

                $invoiceNumber = 'INV-'.gmdate('Ymd').'-'.str_pad((string) $order->id, 4, '0', STR_PAD_LEFT);
                $description = "DEMO ONLY: {$order->plan_code}, {$order->months} month(s). No money charged.";
                DB::table('payment_order')->where('id', $order->id)->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'invoice_number' => $invoiceNumber,
                    'description' => $description,
                    'updated_at' => now(),
                ]);

                $plan = DB::table('subscription_plan')
                    ->where('code', $order->plan_code)
                    ->where('status', 'active')
                    ->whereNull('deleted_at')
                    ->select('id', 'code', 'name', 'scope_type')
                    ->first();
                if (! $plan) {
                    throw new \RuntimeException('Plan not found after payment');
                }

                $startsAt = now();
                $endsAt = $startsAt->copy()->addMonths((int) $order->months);
                $resolvedScopeId = (int) $userId;
                $existingId = DB::table('provider_subscription')
                    ->where('scope_type', $order->scope_type)
                    ->where('scope_id', $resolvedScopeId)
                    ->where('owner_user_id', $userId)
                    ->whereNull('deleted_at')
                    ->orderByDesc('id')
                    ->value('id');

                if ($existingId) {
                    DB::table('provider_subscription')->where('id', $existingId)->update([
                        'plan_id' => $plan->id,
                        'status' => 'active',
                        'starts_at' => $startsAt,
                        'ends_at' => $endsAt,
                        'trial_ends_at' => null,
                        'auto_renew' => 1,
                        'updated_at' => now(),
                    ]);
                } else {
                    DB::table('provider_subscription')->insert([
                        'plan_id' => $plan->id,
                        'scope_type' => $order->scope_type,
                        'scope_id' => $resolvedScopeId,
                        'owner_user_id' => $userId,
                        'status' => 'active',
                        'starts_at' => $startsAt,
                        'ends_at' => $endsAt,
                        'trial_ends_at' => null,
                        'auto_renew' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                return response()->json(['message' => 'Demo payment confirmed; no money charged', 'demo' => true, 'data' => [
                    'order_id' => $order->id,
                    'plan_code' => $order->plan_code,
                    'status' => 'active',
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                ]]);
            } catch (\Throwable $e) {
                throw $e;
            }
        });
    }
}
