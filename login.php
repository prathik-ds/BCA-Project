<?php
require_once __DIR__ . '/includes/config.php';

// If already logged in, redirect to dashboard
if (isLoggedIn()) {
    header("Location: dashboard.php");
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        $error = 'Please enter both email and password.';
    } else {
        $db = getDB();
        $stmt = $db->prepare("SELECT user_id, first_name, last_name, email, password_hash, role, is_active FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => strtolower(trim($email))]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            if (!$user['is_active']) {
                $error = 'Your account has been deactivated. Contact admin.';
            } else {
                // Success! Set session
                $_SESSION['user_id'] = $user['user_id'];
                $_SESSION['first_name'] = $user['first_name'];
                $_SESSION['last_name'] = $user['last_name'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['email'] = $user['email'];

                // Generate JWT for API calls
                $_SESSION['access_token'] = JWTHandler::generateAccessToken([
                    'user_id' => $user['user_id'],
                    'role'    => $user['role'],
                    'email'   => $user['email']
                ]);

                header("Location: dashboard.php");
                exit;
            }
        } else {
            $error = 'Invalid email or password.';
        }
    }
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="min-h-[80vh] flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-md">
        <!-- Card -->
        <div class="bg-surface-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">
            <div class="text-center mb-8">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold text-2xl font-display">N</div>
                <h1 class="text-3xl font-black font-display text-white">Welcome Back</h1>
                <p class="text-gray-400 mt-2">Login to your NexusFest account</p>
            </div>

            <?php if ($error): ?>
                <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-shake">
                    <i data-lucide="alert-circle" size="18"></i>
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <form action="login.php" method="POST" class="space-y-6">
                <div>
                    <label for="email" class="block text-sm font-semibold text-gray-400 mb-2">Email Address</label>
                    <div class="relative">
                        <i data-lucide="mail" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                        <input type="email" name="email" id="email" required 
                               class="w-full bg-surface-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-nexus-400/50 focus:ring-1 focus:ring-nexus-400/50 transition-all"
                               placeholder="name@college.edu">
                    </div>
                </div>

                <div>
                    <label for="password" class="block text-sm font-semibold text-gray-400 mb-2">Password</label>
                    <div class="relative">
                        <i data-lucide="lock" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                        <input type="password" name="password" id="password" required 
                               class="w-full bg-surface-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-nexus-400/50 focus:ring-1 focus:ring-nexus-400/50 transition-all"
                               placeholder="••••••••">
                    </div>
                </div>

                <div class="flex items-center justify-between text-sm">
                    <label class="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" class="w-4 h-4 rounded border-white/10 bg-surface-900 text-nexus-400 focus:ring-offset-surface-900">
                        <span class="text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                    </label>
                    <a href="#" class="text-nexus-400 hover:text-nexus-300 font-medium transition-colors">Forgot password?</a>
                </div>

                <button type="submit" class="w-full py-4 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-bold text-lg hover:shadow-[0_0_25px_rgba(6,232,225,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 mt-4">
                    Login Now <i data-lucide="arrow-right" size="20"></i>
                </button>
            </form>

            <div class="mt-8 pt-8 border-t border-white/5 text-center">
                <p class="text-gray-500 text-sm">Don't have an account? 
                    <a href="register.php" class="text-white font-semibold hover:text-nexus-400 transition-colors">Sign up for free</a>
                </p>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
