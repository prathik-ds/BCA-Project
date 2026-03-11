<?php
/**
 * NexusFest API — Authentication Controller
 * 
 * Handles user registration, login, token refresh, and profile.
 */

class AuthController
{
    // ────────────────────────────────────────────────
    //  POST /api/v1/auth/register
    // ────────────────────────────────────────────────
    public static function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // ── Validate input ──
        $v = new Validator($data);
        $v->required('first_name', 'First name')
          ->required('last_name', 'Last name')
          ->required('email', 'Email')
          ->email('email', 'Email')
          ->required('password', 'Password')
          ->minLength('password', 8, 'Password')
          ->required('college_id', 'College')
          ->numeric('college_id', 'College ID')
          ->validate();

        $db = Database::connect();

        // ── Check duplicate email ──
        $stmt = $db->prepare("SELECT user_id FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => strtolower(trim($data['email']))]);

        if ($stmt->fetch()) {
            Response::error('An account with this email already exists', 409);
        }

        // ── Verify college exists ──
        $stmt = $db->prepare("SELECT college_id FROM colleges WHERE college_id = :id AND is_verified = 1");
        $stmt->execute([':id' => $data['college_id']]);

        if (!$stmt->fetch()) {
            Response::error('Invalid or unverified college', 400);
        }

        // ── Create user ──
        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $qrToken = QRCodeHelper::generateToken('user', 0); // Temporary, updated after insert

        $stmt = $db->prepare("
            INSERT INTO users (first_name, last_name, email, phone, password_hash, role, college_id, department_id, year_of_study, qr_token)
            VALUES (:first_name, :last_name, :email, :phone, :password_hash, :role, :college_id, :department_id, :year, :qr_token)
        ");

        $stmt->execute([
            ':first_name'    => trim($data['first_name']),
            ':last_name'     => trim($data['last_name']),
            ':email'         => strtolower(trim($data['email'])),
            ':phone'         => $data['phone'] ?? null,
            ':password_hash' => $passwordHash,
            ':role'          => ROLE_PARTICIPANT,
            ':college_id'    => (int) $data['college_id'],
            ':department_id' => $data['department_id'] ?? null,
            ':year'          => $data['year_of_study'] ?? null,
            ':qr_token'      => $qrToken,
        ]);

        $userId = (int) $db->lastInsertId();

        // ── Update QR token with actual user ID ──
        $qrToken = QRCodeHelper::generateToken('user', $userId);
        $db->prepare("UPDATE users SET qr_token = :token WHERE user_id = :id")
           ->execute([':token' => $qrToken, ':id' => $userId]);

        // ── Generate tokens ──
        $tokenPayload = [
            'user_id' => $userId,
            'email'   => strtolower(trim($data['email'])),
            'role'    => ROLE_PARTICIPANT,
        ];

        $accessToken  = JWTHandler::generateAccessToken($tokenPayload);
        $refreshToken = JWTHandler::generateRefreshToken($tokenPayload);

        // ── Store refresh token ──
        $stmt = $db->prepare("
            INSERT INTO auth_tokens (user_id, refresh_token, device_info, ip_address, expires_at)
            VALUES (:user_id, :token, :device, :ip, DATE_ADD(NOW(), INTERVAL 7 DAY))
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':token'   => $refreshToken,
            ':device'  => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            ':ip'      => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
        ]);

        Response::created([
            'user' => [
                'user_id'    => $userId,
                'first_name' => trim($data['first_name']),
                'last_name'  => trim($data['last_name']),
                'email'      => strtolower(trim($data['email'])),
                'role'       => ROLE_PARTICIPANT,
            ],
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type'    => 'Bearer',
            'expires_in'    => JWT_ACCESS_EXPIRY,
        ], 'Registration successful');
    }

    // ────────────────────────────────────────────────
    //  POST /api/v1/auth/login
    // ────────────────────────────────────────────────
    public static function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('email', 'Email')
          ->email('email', 'Email')
          ->required('password', 'Password')
          ->validate();

        $db = Database::connect();

        // ── Find user ──
        $stmt = $db->prepare("
            SELECT user_id, first_name, last_name, email, password_hash, role, college_id, is_active
            FROM users WHERE email = :email LIMIT 1
        ");
        $stmt->execute([':email' => strtolower(trim($data['email']))]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            Response::error('Invalid email or password', 401);
        }

        if (!$user['is_active']) {
            Response::error('Your account has been deactivated. Contact admin.', 403);
        }

        // ── Update last login ──
        $db->prepare("UPDATE users SET last_login_at = NOW() WHERE user_id = :id")
           ->execute([':id' => $user['user_id']]);

        // ── Generate tokens ──
        $tokenPayload = [
            'user_id'    => (int) $user['user_id'],
            'email'      => $user['email'],
            'role'       => $user['role'],
            'college_id' => (int) $user['college_id'],
        ];

        $accessToken  = JWTHandler::generateAccessToken($tokenPayload);
        $refreshToken = JWTHandler::generateRefreshToken($tokenPayload);

        // ── Store refresh token ──
        $stmt = $db->prepare("
            INSERT INTO auth_tokens (user_id, refresh_token, device_info, ip_address, expires_at)
            VALUES (:user_id, :token, :device, :ip, DATE_ADD(NOW(), INTERVAL 7 DAY))
        ");
        $stmt->execute([
            ':user_id' => $user['user_id'],
            ':token'   => $refreshToken,
            ':device'  => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            ':ip'      => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
        ]);

        Response::success([
            'user' => [
                'user_id'    => (int) $user['user_id'],
                'first_name' => $user['first_name'],
                'last_name'  => $user['last_name'],
                'email'      => $user['email'],
                'role'       => $user['role'],
            ],
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type'    => 'Bearer',
            'expires_in'    => JWT_ACCESS_EXPIRY,
        ], 'Login successful');
    }

    // ────────────────────────────────────────────────
    //  POST /api/v1/auth/refresh
    // ────────────────────────────────────────────────
    public static function refreshToken(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($data['refresh_token'])) {
            Response::error('Refresh token is required', 400);
        }

        // ── Verify the refresh token ──
        $payload = JWTHandler::verifyToken($data['refresh_token']);

        if (!$payload || ($payload['type'] ?? '') !== 'refresh') {
            Response::unauthorized('Invalid or expired refresh token');
        }

        $db = Database::connect();

        // ── Check if token is stored and not revoked ──
        $stmt = $db->prepare("
            SELECT token_id FROM auth_tokens
            WHERE refresh_token = :token AND user_id = :user_id AND is_revoked = 0 AND expires_at > NOW()
            LIMIT 1
        ");
        $stmt->execute([
            ':token'   => $data['refresh_token'],
            ':user_id' => $payload['user_id'],
        ]);

        if (!$stmt->fetch()) {
            Response::unauthorized('Refresh token has been revoked or expired');
        }

        // ── Revoke old refresh token ──
        $db->prepare("UPDATE auth_tokens SET is_revoked = 1 WHERE refresh_token = :token")
           ->execute([':token' => $data['refresh_token']]);

        // ── Issue new tokens ──
        $newPayload = [
            'user_id'    => $payload['user_id'],
            'email'      => $payload['email'],
            'role'       => $payload['role'],
            'college_id' => $payload['college_id'] ?? null,
        ];

        $newAccess  = JWTHandler::generateAccessToken($newPayload);
        $newRefresh = JWTHandler::generateRefreshToken($newPayload);

        // ── Store new refresh token ──
        $stmt = $db->prepare("
            INSERT INTO auth_tokens (user_id, refresh_token, device_info, ip_address, expires_at)
            VALUES (:user_id, :token, :device, :ip, DATE_ADD(NOW(), INTERVAL 7 DAY))
        ");
        $stmt->execute([
            ':user_id' => $payload['user_id'],
            ':token'   => $newRefresh,
            ':device'  => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            ':ip'      => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
        ]);

        Response::success([
            'access_token'  => $newAccess,
            'refresh_token' => $newRefresh,
            'token_type'    => 'Bearer',
            'expires_in'    => JWT_ACCESS_EXPIRY,
        ], 'Token refreshed');
    }

    // ────────────────────────────────────────────────
    //  POST /api/v1/auth/logout
    // ────────────────────────────────────────────────
    public static function logout(): void
    {
        $auth = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $db = Database::connect();

        if (!empty($data['refresh_token'])) {
            // Revoke specific refresh token
            $db->prepare("UPDATE auth_tokens SET is_revoked = 1 WHERE refresh_token = :token AND user_id = :user_id")
               ->execute([':token' => $data['refresh_token'], ':user_id' => $auth['user_id']]);
        } else {
            // Revoke all tokens for this user (logout all devices)
            $db->prepare("UPDATE auth_tokens SET is_revoked = 1 WHERE user_id = :user_id")
               ->execute([':user_id' => $auth['user_id']]);
        }

        Response::success(null, 'Logged out successfully');
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/auth/me
    // ────────────────────────────────────────────────
    public static function me(): void
    {
        $auth = AuthMiddleware::authenticate();
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, u.role,
                   u.year_of_study, u.roll_number, u.profile_photo, u.gender,
                   u.qr_token, u.email_verified, u.created_at,
                   c.college_name, c.college_code,
                   d.dept_name, d.dept_code
            FROM users u
            JOIN colleges c ON u.college_id = c.college_id
            LEFT JOIN departments d ON u.department_id = d.department_id
            WHERE u.user_id = :id
        ");
        $stmt->execute([':id' => $auth['user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::notFound('User not found');
        }

        // ── Get wallet balance ──
        $stmt = $db->prepare("SELECT balance FROM wallets WHERE user_id = :id");
        $stmt->execute([':id' => $auth['user_id']]);
        $wallet = $stmt->fetch();

        $user['wallet_balance'] = $wallet ? (float) $wallet['balance'] : 0.00;

        Response::success($user, 'Profile retrieved');
    }
}
