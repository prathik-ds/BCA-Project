<?php
/**
 * NexusFest API — Event Controller
 * 
 * Handles event CRUD, listing with filters, and event details.
 */

class EventController
{
    // ────────────────────────────────────────────────
    //  GET /api/v1/events
    //  Supports filters: ?category=1&scope=inter_college&status=published&search=hackathon&page=1&per_page=20
    // ────────────────────────────────────────────────
    public static function list(): void
    {
        $db = Database::connect();

        // ── Parse query parameters ──
        $page    = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(MAX_PAGE_SIZE, max(1, (int) ($_GET['per_page'] ?? DEFAULT_PAGE_SIZE)));
        $offset  = ($page - 1) * $perPage;

        $where  = ["e.status != 'draft'"];
        $params = [];

        // Filter: category
        if (!empty($_GET['category'])) {
            $where[]             = "e.category_id = :category";
            $params[':category'] = (int) $_GET['category'];
        }

        // Filter: scope (intra_college, inter_college, open)
        if (!empty($_GET['scope'])) {
            $where[]          = "e.scope = :scope";
            $params[':scope'] = $_GET['scope'];
        }

        // Filter: event type
        if (!empty($_GET['type'])) {
            $where[]         = "e.event_type = :type";
            $params[':type'] = $_GET['type'];
        }

        // Filter: status
        if (!empty($_GET['status'])) {
            $where[]           = "e.status = :status";
            $params[':status'] = $_GET['status'];
        }

        // Filter: search
        if (!empty($_GET['search'])) {
            $where[]           = "(e.event_name LIKE :search OR e.description LIKE :search)";
            $params[':search'] = '%' . $_GET['search'] . '%';
        }

        $whereClause = implode(' AND ', $where);

        // ── Count total ──
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM events e WHERE {$whereClause}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetch()['total'];

        // ── Fetch events ──
        $stmt = $db->prepare("
            SELECT e.event_id, e.event_name, e.slug, e.description, e.event_type,
                   e.scope, e.start_datetime, e.end_datetime, e.registration_deadline,
                   e.min_team_size, e.max_team_size, e.max_participants, e.entry_fee,
                   e.prize_pool, e.banner_image, e.status,
                   ec.category_name,
                   v.venue_name, v.building,
                   (SELECT COUNT(*) FROM event_registrations r 
                    WHERE r.event_id = e.event_id AND r.status != 'cancelled') AS registered_count
            FROM events e
            JOIN event_categories ec ON e.category_id = ec.category_id
            LEFT JOIN venues v ON e.venue_id = v.venue_id
            WHERE {$whereClause}
            ORDER BY e.start_datetime ASC
            LIMIT :limit OFFSET :offset
        ");

        // PDO needs special handling for LIMIT/OFFSET with prepared statements
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $events = $stmt->fetchAll();

        Response::paginated($events, $total, $page, $perPage);
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/events/{id}
    // ────────────────────────────────────────────────
    public static function show(int $id): void
    {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT e.*, 
                   ec.category_name,
                   v.venue_name, v.building, v.floor_number, v.capacity AS venue_capacity,
                   v.latitude AS venue_lat, v.longitude AS venue_lng,
                   CONCAT(u.first_name, ' ', u.last_name) AS coordinator_name,
                   (SELECT COUNT(*) FROM event_registrations r 
                    WHERE r.event_id = e.event_id AND r.status != 'cancelled') AS registered_count
            FROM events e
            JOIN event_categories ec ON e.category_id = ec.category_id
            LEFT JOIN venues v ON e.venue_id = v.venue_id
            LEFT JOIN users u ON e.coordinator_id = u.user_id
            WHERE e.event_id = :id
        ");
        $stmt->execute([':id' => $id]);
        $event = $stmt->fetch();

        if (!$event) {
            Response::notFound('Event not found');
        }

        Response::success($event);
    }

    // ────────────────────────────────────────────────
    //  POST /api/v1/events
    //  Requires: admin or super_admin
    // ────────────────────────────────────────────────
    public static function create(): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($auth);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('event_name', 'Event name')
          ->required('category_id', 'Category')
          ->required('event_type', 'Event type')
          ->in('event_type', ['solo', 'team', 'workshop', 'exhibition', 'competition', 'seminar'], 'Event type')
          ->required('scope', 'Scope')
          ->in('scope', ['intra_college', 'inter_college', 'open'], 'Scope')
          ->required('start_datetime', 'Start date/time')
          ->dateTime('start_datetime', 'Y-m-d H:i:s', 'Start date/time')
          ->required('end_datetime', 'End date/time')
          ->dateTime('end_datetime', 'Y-m-d H:i:s', 'End date/time')
          ->validate();

        $db = Database::connect();

        // ── Generate slug ──
        $slug = strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', trim($data['event_name'])));
        $slug = $slug . '-' . substr(uniqid(), -5);

        $stmt = $db->prepare("
            INSERT INTO events (event_name, slug, description, rules, category_id, venue_id,
                event_type, scope, start_datetime, end_datetime, registration_deadline,
                min_team_size, max_team_size, max_participants, entry_fee, prize_pool,
                points_first, points_second, points_third, points_participation,
                banner_image, coordinator_id, status, requires_face_verification, created_by)
            VALUES (:name, :slug, :desc, :rules, :cat, :venue,
                :type, :scope, :start, :end, :deadline,
                :min_team, :max_team, :max_part, :fee, :prize,
                :p1, :p2, :p3, :pp,
                :banner, :coord, :status, :face, :created_by)
        ");

        $stmt->execute([
            ':name'       => trim($data['event_name']),
            ':slug'       => $slug,
            ':desc'       => $data['description'] ?? null,
            ':rules'      => $data['rules'] ?? null,
            ':cat'        => (int) $data['category_id'],
            ':venue'      => $data['venue_id'] ?? null,
            ':type'       => $data['event_type'],
            ':scope'      => $data['scope'],
            ':start'      => $data['start_datetime'],
            ':end'        => $data['end_datetime'],
            ':deadline'   => $data['registration_deadline'] ?? null,
            ':min_team'   => (int) ($data['min_team_size'] ?? 1),
            ':max_team'   => (int) ($data['max_team_size'] ?? 1),
            ':max_part'   => $data['max_participants'] ?? null,
            ':fee'        => (float) ($data['entry_fee'] ?? 0),
            ':prize'      => (float) ($data['prize_pool'] ?? 0),
            ':p1'         => (int) ($data['points_first'] ?? 0),
            ':p2'         => (int) ($data['points_second'] ?? 0),
            ':p3'         => (int) ($data['points_third'] ?? 0),
            ':pp'         => (int) ($data['points_participation'] ?? 0),
            ':banner'     => $data['banner_image'] ?? null,
            ':coord'      => $data['coordinator_id'] ?? null,
            ':status'     => $data['status'] ?? 'draft',
            ':face'       => (int) ($data['requires_face_verification'] ?? 0),
            ':created_by' => $auth['user_id'],
        ]);

        $eventId = (int) $db->lastInsertId();

        Response::created([
            'event_id' => $eventId,
            'slug'     => $slug,
        ], 'Event created successfully');
    }

    // ────────────────────────────────────────────────
    //  PUT /api/v1/events/{id}
    //  Requires: admin or super_admin
    // ────────────────────────────────────────────────
    public static function update(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($auth);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $db   = Database::connect();

        // ── Check event exists ──
        $stmt = $db->prepare("SELECT event_id FROM events WHERE event_id = :id");
        $stmt->execute([':id' => $id]);
        if (!$stmt->fetch()) {
            Response::notFound('Event not found');
        }

        // ── Build dynamic UPDATE query ──
        $allowedFields = [
            'event_name', 'description', 'rules', 'category_id', 'venue_id',
            'event_type', 'scope', 'start_datetime', 'end_datetime',
            'registration_deadline', 'min_team_size', 'max_team_size',
            'max_participants', 'entry_fee', 'prize_pool',
            'points_first', 'points_second', 'points_third', 'points_participation',
            'banner_image', 'coordinator_id', 'status', 'requires_face_verification',
        ];

        $setClauses = [];
        $params     = [':id' => $id];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $setClauses[]        = "{$field} = :{$field}";
                $params[":{$field}"] = $data[$field];
            }
        }

        if (empty($setClauses)) {
            Response::error('No fields to update', 400);
        }

        $setString = implode(', ', $setClauses);
        $db->prepare("UPDATE events SET {$setString} WHERE event_id = :id")->execute($params);

        Response::success(['event_id' => $id], 'Event updated successfully');
    }

    // ────────────────────────────────────────────────
    //  DELETE /api/v1/events/{id}
    //  Requires: super_admin only
    // ────────────────────────────────────────────────
    public static function delete(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireRole($auth, [ROLE_SUPER_ADMIN]);

        $db = Database::connect();

        $stmt = $db->prepare("SELECT event_id, status FROM events WHERE event_id = :id");
        $stmt->execute([':id' => $id]);
        $event = $stmt->fetch();

        if (!$event) {
            Response::notFound('Event not found');
        }

        if ($event['status'] === 'ongoing') {
            Response::error('Cannot delete an ongoing event. Cancel it first.', 400);
        }

        // Soft delete: set status to cancelled
        $db->prepare("UPDATE events SET status = 'cancelled' WHERE event_id = :id")
           ->execute([':id' => $id]);

        Response::success(null, 'Event cancelled successfully');
    }
}
