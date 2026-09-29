<?php

return [
    'cors' => ['origins' => env('CORS_ORIGIN', 'http://localhost:5173')],
    'uploads' => [
        'path' => env('LEGACY_UPLOADS_PATH', public_path('uploads')),
        'public_url_prefix' => env('LEGACY_UPLOADS_URL_PREFIX', '/public/uploads'),
    ],
    'image_processing' => [
        'url' => rtrim((string) env('IMAGE_PROCESSING_URL', ''), '/'),
        'internal_api_key' => env('INTERNAL_API_KEY'),
    ],
    // Placeholder only. Legacy HS256 JWT validation is implemented in Phase 3.2.
    'jwt' => ['secret' => env('JWT_SECRET'), 'algorithm' => 'HS256'],
];
