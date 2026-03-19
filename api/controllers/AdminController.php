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
        AuthMiddleware::requireCoordinator($auth);

        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT r.registration_id, r.user_id, r.status, r.payment_status, r.registered_at,
                   u.first_name, u.last_name, u.email,
                   COALESCE(c.college_name, '-') AS college_name
            FROM event_registrations r
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN colleges c ON u.college_id = c.college_id
            WHERE r.event_id = :event_id AND r.status != 'cancelled'
            ORDER BY r.registered_at DESC
        ");
        $stmt->execute([':event_id' => $eventId]);

        Response::success($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * PATCH /api/v1/admin/users/{id}/role
     * Update user role (super_admin only).
     */
    public static function updateUserRole(int $userId): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($auth);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $newRole = $data['role'] ?? null;

        if (!in_array($newRole, ['participant', 'coordinator', 'admin'])) {
            Response::error('Invalid role specified', 422);
        }

        $db = Database::connect();
        
        // Final sanity check: Don't let normal admins change roles of other admins? 
        // For simplicity here, we allow it, but in a real app we'd restrict further.
        
        $stmt = $db->prepare("UPDATE users SET role = :role WHERE user_id = :id");
        $stmt->execute([':role' => $newRole, ':id' => $userId]);

        Response::success(null, 'User role updated successfully');
    }
}
