<?php
/**
 * NexusFest API — Certificate Controller
 * 
 * Generate and download digital certificates with unique verification codes.
 */

class CertificateController
{
    // ────────────────────────────────────────────────
    //  POST /api/v1/certificates/generate
    //  Generate certificate for a participant (admin)
    // ────────────────────────────────────────────────
    public static function generate(): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($auth);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('user_id', 'User ID')
          ->numeric('user_id', 'User ID')
          ->required('event_id', 'Event ID')
          ->numeric('event_id', 'Event ID')
          ->required('cert_type', 'Certificate type')
          ->in('cert_type', [
              'participation', 'winner_first', 'winner_second', 'winner_third',
              'volunteer', 'organizer', 'coordinator', 'merit'
          ], 'Certificate type')
          ->validate();

        $db = Database::connect();

        // ── Verify user exists ──
        $stmt = $db->prepare("
            SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS full_name,
                   c.college_name
            FROM users u
            JOIN colleges c ON u.college_id = c.college_id
            WHERE u.user_id = :id
        ");
        $stmt->execute([':id' => $data['user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::notFound('User not found');
        }

        // ── Verify event ──
        $stmt = $db->prepare("SELECT event_id, event_name FROM events WHERE event_id = :id");
        $stmt->execute([':id' => $data['event_id']]);
        $event = $stmt->fetch();

        if (!$event) {
            Response::notFound('Event not found');
        }

        // ── Check if certificate already exists ──
        $stmt = $db->prepare("
            SELECT certificate_id FROM certificates
            WHERE user_id = :user AND event_id = :event AND cert_type = :type AND is_revoked = 0
        ");
        $stmt->execute([
            ':user'  => $data['user_id'],
            ':event' => $data['event_id'],
            ':type'  => $data['cert_type'],
        ]);
        if ($stmt->fetch()) {
            Response::error('Certificate already exists for this user, event, and type', 409);
        }

        // ── Generate verification code ──
        $verificationCode = 'NF-CERT-' . date('Y') . '-' . str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);

        // ── Check for linked result ──
        $resultId = null;
        if (str_starts_with($data['cert_type'], 'winner_')) {
            $stmt = $db->prepare("
                SELECT result_id FROM event_results
                WHERE event_id = :event AND user_id = :user
                LIMIT 1
            ");
            $stmt->execute([':event' => $data['event_id'], ':user' => $data['user_id']]);
            $result = $stmt->fetch();
            $resultId = $result ? $result['result_id'] : null;
        }

        // ── Insert certificate record ──
        // Note: Actual PDF generation would be handled by the Python microservice.
        // This endpoint creates the DB record and returns data for the Python service to process.
        $filePath = "certificates/{$verificationCode}.pdf";

        $stmt = $db->prepare("
            INSERT INTO certificates 
                (user_id, event_id, result_id, cert_type, verification_code,
                 file_path, template_used, issued_date)
            VALUES (:user, :event, :result, :type, :code,
                    :path, :template, CURDATE())
        ");
        $stmt->execute([
            ':user'     => (int) $data['user_id'],
            ':event'    => (int) $data['event_id'],
            ':result'   => $resultId,
            ':type'     => $data['cert_type'],
            ':code'     => $verificationCode,
            ':path'     => $filePath,
            ':template' => $data['template'] ?? 'default',
        ]);

        $certId = (int) $db->lastInsertId();

        Response::created([
            'certificate_id'    => $certId,
            'verification_code' => $verificationCode,
            'participant_name'  => $user['full_name'],
            'college_name'      => $user['college_name'],
            'event_name'        => $event['event_name'],
            'cert_type'         => $data['cert_type'],
            'file_path'         => $filePath,
        ], 'Certificate generated successfully');
    }

    // ────────────────────────────────────────────────
    //  POST /api/v1/certificates/bulk-generate
    //  Generate certificates for all confirmed attendees of an event
    // ────────────────────────────────────────────────
    public static function bulkGenerate(): void
    {
        $auth = AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin($auth);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('event_id', 'Event ID')
          ->numeric('event_id', 'Event ID')
          ->required('cert_type', 'Certificate type')
          ->validate();

        $db = Database::connect();

        // ── Get all checked-in participants who don't already have this cert ──
        $stmt = $db->prepare("
            SELECT r.user_id
            FROM event_registrations r
            WHERE r.event_id = :event AND r.status = 'checked_in'
              AND r.user_id NOT IN (
                  SELECT c.user_id FROM certificates c
                  WHERE c.event_id = :event2 AND c.cert_type = :type AND c.is_revoked = 0
              )
        ");
        $stmt->execute([
            ':event'  => $data['event_id'],
            ':event2' => $data['event_id'],
            ':type'   => $data['cert_type'],
        ]);
        $users = $stmt->fetchAll();

        $generated = 0;
        $codes     = [];

        foreach ($users as $user) {
            $code = 'NF-CERT-' . date('Y') . '-' . str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);
            $filePath = "certificates/{$code}.pdf";

            $stmt = $db->prepare("
                INSERT INTO certificates 
                    (user_id, event_id, cert_type, verification_code, file_path, template_used, issued_date)
                VALUES (:user, :event, :type, :code, :path, :template, CURDATE())
            ");
            $stmt->execute([
                ':user'     => $user['user_id'],
                ':event'    => (int) $data['event_id'],
                ':type'     => $data['cert_type'],
                ':code'     => $code,
                ':path'     => $filePath,
                ':template' => $data['template'] ?? 'default',
            ]);

            $generated++;
            $codes[] = $code;
        }

        Response::success([
            'event_id'             => (int) $data['event_id'],
            'certificates_generated' => $generated,
            'verification_codes'   => $codes,
        ], "{$generated} certificates generated");
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/certificates/{id}/download
    //  Download certificate PDF (or get certificate data)
    // ────────────────────────────────────────────────
    public static function download(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $db   = Database::connect();

        $stmt = $db->prepare("
            SELECT cert.certificate_id, cert.cert_type, cert.verification_code,
                   cert.file_path, cert.issued_date, cert.is_revoked,
                   CONCAT(u.first_name, ' ', u.last_name) AS participant_name,
                   u.email, c.college_name,
                   e.event_name, e.start_datetime, e.end_datetime,
                   ec.category_name
            FROM certificates cert
            JOIN users u ON cert.user_id = u.user_id
            JOIN colleges c ON u.college_id = c.college_id
            JOIN events e ON cert.event_id = e.event_id
            JOIN event_categories ec ON e.category_id = ec.category_id
            WHERE cert.certificate_id = :id
        ");
        $stmt->execute([':id' => $id]);
        $cert = $stmt->fetch();

        if (!$cert) {
            Response::notFound('Certificate not found');
        }

        if ($cert['is_revoked']) {
            Response::error('This certificate has been revoked', 403);
        }

        // ── Increment download count ──
        $db->prepare("UPDATE certificates SET download_count = download_count + 1 WHERE certificate_id = :id")
           ->execute([':id' => $id]);

        Response::success($cert, 'Certificate data retrieved');
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/certificates/verify/{code}
    //  Public endpoint to verify certificate authenticity
    // ────────────────────────────────────────────────
    public static function verify(string $code): void
    {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT cert.cert_type, cert.verification_code, cert.issued_date, cert.is_revoked,
                   CONCAT(u.first_name, ' ', u.last_name) AS participant_name,
                   c.college_name,
                   e.event_name
            FROM certificates cert
            JOIN users u ON cert.user_id = u.user_id
            JOIN colleges c ON u.college_id = c.college_id
            JOIN events e ON cert.event_id = e.event_id
            WHERE cert.verification_code = :code
        ");
        $stmt->execute([':code' => $code]);
        $cert = $stmt->fetch();

        if (!$cert) {
            Response::notFound('Certificate not found. This verification code is invalid.');
        }

        Response::success([
            'is_valid'         => !$cert['is_revoked'],
            'verification_code' => $cert['verification_code'],
            'participant_name' => $cert['participant_name'],
            'college_name'     => $cert['college_name'],
            'event_name'       => $cert['event_name'],
            'cert_type'        => $cert['cert_type'],
            'issued_date'      => $cert['issued_date'],
            'is_revoked'       => (bool) $cert['is_revoked'],
        ], $cert['is_revoked'] ? 'Certificate has been REVOKED' : 'Certificate is VALID');
    }
}
