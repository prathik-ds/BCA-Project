<?php
/**
 * NexusFest API — Admin Controller
 * 
 * Handles admin-level operations: user listing, event registrations, stats.
 */

class AdminController
{
    /**
     * GET /api/v1/admin/users
     * Return all users (admin only).
     */
    public static function getUsers(): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($auth);

        $db = Database::connect();

        $stmt = $db->query("
            SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.is_active,
                   COALESCE(c.college_code, '-') AS college_code
            FROM users u
            LEFT JOIN colleges c ON u.college_id = c.college_id
            ORDER BY u.created_at DESC
        ");

        Response::success($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * GET /api/v1/admin/events/{id}/registrations
     * Return all registrations for a specific event (admin only).
     */
    public static function getEventRegistrations(int $eventId): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($auth);

        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT r.registration_id, r.user_id, r.status, r.payment_status, r.registered_at,
                   u.first_name, u.last_name, u.email,
                   COALESCE(c.college_name, '-') AS college_name
            FROM event_registrations r
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN colleges c ON u.college_id = c.college_id
            WHERE r.event_id = :event_id
            ORDER BY r.registered_at DESC
        ");
        $stmt->execute([':event_id' => $eventId]);

        Response::success($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}
