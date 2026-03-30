<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

if (!in_array($_SESSION['role'], ['admin', 'super_admin'])) {
    header("Location: dashboard.php");
    exit;
}

$db = getDB();

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$searchLower = strtolower($search);

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

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-6xl mx-auto space-y-6 px-6 py-10 animate-slide-up">
    <div class="flex flex-col md:flex-row justify-between items-center bg-surface-800 p-6 rounded-2xl border border-white/5 gap-4">
        <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-3">
                <i data-lucide="trophy" class="text-amber-500" size="28"></i> Result Preview
            </h1>
            <p class="text-gray-400 text-sm mt-1">Review all declared winners across events.</p>
        </div>
        
        <form class="relative w-full md:w-64" action="admin_view_results.php" method="GET">
            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size="16"></i>
            <input 
                name="search"
                value="<?php echo htmlspecialchars($search); ?>"
                onchange="this.form.submit()"
                placeholder="Search by event..."
                class="w-full pl-10 pr-4 py-2 bg-surface-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
        </form>
    </div>

    <div class="bg-surface-800 rounded-2xl border border-white/5 overflow-x-auto animate-slide-up" style="animation-delay: 0.1s">
        <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
                <tr class="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th class="px-6 py-4">Event Name</th>
                    <th class="px-6 py-4 text-center">1st Place</th>
                    <th class="px-6 py-4 text-center">2nd Place</th>
                    <th class="px-6 py-4 text-center">3rd Place</th>
                    <th class="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                <?php foreach ($filteredEvents as $event): ?>
                    <tr class="hover:bg-white/5 transition group">
                        <td class="px-6 py-4">
                            <div class="font-bold text-white"><?php echo htmlspecialchars($event['event_name']); ?></div>
                            <div class="text-[10px] text-gray-500 mt-0.5"><?php echo htmlspecialchars($event['category_name']); ?></div>
                        </td>
                        
                        <?php foreach (['first', 'second', 'third'] as $pos): 
                            $winner = null;
                            foreach ($event['winners'] as $w) {
                                if ($w['position'] === $pos) {
                                    $winner = $w; break;
                                }
                            }
                            $colors = ['first' => 'text-amber-400', 'second' => 'text-gray-300', 'third' => 'text-orange-400'];
                        ?>
                            <td class="px-6 py-4 text-center">
                                <?php if ($winner): ?>
                                    <div class="space-y-0.5">
                                        <div class="text-sm font-bold <?php echo $colors[$pos]; ?>">
                                            <?php echo htmlspecialchars($winner['winner_name'] . ($winner['last_name'] ? ' ' . $winner['last_name'] : '')); ?>
                                        </div>
                                        <div class="text-[10px] text-gray-500 font-mono"><?php echo htmlspecialchars($winner['college_code'] ?? ''); ?></div>
                                    </div>
                                <?php else: ?>
                                    <span class="text-xs text-gray-700 italic">No entry</span>
                                <?php endif; ?>
                            </td>
                        <?php endforeach; ?>

                        <td class="px-6 py-4 text-right">
                            <a href="admin_results.php" class="p-2 inline-flex rounded-lg bg-surface-700 hover:bg-amber-500/20 hover:text-amber-500 text-gray-400 transition">
                                <i data-lucide="edit-2" size="16"></i>
                            </a>
                        </td>
                    </tr>
                <?php endforeach; ?>
                
                <?php if (empty($filteredEvents)): ?>
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center text-gray-500">No results found mapping this criteria.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
