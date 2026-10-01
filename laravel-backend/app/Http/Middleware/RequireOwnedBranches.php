<?php

namespace App\Http\Middleware;

use App\Services\Provider\ProviderAccessService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RequireOwnedBranches
{
    public function __construct(private readonly ProviderAccessService $provider) {}

    public function handle(Request $request, Closure $next)
    {
        $user = $request->attributes->get('legacy_auth_user');
        if (! $user?->id) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }
        if (array_intersect(ProviderAccessService::BYPASS_ROLES, $this->provider->roles((int) $user->id))) {
            return $next($request);
        }
        $ids = $request->input('branch_ids', []);
        if (! is_array($ids)) {
            $ids = [];
        }
        $routeBranch = $request->is('branches/*') ? $request->route('id') : null;
        if ($request->is('doctors/*') && $request->route('id')) {
            $ids = array_merge($ids, DB::table('doctor_branch')->where('doctor_id', $request->route('id'))->whereNull('deleted_at')->pluck('branch_id')->all());
        }
        foreach ([$request->input('branch_id'), $request->route('branch_id'), $routeBranch] as $id) {
            if (filter_var($id, FILTER_VALIDATE_INT) > 0) {
                $ids[] = (int) $id;
            }
        }
        $ids = array_values(array_unique($ids));
        if (! $ids) {
            return response()->json(['message' => 'branch_id or branch_ids is required'], 400);
        }
        foreach ($ids as $id) {
            if (! $this->provider->ownsBranch((int) $user->id, $id)) {
                return response()->json(['message' => 'You can only manage your own branches', 'branch_ids' => $ids], 403);
            }
        }

        return $next($request);
    }
}
