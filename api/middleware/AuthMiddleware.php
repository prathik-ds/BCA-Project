<?php
/**
 * NexusFest API — Authentication Middleware
 * 
 * Extracts and verifies JWT tokens from the Authorization header.
 * Attaches authenticated user data to further processing.
 */

class AuthMiddleware
{
    /**
     * Verify JWT and return the authenticated user's payload.
     * Halts execution with 401 if token is missing or invalid.
     *
     * @return array Decoded JWT payload (contains user_id, role, email, etc.)
     */
    public static function authenticate(): array
    {
        $token = self::extractToken();

        if (!$token) {
            Response::unauthorized('Access token is missing. Provide it in the Authorization header as: Bearer <token>');
        }

        $payload = JWTHandler::verifyToken($token);

        if (!$payload) {
            Response::unauthorized('Invalid or expired access token');
        }

        if (($payload['type'] ?? '') !== 'access') {
            Response::unauthorized('Invalid token type. Use an access token.');
        }

        return $payload;
    }

    /**
     * Require a specific role (or higher).
     * Call after authenticate().
     *
     * @param array  $payload      Authenticated user payload
     * @param array  $allowedRoles List of allowed roles
     */
    public static function requireRole(array $payload, array $allowedRoles): void
    {
        if (!in_array($payload['role'] ?? '', $allowedRoles, true)) {
            Response::forbidden('You do not have permission to perform this action');
        }
    }

    /**
     * Require admin or super_admin role.
     */
    public static function requireAdmin(array $payload): void
    {
        self::requireRole($payload, [ROLE_ADMIN, ROLE_SUPER_ADMIN]);
    }

    /**
     * Require coordinator, admin, or super_admin role.
     */
    public static function requireCoordinator(array $payload): void
    {
        self::requireRole($payload, [ROLE_COORDINATOR, ROLE_ADMIN, ROLE_SUPER_ADMIN]);
    }

    /**
     * Optional authentication — returns payload if token present, null otherwise.
     * Does NOT halt execution if token is missing.
     */
    public static function optionalAuth(): ?array
    {
        $token = self::extractToken();
        if (!$token) {
            return null;
        }

        $payload = JWTHandler::verifyToken($token);
        if (!$payload || ($payload['type'] ?? '') !== 'access') {
            return null;
        }

        return $payload;
    }

    /**
     * Extract the Bearer token from the Authorization header.
     */
    private static function extractToken(): ?string
    {
        // Check standard header
        $authHeader = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';

        if (empty($authHeader) && function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        } else if (empty($authHeader) && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
