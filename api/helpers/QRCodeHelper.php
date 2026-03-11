<?php
/**
 * NexusFest API — QR Code Helper
 * 
 * Generates HMAC-signed QR tokens for registrations, attendance,
 * food stalls, and scavenger hunt checkpoints.
 */

class QRCodeHelper
{
    /**
     * Generate a signed QR token for a given entity.
     *
     * @param string $type   Entity type: 'registration', 'user', 'stall', 'checkpoint'
     * @param int    $id     Entity ID
     * @return string HMAC-signed token
     */
    public static function generateToken(string $type, int $id): string
    {
        $data = "{$type}:{$id}:" . time() . ':' . bin2hex(random_bytes(8));
        $signature = hash_hmac('sha256', $data, QR_HMAC_SECRET);
        return $data . ':' . substr($signature, 0, 16);
    }

    /**
     * Verify a QR token's signature.
     *
     * @param string $token The full token string
     * @return array|null Parsed token data or null if invalid
     */
    public static function verifyToken(string $token): ?array
    {
        $parts = explode(':', $token);

        if (count($parts) < 5) {
            return null;
        }

        $type      = $parts[0];
        $id        = (int) $parts[1];
        $timestamp = (int) $parts[2];
        $nonce     = $parts[3];
        $signature = $parts[4];

        // Reconstruct and verify
        $data = "{$type}:{$id}:{$timestamp}:{$nonce}";
        $expectedSig = substr(hash_hmac('sha256', $data, QR_HMAC_SECRET), 0, 16);

        if (!hash_equals($expectedSig, $signature)) {
            return null;
        }

        return [
            'type'      => $type,
            'id'        => $id,
            'timestamp' => $timestamp,
        ];
    }
}
