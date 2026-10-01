<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SafeUpload
{
    public function store(array $files, bool $imagesOnly = false): array
    {
        $types = $imagesOnly ? 'jpg,jpeg,png,gif,webp' : 'jpg,jpeg,png,gif,webp,pdf';
        Validator::make(['files' => $files], [
            'files' => 'required|array|max:5',
            'files.*' => ['required', 'file', 'max:5120', 'mimes:'.$types, 'extensions:'.$types],
        ])->validate();
        foreach ($files as $file) {
            if ($file->getMimeType() !== 'application/pdf' && @getimagesize($file->getRealPath()) === false) {
                throw ValidationException::withMessages(['files' => 'The file is not a valid image']);
            }
        }
        $directory = config('legacy.uploads.path');
        if (! is_dir($directory)) {
            mkdir($directory, 0750, true);
        }
        $paths = [];
        try {
            foreach ($files as $file) {
                $name = Str::uuid().'.'.$file->guessExtension();
                $file->move($directory, $name);
                Cache::put('upload-owner:'.$name, request()->attributes->get('legacy_auth_user')?->id, now()->addDay());
                $paths[] = $directory.'/'.$name;
            }
        } catch (\Throwable $e) {
            foreach ($paths as $path) {
                @unlink($path);
            }
            throw $e;
        }

        return array_map(fn ($path) => url('/public/uploads/'.basename($path)), $paths);
    }

    public function reference(string $url, ?int $consultationId, object $user): string
    {
        $name = basename(parse_url($url, PHP_URL_PATH) ?: '');
        if ($url === url('/public/uploads/'.$name) && is_file(config('legacy.uploads.path').'/'.$name)) {
            $owner = Cache::get('upload-owner:'.$name);
            $linked = $consultationId && DB::table('consultation_image')->where('consultation_id', $consultationId)->where('image_url', $url)->exists();
            abort_unless($owner == $user->id || $linked, 403, 'Attachment access denied');

            return $url;
        }
        if ($consultationId) {
            $results = DB::table('ai_analysis_result as res')->join('ai_analysis_request as req', 'req.id', '=', 'res.request_id')->where('req.consultation_id', $consultationId);
            if ($user->role === 'patient') {
                $results->where('res.shared_with_patient', 1);
            }
            foreach ($results->pluck('result_payload') as $json) {
                $vision = json_decode($json, true)['vision_results'] ?? [];
                if (in_array($url, array_values($vision), true)) {
                    return $url;
                }
            }
        }
        abort(422, 'Use an uploaded file or a result belonging to this consultation');
    }
}
