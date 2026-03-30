<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

if (!in_array($_SESSION['role'], ['admin', 'super_admin'])) {
    header("Location: dashboard.php");
    exit;
}

$db = getDB();

// Fetch events and stats
$stmt = $db->query("
    SELECT e.*, c.category_name,
           (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.event_id AND r.status != 'cancelled') AS registered_count
    FROM events e 
    LEFT JOIN event_categories c ON e.category_id = c.category_id
    ORDER BY e.start_datetime DESC
");
$events = $stmt->fetchAll(PDO::FETCH_ASSOC);

$totalEvents = count($events);
$totalRegistrations = array_sum(array_column($events, 'registered_count'));

$categories = [];
foreach ($events as $e) {
    if (!isset($categories[$e['category_name']])) {
        $categories[$e['category_name']] = 0;
    }
    $categories[$e['category_name']] += (int)$e['registered_count'];
}

$recentEvents = array_slice($events, 0, 5);

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-7xl mx-auto space-y-8 px-6 py-10 animate-slide-up">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-2xl bg-gradient-to-br from-surface-700/60 to-surface-800/40 border border-white/5">
        <div>
            <h1 class="text-3xl font-bold font-display text-white mb-2 flex items-center gap-3">
                <i data-lucide="shield-check" class="text-amber-400" size="32"></i>
                Admin Command Center
            </h1>
            <p class="text-gray-400">Manage events, participants, and results.</p>
        </div>
        <a href="admin_events.php" class="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition">
            <i data-lucide="plus" size="18"></i> Create Event
        </a>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up" style="animation-delay: 0.1s">
        <div class="p-6 rounded-2xl bg-surface-700/30 border border-white/5">
            <div class="flex items-center justify-between mb-4">
                <div class="p-3 rounded-xl bg-purple-400/10 text-purple-400">
                    <i data-lucide="calendar" size="24"></i>
                </div>
            </div>
            <div class="text-3xl font-bold text-white mb-1"><?php echo $totalEvents; ?></div>
            <div class="text-sm text-gray-500 font-medium">Total Events</div>
        </div>
        
        <div class="p-6 rounded-2xl bg-surface-700/30 border border-white/5">
            <div class="flex items-center justify-between mb-4">
                <div class="p-3 rounded-xl bg-blue-400/10 text-blue-400">
                    <i data-lucide="users" size="24"></i>
                </div>
            </div>
            <div class="text-3xl font-bold text-white mb-1"><?php echo $totalRegistrations; ?></div>
            <div class="text-sm text-gray-500 font-medium">Total Registrations</div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up" style="animation-delay: 0.1s">
        <a href="admin_events.php" class="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-amber-500/30 transition-all group">
            <i data-lucide="calendar" size="32" class="text-gray-400 group-hover:text-amber-400 transition-colors mb-3"></i>
            <span class="text-sm font-semibold text-gray-300 group-hover:text-white">Manage Events</span>
        </a>
        <a href="admin_users.php" class="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-amber-500/30 transition-all group">
            <i data-lucide="users" size="32" class="text-gray-400 group-hover:text-amber-400 transition-colors mb-3"></i>
            <span class="text-sm font-semibold text-gray-300 group-hover:text-white">View Participants</span>
        </a>
        <a href="admin_results.php" class="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-amber-500/30 transition-all group">
            <i data-lucide="shield-check" size="32" class="text-gray-400 group-hover:text-amber-400 transition-colors mb-3"></i>
            <span class="text-sm font-semibold text-gray-300 group-hover:text-white">Update Results</span>
        </a>
    </div>

    <!-- Recent Events Table -->
    <div class="p-6 rounded-2xl bg-surface-700/30 border border-white/5 animate-slide-up" style="animation-delay: 0.2s">
        <div class="flex justify-between items-center mb-5">
            <h2 class="text-lg font-bold text-white flex items-center gap-2"><i data-lucide="clock" size="20" class="text-gray-400"></i> Recent Events</h2>
            <a href="admin_events.php" class="text-xs text-amber-400 hover:underline flex items-center gap-1">View all <i data-lucide="arrow-right" size="12"></i></a>
        </div>
        
        <?php if (empty($recentEvents)): ?>
            <p class="text-gray-500 text-center py-8">No events yet. Create your first event!</p>
        <?php else: ?>
            <div class="space-y-3">
                <?php foreach ($recentEvents as $evt): ?>
                    <div class="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 border border-white/5">
                        <div>
                            <h3 class="text-sm font-bold text-white"><?php echo htmlspecialchars($evt['event_name']); ?></h3>
                            <p class="text-xs text-gray-500 mt-1"><?php echo date('n/j/Y', strtotime($evt['start_datetime'])); ?> • <?php echo htmlspecialchars($evt['category_name']); ?></p>
                        </div>
                        <div class="text-right">
                            <span class="px-3 py-1 text-xs font-bold rounded-full 
                                <?php 
                                    if ($evt['status'] === 'published') echo 'bg-green-500/20 text-green-400';
                                    elseif ($evt['status'] === 'completed') echo 'bg-blue-500/20 text-blue-400';
                                    else echo 'bg-gray-500/20 text-gray-400';
                                ?>">
                                <?php echo strtoupper($evt['status']); ?>
                            </span>
                            <div class="text-xs text-gray-500 mt-1"><?php echo $evt['registered_count'] ?: 0; ?> registered</div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Analytics Section -->
    <div class="grid lg:grid-cols-2 gap-6 animate-slide-up" style="animation-delay: 0.3s">
        <!-- Event Popularity -->
        <div class="p-6 rounded-2xl bg-surface-700/30 border border-white/5 space-y-6">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">Event Popularity (%)</h2>
            <div class="space-y-4">
                <?php foreach ($events as $evt): 
                    $max = $evt['max_participants'] ?: 1;
                    $reg = $evt['registered_count'] ?: 0;
                    $perc = min(100, round(($reg / $max) * 100));
                ?>
                    <div class="space-y-1.5">
                        <div class="flex justify-between text-xs">
                            <span class="text-gray-300 font-medium truncate max-w-[70%]"><?php echo htmlspecialchars($evt['event_name']); ?></span>
                            <span class="text-gray-500"><?php echo $reg; ?>/<?php echo $max === 1 && !$evt['max_participants'] ? '∞' : $max; ?></span>
                        </div>
                        <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000" style="width: <?php echo $perc; ?>%"></div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Category Breakdown -->
        <div class="p-6 rounded-2xl bg-surface-700/30 border border-white/5 flex flex-col">
            <h2 class="text-lg font-bold text-white mb-6">Category Distribution</h2>
            <div class="flex-1 flex flex-col justify-center space-y-4">
                <?php 
                $colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-cyan-500'];
                $i = 0;
                foreach ($categories as $cat => $count): 
                    $total = $totalRegistrations ?: 1;
                    $perc = round(($count / $total) * 100);
                    $color = $colors[$i % count($colors)];
                    $i++;
                ?>
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs">
                            <span class="text-gray-400 capitalize"><?php echo htmlspecialchars($cat); ?></span>
                            <span class="text-gray-200 font-bold"><?php echo $perc; ?>%</span>
                        </div>
                        <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full <?php echo $color; ?> transition-all duration-1000" style="width: <?php echo $perc; ?>%"></div>
                        </div>
                    </div>
                <?php endforeach; ?>
                
                <?php if (empty($categories)): ?>
                    <p class="text-center text-gray-500 py-8">No registration data yet.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
