<?php
require_once __DIR__ . '/includes/config.php';

// Fetch colleges for the dropdown
$db = getDB();
$colleges = $db->query("SELECT college_id, college_name FROM colleges WHERE is_verified = 1 ORDER BY college_name ASC")->fetchAll();

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $first_name = $_POST['first_name'] ?? '';
    $last_name = $_POST['last_name'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $college_id = $_POST['college_id'] ?? '';

    if (empty($first_name) || empty($last_name) || empty($email) || empty($password) || empty($college_id)) {
        $error = 'All fields are required.';
    } elseif (strlen($password) < 8) {
        $error = 'Password must be at least 8 characters long.';
    } else {
        // Check duplicate email
        $stmt = $db->prepare("SELECT user_id FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => strtolower(trim($email))]);
        
        if ($stmt->fetch()) {
            $error = 'An account with this email already exists.';
        } else {
            // Create user
            $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
            $qrToken = bin2hex(random_bytes(16)); // Simple unique token

            try {
                $stmt = $db->prepare("
                    INSERT INTO users (first_name, last_name, email, password_hash, role, college_id, qr_token, is_active)
                    VALUES (:first_name, :last_name, :email, :password_hash, 'participant', :college_id, :qr_token, 1)
                ");

                $stmt->execute([
                    ':first_name'    => trim($first_name),
                    ':last_name'     => trim($last_name),
                    ':email'         => strtolower(trim($email)),
                    ':password_hash' => $passwordHash,
                    ':college_id'    => (int) $college_id,
                    ':qr_token'      => $qrToken,
                ]);

                $success = 'Registration successful! You can now login.';
            } catch (PDOException $e) {
                $error = 'Registration failed: ' . $e->getMessage();
            }
        }
    }
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="min-h-[90vh] flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-lg">
        <!-- Card -->
        <div class="bg-surface-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl animate-slide-up">
            <div class="text-center mb-8">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold text-2xl font-display">N</div>
                <h1 class="text-3xl font-black font-display text-white">Join the Fest</h1>
                <p class="text-gray-400 mt-2">Create your account for NexusFest 2026</p>
            </div>

            <?php if ($error): ?>
                <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
                    <i data-lucide="alert-circle" size="18"></i>
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-3">
                    <i data-lucide="check-circle" size="18"></i>
                    <?php echo htmlspecialchars($success); ?>
                </div>
            <?php endif; ?>

            <form action="register.php" method="POST" class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-400 mb-2">First Name</label>
                        <input type="text" name="first_name" required 
                               class="w-full bg-surface-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-400/50"
                               placeholder="John">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-400 mb-2">Last Name</label>
                        <input type="text" name="last_name" required 
                               class="w-full bg-surface-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-400/50"
                               placeholder="Doe">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-400 mb-2">College</label>
                    <select name="college_id" required 
                            class="w-full bg-surface-900/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-nexus-400/50 appearance-none">
                        <option value="">Select your college</option>
                        <?php foreach ($colleges as $c): ?>
                            <option value="<?php echo $c['college_id']; ?>"><?php echo htmlspecialchars($c['college_name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-400 mb-2">Email Address</label>
                    <input type="email" name="email" required 
                           class="w-full bg-surface-900/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-nexus-400/50"
                           placeholder="john.doe@college.edu">
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-400 mb-2">Password</label>
                    <input type="password" name="password" required minlength="8"
                           class="w-full bg-surface-900/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-nexus-400/50"
                           placeholder="At least 8 characters">
                </div>

                <button type="submit" class="w-full py-4 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-bold text-lg hover:shadow-[0_0_25px_rgba(6,232,225,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-4">
                    Create Account
                </button>
            </form>

            <div class="mt-8 pt-6 border-t border-white/5 text-center">
                <p class="text-gray-500 text-sm">Already have an account? 
                    <a href="login.php" class="text-white font-semibold hover:text-nexus-400 transition-colors">Log in here</a>
                </p>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
