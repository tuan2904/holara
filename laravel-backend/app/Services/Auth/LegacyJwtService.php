<?php

namespace App\Services\Auth;

use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use RuntimeException;

class LegacyJwtService
{
    public function issue(object $user, array $roles, string $sessionHash): string
    {
        $now = time();
        $primaryRole = $roles[0] ?? 'patient';

        return JWT::encode([
            'id' => (int) $user->id,
            'email' => $user->email,
            'username' => $user->username,
            'role' => $primaryRole,
            'roles' => array_values($roles),
            'sid' => $sessionHash,
            'iat' => $now,
            'exp' => $now + 900,
        ], $this->secret(), 'HS256');
    }

    public function decode(string $token): object
    {
        return JWT::decode($token, new Key($this->secret(), 'HS256'));
    }

    public function isExpired(\Throwable $exception): bool
    {
        return $exception instanceof ExpiredException;
    }

    private function secret(): string
    {
        $secret = (string) config('legacy.jwt.secret');
        if (strlen($secret) < 32) {
            throw new RuntimeException('JWT_SECRET is not configured');
        }

        return $secret;
    }
}
