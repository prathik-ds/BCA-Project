<?php
/**
 * NexusFest API — Leaderboard Controller
 * 
 * Inter-college rankings, individual rankings, and category-wise boards.
 */

class LeaderboardController
{
    // ────────────────────────────────────────────────
    //  GET /api/v1/leaderboard/colleges
    //  Inter-college leaderboard
    // ────────────────────────────────────────────────
    public static function colleges(): void
    {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT c.college_id, c.college_name, c.college_code, c.city, c.logo_url,
                   COALESCE(lb.total_points, 0) AS total_points,
                   COALESCE(lb.events_won, 0) AS events_won,
                   COALESCE(lb.events_participated, 0) AS events_participated,
                   RANK() OVER (ORDER BY COALESCE(lb.total_points, 0) DESC) AS rank_position
            FROM colleges c
            LEFT JOIN leaderboard lb ON c.college_id = lb.college_id 
                 AND lb.user_id IS NULL AND lb.category_id IS NULL
            WHERE c.is_verified = 1
            ORDER BY total_points DESC
        ");
        $stmt->execute();

        Response::success($stmt->fetchAll(), 'Inter-college leaderboard');
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/leaderboard/individual
    //  Individual participant leaderboard
    //  Supports: ?college_id=1&limit=50
    // ────────────────────────────────────────────────
    public static function individual(): void
    {
        $db    = Database::connect();
        $limit = min(100, max(10, (int) ($_GET['limit'] ?? 50)));

        $where  = ["lb.user_id IS NOT NULL", "lb.category_id IS NULL"];
        $params = [];

        if (!empty($_GET['college_id'])) {
            $where[]              = "lb.college_id = :college";
            $params[':college']   = (int) $_GET['college_id'];
        }

        $whereClause = implode(' AND ', $where);

        $stmt = $db->prepare("
            SELECT lb.leaderboard_id,
                   u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS participant_name,
                   u.profile_photo,
                   c.college_name, c.college_code,
                   lb.total_points, lb.events_won, lb.events_participated,
                   RANK() OVER (ORDER BY lb.total_points DESC) AS rank_position
            FROM leaderboard lb
            JOIN users u ON lb.user_id = u.user_id
            JOIN colleges c ON lb.college_id = c.college_id
            WHERE {$whereClause}
            ORDER BY lb.total_points DESC
            LIMIT :lim
        ");

        foreach ($params as $k => $val) {
            $stmt->bindValue($k, $val);
        }
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();

        Response::success($stmt->fetchAll(), 'Individual leaderboard');
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/leaderboard/category/{categoryId}
    //  Category-wise leaderboard
    // ────────────────────────────────────────────────
    public static function byCategory(int $categoryId): void
    {
        $db = Database::connect();

        // Verify category
        $stmt = $db->prepare("SELECT category_name FROM event_categories WHERE category_id = :id");
        $stmt->execute([':id' => $categoryId]);
        $category = $stmt->fetch();

        if (!$category) {
            Response::notFound('Category not found');
        }

        $stmt = $db->prepare("
            SELECT c.college_id, c.college_name, c.college_code,
                   COALESCE(lb.total_points, 0) AS total_points,
                   COALESCE(lb.events_won, 0) AS events_won,
                   RANK() OVER (ORDER BY COALESCE(lb.total_points, 0) DESC) AS rank_position
            FROM colleges c
            LEFT JOIN leaderboard lb ON c.college_id = lb.college_id 
                 AND lb.user_id IS NULL AND lb.category_id = :cat
            WHERE c.is_verified = 1
            ORDER BY total_points DESC
        ");
        $stmt->execute([':cat' => $categoryId]);

        Response::success([
            'category' => $category['category_name'],
            'rankings' => $stmt->fetchAll(),
        ], "Leaderboard for {$category['category_name']}");
    }
}
