<?php
/**
 * NexusFest API — Team Controller
 * 
 * Handles team creation, joining via invite code, and member management.
 */

class TeamController
{
    // ────────────────────────────────────────────────
    //  POST /api/v1/teams
    //  Create a new team for a team-based event
    // ────────────────────────────────────────────────
    public static function create(): void
    {
        $auth = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('team_name', 'Team name')
          ->required('event_id', 'Event')
          ->numeric('event_id', 'Event ID')
          ->validate();

        $db = Database::connect();

        // ── Verify event exists and is a team event ──
        $stmt = $db->prepare("
            SELECT event_id, event_type, max_team_size, scope, status
            FROM events WHERE event_id = :id
        ");
        $stmt->execute([':id' => $data['event_id']]);
        $event = $stmt->fetch();

        if (!$event) {
            Response::notFound('Event not found');
        }

        if ($event['max_team_size'] <= 1) {
            Response::error('This is a solo event. Teams are not allowed.', 400);
        }

        if (!in_array($event['status'], ['published', 'ongoing'])) {
            Response::error('Registrations are not open for this event', 400);
        }

        // ── Check if user already has a team for this event ──
        $stmt = $db->prepare("
            SELECT t.team_id FROM teams t
            JOIN team_members tm ON t.team_id = tm.team_id
            WHERE t.event_id = :event_id AND tm.user_id = :user_id
        ");
        $stmt->execute([':event_id' => $data['event_id'], ':user_id' => $auth['user_id']]);
        if ($stmt->fetch()) {
            Response::error('You are already in a team for this event', 409);
        }

        // ── Generate invite code ──
        $inviteCode = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));

        // ── Get user's college ──
        $stmt = $db->prepare("SELECT college_id FROM users WHERE user_id = :id");
        $stmt->execute([':id' => $auth['user_id']]);
        $user = $stmt->fetch();

        // ── Create team ──
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                INSERT INTO teams (team_name, event_id, leader_id, invite_code, college_id)
                VALUES (:name, :event_id, :leader_id, :invite, :college_id)
            ");
            $stmt->execute([
                ':name'       => trim($data['team_name']),
                ':event_id'   => (int) $data['event_id'],
                ':leader_id'  => $auth['user_id'],
                ':invite'     => $inviteCode,
                ':college_id' => $user['college_id'],
            ]);

            $teamId = (int) $db->lastInsertId();

            // ── Add creator as leader ──
            $db->prepare("
                INSERT INTO team_members (team_id, user_id, role) VALUES (:team, :user, 'leader')
            ")->execute([':team' => $teamId, ':user' => $auth['user_id']]);

            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to create team', 500);
        }

        Response::created([
            'team_id'     => $teamId,
            'team_name'   => trim($data['team_name']),
            'invite_code' => $inviteCode,
            'event_id'    => (int) $data['event_id'],
            'leader_id'   => $auth['user_id'],
        ], 'Team created successfully. Share the invite code with your teammates.');
    }

    // ────────────────────────────────────────────────
    //  POST /api/v1/teams/join
    //  Join a team using an invite code
    // ────────────────────────────────────────────────
    public static function join(): void
    {
        $auth = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('invite_code', 'Invite code')->validate();

        $db = Database::connect();

        // ── Find team by invite code ──
        $stmt = $db->prepare("
            SELECT t.team_id, t.team_name, t.event_id, t.college_id,
                   e.max_team_size, e.scope,
                   (SELECT COUNT(*) FROM team_members WHERE team_id = t.team_id) AS member_count
            FROM teams t
            JOIN events e ON t.event_id = e.event_id
            WHERE t.invite_code = :code
        ");
        $stmt->execute([':code' => strtoupper(trim($data['invite_code']))]);
        $team = $stmt->fetch();

        if (!$team) {
            Response::error('Invalid invite code', 404);
        }

        // ── Check team capacity ──
        if ($team['member_count'] >= $team['max_team_size']) {
            Response::error("Team is full (max {$team['max_team_size']} members)", 400);
        }

        // ── Check if already in a team for this event ──
        $stmt = $db->prepare("
            SELECT t.team_id FROM teams t
            JOIN team_members tm ON t.team_id = tm.team_id
            WHERE t.event_id = :event_id AND tm.user_id = :user_id
        ");
        $stmt->execute([':event_id' => $team['event_id'], ':user_id' => $auth['user_id']]);
        if ($stmt->fetch()) {
            Response::error('You are already in a team for this event', 409);
        }

        // ── Check inter-college restrictions ──
        if ($team['scope'] === 'intra_college' && $team['college_id']) {
            $stmt = $db->prepare("SELECT college_id FROM users WHERE user_id = :id");
            $stmt->execute([':id' => $auth['user_id']]);
            $user = $stmt->fetch();

            if ((int) $user['college_id'] !== (int) $team['college_id']) {
                Response::error('This is an intra-college event. You must be from the same college.', 403);
            }
        }

        // ── Add member ──
        $db->prepare("
            INSERT INTO team_members (team_id, user_id, role) VALUES (:team, :user, 'member')
        ")->execute([':team' => $team['team_id'], ':user' => $auth['user_id']]);

        // ── Check if team now meets min size → confirm ──
        $stmt = $db->prepare("
            SELECT COUNT(*) AS cnt FROM team_members WHERE team_id = :id
        ");
        $stmt->execute([':id' => $team['team_id']]);
        $count = (int) $stmt->fetch()['cnt'];

        $stmt = $db->prepare("SELECT min_team_size FROM events WHERE event_id = :id");
        $stmt->execute([':id' => $team['event_id']]);
        $minSize = (int) $stmt->fetch()['min_team_size'];

        if ($count >= $minSize) {
            $db->prepare("UPDATE teams SET is_confirmed = 1 WHERE team_id = :id")
               ->execute([':id' => $team['team_id']]);
        }

        Response::success([
            'team_id'      => (int) $team['team_id'],
            'team_name'    => $team['team_name'],
            'member_count' => $count,
        ], 'Joined team successfully');
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/teams/{id}
    // ────────────────────────────────────────────────
    public static function show(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $db   = Database::connect();

        $stmt = $db->prepare("
            SELECT t.team_id, t.team_name, t.invite_code, t.is_confirmed, t.created_at,
                   e.event_id, e.event_name, e.max_team_size, e.min_team_size,
                   CONCAT(u.first_name, ' ', u.last_name) AS leader_name
            FROM teams t
            JOIN events e ON t.event_id = e.event_id
            JOIN users u ON t.leader_id = u.user_id
            WHERE t.team_id = :id
        ");
        $stmt->execute([':id' => $id]);
        $team = $stmt->fetch();

        if (!$team) {
            Response::notFound('Team not found');
        }

        // ── Get members ──
        $stmt = $db->prepare("
            SELECT tm.user_id, tm.role, tm.joined_at,
                   u.first_name, u.last_name, u.email,
                   c.college_name, c.college_code
            FROM team_members tm
            JOIN users u ON tm.user_id = u.user_id
            JOIN colleges c ON u.college_id = c.college_id
            WHERE tm.team_id = :id
            ORDER BY tm.role DESC, tm.joined_at ASC
        ");
        $stmt->execute([':id' => $id]);
        $team['members'] = $stmt->fetchAll();

        Response::success($team);
    }

    // ────────────────────────────────────────────────
    //  DELETE /api/v1/teams/{teamId}/members/{userId}
    //  Remove a member (leader only) or leave team
    // ────────────────────────────────────────────────
    public static function removeMember(int $teamId, int $userId): void
    {
        $auth = AuthMiddleware::authenticate();
        $db   = Database::connect();

        // ── Verify team exists and requester is leader or the member themselves ──
        $stmt = $db->prepare("SELECT leader_id FROM teams WHERE team_id = :id");
        $stmt->execute([':id' => $teamId]);
        $team = $stmt->fetch();

        if (!$team) {
            Response::notFound('Team not found');
        }

        $isLeader = ((int) $team['leader_id'] === (int) $auth['user_id']);
        $isSelf   = ((int) $userId === (int) $auth['user_id']);

        if (!$isLeader && !$isSelf) {
            Response::forbidden('Only the team leader can remove members');
        }

        if ($isLeader && $isSelf) {
            Response::error('Team leader cannot leave. Transfer leadership first or disband the team.', 400);
        }

        $db->prepare("DELETE FROM team_members WHERE team_id = :team AND user_id = :user")
           ->execute([':team' => $teamId, ':user' => $userId]);

        Response::success(null, 'Member removed from team');
    }
}
