<?php

return [
    'cors' => ['origins' => env('CORS_ORIGIN', 'http://localhost:18081,http://localhost:15173')],
    'uploads' => [
        'path' => env('LEGACY_UPLOADS_PATH', storage_path('app/uploads')),
        'public_url_prefix' => env('LEGACY_UPLOADS_URL_PREFIX', '/public/uploads'),
    ],
    'image_processing' => [
        'url' => rtrim((string) env('IMAGE_PROCESSING_URL', ''), '/'),
        'internal_api_key' => env('INTERNAL_API_KEY'),
        'public_url' => rtrim((string) env('IMAGE_PROCESSING_PUBLIC_URL', 'http://localhost:18000'), '/'),
    ],
    'jwt' => ['secret' => env('JWT_SECRET'), 'algorithm' => 'HS256'],
    'demo_payments' => (bool) env('DEMO_PAYMENTS_ENABLED', false),
    'google_client_id' => env('GOOGLE_CLIENT_ID'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:18081'),
];
