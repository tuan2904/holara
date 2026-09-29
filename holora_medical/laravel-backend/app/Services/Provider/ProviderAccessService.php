<?php

namespace App\Services\Provider;

use Illuminate\Support\Facades\DB;

class ProviderAccessService
{
    public const ROLES = ['super_admin', 'admin', 'doctor', 'clinic_owner', 'branch_manager'];
    public const BYPASS_ROLES = ['super_admin', 'admin'];

    public function roles(int $userId): array
    {
        return DB::table('user_role as ur')->join('role as r', 'r.id', '=', 'ur.role_id')->where('ur.user_id', $userId)->pluck('r.code')->all();
    }

    public function ownsBranch(int $userId, int $branchId): bool
    {
        return DB::table('branch')->where('id', $branchId)->where('owner_user_id', $userId)->whereNull('deleted_at')->exists();
    }

    public function candidates(int $userId, array $scopeOrder = ['account', 'branch', 'doctor'], ?int $branchId = null, ?int $doctorId = null): array
    {
        $all = ['account' => $userId, 'branch' => $branchId, 'doctor' => $doctorId];
        return array_values(array_filter(array_map(fn ($scope) => ! empty($all[$scope]) ? ['scopeType' => $scope, 'scopeId' => $all[$scope]] : null, $scopeOrder)));
    }

    public function entitled(int $userId, string $featureCode, array $scopeOrder = ['account', 'branch', 'doctor'], ?int $branchId = null, ?int $doctorId = null): ?object
    {
        if (array_intersect(self::BYPASS_ROLES, $this->roles($userId))) return (object) ['bypass' => true];
        foreach ($this->candidates($userId, $scopeOrder, $branchId, $doctorId) as $candidate) {
            $scope = $candidate['scopeType']; $scopeId = $candidate['scopeId'];
            $subscription = DB::table('provider_subscription as ps')->join('subscription_plan as p', 'p.id', '=', 'ps.plan_id')->join('subscription_entitlement as se', 'se.plan_id', '=', 'p.id')
                ->where('ps.scope_type', $scope)->where('ps.scope_id', $scopeId)->where('ps.owner_user_id', $userId)->whereIn('ps.status', ['active', 'trialing'])
                ->whereNull('ps.deleted_at')->where(fn ($q) => $q->whereNull('ps.ends_at')->orWhere('ps.ends_at', '>=', now()))
                ->where(fn ($q) => $q->whereNull('ps.trial_ends_at')->orWhere('ps.trial_ends_at', '>=', now())->orWhere('ps.status', 'active'))
                ->where('p.status', 'active')->where('se.feature_code', $featureCode)->where('se.is_enabled', 1)->orderByDesc('ps.id')
                ->select('ps.*', 'p.code as plan_code', 'se.limit_value')->first();
            if ($subscription) return $subscription;
        }
        return null;
    }

    public function quotaAvailable(int $userId, object $grant, string $resource, ?int $branchId = null): array
    {
        $limit = (int) ($grant->limit_value ?? 0);
        if ($limit <= 0 || ! empty($grant->bypass)) return ['allowed' => true, 'limit' => $limit, 'current' => 0];
        if ($resource === 'branch') $current = DB::table('branch')->where('owner_user_id', $userId)->whereNull('deleted_at')->count();
        elseif (in_array($grant->scope_type ?? '', ['account', 'branch'], true) && $branchId) $current = DB::table('doctor_branch as db')->join('doctor as d', 'd.id', '=', 'db.doctor_id')->where('db.branch_id', $branchId)->whereNull('db.deleted_at')->where('d.status', '<>', 'deleted')->distinct('db.doctor_id')->count('db.doctor_id');
        else $current = DB::table('doctor')->where('created_by_user_id', $userId)->where('status', '<>', 'deleted')->count();
        return ['allowed' => $current < $limit, 'limit' => $limit, 'current' => $current];
    }

    public function ensureTrial(int $userId, string $scopeType, int $scopeId): void
    {
        $code = $scopeType === 'branch' ? 'BRANCH_TRIAL_30D' : 'DOCTOR_TRIAL_14D';
        $plan = DB::table('subscription_plan')->where('code', $code)->where('status', 'active')->whereNull('deleted_at')->first();
        if (! $plan) return;
        if (DB::table('provider_subscription')->where('scope_type', $scopeType)->where('scope_id', $scopeId)->whereNull('deleted_at')->exists()) return;
        DB::table('provider_subscription')->insert(['plan_id' => $plan->id, 'scope_type' => $scopeType, 'scope_id' => $scopeId, 'owner_user_id' => $userId, 'status' => 'trialing', 'starts_at' => now(), 'ends_at' => null, 'trial_ends_at' => now()->addDays($scopeType === 'branch' ? 30 : 14), 'auto_renew' => false]);
    }
}
