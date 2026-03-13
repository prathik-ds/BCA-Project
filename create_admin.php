<?php
require_once 'api/config/constants.php';
require_once 'api/config/database.php';

try {
    $db = Database::connect();
    
    // Check if any college exists
    $stmt = $db->query("SELECT college_id FROM colleges LIMIT 1");
    $college = $stmt->fetch();
    
    if (!$college) {
        // Insert a default college if none exists
        $db->exec("INSERT INTO colleges (college_name, college_code, city, state, is_host, is_verified) 
                  VALUES ('Nexus University', 'NXU', 'Pune', 'Maharashtra', 1, 1)");
        $collegeId = $db->lastInsertId();
        echo "Default college created with ID: $collegeId\n";
    } else {
        $collegeId = $college['college_id'];
    }
    
    // Check if admin already exists
    $email = 'admin@nexusfest.com';
    $stmt = $db->prepare("SELECT user_id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    
    if ($stmt->fetch()) {
        echo "Admin user $email already exists.\n";
    } else {
        // Create admin user
        $pass = 'admin123';
        $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
        
        $stmt = $db->prepare("INSERT INTO users (first_name, last_name, email, password_hash, role, college_id, is_active, email_verified) 
                              VALUES ('System', 'Admin', :email, :hash, 'admin', :college_id, 1, 1)");
        $stmt->execute([
            ':email' => $email,
            ':hash' => $hash,
            ':college_id' => $collegeId
        ]);
        
        echo "Admin user created successfully!\n";
        echo "Email: $email\n";
        echo "Password: $pass\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
