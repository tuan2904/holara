<?php

namespace Tests;

use App\Services\Auth\LegacyAuthService;
use App\Services\BookingService;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Process\Process;

class RegressionTest extends TestCase
{
    private array $patient;

    private array $other;

    private array $doctor;

    private int $caseId;

    private int $branch;

    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.connections.mysql.database') !== 'medecode_test' || ! app()->environment('testing')) {
            throw new \RuntimeException('Tests may only run on medecode_test');
        }
        DB::beginTransaction();
        config(['legacy.uploads.path' => storage_path('framework/testing/uploads'), 'legacy.demo_payments' => false]);
        $this->patient = $this->account('patient');
        $this->other = $this->account('patient');
        $this->doctor = $this->account('doctor');
        $this->branch = DB::table('branch')->insertGetId(['name' => 'Test', 'code' => uniqid('BR'), 'address' => 'Synthetic']);
        DB::table('doctor_branch')->insert(['doctor_id' => $this->doctor['profile'], 'branch_id' => $this->branch]);
        $this->caseId = DB::table('consultation')->insertGetId(['patient_id' => $this->patient['profile'], 'doctor_id' => $this->doctor['profile'], 'chief_complaint' => 'Synthetic', 'symptoms' => 'Synthetic', 'status' => 'pending']);
    }

    protected function tearDown(): void
    {
        DB::rollBack();
        File::deleteDirectory(storage_path('framework/testing/uploads'));
        parent::tearDown();
    }

    private function account(string $role): array
    {
        $name = uniqid('test');
        $id = DB::table('users')->insertGetId(['full_name' => $name, 'username' => $name, 'email' => $name.'@example.test', 'password_hash' => password_hash('password123', PASSWORD_BCRYPT), 'status' => 'active']);
        $roleId = DB::table('role')->where('code', $role)->value('id');
        DB::table('user_role')->insert(['user_id' => $id, 'role_id' => $roleId]);
        $profile = null;
        if (in_array($role, ['patient', 'doctor'])) {
            $profile = DB::table($role)->insertGetId(['user_id' => $id, $role.'_code' => $name, 'full_name' => $name, 'phone' => '0000000000', 'status' => 'active']);
        }
        $user = DB::table('users')->where('id', $id)->first();
        $auth = app(LegacyAuthService::class)->issue($user, Request::create('/auth/login'));

        return ['id' => $id, 'profile' => $profile, 'token' => $auth['token'], 'refresh' => $auth['refreshToken']];
    }

    private function asUser(array $user): static
    {
        return $this->withHeader('Authorization', 'Bearer '.$user['token']);
    }

    private function png(string $name = 'scan.png'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, base64_decode('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAAAAABWESUoAAAARklEQVQ4EX3BMQEAAACDIP3sn3gNBtInfdInfdInfdInfdInfdInfdInfdInfdInfdInfdInfdInfdInfdInfdInfdInfQMscB8hhJMm0QAAAABJRU5ErkJggg=='));
    }

    public function test_owner_can_read_consultation_but_other_patient_cannot(): void
    {
        $this->asUser($this->patient)->getJson('/consultations/'.$this->caseId)->assertOk();
        $this->asUser($this->other)->getJson('/consultations/'.$this->caseId)->assertForbidden();
        $this->asUser($this->other)->postJson('/consultations/'.$this->caseId.'/responses', ['content' => 'not mine'])->assertForbidden();
    }

    public function test_other_doctor_cannot_change_consultation_or_schedule(): void
    {
        $other = $this->account('doctor');
        $schedule = DB::table('doctor_schedule')->insertGetId(['doctor_id' => $this->doctor['profile'], 'work_date' => '2030-01-01', 'start_time' => '09:00', 'end_time' => '12:00', 'slot_duration' => 30]);
        $this->asUser($other)->postJson('/consultations/'.$this->caseId.'/responses', ['content' => 'wrong doctor'])->assertForbidden();
        $this->asUser($other)->deleteJson('/schedules/'.$schedule)->assertForbidden();
    }

    public function test_prescription_and_audit_routes_reject_other_patient(): void
    {
        $this->asUser($this->other)->getJson('/prescriptions/consultation/'.$this->caseId)->assertForbidden();
        $this->asUser($this->patient)->getJson('/audit-logs')->assertForbidden();
    }

    public function test_doctor_can_save_unchanged_own_schedule(): void
    {
        $data = ['work_date' => '2030-01-01', 'start_time' => '09:00', 'end_time' => '12:00', 'slot_duration' => 30, 'status' => 'active'];
        $id = DB::table('doctor_schedule')->insertGetId($data + ['doctor_id' => $this->doctor['profile']]);
        $this->asUser($this->doctor)->putJson('/schedules/'.$id, $data)->assertOk();
        $this->putJson('/schedules/'.$id, $data)->assertOk();
        $this->assertSame(1, DB::table('doctor_schedule')->where('id', $id)->count());
    }

    public function test_chat_is_private(): void
    {
        $chat = DB::table('holora_mind_chats')->insertGetId(['user_id' => $this->patient['id']]);
        $this->asUser($this->other)->getJson('/holoramind/chats/'.$chat.'/messages')->assertForbidden();
        $this->asUser($this->other)->postJson('/holoramind/send', ['chatId' => $chat, 'content' => 'hello'])->assertForbidden();
        $this->asUser($this->patient)->getJson('/holoramind/chats/'.$chat.'/messages')->assertOk();
    }

    public function test_executable_uploads_are_rejected_on_both_paths(): void
    {
        $this->asUser($this->doctor)->postJson('/upload', ['attachments' => [UploadedFile::fake()->createWithContent('bad.php', '<?php echo 1;')]])->assertUnprocessable();
        $this->asUser($this->doctor)->postJson('/consultations/'.$this->caseId.'/responses', ['attachments' => [$this->png('bad.php')]])->assertUnprocessable();
        $this->asUser($this->doctor)->postJson('/upload', ['attachments' => [UploadedFile::fake()->createWithContent('bad.png', '<?php echo 1;')]])->assertUnprocessable();
    }

    public function test_patient_receives_image_attachments(): void
    {
        $this->asUser($this->doctor)->postJson('/consultations/'.$this->caseId.'/responses', ['content' => 'Image', 'attachments' => [$this->png()]])->assertCreated();
        $response = $this->asUser($this->patient)->getJson('/consultations/'.$this->caseId)->assertOk();
        $url = $response->json('data.responses.0.attachments.0.image_url');
        $this->assertNotEmpty($url);
        $this->get(parse_url($url, PHP_URL_PATH))->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertFileDoesNotExist(public_path('uploads/'.basename($url)));
    }

    public function test_arbitrary_image_url_cannot_be_sent(): void
    {
        $this->asUser($this->doctor)->postJson('/consultations/'.$this->caseId.'/responses', ['attachments' => ['https://example.test/tracker.png']])->assertUnprocessable();
    }

    public function test_reset_password_revokes_access_and_refresh_tokens(): void
    {
        DB::table('users')->where('id', $this->patient['id'])->update(['reset_password_token' => hash('sha256', 'reset-test'), 'reset_password_expires' => now()->addHour()]);
        $this->postJson('/auth/reset-password', ['token' => 'reset-test', 'new_password' => 'newpassword123'])->assertOk();
        $this->asUser($this->patient)->getJson('/consultations/'.$this->caseId)->assertUnauthorized();
        $this->postJson('/auth/refresh', ['refreshToken' => $this->patient['refresh']])->assertUnauthorized();
    }

    public function test_refresh_rotates_and_detects_reuse(): void
    {
        $new = $this->postJson('/auth/refresh', ['refreshToken' => $this->patient['refresh']])->assertOk()->json();
        $this->withHeader('Authorization', 'Bearer '.$new['token'])->getJson('/consultations/'.$this->caseId)->assertOk();
        $this->postJson('/auth/refresh', ['refreshToken' => $this->patient['refresh']])->assertUnauthorized();
        $this->withHeader('Authorization', 'Bearer '.$new['token'])->getJson('/consultations/'.$this->caseId)->assertUnauthorized();
    }

    public function test_auth_rate_limit(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/auth/login', ['email' => 'absent@example.test', 'password' => 'x'])->assertUnauthorized();
        }
        $this->postJson('/auth/login', ['email' => 'absent@example.test', 'password' => 'x'])->assertStatus(429);
    }

    private function booking(): array
    {
        $date = now()->addDays(5)->toDateString();
        DB::table('doctor_schedule')->insert(['doctor_id' => $this->doctor['profile'], 'work_date' => $date, 'start_time' => '09:00', 'end_time' => '12:00', 'slot_duration' => 30, 'status' => 'active']);

        return ['doctor_id' => $this->doctor['profile'], 'branch_id' => $this->branch, 'appointment_date' => $date, 'start_time' => '09:00', 'duration_minutes' => 30];
    }

    public function test_booking_uses_authenticated_patient_and_rejects_overlap(): void
    {
        $data = $this->booking() + ['patient_id' => $this->other['profile'], 'recurring' => true, 'recurring_count' => 1];
        $result = $this->asUser($this->patient)->postJson('/appointments', $data)->assertCreated()->json();
        $this->assertEquals($this->patient['profile'], DB::table('appointment')->where('id', $result['appointment_id'])->value('patient_id'));
        $this->assertEquals($this->patient['profile'], DB::table('recurring_appointments')->where('id', $result['recurring_id'])->value('patient_id'));
        $this->asUser($this->other)->postJson('/appointments', $data)->assertStatus(409);
    }

    public function test_booking_rejects_invalid_duration_and_off_shift_time(): void
    {
        $data = $this->booking();
        $this->asUser($this->patient)->postJson('/appointments', array_replace($data, ['duration_minutes' => -30]))->assertUnprocessable();
        $this->asUser($this->patient)->postJson('/appointments', array_replace($data, ['start_time' => '19:00']))->assertUnprocessable();
    }

    public function test_recurring_dates_support_multiple_weekdays(): void
    {
        $dates = app(BookingService::class)->dates(['appointment_date' => '2030-01-07', 'recurring' => true, 'recurring_type' => 'weekly', 'recurring_days' => [1, 3], 'recurring_count' => 4]);
        $this->assertSame(['2030-01-07', '2030-01-09', '2030-01-14', '2030-01-16'], $dates);
    }

    private function image(): int
    {
        $response = $this->asUser($this->doctor)->postJson('/upload', ['attachments' => [$this->png()]])->assertOk();

        return DB::table('consultation_image')->insertGetId(['consultation_id' => $this->caseId, 'uploaded_by' => $this->doctor['id'], 'image_url' => $response->json('urls.0'), 'image_type' => 'xray']);
    }

    public function test_ai_failure_does_not_mark_job_completed(): void
    {
        $image = $this->image();
        config(['legacy.image_processing.url' => 'http://processor.test']);
        Http::fake(['*' => Http::response(['detail' => 'failed'], 500)]);
        $response = $this->asUser($this->doctor)->postJson('/ai/analyze', ['consultation_id' => $this->caseId, 'consultation_image_id' => $image])->assertStatus(502);
        $this->assertSame('failed', DB::table('ai_analysis_request')->where('id', $response->json('analysis_request_id'))->value('status'));
        $this->assertSame(0, DB::table('ai_analysis_result')->count());
    }

    public function test_ai_outputs_can_be_shared_into_patient_chat(): void
    {
        $image = $this->image();
        config(['legacy.image_processing.url' => 'http://processor.test']);
        Http::fake([
            '*/preprocess' => Http::response(['id' => 1, 'status' => 'completed']),
            '*/jobs/1/result' => Http::response(['processed_image_path' => '/app/processed/p.png', 'edge_image_path' => '/app/processed/e.png', 'mask_image_path' => '/app/processed/m.png']),
        ]);
        $job = $this->asUser($this->doctor)->postJson('/ai/analyze', ['consultation_id' => $this->caseId, 'consultation_image_id' => $image])->assertStatus(202)->json('analysis_request_id');
        $result = $this->getJson('/ai/consultation/'.$this->caseId)->assertOk()->json('data.0.result_payload.vision_results');
        $this->assertCount(3, $result);
        $this->patchJson('/ai/review/'.$job, ['review_status' => 'approved'])->assertOk();
        $this->postJson('/consultations/'.$this->caseId.'/responses', ['content' => 'Processed', 'attachments' => [$result['processed_image_path']]])->assertCreated();
        $this->asUser($this->patient)->getJson('/consultations/'.$this->caseId)->assertOk()->assertJsonPath('data.responses.0.attachments.0.image_url', $result['processed_image_path']);
    }

    public function test_demo_payment_is_disabled_by_default(): void
    {
        $owner = $this->account('clinic_owner');
        $this->asUser($owner)->postJson('/subscriptions/create-payment', ['plan_code' => 'anything', 'payment_method' => 'momo'])->assertForbidden();
        $this->postJson('/subscriptions/confirm-payment', ['token' => 'anything'])->assertForbidden();
    }

    public function test_live_python_outputs_are_downloadable_and_shared(): void
    {
        if (! getenv('LIVE_IMAGE_URL') || ! getenv('INTERNAL_API_KEY')) {
            $this->markTestSkipped('Set LIVE_IMAGE_URL and INTERNAL_API_KEY for the isolated live image service.');
        }
        config([
            'legacy.image_processing.url' => getenv('LIVE_IMAGE_URL'),
            'legacy.image_processing.public_url' => getenv('LIVE_IMAGE_URL'),
            'legacy.image_processing.internal_api_key' => getenv('INTERNAL_API_KEY'),
        ]);
        $image = $this->image();
        $job = $this->asUser($this->doctor)->postJson('/ai/analyze', ['consultation_id' => $this->caseId, 'consultation_image_id' => $image])->assertStatus(202)->json('analysis_request_id');
        $outputs = $this->getJson('/ai/consultation/'.$this->caseId)->assertOk()->json('data.0.result_payload.vision_results');
        $this->assertCount(3, $outputs);
        foreach ($outputs as $url) {
            $download = Http::get($url);
            $this->assertTrue($download->successful());
            $this->assertNotFalse(getimagesizefromstring($download->body()));
        }
        $this->patchJson('/ai/review/'.$job, ['review_status' => 'approved'])->assertOk();
        $this->postJson('/consultations/'.$this->caseId.'/responses', ['content' => 'Synthetic processing outputs', 'attachments' => array_values($outputs)])->assertCreated();
        $this->asUser($this->patient)->getJson('/consultations/'.$this->caseId)->assertOk()->assertJsonCount(3, 'data.responses.0.attachments');
    }

    public function test_concurrent_bookings_only_create_one_appointment(): void
    {
        $data = $this->booking();
        DB::commit();
        try {
            $at = (string) (microtime(true) + 2);
            $a = new Process([PHP_BINARY, __DIR__.'/booking-worker.php', $at, json_encode($data), (string) $this->patient['profile']], base_path(), ['DB_DATABASE' => 'medecode_test', 'APP_ENV' => 'testing']);
            $b = new Process([PHP_BINARY, __DIR__.'/booking-worker.php', $at, json_encode($data), (string) $this->other['profile']], base_path(), ['DB_DATABASE' => 'medecode_test', 'APP_ENV' => 'testing']);
            $a->start();
            $b->start();
            $a->wait();
            $b->wait();
            $this->assertTrue($a->isSuccessful(), $a->getErrorOutput());
            $this->assertTrue($b->isSuccessful(), $b->getErrorOutput());
            $codes = [trim($a->getOutput()), trim($b->getOutput())];
            sort($codes);
            $this->assertSame(['201', '409'], $codes);
            $this->assertSame(1, DB::table('appointment')->where('doctor_id', $this->doctor['profile'])->count());
        } finally {
            DB::table('appointment')->where('doctor_id', $this->doctor['profile'])->delete();
            DB::table('consultation')->where('id', $this->caseId)->delete();
            DB::table('doctor_branch')->where('doctor_id', $this->doctor['profile'])->delete();
            DB::table('doctor_schedule')->where('doctor_id', $this->doctor['profile'])->delete();
            DB::table('doctor')->where('id', $this->doctor['profile'])->delete();
            DB::table('branch')->where('id', $this->branch)->delete();
            DB::table('users')->whereIn('id', [$this->doctor['id'], $this->patient['id'], $this->other['id']])->delete();
            DB::beginTransaction();
        }
    }

    public function test_paid_plan_cannot_be_activated_directly_even_in_demo(): void
    {
        config(['legacy.demo_payments' => true]);
        $owner = $this->account('clinic_owner');
        $plan = DB::table('subscription_plan')->where('scope_type', 'account')->where('price_cents', '>', 0)->whereNull('deleted_at')->first();
        $this->assertNotNull($plan);
        $this->asUser($owner)->postJson('/subscriptions/activate', ['plan_code' => $plan->code, 'scope_type' => 'account', 'scope_id' => $owner['id']])->assertForbidden();
        $order = $this->postJson('/subscriptions/create-payment', ['plan_code' => $plan->code, 'payment_method' => 'momo', 'months' => 1])->assertCreated()->assertJsonPath('demo', true)->json('data');
        $this->postJson('/subscriptions/confirm-payment', ['token' => $order['token']])->assertOk()->assertJsonPath('demo', true);
        $this->postJson('/subscriptions/confirm-payment', ['token' => $order['token']])->assertStatus(400);
    }

    public function test_patient_can_only_view_and_cancel_own_recurring_series(): void
    {
        $result = $this->asUser($this->patient)->postJson('/appointments', $this->booking() + ['recurring' => true, 'recurring_count' => 1])->assertCreated()->json();
        $path = '/recurring-appointments/'.$result['recurring_id'];
        $this->getJson($path.'/children')->assertOk();
        $this->asUser($this->other)->getJson($path.'/children')->assertForbidden();
        $this->asUser($this->patient)->postJson($path.'/cancel-all')->assertOk();
        $this->assertSame('cancelled', DB::table('appointment')->where('id', $result['appointment_id'])->value('status'));
    }

    public function test_patient_cannot_request_or_review_other_patients_ai(): void
    {
        $image = $this->image();
        $this->asUser($this->other)->postJson('/ai/analyze', ['consultation_id' => $this->caseId, 'consultation_image_id' => $image])->assertForbidden();
        $this->getJson('/ai/consultation/'.$this->caseId)->assertForbidden();
    }
}
