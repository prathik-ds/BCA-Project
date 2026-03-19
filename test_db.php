<?php
require_once __DIR__ . '/api/config/constants.php';
require_once __DIR__ . '/api/config/database.php';

try {
    $db = Database::connect();
    echo "SUCCESS: Database connection established.\n";
    $stmt = $db->query("SELECT VERSION() as version");
    $row = $stmt->fetch();
    echo "MySQL Version: " . $row['version'] . "\n";
} catch (Exception $e) {
    echo "FAILURE: " . $e->getMessage() . "\n";
}
