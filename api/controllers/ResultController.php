<?php
/**
 * NexusFest API — Result Controller
 * 
 * Submit event results and calculate leaderboard points.
 */

class ResultController
{
    // ────────────────────────────────────────────────
    //  POST /api/v1/results
    //  Submit results for an event (admin/coordinator)
    // ────────────────────────────────────────────────
    public static function submit(): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireCoordinator($auth);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('event_id', 'Event ID')
          ->numeric('event_id', 'Event ID')
          ->required('position', 'Position')
          ->in('position', ['first', 'second', 'third', 'runner_up', 'participation', 'disqualified'], 'Position')
          ->validate();

        // Must have either user_id or team_id
        if (empty($data['user_id']) && empty($data['team_id'])) {
            Response::error('Either user_id or team_id is required', 422);
        }

        $db = Database::connect();

        // ── Verify event ──
        $stmt = $db->prepare("
            SELECT event_id, event_name, event_type, points_first, points_second,
                   points_third, points_participation
            FROM events WHERE event_id = :id
        ");
        $stmt->execute([':id' => $data['event_id']]);
        $event = $stmt->fetch();

        if (!$event) {
            Response::notFound('Event not found');
        }

        // ── Calculate points based on position ──
        $pointsMap = [
            'first'         => (int) $event['points_first'],
            'second'        => (int) $event['points_second'],
            'third'         => (int) $event['points_third'],
            'runner_up'     => (int) round($event['points_third'] * 0.5),
            'participation' => (int) $event['points_participation'],
            'disqualified'  => 0,
        ];

        $pointsAwarded = $pointsMap[$data['position']] ?? 0;

        $db->beginTransaction();
        try {
            // ── Insert result ──
            $stmt = $db->prepare("
                INSERT INTO event_results 
                    (event_id, user_id, team_id, position, score, points_awarded, remarks, declared_by)
                VALUES (:event, :user, :team, :position, :score, :points, :remarks, :declared_by)
            ");
            $stmt->execute([
                ':event'       => (int) $data['event_id'],
                ':user'        => $data['user_id'] ?? null,
                ':team'        => $data['team_id'] ?? null,
                ':position'    => $data['position'],
                ':score'       => $data['score'] ?? null,
                ':points'      => $pointsAwarded,
                ':remarks'     => $data['remarks'] ?? null,
                ':declared_by' => $auth['user_id'],
            ]);

            $resultId = (int) $db->lastInsertId();

            // ── Update leaderboard for the user/team ──
            if (!empty($data['user_id'])) {
                self::updateLeaderboard($db, (int) $data['user_id'], $pointsAwarded, $data['position']);
            }

            // If team result, update leaderboard for all team members
            if (!empty($data['team_id'])) {
                $stmt = $db->prepare("SELECT user_id FROM team_members WHERE team_id = :team");
                $stmt->execute([':team' => $data['team_id']]);
                $members = $stmt->fetchAll();

                foreach ($members as $member) {
                    self::updateLeaderboard($db, (int) $member['user_id'], $pointsAwarded, $data['position']);
                }
            }

            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to submit result: ' . $e->getMessage(), 500);
        }

        Response::created([
            'result_id'      => $resultId,
            'event_name'     => $event['event_name'],
            'position'       => $data['position'],
            'points_awarded' => $pointsAwarded,
        ], 'Result submitted successfully');
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/results/event/{eventId}
    //  Get all results for an event
    // ────────────────────────────────────────────────
    public static function eventResults(int $eventId): void
    {
        $db = Database::connect();

        $stmt = $db->prepare("SELECT event_id, event_name FROM events WHERE event_id = :id");
        $stmt->execute([':id' => $eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            Response::notFound('Event not found');
        }

        $stmt = $db->prepare("
            SELECT r.result_id, r.position, r.score, r.points_awarded, r.remarks, r.declared_at,
                   u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS participant_name,
                   c.college_name, c.college_code,
                   t.team_id, t.team_name
            FROM event_results r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN colleges c ON u.college_id = c.college_id
            LEFT JOIN teams t ON r.team_id = t.team_id
            WHERE r.event_id = :event
            ORDER BY FIELD(r.position, 'first', 'second', 'third', 'runner_up', 'participation', 'disqualified')
        ");
        $stmt->execute([':event' => $eventId]);

        Response::success([
            'event'   => $event,
            'results' => $stmt->fetchAll(),
        ]);
    }

    // ────────────────────────────────────────────────
    //  Private: Update leaderboard for a user
    // ────────────────────────────────────────────────
    private static function updateLeaderboard(PDO $db, int $userId, int $points, string $position): void
    {
        // ── Get user's college ──
        $stmt = $db->prepare("SELECT college_id FROM users WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch();

        if (!$user) return;

        $won = in_array($position, ['first', 'second', 'third']) ? 1 : 0;

        // ── Upsert user leaderboard entry (overall) ──
        $stmt = $db->prepare("
            INSERT INTO leaderboard (college_id, user_id, category_id, total_points, events_won, events_participated)
            VALUES (:college, :user, NULL, :points, :won, 1)
            ON DUPLICATE KEY UPDATE
                total_points = total_points + :points2,
                events_won = events_won + :won2,
                events_participated = events_participated + 1
        ");
        $stmt->execute([
            ':college' => $user['college_id'],
            ':user'    => $userId,
            ':points'  => $points,
            ':won'     => $won,
            ':points2' => $points,
            ':won2'    => $won,
        ]);

        // ── Upsert college aggregate leaderboard (user_id = NULL) ──
        $stmt = $db->prepare("
            INSERT INTO leaderboard (college_id, user_id, category_id, total_points, events_won, events_participated)
            VALUES (:college, NULL, NULL, :points, :won, 1)
            ON DUPLICATE KEY UPDATE
                total_points = total_points + :points2,
                events_won = events_won + :won2,
                events_participated = events_participated + 1
        ");
        $stmt->execute([
            ':college' => $user['college_id'],
            ':points'  => $points,
            ':won'     => $won,
            ':points2' => $points,
            ':won2'    => $won,
        ]);
    }
}
