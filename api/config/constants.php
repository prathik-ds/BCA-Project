<?php
// ── Application settings ──
define('BASE_URL', 'http://localhost:8000');
define('APP_NAME', 'NexusFest');
define('APP_VERSION', '1.0.0');
define('API_PREFIX', '/api/v1');

// ── JWT Configuration ──
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'nexusfest_change_this_in_production_2026');
define('JWT_ALGORITHM', 'HS256');
define('JWT_ACCESS_EXPIRY', 900);       // 15 minutes
define('JWT_REFRESH_EXPIRY', 604800);   // 7 days

// ── QR Code ──
define('QR_HMAC_SECRET', getenv('QR_HMAC_SECRET') ?: 'nexusfest_qr_secret_2026');

// ── File Upload ──
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('CERTIFICATES_DIR', __DIR__ . '/../uploads/certificates/');
define('QR_CODES_DIR', __DIR__ . '/../uploads/qrcodes/');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024);  // 5 MB

// ── Wallet ──
define('WALLET_MAX_BALANCE', 5000.00);
define('WALLET_MIN_TOPUP', 50.00);

// ── Pagination ──
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// ── User Roles ──
define('ROLE_PARTICIPANT', 'participant');
define('ROLE_COORDINATOR', 'coordinator');
define('ROLE_ADMIN', 'admin');
define('ROLE_SUPER_ADMIN', 'super_admin');

// ── Database Credentials ──
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'nexusfest');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
