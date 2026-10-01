<?php

use App\Http\Controllers\AI\AIController;
use App\Http\Controllers\Appointment\AppointmentController;
use App\Http\Controllers\Appointment\RecurringAppointmentController;
use App\Http\Controllers\Audit\AuditController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Branch\BranchController;
use App\Http\Controllers\Consultation\ConsultationController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Doctor\DoctorController;
use App\Http\Controllers\Earnings\EarningsController;
use App\Http\Controllers\HoloraMind\HoloraMindController;
use App\Http\Controllers\Notification\NotificationController;
use App\Http\Controllers\Patient\PatientController;
use App\Http\Controllers\Permission\PermissionController;
use App\Http\Controllers\Prescription\PrescriptionController;
use App\Http\Controllers\Review\ReviewController;
use App\Http\Controllers\Role\RoleController;
use App\Http\Controllers\Schedule\ScheduleController;
use App\Http\Controllers\Specialty\SpecialtyController;
use App\Http\Controllers\Subscription\SubscriptionController;
use App\Http\Controllers\Upload\UploadController;
use App\Http\Controllers\User\UserController;
use App\Http\Middleware\AuthenticateLegacyJwt;
use App\Http\Middleware\AuthorizeLegacyRoles;
use App\Http\Middleware\RequireOwnedBranches;
use App\Http\Middleware\RequireProviderEntitlement;
use App\Http\Middleware\RequireProviderRole;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'Holora Medical Backend is running']);
});

Route::get('/internal/health', function () {
    DB::select('SELECT 1 AS connection_ok');

    return response()->json([
        'status' => 'ok',
        'database' => 'connected',
        'image_processing_configured' => config('legacy.image_processing.url') !== '',
    ]);
});

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/google', [AuthController::class, 'google']);
    Route::post('/doctor-invite/accept', [AuthController::class, 'acceptDoctorInvite']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll'])->middleware(AuthenticateLegacyJwt::class);
    Route::post('/change-password', [AuthController::class, 'changePassword'])->middleware(AuthenticateLegacyJwt::class);
});

Route::prefix('audit-logs')->middleware(AuthenticateLegacyJwt::class)->group(function (): void {
    Route::get('/', [AuditController::class, 'index']);
    Route::get('/actions', [AuditController::class, 'actions']);
    Route::get('/entity-types', [AuditController::class, 'entityTypes']);
});
Route::get('/api/earnings/history', [EarningsController::class, 'history'])->middleware(AuthenticateLegacyJwt::class);
Route::prefix('earnings')->middleware(AuthenticateLegacyJwt::class)->group(function (): void {
    Route::get('/doctor/{doctorId}', [EarningsController::class, 'doctor']);
});
Route::prefix('dashboard')->group(function (): void {
    Route::get('/stats', [DashboardController::class, 'stats'])->middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':super_admin,admin,doctor,clinic_owner']);
    Route::get('/analytics', [DashboardController::class, 'analytics'])->middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':super_admin,admin,doctor,clinic_owner']);
    Route::get('/doctor', [DashboardController::class, 'doctor'])->middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':doctor']);
    Route::get('/patient', [DashboardController::class, 'patient'])->middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':patient']);
});
Route::prefix('holoramind')->middleware(AuthenticateLegacyJwt::class)->group(function (): void {
    Route::get('/chats', [HoloraMindController::class, 'chats']);
    Route::get('/chats/{chatId}/messages', [HoloraMindController::class, 'messages']);
    Route::post('/send', [HoloraMindController::class, 'send'])->withoutMiddleware(ValidateCsrfToken::class);
});
Route::prefix('schedules')->middleware(AuthenticateLegacyJwt::class)->group(function (): void {
    Route::get('/', [ScheduleController::class, 'index']);
    Route::post('/', [ScheduleController::class, 'store'])
        ->middleware(AuthorizeLegacyRoles::class.':super_admin,admin,doctor')
        ->withoutMiddleware(ValidateCsrfToken::class);
    Route::put('/{id}', [ScheduleController::class, 'update'])
        ->middleware(AuthorizeLegacyRoles::class.':super_admin,admin,doctor')
        ->withoutMiddleware(ValidateCsrfToken::class);
    Route::delete('/{id}', [ScheduleController::class, 'destroy'])
        ->middleware(AuthorizeLegacyRoles::class.':super_admin,admin,doctor')
        ->withoutMiddleware(ValidateCsrfToken::class);
});

Route::middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':admin,super_admin'])->group(function (): void {
    Route::prefix('permissions')->group(function (): void {
        Route::get('/', [PermissionController::class, 'index']);
        Route::get('/modules/list', [PermissionController::class, 'modules']);
        Route::get('/{id}', [PermissionController::class, 'show']);
        Route::post('/', [PermissionController::class, 'store']);
        Route::put('/{id}', [PermissionController::class, 'update']);
        Route::delete('/{id}', [PermissionController::class, 'destroy']);
    });
    Route::prefix('roles')->group(function (): void {
        Route::get('/', [RoleController::class, 'index']);
        Route::post('/', [RoleController::class, 'store']);
        Route::post('/permissions/assign', [RoleController::class, 'assignPermission']);
        Route::post('/permissions/remove', [RoleController::class, 'removePermission']);
        Route::get('/{id}/permissions', [RoleController::class, 'permissions']);
        Route::get('/{id}', [RoleController::class, 'show']);
        Route::put('/{id}', [RoleController::class, 'update']);
        Route::delete('/{id}', [RoleController::class, 'destroy']);
    });
    Route::prefix('users')->group(function (): void {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::post('/assign-role', [UserController::class, 'assignRole']);
        Route::post('/remove-role', [UserController::class, 'removeRole']);
        Route::get('/{user_id}/available-roles', [UserController::class, 'availableRoles']);
        Route::get('/{user_id}/roles', [UserController::class, 'roles']);
        Route::get('/{id}/sessions', [UserController::class, 'sessions']);
        Route::get('/{id}/login-history', [UserController::class, 'loginHistory']);
        Route::post('/{id}/force-logout', [UserController::class, 'forceLogout']);
        Route::delete('/{id}/sessions/{sessionId}', [UserController::class, 'revokeSession']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
    });
});

Route::prefix('specialties')->group(function (): void {
    Route::get('/', [SpecialtyController::class, 'index']);
    Route::get('/{id}', [SpecialtyController::class, 'show']);
    Route::middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':admin,super_admin'])->group(function (): void {
        Route::post('/', [SpecialtyController::class, 'store']);
        Route::put('/{id}', [SpecialtyController::class, 'update']);
        Route::patch('/{id}/parent', [SpecialtyController::class, 'parentUpdate']);
        Route::post('/{id}/reassign-delete', [SpecialtyController::class, 'reassignDelete']);
        Route::delete('/{id}', [SpecialtyController::class, 'destroy']);
    });
});
Route::prefix('branches')->group(function (): void {
    Route::get('/', [BranchController::class, 'index']);
    Route::get('/next-code', [BranchController::class, 'nextCode']);
    Route::get('/my', [BranchController::class, 'mine'])->middleware([AuthenticateLegacyJwt::class, RequireProviderRole::class]);
    Route::get('/{id}', [BranchController::class, 'show']);
    Route::post('/', [BranchController::class, 'store'])->middleware([AuthenticateLegacyJwt::class, RequireProviderRole::class, RequireProviderEntitlement::class.':branch.manage']);
    Route::put('/{id}', [BranchController::class, 'update'])->middleware([AuthenticateLegacyJwt::class, RequireProviderRole::class, RequireOwnedBranches::class, RequireProviderEntitlement::class.':branch.manage']);
    Route::delete('/{id}', [BranchController::class, 'destroy'])->middleware([AuthenticateLegacyJwt::class, RequireProviderRole::class, RequireOwnedBranches::class, RequireProviderEntitlement::class.':branch.manage']);
});
Route::prefix('doctors')->group(function (): void {
    Route::get('/', [DoctorController::class, 'index']);
    Route::get('/search', [DoctorController::class, 'search']);
    Route::get('/next-code', [DoctorController::class, 'nextCode']);
    Route::get('/my-branches', [DoctorController::class, 'myBranches'])->middleware([AuthenticateLegacyJwt::class, RequireProviderRole::class]);
    Route::get('/me/patients', [DoctorController::class, 'patients'])->middleware(AuthenticateLegacyJwt::class);
    Route::get('/me', [DoctorController::class, 'me'])->middleware(AuthenticateLegacyJwt::class);
    Route::put('/me', [DoctorController::class, 'updateMe'])->middleware(AuthenticateLegacyJwt::class);
    Route::get('/{id}', [DoctorController::class, 'show']);
    Route::post('/', [DoctorController::class, 'store'])->middleware([AuthenticateLegacyJwt::class, RequireProviderRole::class, RequireOwnedBranches::class, RequireProviderEntitlement::class.':doctor.manage']);
    Route::put('/{id}', [DoctorController::class, 'update'])->middleware([AuthenticateLegacyJwt::class, RequireProviderRole::class, RequireOwnedBranches::class, RequireProviderEntitlement::class.':doctor.manage']);
    Route::delete('/{id}', [DoctorController::class, 'destroy'])->middleware([AuthenticateLegacyJwt::class, RequireProviderRole::class, RequireProviderEntitlement::class.':doctor.manage']);
});
Route::prefix('patients')->group(function (): void {
    Route::get('/me', [PatientController::class, 'me'])->middleware(AuthenticateLegacyJwt::class);
    Route::put('/me', [PatientController::class, 'updateMe'])->middleware(AuthenticateLegacyJwt::class);
    Route::get('/me/stats', [PatientController::class, 'stats'])->middleware(AuthenticateLegacyJwt::class);
    Route::get('/me/doctors', [PatientController::class, 'myDoctors'])->middleware(AuthenticateLegacyJwt::class);
    Route::get('/me/branches', [PatientController::class, 'myBranches'])->middleware(AuthenticateLegacyJwt::class);
    Route::get('/my-branches', [PatientController::class, 'ownerBranches'])->middleware([AuthenticateLegacyJwt::class, RequireProviderRole::class]);
    Route::middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':admin,super_admin'])->group(function (): void {
        Route::get('/', [PatientController::class, 'index']);
        Route::get('/next-code', [PatientController::class, 'nextCode']);
        Route::get('/{id}', [PatientController::class, 'show']);
        Route::post('/', [PatientController::class, 'store']);
        Route::put('/{id}', [PatientController::class, 'update']);
        Route::delete('/{id}', [PatientController::class, 'destroy']);
    });
});
Route::prefix('appointments')->group(function (): void {
    Route::get('/available-slots', [AppointmentController::class, 'slots']);
    Route::middleware(AuthenticateLegacyJwt::class)->group(function (): void {
        Route::post('/', [AppointmentController::class, 'book'])->middleware(AuthorizeLegacyRoles::class.':patient');
        Route::get('/', [AppointmentController::class, 'mine']);
        Route::get('/admin/all', [AppointmentController::class, 'admin'])->middleware(AuthorizeLegacyRoles::class.':super_admin,admin');
        Route::get('/owner/all', [AppointmentController::class, 'owner'])->middleware(AuthorizeLegacyRoles::class.':clinic_owner');
        Route::get('/{id}/consultation', [AppointmentController::class, 'consultation']);
        Route::get('/{id}', [AppointmentController::class, 'show']);
        Route::put('/{id}/status', [AppointmentController::class, 'status'])->middleware(AuthorizeLegacyRoles::class.':super_admin,admin,doctor,clinic_owner');
    });
});
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
Route::prefix('notifications')->middleware(AuthenticateLegacyJwt::class)->group(function (): void {
    Route::get('/', [NotificationController::class, 'index']);
    Route::patch('/read-all', [NotificationController::class, 'readAll']);
    Route::patch('/{id}/read', [NotificationController::class, 'read']);
});
Route::prefix('consultations')->middleware(AuthenticateLegacyJwt::class)->group(function (): void {
    Route::post('/', [ConsultationController::class, 'create']);
    Route::get('/doctor-requests', [ConsultationController::class, 'doctor']);
    Route::get('/owner/all', [ConsultationController::class, 'owner'])->middleware(AuthorizeLegacyRoles::class.':clinic_owner');
    Route::get('/my-history', [ConsultationController::class, 'history']);
    Route::get('/{id}', [ConsultationController::class, 'detail']);
    Route::post('/{id}/responses', [ConsultationController::class, 'response']);
    Route::patch('/{id}/reopen', [ConsultationController::class, 'reopen']);
    Route::delete('/{id}/images/{imageId}', [ConsultationController::class, 'deleteImage']);
});
Route::post('/upload', [UploadController::class, 'store'])->middleware(AuthenticateLegacyJwt::class);
Route::get('/public/uploads/{file}', [UploadController::class, 'show'])->where('file', '[^/]+');
Route::prefix('ai')->middleware(AuthenticateLegacyJwt::class)->group(function (): void {
    Route::post('/analyze', [AIController::class, 'analyze']);
    Route::get('/consultation/{id}', [AIController::class, 'consultation']);
    Route::patch('/review/{id}', [AIController::class, 'review']);
});
Route::prefix('prescriptions')->middleware(AuthenticateLegacyJwt::class)->group(function (): void {
    Route::post('/', [PrescriptionController::class, 'create']);
    Route::get('/doctor/me', fn (Request $r) => app(PrescriptionController::class)->mine($r, 'doctor'));
    Route::get('/patient/me', fn (Request $r) => app(PrescriptionController::class)->mine($r, 'patient'));
    Route::get('/consultation/{id}', fn ($id) => app(PrescriptionController::class)->list('consultation_id', $id));
    Route::get('/appointment/{id}', fn ($id) => app(PrescriptionController::class)->list('appointment_id', $id));
    Route::get('/{id}', [PrescriptionController::class, 'show']);
    Route::put('/{id}', [PrescriptionController::class, 'update']);
    Route::post('/{id}/issue', [PrescriptionController::class, 'issue']);
    Route::post('/{id}/cancel', [PrescriptionController::class, 'cancel']);
});
Route::prefix('reviews')->group(function (): void {
    Route::get('/doctor/{id}', [ReviewController::class, 'doctor']);
    Route::get('/doctor/{id}/summary', [ReviewController::class, 'summary']);
    Route::middleware(AuthenticateLegacyJwt::class)->group(function (): void {
        Route::post('/', [ReviewController::class, 'create']);
        Route::get('/me', [ReviewController::class, 'mine']);
        Route::get('/check', [ReviewController::class, 'check']);
        Route::put('/{id}', [ReviewController::class, 'update']);
        Route::delete('/{id}', [ReviewController::class, 'delete']);
        Route::get('/received', [ReviewController::class, 'received']);
        Route::get('/admin', [ReviewController::class, 'admin'])->middleware(AuthorizeLegacyRoles::class.':admin,super_admin');
        Route::patch('/{id}/moderate', [ReviewController::class, 'moderate'])->middleware(AuthorizeLegacyRoles::class.':admin,super_admin');
    });
});
Route::prefix('subscriptions')->group(function (): void {
    Route::get('/plans', [SubscriptionController::class, 'plans']);
    Route::get('/me', [SubscriptionController::class, 'me'])->middleware(AuthenticateLegacyJwt::class);
    Route::post('/activate', [SubscriptionController::class, 'activate'])->middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':super_admin,admin,doctor,clinic_owner,branch_manager']);
    Route::post('/create-payment', [SubscriptionController::class, 'createPayment'])->middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':clinic_owner']);
    Route::post('/confirm-payment', [SubscriptionController::class, 'confirmPayment'])->middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':clinic_owner']);
    Route::get('/payment-history', [SubscriptionController::class, 'paymentHistory'])->middleware([AuthenticateLegacyJwt::class, AuthorizeLegacyRoles::class.':clinic_owner']);
});
