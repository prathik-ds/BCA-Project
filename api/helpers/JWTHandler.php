<?php
/**
 * NexusFest API — JWT Token Handler
 * 
 * Handles creation and verification of JSON Web Tokens.
 * Uses HMAC-SHA256 (HS256) signing.
 * 
 * Note: This is a lightweight implementation. For production,
 * consider using firebase/php-jwt via Composer.
 */

class JWTHandler
{
    /**
     * Generate a JWT access token.
     *
     * @param array $payload Token payload data
     * @return string Encoded JWT token
     */
    public static function generateAccessToken(array $payload): string
    {
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_ACCESS_EXPIRY;
        $payload['type'] = 'access';

        return self::encode($payload);
    }

    /**
     * Generate a JWT refresh token.
     *
     * @param array $payload Token payload data
     * @return string Encoded JWT token
     */
    public static function generateRefreshToken(array $payload): string
    {
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_REFRESH_EXPIRY;
        $payload['type'] = 'refresh';

        return self::encode($payload);
    }

    /**
     * Verify and decode a JWT token.
     *
     * @param string $token The JWT token string
     * @return array|null Decoded payload or null if invalid
     */
    public static function verifyToken(string $token): ?array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        // Verify signature
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "{$headerB64}.{$payloadB64}", JWT_SECRET, true)
        );

        if (!hash_equals($expectedSignature, $signatureB64)) {
            return null;
        }

        // Decode payload
        $payload = json_decode(self::base64UrlDecode($payloadB64), true);

        if (!$payload) {
            return null;
        }

        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Encode a payload into a JWT string.
     */
    private static function encode(array $payload): string
    {
        $header = self::base64UrlEncode(json_encode([
            'alg' => JWT_ALGORITHM,
            'typ' => 'JWT',
        ]));

        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payloadEncoded}", JWT_SECRET, true)
        );

        return "{$header}.{$payloadEncoded}.{$signature}";
    }

    /**
     * Base64 URL-safe encoding.
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL-safe decoding.
     */
    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
