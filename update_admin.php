<?php
require 'api/config/database.php';
$db = Database::connect();
$db->query("UPDATE users SET role='super_admin' WHERE email='admin@nexusfest.com'");
$users = $db->query('SELECT email, role FROM users')->fetchAll(PDO::FETCH_ASSOC);
echo "Update complete. Current users:\n";
print_r($users);
