<?php
require_once __DIR__ . '/includes/config.php';

$db = getDB();

// Fetch categories for filtering
$categories = $db->query("SELECT * FROM event_categories ORDER BY display_order ASC")->fetchAll();

// Get selected category
$categoryFilter = $_GET['category'] ?? '';

// Build query
$query = "
    SELECT e.*, c.category_name, v.venue_name 
    FROM events e 
    JOIN event_categories c ON e.category_id = c.category_id 
    LEFT JOIN venues v ON e.venue_id = v.venue_id
    WHERE e.status = 'published'
";
$params = [];
if ($categoryFilter) {
    $query .= " AND e.category_id = :category_id";
    $params[':category_id'] = (int) $categoryFilter;
}
$query .= " ORDER BY e.start_datetime ASC";

$stmt = $db->prepare($query);
$stmt->execute($params);
$events = $stmt->fetchAll();

$categoryColors = [
    'technical' => 'bg-cyan-400/15 text-cyan-400',
    'cultural' => 'bg-pink-400/15 text-pink-400',
    'academic' => 'bg-blue-400/15 text-blue-400',
    'sports' => 'bg-green-400/15 text-green-400',
    'gaming' => 'bg-amber-400/15 text-amber-400',
];

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-7xl mx-auto px-6 py-12">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 animate-slide-up">
        <div>
            <h1 class="text-4xl font-black font-display text-white mb-2">NexusFest <span class="text-nexus-400">Events</span></h1>
            <p class="text-gray-400">Discover and register for the most exciting events of 2026.</p>
        </div>
        
        <!-- Category Filter -->
        <div class="flex flex-wrap gap-2">
            <a href="events.php" class="px-5 py-2 rounded-full text-sm font-semibold transition-all <?php echo !$categoryFilter ? 'bg-nexus-400 text-white shadow-[0_0_15px_rgba(6,232,225,0.3)]' : 'bg-surface-800 text-gray-400 hover:text-white border border-white/5' ?>">
                All Categories
            </a>
            <?php foreach ($categories as $cat): ?>
                <a href="events.php?category=<?php echo $cat['category_id']; ?>" class="px-5 py-2 rounded-full text-sm font-semibold transition-all <?php echo $categoryFilter == $cat['category_id'] ? 'bg-nexus-400 text-white shadow-[0_0_15px_rgba(6,232,225,0.3)]' : 'bg-surface-800 text-gray-400 hover:text-white border border-white/5' ?>">
                    <?php echo htmlspecialchars($cat['category_name']); ?>
                </a>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Events Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <?php if (empty($events)): ?>
            <div class="col-span-full text-center py-20 bg-surface-800/20 rounded-3xl border border-dashed border-white/10 animate-slide-up">
                <i data-lucide="search" size="48" class="mx-auto text-gray-600 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-400">No events found</h3>
                <p class="text-gray-500 mt-2">Try selecting a different category or check back later.</p>
            </div>
        <?php else: ?>
            <?php foreach ($events as $index => $evt): ?>
                <?php 
                $colorClass = $categoryColors[strtolower($evt['category_name'])] ?? 'bg-white/5 text-gray-400';
                ?>
                <div class="group p-6 rounded-2xl bg-surface-700/40 backdrop-blur-sm border border-nexus-400/10 hover:border-nexus-400/30 hover:bg-surface-600/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl animate-slide-up" style="animation-delay: <?php echo $index * 0.05; ?>s">
                    <div class="flex items-center gap-2 mb-4">
                        <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider <?php echo $colorClass; ?>">
                            <?php echo htmlspecialchars($evt['category_name']); ?>
                        </span>
                        <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 text-gray-400">
                            <?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $evt['scope']))); ?>
                        </span>
                    </div>
                    
                    <h3 class="text-xl font-bold text-white mb-2 leading-tight min-h-[3.5rem] flex items-center group-hover:text-nexus-400 transition-colors">
                        <?php echo htmlspecialchars($evt['event_name']); ?>
                    </h3>
                    
                    <p class="text-sm text-gray-400 mb-6 line-clamp-2">
                        <?php echo htmlspecialchars($evt['description']); ?>
                    </p>
                    
                    <div class="space-y-3 mb-8">
                        <div class="flex items-center gap-3 text-sm text-gray-400">
                            <i data-lucide="calendar" size="16" class="text-nexus-400"></i>
                            <span><?php echo date('D, M j, Y', strtotime($evt['start_datetime'])); ?></span>
                        </div>
                        <div class="flex items-center gap-3 text-sm text-gray-400">
                            <i data-lucide="clock" size="16" class="text-nexus-400"></i>
                            <span><?php echo date('g:i A', strtotime($evt['start_datetime'])); ?></span>
                        </div>
                        <?php if ($evt['venue_name']): ?>
                            <div class="flex items-center gap-3 text-sm text-gray-400">
                                <i data-lucide="map-pin" size="16" class="text-pink-400"></i>
                                <span><?php echo htmlspecialchars($evt['venue_name']); ?></span>
                            </div>
                        <?php endif; ?>
                        <div class="flex items-center gap-3 text-sm text-gray-400">
                            <i data-lucide="trophy" size="16" class="text-amber-400"></i>
                            <span class="font-semibold text-gray-300">Prize: ₹<?php echo number_format($evt['prize_pool']); ?></span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between pt-6 border-t border-white/5">
                        <div class="text-xs text-gray-500">
                            <span class="text-gray-300 font-bold"><?php echo $evt['entry_fee'] > 0 ? '₹'.number_format($evt['entry_fee']) : 'FREE'; ?></span> 
                            Entry Fee
                        </div>
                        <a href="login.php" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-nexus-400 to-accent-500 text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] hover:scale-105 active:scale-[0.98] transition-all flex items-center gap-2">
                            Register <i data-lucide="arrow-right" size="14"></i>
                        </a>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
