<?php
require_once __DIR__ . '/includes/config.php';

$db = getDB();

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$searchLower = strtolower($search);

// Fetch events that have results
$stmt = $db->query("
    SELECT DISTINCT e.event_id, e.event_name, ec.category_name, e.start_datetime
    FROM events e
    JOIN event_results r ON e.event_id = r.event_id
    JOIN event_categories ec ON e.category_id = ec.category_id
    ORDER BY e.start_datetime DESC
");
$allEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);

$filteredEvents = [];
foreach ($allEvents as $event) {
    if (
        $search === '' || 
        strpos(strtolower($event['event_name']), $searchLower) !== false || 
        strpos(strtolower($event['category_name']), $searchLower) !== false
    ) {
        // Fetch winners for this event
        $stmt = $db->prepare("
            SELECT r.position, 
                   COALESCE(u.first_name, t.team_name, 'Unknown') as winner_name,
                   u.last_name,
                   c.college_code
            FROM event_results r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN colleges c ON u.college_id = c.college_id
            LEFT JOIN teams t ON r.team_id = t.team_id
            WHERE r.event_id = :event AND r.position IN ('first', 'second', 'third')
            ORDER BY FIELD(r.position, 'first', 'second', 'third')
        ");
        $stmt->execute([':event' => $event['event_id']]);
        $event['winners'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $filteredEvents[] = $event;
    }
}

$positionStyles = [
    'first' => [
        'icon' => 'trophy',
        'color' => 'text-amber-400',
        'bg' => 'bg-amber-400/10',
        'border' => 'border-amber-400/20',
        'label' => '1st Place'
    ],
    'second' => [
        'icon' => 'award',
        'color' => 'text-gray-300',
        'bg' => 'bg-gray-300/10',
        'border' => 'border-gray-300/20',
        'label' => '2nd Place'
    ],
    'third' => [
        'icon' => 'star',
        'color' => 'text-orange-400',
        'bg' => 'bg-orange-400/10',
        'border' => 'border-orange-400/20',
        'label' => '3rd Place'
    ]
];

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-6xl mx-auto space-y-8 pb-12 px-6 py-10">
    <!-- Header -->
    <div class="relative p-8 rounded-3xl bg-gradient-to-br from-surface-700/60 to-surface-800/40 border border-white/5 overflow-hidden animate-slide-up">
        <div class="absolute top-0 right-0 w-64 h-64 rounded-full bg-nexus-400/5 blur-[80px]"></div>
        <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-400/10 text-nexus-400 text-xs font-bold uppercase tracking-widest">
                    <i data-lucide="trophy" size="14"></i> Official Announcements
                </div>
                <h1 class="text-3xl md:text-4xl font-bold font-display text-white">Event Results</h1>
                <p class="text-gray-400 max-w-md">Celebrating the champions of NexusFest 2026. Congratulations to all participants!</p>
            </div>

            <form action="results.php" method="GET" class="relative w-full md:w-72">
                <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size="18"></i>
                <input 
                    type="text" 
                    name="search"
                    placeholder="Search results..."
                    value="<?php echo htmlspecialchars($search); ?>"
                    onchange="this.form.submit()"
                    class="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-nexus-400/50 transition-all"
                >
            </form>
        </div>
    </div>

    <?php if (empty($filteredEvents)): ?>
        <div class="text-center py-20 bg-surface-700/20 rounded-3xl border border-white/5 animate-slide-up" style="animation-delay: 0.1s">
            <i data-lucide="award" class="mx-auto text-gray-600 mb-4" size="48"></i>
            <h3 class="text-xl font-bold text-white">No results found</h3>
            <p class="text-gray-500 mt-2">Try searching for a different event or check back later.</p>
        </div>
    <?php else: ?>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style="animation-delay: 0.1s">
            <?php foreach ($filteredEvents as $event): ?>
                <div class="group relative bg-surface-800/40 border border-white/5 rounded-3xl overflow-hidden hover:border-nexus-400/30 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                    <!-- Category Badge -->
                    <div class="absolute top-4 right-4 z-10">
                        <span class="px-2.5 py-1 rounded-lg bg-surface-900/80 backdrop-blur-md text-[10px] font-bold text-gray-400 border border-white/5 uppercase">
                            <?php echo htmlspecialchars($event['category_name'] ?? 'General'); ?>
                        </span>
                    </div>

                    <div class="p-6 space-y-6 flex-1">
                        <div>
                            <h3 class="text-lg font-bold text-white group-hover:text-nexus-400 transition-colors line-clamp-1"><?php echo htmlspecialchars($event['event_name']); ?></h3>
                            <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <i data-lucide="calendar" size="12"></i> 
                                <?php echo date('n/j/Y', strtotime($event['start_datetime'])); ?>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <?php foreach (['first', 'second', 'third'] as $pos): 
                                $winner = null;
                                foreach ($event['winners'] as $w) {
                                    if ($w['position'] === $pos) {
                                        $winner = $w;
                                        break;
                                    }
                                }
                                $style = $positionStyles[$pos];
                            ?>
                                <div class="flex items-center gap-3 p-3 rounded-2xl border <?php echo $winner ? $style['bg'] . ' ' . $style['border'] : 'bg-white/2 border-white/5 opacity-40'; ?>">
                                    <div class="w-10 h-10 rounded-xl <?php echo $style['bg']; ?> <?php echo $style['color']; ?> flex items-center justify-center shrink-0">
                                        <i data-lucide="<?php echo $style['icon']; ?>" size="20"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="text-[10px] font-bold uppercase tracking-wider text-gray-500"><?php echo $style['label']; ?></div>
                                        <?php if ($winner): ?>
                                            <div class="flex items-center justify-between gap-2">
                                                <span class="text-sm font-bold text-white truncate">
                                                    <?php echo htmlspecialchars($winner['winner_name'] . ($winner['last_name'] ? ' ' . $winner['last_name'] : '')); ?>
                                                </span>
                                                <span class="text-[10px] font-mono text-gray-400 shrink-0"><?php echo htmlspecialchars($winner['college_code'] ?? ''); ?></span>
                                            </div>
                                        <?php else: ?>
                                            <div class="text-sm font-medium text-gray-600">No winner declared</div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <div class="p-4 bg-white/2 border-t border-white/5 flex justify-center mt-auto">
                        <button class="text-xs font-bold text-nexus-400 hover:text-white transition-colors">View Detailed Scoreboard</button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
