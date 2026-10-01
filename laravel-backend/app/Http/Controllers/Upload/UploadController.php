<?php

namespace App\Http\Controllers\Upload;

use App\Http\Controllers\Controller;
use App\Services\SafeUpload;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function store(Request $request, SafeUpload $upload)
    {
        $files = $request->file('attachments', []);

        return response()->json(['message' => 'Uploaded', 'urls' => $upload->store(is_array($files) ? $files : [$files])]);
    }

    public function show(string $file)
    {
        abort_unless(preg_match('/^[a-f0-9-]+\.(jpg|jpeg|png|gif|webp|pdf)$/i', $file), 404);
        $path = config('legacy.uploads.path').'/'.$file;
        abort_unless(is_file($path), 404);

        return response()->file($path, ['X-Content-Type-Options' => 'nosniff', 'Content-Security-Policy' => "default-src 'none'; sandbox"]);
    }
}
