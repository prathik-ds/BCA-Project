<?php
require_once __DIR__ . '/includes/config.php';

$db = getDB();

// Fetch events
$stmt = $db->query("
    SELECT e.*, c.category_name 
    FROM events e 
    LEFT JOIN event_categories c ON e.category_id = c.category_id 
    WHERE e.status = 'published'
    ORDER BY e.start_datetime ASC
");
$events = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Group events by date
$grouped = [];
foreach ($events as $evt) {
    if (!$evt['start_datetime']) continue;
    $dateObj = new DateTime($evt['start_datetime']);
    $dateStr = $dateObj->format('l, M j, Y');
    
    if (!isset($grouped[$dateStr])) {
        $grouped[$dateStr] = [];
    }
    $grouped[$dateStr][] = $evt;
}

$days = array_keys($grouped);
$activeDay = $days[0] ?? null;

if (isset($_GET['day']) && in_array($_GET['day'], $days)) {
    $activeDay = $_GET['day'];
}

$catColors = [
    'technical' => 'border-l-cyan-400 bg-cyan-400/5',
    'cultural' => 'border-l-pink-400 bg-pink-400/5',
    'sports' => 'border-l-green-400 bg-green-400/5',
    'gaming' => 'border-l-amber-400 bg-amber-400/5',
    'academic' => 'border-l-blue-400 bg-blue-400/5',
];
$catBadge = [
    'technical' => 'bg-cyan-400/15 text-cyan-400',
    'cultural' => 'bg-pink-400/15 text-pink-400',
    'sports' => 'bg-green-400/15 text-green-400',
    'gaming' => 'bg-amber-400/15 text-amber-400',
    'academic' => 'bg-blue-400/15 text-blue-400',
];

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-4xl mx-auto space-y-6 px-6 py-10">
    <div class="animate-slide-up">
        <h1 class="text-2xl font-bold font-display text-white">Event Schedule</h1>
        <p class="text-sm text-gray-500 mt-1"><?php echo count($events); ?> events across <?php echo count($days); ?> day<?php echo count($days) !== 1 ? 's' : ''; ?></p>
    </div>

    <?php if (empty($events)): ?>
        <div class="p-8 rounded-2xl bg-surface-700/30 border border-white/5 text-center animate-slide-up" style="animation-delay: 0.1s">
            <i data-lucide="clock" size="48" class="text-gray-600 mx-auto mb-4"></i>
            <p class="text-gray-500">No events scheduled yet. Events will appear here once admin creates them.</p>
        </div>
    <?php else: ?>
        <!-- Day Tabs -->
        <div class="flex gap-3 overflow-x-auto pb-1 hide-scrollbar animate-slide-up" style="animation-delay: 0.1s">
            <?php foreach ($days as $index => $day): ?>
                <?php $isActive = ($day === $activeDay); ?>
                <a href="?day=<?php echo urlencode($day); ?>"
                   class="flex-1 min-w-[120px] p-4 rounded-2xl text-center transition-all <?php echo $isActive ? 'bg-nexus-400/10 border-2 border-nexus-400/30' : 'bg-surface-700/30 border border-white/5 hover:bg-surface-600/30'; ?>">
                    <div class="text-lg font-bold <?php echo $isActive ? 'text-nexus-400' : 'text-white'; ?>">Day <?php echo $index + 1; ?></div>
                    <div class="text-xs text-gray-500"><?php echo $day; ?></div>
                </a>
            <?php endforeach; ?>
        </div>

        <!-- Timeline -->
        <?php if ($activeDay && isset($grouped[$activeDay])): ?>
            <div class="space-y-4 animate-slide-up" style="animation-delay: 0.2s">
                <?php foreach ($grouped[$activeDay] as $evt): 
                    $cat = strtolower($evt['category_name'] ?? '');
                    $colorClass = $catColors[$cat] ?? 'border-l-gray-400 bg-gray-400/5';
                    $badgeClass = $catBadge[$cat] ?? 'bg-white/10 text-gray-400';
                    $startObj = new DateTime($evt['start_datetime']);
                    $endObj = null;
                    if ($evt['end_datetime']) $endObj = new DateTime($evt['end_datetime']);
                ?>
                    <a href="events.php?id=<?php echo $evt['event_id']; ?>" 
                       class="block p-4 rounded-xl border-l-4 <?php echo $colorClass; ?> border border-white/5 hover:border-white/15 transition-all hover:-translate-y-0.5 group">
                        
                        <div class="flex items-center gap-2 mb-1">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 <?php echo $badgeClass; ?>">
                                <?php echo htmlspecialchars($evt['category_name'] ?: 'General'); ?>
                            </span>
                            <span class="text-[10px] text-gray-500 flex items-center gap-1 uppercase tracking-wider font-bold">
                                <i data-lucide="users" size="10"></i> <?php echo htmlspecialchars($evt['event_type']); ?>
                            </span>
                        </div>
                        
                        <h3 class="font-bold text-white group-hover:text-nexus-400 transition-colors text-lg"><?php echo htmlspecialchars($evt['event_name']); ?></h3>
                        
                        <div class="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400 font-medium">
                            <span class="flex items-center gap-1.5 bg-surface-800/50 px-2 py-1 rounded">
                                <i data-lucide="clock" size="12" class="text-nexus-400"></i>
                                <?php echo $startObj->format('g:i A'); ?>
                                <?php if ($endObj): ?>
                                    – <?php echo $endObj->format('g:i A'); ?>
                                <?php endif; ?>
                            </span>
                            <?php if (!empty($evt['venue_name'])): ?>
                                <span class="flex items-center gap-1.5 bg-surface-800/50 px-2 py-1 rounded">
                                    <i data-lucide="map-pin" size="12" class="text-accent-400"></i>
                                    <?php echo htmlspecialchars($evt['venue_name']); ?>
                                </span>
                            <?php endif; ?>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    <?php endif; ?>
</div>

<style>
/* Hide scrollbar for the horizontal nav */
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
