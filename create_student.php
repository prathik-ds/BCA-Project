<?php
require_once 'api/config/constants.php';
require_once 'api/config/database.php';

try {
    $db = Database::connect();
    
    // Check if college exists
    $stmt = $db->query("SELECT college_id FROM colleges LIMIT 1");
    $college = $stmt->fetch();
    
    if (!$college) {
        $db->exec("INSERT INTO colleges (college_name, college_code, city, state, is_host, is_verified) 
                  VALUES ('Nexus University', 'NXU', 'Pune', 'Maharashtra', 1, 1)");
        $collegeId = $db->lastInsertId();
    } else {
        $collegeId = $college['college_id'];
    }
    
    $email = 'student@nexusfest.com';
    $pass = 'student123';
    
    $stmt = $db->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        echo "Student user $email already exists.\n";
    } else {
        $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $db->prepare("INSERT INTO users (first_name, last_name, email, password_hash, role, college_id, is_active, email_verified) 
                              VALUES ('Test', 'Student', ?, ?, 'participant', ?, 1, 1)");
        $stmt->execute([$email, $hash, $collegeId]);
        
        echo "Student user created successfully!\n";
        echo "Email: $email\n";
        echo "Password: $pass\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
