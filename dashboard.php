<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

$userId = $_SESSION['user_id'];
$db = getDB();

// Fetch events
$stmt = $db->query("
    SELECT e.*, c.category_name, v.venue_name 
    FROM events e 
    JOIN event_categories c ON e.category_id = c.category_id 
    LEFT JOIN venues v ON e.venue_id = v.venue_id
    WHERE e.status = 'published'
    ORDER BY e.start_datetime ASC
    LIMIT 5
");
$events = $stmt->fetchAll();

// Count stats
$activeEventsCount = count($events);
$upcomingEventsCount = $db->query("SELECT COUNT(*) FROM events WHERE start_datetime > NOW() AND status = 'published'")->fetchColumn();
$categoriesCount = $db->query("SELECT COUNT(*) FROM event_categories")->fetchColumn();

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-7xl mx-auto px-6 space-y-8 py-10">
    <!-- Welcome Card -->
    <div class="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-surface-700/60 to-surface-700/30 border border-white/5 overflow-hidden animate-slide-up">
        <div class="absolute top-0 right-0 w-48 h-48 rounded-full bg-nexus-400/5 blur-[60px]"></div>
        <div class="relative flex items-center justify-between">
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold font-display text-white mb-1">
                    Welcome back, <?php echo htmlspecialchars($_SESSION['first_name']); ?>! 👋
                </h1>
                <p class="text-gray-400"><?php echo htmlspecialchars($_SESSION['email']); ?></p>
            </div>
            <a href="logout.php" class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 group">
                <i data-lucide="log-out" size="18"></i>
                <span class="hidden sm:inline font-semibold">Logout</span>
            </a>
        </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-slide-up" style="animation-delay: 0.1s">
        <?php
        $stats = [
            ['icon' => 'calendar', 'label' => 'Available Events', 'value' => $activeEventsCount, 'color' => 'from-cyan-400 to-blue-500', 'link' => 'events.php'],
            ['icon' => 'clock', 'label' => 'Upcoming Overall', 'value' => $upcomingEventsCount, 'color' => 'from-purple-400 to-pink-500', 'link' => 'events.php'],
            ['icon' => 'award', 'label' => 'Categories', 'value' => $categoriesCount, 'color' => 'from-amber-400 to-orange-500', 'link' => 'events.php'],
        ];
        foreach ($stats as $s):
        ?>
        <a href="<?php echo $s['link']; ?>" class="group p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br <?php echo $s['color']; ?> flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <i data-lucide="<?php echo $s['icon']; ?>" size="18" class="text-white"></i>
            </div>
            <div class="text-2xl font-bold font-display text-white mb-0.5"><?php echo $s['value']; ?></div>
            <div class="text-xs text-gray-500 font-medium"><?php echo $s['label']; ?></div>
        </a>
        <?php endforeach; ?>
    </div>

    <!-- Role-based Menus -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style="animation-delay: 0.1s">
        <?php if ($_SESSION['role'] === 'participant'): ?>
            <a href="registrations.php" class="flex items-center gap-4 p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-nexus-400/30 transition-all group">
                <div class="w-12 h-12 rounded-xl bg-nexus-400/10 flex items-center justify-center text-nexus-400 group-hover:bg-nexus-400 group-hover:text-white transition-all">
                    <i data-lucide="ticket" size="22"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white">My Registrations</h3>
                    <p class="text-xs text-gray-500">View and manage your events</p>
                </div>
            </a>
            <a href="certificates.php" class="flex items-center gap-4 p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-accent-400/30 transition-all group">
                <div class="w-12 h-12 rounded-xl bg-accent-400/10 flex items-center justify-center text-accent-400 group-hover:bg-accent-400 group-hover:text-white transition-all">
                    <i data-lucide="award" size="22"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white">My Certificates</h3>
                    <p class="text-xs text-gray-500">Download your achievements</p>
                </div>
            </a>
            <a href="wallet.php" class="flex items-center gap-4 p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-amber-400/30 transition-all group">
                <div class="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-white transition-all">
                    <i data-lucide="wallet" size="22"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white">Digital Wallet</h3>
                    <p class="text-xs text-gray-500">Pay at food stalls via QR</p>
                </div>
            </a>
        <?php elseif ($_SESSION['role'] === 'coordinator'): ?>
            <a href="scanner.php" class="flex items-center gap-4 p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-nexus-400/30 transition-all group">
                <div class="w-12 h-12 rounded-xl bg-nexus-400/10 flex items-center justify-center text-nexus-400 group-hover:bg-nexus-400 group-hover:text-white transition-all">
                    <i data-lucide="scan-qr-code" size="22"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white">Scan Attendance</h3>
                    <p class="text-xs text-gray-500">Mark student entry via QR</p>
                </div>
            </a>
            <a href="manage_event.php" class="flex items-center gap-4 p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-accent-400/30 transition-all group">
                <div class="w-12 h-12 rounded-xl bg-accent-400/10 flex items-center justify-center text-accent-400 group-hover:bg-accent-400 group-hover:text-white transition-all">
                    <i data-lucide="calendar-plus" size="22"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white">Manage My Event</h3>
                    <p class="text-xs text-gray-500">Update event details & status</p>
                </div>
            </a>
            <a href="results_submit.php" class="flex items-center gap-4 p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-amber-400/30 transition-all group">
                <div class="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-white transition-all">
                    <i data-lucide="trophy" size="22"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white">Submit Results</h3>
                    <p class="text-xs text-gray-500">Declare winners for your event</p>
                </div>
            </a>
        <?php elseif ($_SESSION['role'] === 'admin' || $_SESSION['role'] === 'super_admin'): ?>
            <a href="admin_users.php" class="flex items-center gap-4 p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-nexus-400/30 transition-all group">
                <div class="w-12 h-12 rounded-xl bg-nexus-400/10 flex items-center justify-center text-nexus-400 group-hover:bg-nexus-400 group-hover:text-white transition-all">
                    <i data-lucide="users" size="22"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white">Manage Users</h3>
                    <p class="text-xs text-gray-500">View all registered students</p>
                </div>
            </a>
            <a href="admin_events.php" class="flex items-center gap-4 p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-accent-400/30 transition-all group">
                <div class="w-12 h-12 rounded-xl bg-accent-400/10 flex items-center justify-center text-accent-400 group-hover:bg-accent-400 group-hover:text-white transition-all">
                    <i data-lucide="calendar" size="22"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white">Manage Events</h3>
                    <p class="text-xs text-gray-500">Create & schedule fest events</p>
                </div>
            </a>
            <a href="admin_results.php" class="flex items-center gap-4 p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-amber-400/30 transition-all group">
                <div class="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-white transition-all">
                    <i data-lucide="award" size="22"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white">Fest Results</h3>
                    <p class="text-xs text-gray-500">Full analysis of event outcomes</p>
                </div>
            </a>
        <?php endif; ?>
    </div>

    <!-- Events List -->
    <div class="p-6 rounded-2xl bg-surface-700/30 border border-white/5 animate-slide-up" style="animation-delay: 0.2s">
        <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-bold text-white font-display">Available Events</h2>
            <a href="events.php" class="text-xs text-nexus-400 hover:underline flex items-center gap-1">View all <i data-lucide="arrow-right" size="12"></i></a>
        </div>

        <?php if (empty($events)): ?>
            <div class="text-center py-12">
                <p class="text-gray-500">No events available yet. Check back soon!</p>
            </div>
        <?php else: ?>
            <div class="space-y-3">
                <?php foreach ($events as $evt): ?>
                <a href="events.php?id=<?php echo $evt['event_id']; ?>" class="flex items-center gap-4 p-4 rounded-xl bg-surface-800/40 hover:bg-surface-600/40 border border-white/5 hover:border-white/10 transition-all group">
                    <div class="w-14 h-14 rounded-xl bg-surface-700 flex flex-col items-center justify-center shrink-0">
                        <span class="text-xs text-nexus-400 font-semibold uppercase"><?php echo date('M', strtotime($evt['start_datetime'])); ?></span>
                        <span class="text-lg font-bold text-white"><?php echo date('d', strtotime($evt['start_datetime'])); ?></span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-semibold text-white text-sm group-hover:text-nexus-400 transition-colors truncate"><?php echo htmlspecialchars($evt['event_name']); ?></h3>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-gray-400">
                                <?php echo htmlspecialchars($evt['category_name']); ?>
                            </span>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-gray-500">
                            <span class="flex items-center gap-1"><i data-lucide="clock" size="11"></i> <?php echo date('g:i A', strtotime($evt['start_datetime'])); ?></span>
                            <?php if ($evt['venue_name']): ?>
                                <span class="flex items-center gap-1"><i data-lucide="map-pin" size="11"></i> <?php echo htmlspecialchars($evt['venue_name']); ?></span>
                            <?php endif; ?>
                        </div>
                    </div>
                </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
