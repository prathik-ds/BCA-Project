<?php
/**
 * NexusFest API — Registration Controller
 * 
 * Handles event registration (single and batch), cancellation, and user's registrations.
 */

class RegistrationController
{
    // ────────────────────────────────────────────────
    //  POST /api/v1/registrations
    //  Register for one or more events
    // ────────────────────────────────────────────────
    public static function register(): void
    {
        $auth = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('event_id', 'Event ID')
          ->numeric('event_id', 'Event ID')
          ->validate();

        $db      = Database::connect();
        $eventId = (int) $data['event_id'];
        $teamId  = $data['team_id'] ?? null;

        // ── Verify event ──
        $stmt = $db->prepare("
            SELECT event_id, event_name, max_participants, entry_fee, status,
                   registration_deadline, max_team_size, scope
            FROM events WHERE event_id = :id
        ");
        $stmt->execute([':id' => $eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            Response::notFound('Event not found');
        }

        if (!in_array($event['status'], ['published', 'ongoing'])) {
            Response::error('Registration is not open for this event', 400);
        }

        // ── Check registration deadline ──
        if ($event['registration_deadline'] && strtotime($event['registration_deadline']) < time()) {
            Response::error('Registration deadline has passed', 400);
        }

        // ── Check duplicate registration ──
        $stmt = $db->prepare("
            SELECT registration_id FROM event_registrations
            WHERE user_id = :user AND event_id = :event AND status != 'cancelled'
        ");
        $stmt->execute([':user' => $auth['user_id'], ':event' => $eventId]);
        if ($stmt->fetch()) {
            Response::error('You are already registered for this event', 409);
        }

        // ── Check capacity ──
        $stmt = $db->prepare("
            SELECT COUNT(*) AS cnt FROM event_registrations
            WHERE event_id = :id AND status != 'cancelled'
        ");
        $stmt->execute([':id' => $eventId]);
        $currentCount = (int) $stmt->fetch()['cnt'];

        $status = 'confirmed';
        if ($event['max_participants'] && $currentCount >= $event['max_participants']) {
            $status = 'waitlisted';
        }

        // ── Payment status ──
        $paymentStatus = ((float) $event['entry_fee'] > 0) ? 'pending' : 'not_required';

        // ── Generate QR token ──
        $qrToken = QRCodeHelper::generateToken('registration', 0);

        // ── Insert registration ──
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                INSERT INTO event_registrations 
                    (user_id, event_id, team_id, status, payment_status, amount_paid, qr_token)
                VALUES (:user, :event, :team, :status, :pay_status, :amount, :qr)
            ");
            $stmt->execute([
                ':user'       => $auth['user_id'],
                ':event'      => $eventId,
                ':team'       => $teamId,
                ':status'     => $status,
                ':pay_status' => $paymentStatus,
                ':amount'     => ($paymentStatus === 'not_required') ? 0.00 : (float) $event['entry_fee'],
                ':qr'         => $qrToken,
            ]);

            $regId = (int) $db->lastInsertId();

            // Update QR token with actual registration ID
            $qrToken = QRCodeHelper::generateToken('registration', $regId);
            $db->prepare("UPDATE event_registrations SET qr_token = :qr WHERE registration_id = :id")
               ->execute([':qr' => $qrToken, ':id' => $regId]);

            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Registration failed', 500);
        }

        Response::created([
            'registration_id' => $regId,
            'event_id'        => $eventId,
            'event_name'      => $event['event_name'],
            'status'          => $status,
            'payment_status'  => $paymentStatus,
            'qr_token'        => $qrToken,
        ], $status === 'waitlisted'
            ? 'You have been added to the waitlist'
            : 'Registration successful');
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/registrations/my
    //  Get all registrations for the authenticated user
    // ────────────────────────────────────────────────
    public static function myRegistrations(): void
    {
        $auth = AuthMiddleware::authenticate();
        $db   = Database::connect();

        $stmt = $db->prepare("
            SELECT r.registration_id, r.status, r.payment_status, r.qr_token, r.registered_at,
                   e.event_id, e.event_name, e.event_type, e.scope, e.start_datetime,
                   e.end_datetime, e.entry_fee, e.status AS event_status,
                   ec.category_name,
                   v.venue_name,
                   t.team_id, t.team_name
            FROM event_registrations r
            JOIN events e ON r.event_id = e.event_id
            JOIN event_categories ec ON e.category_id = ec.category_id
            LEFT JOIN venues v ON e.venue_id = v.venue_id
            LEFT JOIN teams t ON r.team_id = t.team_id
            WHERE r.user_id = :user
            ORDER BY e.start_datetime ASC
        ");
        $stmt->execute([':user' => $auth['user_id']]);

        Response::success($stmt->fetchAll(), 'Registrations retrieved');
    }

    // ────────────────────────────────────────────────
    //  DELETE /api/v1/registrations/{id}
    //  Cancel a registration
    // ────────────────────────────────────────────────
    public static function cancel(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $db   = Database::connect();

        $stmt = $db->prepare("
            SELECT registration_id, user_id, event_id, status, payment_status
            FROM event_registrations WHERE registration_id = :id
        ");
        $stmt->execute([':id' => $id]);
        $reg = $stmt->fetch();

        if (!$reg) {
            Response::notFound('Registration not found');
        }

        if ((int) $reg['user_id'] !== (int) $auth['user_id']) {
            Response::forbidden('You can only cancel your own registrations');
        }

        if ($reg['status'] === 'cancelled') {
            Response::error('Registration is already cancelled', 400);
        }

        $db->prepare("UPDATE event_registrations SET status = 'cancelled' WHERE registration_id = :id")
           ->execute([':id' => $id]);

        // ── If paid, mark for refund ──
        if ($reg['payment_status'] === 'completed') {
            $db->prepare("UPDATE event_registrations SET payment_status = 'refunded' WHERE registration_id = :id")
               ->execute([':id' => $id]);
        }

        Response::success(null, 'Registration cancelled');
    }
}
