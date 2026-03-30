<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

// Restricted to Admin
if ($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'super_admin') {
    header("Location: dashboard.php");
    exit;
}

$db = getDB();

// Handle Role Change
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['user_id']) && isset($_POST['new_role'])) {
    $targetUserId = (int)$_POST['user_id'];
    $newRole = $_POST['new_role'];
    
    // Safety: Don't let normal admins change super_admins or themselves? 
    // For this migration, we'll keep it simple as per the React logic.
    if (in_array($newRole, ['participant', 'coordinator', 'admin'])) {
        $stmt = $db->prepare("UPDATE users SET role = :role WHERE user_id = :id");
        $stmt->execute([':role' => $newRole, ':id' => $targetUserId]);
        $successMsg = "User role updated successfully.";
    }
}

// Fetch all users
$search = $_GET['search'] ?? '';
$query = "
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.is_active,
           COALESCE(c.college_code, '-') AS college_code
    FROM users u
    LEFT JOIN colleges c ON u.college_id = c.college_id
";
$params = [];
if ($search) {
    $query .= " WHERE u.first_name LIKE :search OR u.last_name LIKE :search OR u.email LIKE :search";
    $params[':search'] = "%$search%";
}
$query .= " ORDER BY u.created_at DESC";

$stmt = $db->prepare($query);
$stmt->execute($params);
$users = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-7xl mx-auto px-6 py-12 space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-up">
        <div>
            <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                <i data-lucide="users" class="text-amber-400" size="28"></i> Participants
            </h1>
            <p class="text-gray-500 text-sm mt-1"><?php echo count($users); ?> registered users</p>
        </div>
        
        <!-- Search Bar -->
        <form action="admin_users.php" method="GET" class="relative w-full max-w-sm">
            <i data-lucide="search" size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input type="text" name="search" value="<?php echo htmlspecialchars($search); ?>" placeholder="Search users..."
                   class="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-700/50 border border-white/5 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/30 transition">
        </form>
    </div>

    <?php if (isset($successMsg)): ?>
        <div class="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-3 animate-slide-up">
            <i data-lucide="check-circle" size="18"></i>
            <?php echo htmlspecialchars($successMsg); ?>
        </div>
    <?php endif; ?>

    <div class="bg-surface-800/50 rounded-2xl border border-white/5 overflow-hidden animate-slide-up" style="animation-delay: 0.1s">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-surface-900/50 text-gray-400 text-sm">
                    <tr>
                        <th class="px-6 py-4 font-medium uppercase tracking-wider">Name</th>
                        <th class="px-6 py-4 font-medium uppercase tracking-wider">Email</th>
                        <th class="px-6 py-4 font-medium uppercase tracking-wider">College</th>
                        <th class="px-6 py-4 font-medium uppercase tracking-wider">Role</th>
                        <th class="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <?php if (empty($users)): ?>
                        <tr><td colspan="5" class="px-6 py-20 text-center text-gray-500">No users found.</td></tr>
                    <?php else: ?>
                        <?php foreach ($users as $user): ?>
                            <tr class="hover:bg-surface-700/30 transition group">
                                <td class="px-6 py-4 font-medium text-white"><?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?></td>
                                <td class="px-6 py-4 text-gray-400 text-sm"><?php echo htmlspecialchars($user['email']); ?></td>
                                <td class="px-6 py-4 text-gray-400 text-sm">
                                    <span class="px-2 py-1 rounded bg-white/5 border border-white/5"><?php echo htmlspecialchars($user['college_code']); ?></span>
                                </td>
                                <td class="px-6 py-4">
                                    <form action="admin_users.php" method="POST" class="inline">
                                        <input type="hidden" name="user_id" value="<?php echo $user['user_id']; ?>">
                                        <select name="new_role" onchange="this.form.submit()" 
                                                class="px-2 py-1 text-xs font-bold rounded-lg bg-surface-900 border border-white/10 text-white outline-none focus:border-amber-500/50 cursor-pointer 
                                                <?php echo $user['role'] == 'admin' ? 'text-amber-400 border-amber-400/50' : 'text-blue-400 border-blue-400/50'; ?>">
                                            <option value="participant" <?php echo $user['role'] == 'participant' ? 'selected' : ''; ?>>Student</option>
                                            <option value="coordinator" <?php echo $user['role'] == 'coordinator' ? 'selected' : ''; ?>>Coordinator</option>
                                            <option value="admin" <?php echo $user['role'] == 'admin' ? 'selected' : ''; ?>>Admin</option>
                                            <?php if ($user['role'] == 'super_admin'): ?>
                                                <option value="super_admin" selected>Super Admin</option>
                                            <?php endif; ?>
                                        </select>
                                    </form>
                                </td>
                                <td class="px-6 py-4 text-sm font-semibold text-green-400">
                                    <span class="flex items-center gap-1.5"><div class="w-1.5 h-1.5 rounded-full bg-green-400"></div> Active</span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
