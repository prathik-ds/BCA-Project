<?php
require_once __DIR__ . '/includes/config.php';

// Clear session data
$_SESSION = array();

// Destroy session cookie
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 42000, '/');
}

// Destroy session
session_destroy();

// Redirect to landing
header("Location: index.php");
exit;
?>
