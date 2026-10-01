<?php

use App\Http\Controllers\Appointment\RecurringAppointmentController;
use App\Http\Middleware\AuthenticateLegacyJwt;
use Illuminate\Support\Facades\Route;

/* Phase 3.1 has no business API routes. */
Route::get('/internal/foundation', static fn () => response()->json([
    'status' => 'ok',
    'phase' => '3.1',
]));
Route::prefix('recurring-appointments')->middleware(AuthenticateLegacyJwt::class)->group(function (): void {
    Route::get('/{recurring_id}/children', [RecurringAppointmentController::class, 'children']);
    Route::post('/children/{id}/cancel', [RecurringAppointmentController::class, 'cancelChild']);
    Route::post('/{recurring_id}/cancel-all', [RecurringAppointmentController::class, 'cancelAll']);
    Route::post('/', [RecurringAppointmentController::class, 'create']);
    Route::get('/patient/{id}', [RecurringAppointmentController::class, 'patient']);
    Route::get('/doctor/{id}', [RecurringAppointmentController::class, 'doctor']);
    Route::get('/{id}', [RecurringAppointmentController::class, 'show']);
    Route::put('/{id}', [RecurringAppointmentController::class, 'update']);
    Route::delete('/{id}', [RecurringAppointmentController::class, 'destroy']);
});
