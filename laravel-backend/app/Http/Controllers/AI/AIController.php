<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    public function analyze(Request $request)
    {
        $data = $request->validate(['consultation_id' => 'required|integer|min:1', 'consultation_image_id' => 'required|integer|min:1']);
        $url = DB::table('consultation_image')->where('id', $data['consultation_image_id'])->where('consultation_id', $data['consultation_id'])->value('image_url');
        abort_unless($url, 404, 'Image not found');
        $path = config('legacy.uploads.path').'/'.basename(parse_url($url, PHP_URL_PATH));
        abort_unless(is_file($path), 404, 'Source file not found');
        $id = DB::table('ai_analysis_request')->insertGetId([
            'consultation_id' => $data['consultation_id'], 'consultation_image_id' => $data['consultation_image_id'],
            'requested_by' => $request->attributes->get('legacy_auth_user')->id,
            'model_name' => 'OpenCV-preprocessing', 'request_type' => 'image_analysis', 'status' => 'processing',
        ]);
        // The course demo processes synchronously so failures cannot be lost after the response.
        try {
            $client = Http::timeout(60)->withHeaders(['X-API-Key' => config('legacy.image_processing.internal_api_key')]);
            $base = config('legacy.image_processing.url');
            $handle = fopen($path, 'rb');
            try {
                $job = $client->attach('file', $handle, basename($path))->post($base.'/api/v1/preprocess', [
                    'source_image_id' => $data['consultation_image_id'], 'source_consultation_id' => $data['consultation_id'], 'modality' => 'xray', 'body_part' => 'unspecified',
                ])->throw()->json();
            } finally {
                fclose($handle);
            }
            if (empty($job['id']) || ($job['status'] ?? '') !== 'completed') {
                throw new \RuntimeException('Image job did not complete');
            }
            $result = Http::timeout(30)->withHeaders(['X-API-Key' => config('legacy.image_processing.internal_api_key')])->get($base.'/api/v1/jobs/'.$job['id'].'/result')->throw()->json();
            $vision = [];
            foreach (['processed_image_path', 'edge_image_path', 'mask_image_path'] as $key) {
                if (empty($result[$key]) || ! is_string($result[$key])) {
                    throw new \RuntimeException('Missing output: '.$key);
                }
                $vision[$key] = config('legacy.image_processing.public_url').'/processed/'.basename(str_replace('\\', '/', $result[$key]));
            }
            DB::transaction(function () use ($id, $vision) {
                DB::table('ai_analysis_result')->insert([
                    'request_id' => $id, 'result_summary' => 'Image preprocessing completed. Not a diagnosis.',
                    'result_payload' => json_encode(['vision_results' => $vision]), 'doctor_review_status' => 'pending_review', 'shared_with_patient' => 0,
                ]);
                DB::table('ai_analysis_request')->where('id', $id)->update(['status' => 'completed', 'completed_at' => now()]);
            });

            return response()->json(['message' => 'Image processing completed', 'analysis_request_id' => $id, 'status' => 'completed'], 202);
        } catch (\Throwable $e) {
            report($e);
            DB::table('ai_analysis_request')->where('id', $id)->update(['status' => 'failed', 'error_message' => 'Image service failed. Retry or check server logs.']);

            return response()->json(['message' => 'Image processing failed', 'analysis_request_id' => $id, 'status' => 'failed'], 502);
        }
    }

    public function consultation(Request $request, $id)
    {
        $patient = $request->attributes->get('legacy_auth_user')->role === 'patient';
        $query = DB::table('ai_analysis_request as req')->leftJoin('ai_analysis_result as res', 'req.id', '=', 'res.request_id')->leftJoin('consultation_image as img', 'req.consultation_image_id', '=', 'img.id')->where('req.consultation_id', $id);
        if ($patient) {
            $query->where('res.shared_with_patient', 1);
        }
        $columns = ['req.id as request_id', 'req.consultation_image_id', 'req.status as request_status', 'req.requested_at', 'img.image_url', 'res.result_summary', 'res.confidence_score', 'res.risk_level', 'res.recommendation', 'res.created_at as completed_at', 'res.doctor_review_status', 'res.shared_with_patient', 'res.review_note', 'res.result_payload'];
        if (! $patient) {
            $columns[] = 'req.error_message';
        }
        $rows = $query->select($columns)->orderByDesc('req.requested_at')->get();
        foreach ($rows as $row) {
            $row->result_payload = json_decode($row->result_payload ?? '{}');
        }

        return response()->json(['data' => $rows]);
    }

    public function review(Request $request, $id)
    {
        $data = $request->validate(['review_status' => 'required|in:pending_review,approved,approved_watch,not_standard,revoked', 'review_note' => 'nullable|string|max:4000']);
        $doctor = DB::table('doctor')->where('user_id', $request->attributes->get('legacy_auth_user')->id)->value('id');
        abort_unless(DB::table('ai_analysis_result')->where('request_id', $id)->exists(), 404);
        $share = in_array($data['review_status'], ['approved', 'approved_watch'], true);
        DB::table('ai_analysis_result')->where('request_id', $id)->update(['doctor_review_status' => $data['review_status'], 'shared_with_patient' => $share, 'review_note' => $data['review_note'] ?? null, 'reviewed_by_doctor_id' => $doctor, 'reviewed_at' => now()]);

        return response()->json(['message' => 'Review saved', 'shared_with_patient' => (int) $share]);
    }
}
