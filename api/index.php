<?php
/**
 * NexusFest API — Application Entry Point
 * 
 * All HTTP requests are routed through this file via .htaccess rewriting.
 * This file bootstraps configuration, loads middleware, and dispatches routes.
 */

// ── Error Reporting (disable display in production) ──
ini_set('display_errors', 1);
error_reporting(E_ALL);

// ── Load Configuration ──
require_once __DIR__ . '/config/constants.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/cors.php';

// ── Load Core Helpers ──
require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/helpers/JWTHandler.php';
require_once __DIR__ . '/helpers/Validator.php';
require_once __DIR__ . '/helpers/QRCodeHelper.php';

// ── Load Middleware ──
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// ── Load Controllers ──
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/EventController.php';
require_once __DIR__ . '/controllers/TeamController.php';
require_once __DIR__ . '/controllers/RegistrationController.php';
require_once __DIR__ . '/controllers/AttendanceController.php';
require_once __DIR__ . '/controllers/WalletController.php';
require_once __DIR__ . '/controllers/ResultController.php';
require_once __DIR__ . '/controllers/CertificateController.php';
require_once __DIR__ . '/controllers/LeaderboardController.php';

// ── Load & Run Routes ──
require_once __DIR__ . '/routes/api.php';
