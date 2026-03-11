<?php
/**
 * NexusFest API — Route Definitions
 * 
 * Maps HTTP method + URI pattern to controller methods.
 * Supports path parameters like {id} via regex extraction.
 * 
 * Route format:  'METHOD /path' => [Controller, method]
 *                'METHOD /path/{id}' => [Controller, method]  (numeric param)
 *                'METHOD /path/{code}' => [Controller, method] (string param)
 */

// ── Get the request method and URI ──
$method     = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';

// Remove query string
$uri = parse_url($requestUri, PHP_URL_PATH);

// Remove trailing slash (except for root)
$uri = ($uri !== '/') ? rtrim($uri, '/') : $uri;

// ══════════════════════════════════════════════════════
//  ROUTE DEFINITIONS
// ══════════════════════════════════════════════════════

$routes = [

    // ── Authentication ──
    'POST /api/v1/auth/register'     => ['AuthController', 'register'],
    'POST /api/v1/auth/login'        => ['AuthController', 'login'],
    'POST /api/v1/auth/refresh'      => ['AuthController', 'refreshToken'],
    'POST /api/v1/auth/logout'       => ['AuthController', 'logout'],
    'GET  /api/v1/auth/me'           => ['AuthController', 'me'],

    // ── Events ──
    'GET  /api/v1/events'            => ['EventController', 'list'],
    'POST /api/v1/events'            => ['EventController', 'create'],
    // Events with {id} handled below via regex

    // ── Teams ──
    'POST /api/v1/teams'             => ['TeamController', 'create'],
    'POST /api/v1/teams/join'        => ['TeamController', 'join'],
    // Teams with {id} and member removal handled below via regex

    // ── Registrations ──
    'POST /api/v1/registrations'     => ['RegistrationController', 'register'],
    'GET  /api/v1/registrations/my'  => ['RegistrationController', 'myRegistrations'],
    // Registration cancel with {id} handled below via regex

    // ── Attendance ──
    'POST /api/v1/attendance/scan'   => ['AttendanceController', 'scan'],
    'POST /api/v1/attendance/sync'   => ['AttendanceController', 'syncOffline'],
    // Attendance event report with {eventId} handled below via regex

    // ── Wallet ──
    'GET  /api/v1/wallet/balance'       => ['WalletController', 'balance'],
    'POST /api/v1/wallet/topup'         => ['WalletController', 'topup'],
    'POST /api/v1/wallet/pay'           => ['WalletController', 'pay'],
    'GET  /api/v1/wallet/transactions'  => ['WalletController', 'transactions'],

    // ── Results ──
    'POST /api/v1/results'           => ['ResultController', 'submit'],
    // Results by event with {eventId} handled below via regex

    // ── Leaderboard ──
    'GET  /api/v1/leaderboard/colleges'   => ['LeaderboardController', 'colleges'],
    'GET  /api/v1/leaderboard/individual' => ['LeaderboardController', 'individual'],
    // Leaderboard by category with {categoryId} handled below via regex

    // ── Certificates ──
    'POST /api/v1/certificates/generate'       => ['CertificateController', 'generate'],
    'POST /api/v1/certificates/bulk-generate'  => ['CertificateController', 'bulkGenerate'],
    // Certificate download and verify handled below via regex
];


// ══════════════════════════════════════════════════════
//  ROUTE MATCHING
// ══════════════════════════════════════════════════════

// 1. Try exact match first
$routeKey = "{$method} {$uri}";
// Also try with normalized spacing
$routeKeyNorm = preg_replace('/\s+/', ' ', $routeKey);

foreach ($routes as $pattern => $handler) {
    $patternNorm = preg_replace('/\s+/', ' ', trim($pattern));
    if ($routeKeyNorm === $patternNorm) {
        call_user_func([$handler[0], $handler[1]]);
        exit;
    }
}

// 2. Try parameterized routes (with numeric {id} parameters)
$paramRoutes = [
    // Events
    ['GET',    '#^/api/v1/events/(\d+)$#',                              'EventController',      'show'],
    ['PUT',    '#^/api/v1/events/(\d+)$#',                              'EventController',      'update'],
    ['DELETE', '#^/api/v1/events/(\d+)$#',                              'EventController',      'delete'],

    // Teams
    ['GET',    '#^/api/v1/teams/(\d+)$#',                               'TeamController',       'show'],
    ['DELETE', '#^/api/v1/teams/(\d+)/members/(\d+)$#',                 'TeamController',       'removeMember'],

    // Registrations
    ['DELETE', '#^/api/v1/registrations/(\d+)$#',                       'RegistrationController', 'cancel'],

    // Attendance
    ['GET',    '#^/api/v1/attendance/event/(\d+)$#',                    'AttendanceController', 'eventReport'],

    // Results
    ['GET',    '#^/api/v1/results/event/(\d+)$#',                       'ResultController',     'eventResults'],

    // Leaderboard
    ['GET',    '#^/api/v1/leaderboard/category/(\d+)$#',                'LeaderboardController', 'byCategory'],

    // Certificates
    ['GET',    '#^/api/v1/certificates/(\d+)/download$#',               'CertificateController', 'download'],
    ['GET',    '#^/api/v1/certificates/verify/([A-Za-z0-9\-]+)$#',      'CertificateController', 'verify'],
];

foreach ($paramRoutes as [$routeMethod, $regex, $controller, $action]) {
    if ($method === $routeMethod && preg_match($regex, $uri, $matches)) {
        array_shift($matches); // Remove full match
        // Cast numeric params to int
        $params = array_map(function ($m) {
            return is_numeric($m) ? (int) $m : $m;
        }, $matches);

        call_user_func_array([$controller, $action], $params);
        exit;
    }
}


// ══════════════════════════════════════════════════════
//  NO ROUTE MATCHED
// ══════════════════════════════════════════════════════

// Check if the path exists but method is wrong
$pathExists = false;
foreach ($routes as $pattern => $handler) {
    $patternParts = explode(' ', trim(preg_replace('/\s+/', ' ', $pattern)));
    if (isset($patternParts[1]) && $patternParts[1] === $uri) {
        $pathExists = true;
        break;
    }
}

if ($pathExists) {
    Response::methodNotAllowed();
} else {
    Response::notFound("Endpoint not found: {$method} {$uri}");
}
