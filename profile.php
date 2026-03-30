<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

$userId = $_SESSION['user_id'];
$db = getDB();

$error = '';
$success = '';

// Handle Profile Update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_profile') {
    $firstName = trim($_POST['first_name'] ?? '');
    $lastName = trim($_POST['last_name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');

    if (empty($firstName) || empty($lastName)) {
        $error = "First and last name are required.";
    } else {
        $stmt = $db->prepare("UPDATE users SET first_name = :first, last_name = :last, phone = :phone WHERE user_id = :id");
        if ($stmt->execute([':first' => $firstName, ':last' => $lastName, ':phone' => $phone, ':id' => $userId])) {
            $_SESSION['first_name'] = $firstName;
            $_SESSION['last_name'] = $lastName;
            $success = "Profile updated successfully!";
        } else {
            $error = "Failed to update profile.";
        }
    }
}

// Fetch User Data
$stmt = $db->prepare("
    SELECT u.*, c.college_name 
    FROM users u 
    LEFT JOIN colleges c ON u.college_id = c.college_id 
    WHERE u.user_id = :id
");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

// Fetch Registration Stats
$regStats = $db->prepare("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM event_registrations 
    WHERE user_id = :id AND status != 'cancelled'
");
$regStats->execute([':id' => $userId]);
$stats = $regStats->fetch();

// Fetch My Registrations
$stmt = $db->prepare("
    SELECT r.*, e.event_name, e.start_datetime, cat.category_name 
    FROM event_registrations r
    JOIN events e ON r.event_id = e.event_id
    JOIN event_categories cat ON e.category_id = cat.category_id
    WHERE r.user_id = :id AND r.status != 'cancelled'
    ORDER BY e.start_datetime DESC
");
$stmt->execute([':id' => $userId]);
$registrations = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-4xl mx-auto px-6 py-12 space-y-8">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold font-display text-white">My Profile</h1>
        <a href="dashboard.php" class="text-xs text-gray-500 hover:text-white flex items-center gap-1">
            <i data-lucide="arrow-left" size="14"></i> Dashboard
        </a>
    </div>

    <!-- Profile Card -->
    <div class="relative p-8 rounded-3xl bg-gradient-to-br from-surface-700/60 to-surface-800/40 border border-white/5 overflow-hidden shadow-xl animate-scale-in">
        <div class="absolute top-0 right-0 w-40 h-40 rounded-full bg-nexus-400/5 blur-[60px]"></div>
        <div class="relative flex flex-col sm:flex-row items-center gap-8">
            <div class="w-24 h-24 rounded-3xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white text-3xl font-black font-display shadow-2xl">
                <?php echo strtoupper(substr($user['first_name'], 0, 1) . substr($user['last_name'], 0, 1)); ?>
            </div>
            <div class="text-center sm:text-left flex-1">
                <h2 class="text-3xl font-bold text-white mb-1"><?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?></h2>
                <div class="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                    <span class="flex items-center gap-1.5 text-nexus-400 text-sm font-medium">
                        <i data-lucide="mail" size="14"></i> <?php echo htmlspecialchars($user['email']); ?>
                    </span>
                    <span class="w-1 h-1 rounded-full bg-gray-600 hidden sm:block"></span>
                    <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-400 border border-white/5">
                        <?php echo htmlspecialchars($user['role']); ?>
                    </span>
                </div>
            </div>
        </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
        <!-- Quick Stats -->
        <div class="p-8 rounded-3xl bg-surface-700/30 border border-white/5 space-y-6 animate-slide-up" style="animation-delay: 0.1s">
            <h3 class="font-bold text-white text-sm uppercase tracking-widest opacity-50">Quick Stats</h3>
            <div class="space-y-4">
                <div class="flex items-center justify-between py-2 border-b border-white/5">
                    <span class="text-sm text-gray-400">Total Registered</span>
                    <span class="text-lg font-bold text-cyan-400"><?php echo $stats['total'] ?: 0; ?></span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-white/5">
                    <span class="text-sm text-gray-400">Confirmed Slots</span>
                    <span class="text-lg font-bold text-green-400"><?php echo $stats['confirmed'] ?: 0; ?></span>
                </div>
                <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-400">Pending</span>
                    <span class="text-lg font-bold text-amber-400"><?php echo $stats['pending'] ?: 0; ?></span>
                </div>
            </div>
            
            <div class="pt-4">
                <div class="p-4 rounded-2xl bg-surface-800/50 border border-white/5">
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Institution</p>
                    <p class="text-sm font-bold text-white"><?php echo htmlspecialchars($user['college_name'] ?: 'External Participant'); ?></p>
                </div>
            </div>
        </div>

        <!-- Personal Info Form -->
        <div class="lg:col-span-2 p-8 rounded-3xl bg-surface-700/30 border border-white/5 space-y-8 animate-slide-up" style="animation-delay: 0.2s">
            <div class="flex items-center justify-between">
                <h3 class="font-bold text-white text-sm uppercase tracking-widest opacity-50">Account Details</h3>
                <?php if ($success): ?>
                    <span class="text-xs text-green-400 font-bold flex items-center gap-1 animate-slide-down">
                        <i data-lucide="check" size="14"></i> Updated
                    </span>
                <?php endif; ?>
            </div>

            <form action="profile.php" method="POST" class="space-y-6">
                <input type="hidden" name="action" value="update_profile">
                
                <div class="grid sm:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">First Name</label>
                        <div class="relative">
                            <i data-lucide="user" size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                            <input type="text" name="first_name" value="<?php echo htmlspecialchars($user['first_name']); ?>" required
                                   class="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-900/50 border border-white/10 text-white font-bold focus:outline-none focus:border-nexus-400 transition-all">
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Last Name</label>
                        <div class="relative">
                            <i data-lucide="user" size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                            <input type="text" name="last_name" value="<?php echo htmlspecialchars($user['last_name']); ?>" required
                                   class="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-900/50 border border-white/10 text-white font-bold focus:outline-none focus:border-nexus-400 transition-all">
                        </div>
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <div class="relative">
                        <i data-lucide="phone" size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                        <input type="text" name="phone" value="<?php echo htmlspecialchars($user['phone']); ?>" placeholder="Not specified"
                               class="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-900/50 border border-white/10 text-white font-bold focus:outline-none focus:border-nexus-400 transition-all">
                    </div>
                </div>

                <div class="pt-4">
                    <button type="submit" class="w-full sm:w-auto px-10 py-4 bg-white text-surface-900 rounded-2xl font-black hover:bg-nexus-400 hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                        Update Profile
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Registrations -->
    <div class="p-8 rounded-3xl bg-surface-700/30 border border-white/5 animate-slide-up" style="animation-delay: 0.3s">
        <h3 class="font-bold text-white text-sm uppercase tracking-widest opacity-50 mb-8">My Registrations</h3>
        
        <?php if (empty($registrations)): ?>
            <div class="text-center py-20 opacity-20">
                <i data-lucide="calendar" size="48" class="mx-auto mb-4"></i>
                <p class="font-bold tracking-widest text-xs uppercase">No active registrations found</p>
                <a href="events.php" class="text-nexus-400 text-sm mt-4 inline-block hover:underline font-bold">Discover Events</a>
            </div>
        <?php else: ?>
            <div class="space-y-4">
                <?php foreach ($registrations as $r): ?>
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl bg-surface-800/40 border border-white/5 hover:border-nexus-400/20 transition-all group gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-xl bg-surface-700 flex flex-col items-center justify-center shrink-0">
                                <span class="text-[10px] text-nexus-400 font-bold uppercase"><?php echo date('M', strtotime($r['start_datetime'])); ?></span>
                                <span class="text-lg font-bold text-white"><?php echo date('d', strtotime($r['start_datetime'])); ?></span>
                            </div>
                            <div>
                                <h4 class="font-bold text-white group-hover:text-nexus-400 transition-colors"><?php echo htmlspecialchars($r['event_name']); ?></h4>
                                <p class="text-xs text-gray-500 font-medium"><?php echo htmlspecialchars($r['category_name']); ?> • Ref: #<?php echo $r['registration_id']; ?></p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4 self-end sm:self-center">
                            <span class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest <?php 
                                echo $r['status'] === 'confirmed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400';
                            ?>">
                                <?php echo htmlspecialchars($r['status']); ?>
                            </span>
                            <i data-lucide="chevron-right" size="16" class="text-gray-700 group-hover:text-white transition-colors"></i>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
