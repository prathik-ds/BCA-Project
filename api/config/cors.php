<?php
/**
 * NexusFest API — CORS Configuration
 * 
 * Sets Cross-Origin Resource Sharing headers.
 * Handles OPTIONS preflight requests automatically.
 */

// Allowed origins (add your frontend domains)
$allowedOrigins = [
    'http://localhost:3000',        // React dev server
    'http://localhost:5173',        // Vite dev server
    'https://nexusfest.college',    // Production web
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    // In development, allow all origins (remove in production)
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json; charset=UTF-8");

// ── Security Headers ──
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");

// ── Handle OPTIONS preflight ──
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
