<?php
/**
 * NexusFest API — Attendance Controller
 * 
 * QR-code-based check-in/check-out with offline sync support.
 */

class AttendanceController
{
    // ────────────────────────────────────────────────
    //  POST /api/v1/attendance/scan
    //  Coordinator scans a QR code to mark attendance
    // ────────────────────────────────────────────────
    public static function scan(): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireCoordinator($auth);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('qr_token', 'QR Token')
          ->required('event_id', 'Event ID')
          ->numeric('event_id', 'Event ID')
          ->validate();

        $db = Database::connect();

        // ── Verify QR token ──
        $qrData = QRCodeHelper::verifyToken($data['qr_token']);
        if (!$qrData) {
            Response::error('Invalid or tampered QR code', 400);
        }

        // ── Find the registration by QR token ──
        $stmt = $db->prepare("
            SELECT r.registration_id, r.user_id, r.event_id, r.status,
                   CONCAT(u.first_name, ' ', u.last_name) AS participant_name,
                   u.profile_photo
            FROM event_registrations r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.qr_token = :token
        ");
        $stmt->execute([':token' => $data['qr_token']]);
        $reg = $stmt->fetch();

        if (!$reg) {
            Response::error('No registration found for this QR code', 404);
        }

        if ((int) $reg['event_id'] !== (int) $data['event_id']) {
            Response::error('This QR code is not for the selected event', 400);
        }

        if ($reg['status'] === 'cancelled') {
            Response::error('This registration has been cancelled', 400);
        }

        // ── Determine check type (check_in / check_out) ──
        $stmt = $db->prepare("
            SELECT check_type FROM attendance_logs
            WHERE user_id = :user AND event_id = :event
            ORDER BY scanned_at DESC LIMIT 1
        ");
        $stmt->execute([':user' => $reg['user_id'], ':event' => $data['event_id']]);
        $lastScan = $stmt->fetch();

        $checkType = (!$lastScan || $lastScan['check_type'] === 'check_out') ? 'check_in' : 'check_out';

        // ── Record attendance ──
        $stmt = $db->prepare("
            INSERT INTO attendance_logs 
                (user_id, event_id, registration_id, check_type, scanned_at, scanned_by,
                 scan_method, device_id, latitude, longitude, synced)
            VALUES (:user, :event, :reg, :check, NOW(), :scanner,
                    :method, :device, :lat, :lng, 1)
        ");
        $stmt->execute([
            ':user'    => $reg['user_id'],
            ':event'   => (int) $data['event_id'],
            ':reg'     => $reg['registration_id'],
            ':check'   => $checkType,
            ':scanner' => $auth['user_id'],
            ':method'  => $data['scan_method'] ?? 'qr_scan',
            ':device'  => $data['device_id'] ?? null,
            ':lat'     => $data['latitude'] ?? null,
            ':lng'     => $data['longitude'] ?? null,
        ]);

        // ── Update registration status ──
        if ($checkType === 'check_in' && $reg['status'] === 'confirmed') {
            $db->prepare("UPDATE event_registrations SET status = 'checked_in' WHERE registration_id = :id")
               ->execute([':id' => $reg['registration_id']]);
        }

        Response::success([
            'attendance_id'    => (int) $db->lastInsertId(),
            'participant_name' => $reg['participant_name'],
            'profile_photo'    => $reg['profile_photo'],
            'check_type'       => $checkType,
            'event_id'         => (int) $data['event_id'],
            'scanned_at'       => date('Y-m-d H:i:s'),
        ], "Participant {$checkType} recorded");
    }

    // ────────────────────────────────────────────────
    //  POST /api/v1/attendance/sync
    //  Sync offline attendance records from mobile app
    // ────────────────────────────────────────────────
    public static function syncOffline(): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireCoordinator($auth);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($data['records']) || !is_array($data['records'])) {
            Response::error('No records to sync', 400);
        }

        $db = Database::connect();
        $accepted = 0;
        $rejected = 0;
        $conflicts = [];

        $db->beginTransaction();
        try {
            foreach ($data['records'] as $record) {
                // ── Verify QR token ──
                $qrData = QRCodeHelper::verifyToken($record['qr_token'] ?? '');
                if (!$qrData) {
                    $rejected++;
                    $conflicts[] = ['qr_token' => $record['qr_token'] ?? '', 'reason' => 'Invalid QR'];
                    continue;
                }

                // ── Find registration ──
                $stmt = $db->prepare("
                    SELECT registration_id, user_id FROM event_registrations
                    WHERE qr_token = :token AND event_id = :event
                ");
                $stmt->execute([
                    ':token' => $record['qr_token'],
                    ':event' => $record['event_id'] ?? 0,
                ]);
                $reg = $stmt->fetch();

                if (!$reg) {
                    $rejected++;
                    $conflicts[] = ['qr_token' => $record['qr_token'], 'reason' => 'Registration not found'];
                    continue;
                }

                // ── Check for duplicate scan at same timestamp ──
                $stmt = $db->prepare("
                    SELECT attendance_id FROM attendance_logs
                    WHERE user_id = :user AND event_id = :event AND scanned_at = :time
                ");
                $stmt->execute([
                    ':user'  => $reg['user_id'],
                    ':event' => $record['event_id'],
                    ':time'  => $record['scanned_at'],
                ]);
                if ($stmt->fetch()) {
                    $rejected++;
                    $conflicts[] = ['qr_token' => $record['qr_token'], 'reason' => 'Duplicate scan'];
                    continue;
                }

                // ── Insert attendance ──
                $stmt = $db->prepare("
                    INSERT INTO attendance_logs 
                        (user_id, event_id, registration_id, check_type, scanned_at,
                         scanned_by, scan_method, device_id, latitude, longitude, synced, sync_timestamp)
                    VALUES (:user, :event, :reg, :check, :time,
                            :scanner, :method, :device, :lat, :lng, 1, NOW())
                ");
                $stmt->execute([
                    ':user'    => $reg['user_id'],
                    ':event'   => $record['event_id'],
                    ':reg'     => $reg['registration_id'],
                    ':check'   => $record['check_type'] ?? 'check_in',
                    ':time'    => $record['scanned_at'],
                    ':scanner' => $auth['user_id'],
                    ':method'  => 'qr_scan',
                    ':device'  => $data['device_id'] ?? null,
                    ':lat'     => $record['latitude'] ?? null,
                    ':lng'     => $record['longitude'] ?? null,
                ]);
                $accepted++;
            }

            // ── Log the sync operation ──
            $stmt = $db->prepare("
                INSERT INTO offline_sync_log 
                    (user_id, device_id, sync_type, records_sent, records_accepted, 
                     records_rejected, conflicts_found, conflict_details)
                VALUES (:user, :device, 'attendance', :sent, :accepted, :rejected, :conflicts, :details)
            ");
            $stmt->execute([
                ':user'      => $auth['user_id'],
                ':device'    => $data['device_id'] ?? 'unknown',
                ':sent'      => count($data['records']),
                ':accepted'  => $accepted,
                ':rejected'  => $rejected,
                ':conflicts' => count($conflicts),
                ':details'   => !empty($conflicts) ? json_encode($conflicts) : null,
            ]);

            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Sync failed', 500);
        }

        Response::success([
            'records_sent'     => count($data['records']),
            'records_accepted' => $accepted,
            'records_rejected' => $rejected,
            'conflicts'        => $conflicts,
        ], 'Offline sync completed');
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/attendance/event/{eventId}
    //  Get attendance report for an event
    // ────────────────────────────────────────────────
    public static function eventReport(int $eventId): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireCoordinator($auth);

        $db = Database::connect();

        // ── Get event info ──
        $stmt = $db->prepare("SELECT event_id, event_name FROM events WHERE event_id = :id");
        $stmt->execute([':id' => $eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            Response::notFound('Event not found');
        }

        // ── Get attendance records ──
        $stmt = $db->prepare("
            SELECT a.attendance_id, a.check_type, a.scanned_at, a.scan_method,
                   u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS participant_name,
                   u.email, c.college_name,
                   CONCAT(s.first_name, ' ', s.last_name) AS scanner_name
            FROM attendance_logs a
            JOIN users u ON a.user_id = u.user_id
            JOIN colleges c ON u.college_id = c.college_id
            LEFT JOIN users s ON a.scanned_by = s.user_id
            WHERE a.event_id = :event
            ORDER BY a.scanned_at DESC
        ");
        $stmt->execute([':event' => $eventId]);
        $records = $stmt->fetchAll();

        // ── Summary ──
        $stmt = $db->prepare("
            SELECT 
                COUNT(DISTINCT CASE WHEN check_type = 'check_in' THEN user_id END) AS total_checked_in,
                COUNT(DISTINCT CASE WHEN check_type = 'check_out' THEN user_id END) AS total_checked_out,
                (SELECT COUNT(*) FROM event_registrations 
                 WHERE event_id = :event2 AND status != 'cancelled') AS total_registered
            FROM attendance_logs WHERE event_id = :event
        ");
        $stmt->execute([':event' => $eventId, ':event2' => $eventId]);
        $summary = $stmt->fetch();

        Response::success([
            'event'   => $event,
            'summary' => $summary,
            'records' => $records,
        ]);
    }

    /**
     * POST /api/v1/attendance/manual
     * Coordinator manually marks a participant as attended
     */
    public static function manualCheckIn(): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireCoordinator($auth);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $eventId = (int) ($data['event_id'] ?? 0);
        $regId = (int) ($data['registration_id'] ?? 0);

        if (!$eventId || !$regId) {
            Response::error('Event ID and Registration ID are required', 400);
        }

        $db = Database::connect();

        // Find registration
        $stmt = $db->prepare("SELECT user_id, status FROM event_registrations WHERE registration_id = :reg AND event_id = :evt");
        $stmt->execute([':reg' => $regId, ':evt' => $eventId]);
        $reg = $stmt->fetch();

        if (!$reg) {
            Response::notFound('Registration not found for this event');
        }

        if ($reg['status'] === 'checked_in') {
            Response::error('Participant is already checked in', 400);
        }

        // Record attendance log
        $stmt = $db->prepare("
            INSERT INTO attendance_logs 
                (user_id, event_id, registration_id, check_type, scanned_at, scanned_by, scan_method, synced)
            VALUES (:user, :event, :reg, 'check_in', NOW(), :scanner, 'manual_admin', 1)
        ");
        $stmt->execute([
            ':user'    => $reg['user_id'],
            ':event'   => $eventId,
            ':reg'     => $regId,
            ':scanner' => $auth['user_id']
        ]);

        // Update registration status
        $db->prepare("UPDATE event_registrations SET status = 'checked_in' WHERE registration_id = :id")
           ->execute([':id' => $regId]);

        Response::success(null, 'Participant checked in successfully');
    }

    /**
     * POST /api/v1/attendance/undo
     * Coordinator reverts a check-in (marks back as confirmed)
     */
    public static function undoCheckIn(): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireCoordinator($auth);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $eventId = (int) ($data['event_id'] ?? 0);
        $regId = (int) ($data['registration_id'] ?? 0);

        if (!$eventId || !$regId) {
            Response::error('Event ID and Registration ID are required', 400);
        }

        $db = Database::connect();
        $db->beginTransaction();

        try {
            // Check if checked in
            $stmt = $db->prepare("SELECT status FROM event_registrations WHERE registration_id = :reg AND event_id = :evt FOR UPDATE");
            $stmt->execute([':reg' => $regId, ':evt' => $eventId]);
            $reg = $stmt->fetch();

            if (!$reg || $reg['status'] !== 'checked_in') {
                $db->rollBack();
                Response::error('Participant is not checked in', 400);
            }

            // ── Reset registration status ──
            $db->prepare("UPDATE event_registrations SET status = 'confirmed' WHERE registration_id = :id")
               ->execute([':id' => $regId]);

            // ── Remove the latest check_in log entry ──
            // Using a subquery/limit to ensure we only remove the check_in
            $db->prepare("DELETE FROM attendance_logs WHERE registration_id = :id AND check_type = 'check_in' ORDER BY scanned_at DESC LIMIT 1")
               ->execute([':id' => $regId]);

            $db->commit();
            Response::success(null, 'Check-in cancelled and reverted successfully');
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to undo check-in', 500);
        }
    }
}
