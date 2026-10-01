<?php

use App\Services\BookingService;
use Illuminate\Contracts\Console\Kernel;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.connections.mysql.database') !== 'medecode_test') {
    exit(2);
}
while (microtime(true) < (float) $argv[1]) {
    usleep(1000);
}
try {
    app(BookingService::class)->book(json_decode($argv[2], true), (int) $argv[3]);
    echo '201';
} catch (HttpExceptionInterface $e) {
    echo $e->getStatusCode();
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage());
    exit(1);
}
