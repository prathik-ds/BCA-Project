<?php
/**
 * Global Configuration for PHP Frontend
 */

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Ensure the database and constants are loaded
require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/helpers/JWTHandler.php';

// Safe check for wallet constants if not in constants.php
if (!defined('WALLET_MIN_TOPUP')) define('WALLET_MIN_TOPUP', 100);
if (!defined('WALLET_MAX_BALANCE')) define('WALLET_MAX_BALANCE', 5000);

// Helper function to check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// Redirect if not logged in
function requireLogin() {
    if (!isLoggedIn()) {
        header("Location: login.php");
        exit;
    }
}

// Helper function to get DB connection
function getDB() {
    return Database::connect();
}
?>
