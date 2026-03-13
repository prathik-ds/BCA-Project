<?php
require_once 'api/config/constants.php';
require_once 'api/config/database.php';

echo "Connecting to DB...\n";
try {
    $db = Database::connect();
    echo "Connected. Querying users...\n";
    $stmt = $db->query("SELECT user_id, email, role FROM users");
    $users = $stmt->fetchAll();
    echo "Query successful. Count: " . count($users) . "\n";
    echo json_encode($users, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
echo "\nDone.\n";
