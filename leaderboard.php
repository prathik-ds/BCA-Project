<?php
require_once __DIR__ . '/includes/config.php';

$db = getDB();

// Fetch college leaderboard
$leaderboard = $db->query("
    SELECT c.college_name, c.college_code, c.logo_url, l.total_points, l.events_won, l.events_participated, l.rank_position
    FROM leaderboard l
    JOIN colleges c ON l.college_id = c.college_id
    WHERE l.user_id IS NULL AND l.category_id IS NULL
    ORDER BY l.total_points DESC, l.events_won DESC
    LIMIT 20
")->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-7xl mx-auto px-6 py-12">
    <div class="text-center mb-16 animate-slide-up">
        <h1 class="text-4xl sm:text-5xl font-black font-display text-white mb-4">
            Official <span class="bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">Leaderboard</span>
        </h1>
        <p class="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
            Real-time standings of participating colleges. Every win brings your institution closer to the Nexus Trophy!
        </p>
    </div>

    <!-- Top 3 Podium (Replicating some UI from LeaderboardPage.jsx) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-24 max-w-5xl mx-auto">
        <?php foreach ($leaderboard as $index => $row): if ($index >= 3) break; ?>
            <?php 
            $pos = $index + 1;
            $order = $pos == 1 ? 'order-1 md:order-2 scale-110 mb-8' : ($pos == 2 ? 'order-2 md:order-1' : 'order-3');
            $podiumColor = $pos == 1 ? 'from-amber-400 to-orange-500' : ($pos == 2 ? 'from-slate-300 to-slate-500' : 'from-orange-700 to-orange-900');
            $bgColor = $pos == 1 ? 'bg-amber-400/5 border-amber-400/20' : ($pos == 2 ? 'bg-slate-400/5 border-slate-400/20' : 'bg-orange-900/5 border-orange-900/20');
            ?>
            <div class="<?php echo $order; ?> relative h-full flex flex-col items-center animate-slide-up" style="animation-delay: <?php echo $index * 0.1; ?>s">
                <div class="w-full p-8 rounded-3xl <?php echo $bgColor; ?> border backdrop-blur-sm relative group hover:border-white/20 transition-all duration-500 text-center">
                    <!-- Rank Badge -->
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-gradient-to-br <?php echo $podiumColor; ?> flex items-center justify-center text-white font-black text-xl shadow-2xl group-hover:scale-110 transition-transform">
                        <?php echo $pos; ?>
                    </div>
                    
                    <div class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-surface-800 flex items-center justify-center text-3xl font-black text-white p-4 overflow-hidden border border-white/5 group-hover:border-nexus-400/30 transition-all">
                        <?php if ($row['logo_url']): ?>
                            <img src="<?php echo htmlspecialchars($row['logo_url']); ?>" alt="logo" class="w-full h-full object-contain">
                        <?php else: ?>
                            <?php echo substr($row['college_name'], 0, 1); ?>
                        <?php endif; ?>
                    </div>
                    
                    <h3 class="text-xl font-bold text-white mb-2 leading-tight"><?php echo htmlspecialchars($row['college_name']); ?></h3>
                    <p class="text-nexus-400 font-bold text-3xl font-display mb-1"><?php echo number_format($row['total_points']); ?></p>
                    <p class="text-gray-500 text-xs font-bold uppercase tracking-widest">Points</p>
                    
                    <div class="mt-6 flex gap-4 justify-center pt-6 border-t border-white/5">
                        <div class="text-center">
                            <div class="text-white font-bold text-lg"><?php echo $row['events_won']; ?></div>
                            <div class="text-[10px] text-gray-500 font-bold uppercase">Wins</div>
                        </div>
                        <div class="text-center">
                            <div class="text-white font-bold text-lg"><?php echo $row['events_participated']; ?></div>
                            <div class="text-[10px] text-gray-500 font-bold uppercase">Events</div>
                        </div>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>

    <!-- Rest of the Table -->
    <div class="max-w-4xl mx-auto overflow-hidden rounded-3xl border border-white/5 bg-surface-800/20 backdrop-blur-md animate-slide-up" style="animation-delay: 0.4s">
        <div class="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <h2 class="font-bold text-white text-lg font-display">Institution Standings</h2>
            <span class="text-gray-500 text-sm font-medium">Rankings refresh every 30 mins</span>
        </div>
        
        <table class="w-full text-left">
            <thead class="bg-surface-800/40 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                    <th class="px-8 py-5">Rank</th>
                    <th class="px-8 py-5">College</th>
                    <th class="px-8 py-5 text-center">Wins</th>
                    <th class="px-8 py-5 text-right">Points</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                <?php if (empty($leaderboard)): ?>
                    <tr>
                        <td colspan="4" class="px-8 py-20 text-center">
                            <i data-lucide="loader-2" class="animate-spin mx-auto text-nexus-400 mb-4"></i>
                            <p class="text-gray-500">Leaderboard being calculated. Check back soon!</p>
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($leaderboard as $index => $row): if ($index < 3) continue; ?>
                        <tr class="hover:bg-white/[0.02] transition-colors group">
                            <td class="px-8 py-5 font-bold text-gray-400 font-display text-lg">
                                #<?php echo $index + 1; ?>
                            </td>
                            <td class="px-8 py-5">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center text-gray-400 font-bold text-sm">
                                        <?php echo htmlspecialchars($row['college_code'] ?: '?'); ?>
                                    </div>
                                    <div>
                                        <div class="text-white font-bold text-sm leading-tight group-hover:text-nexus-400 transition-colors"><?php echo htmlspecialchars($row['college_name']); ?></div>
                                        <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Participated in <?php echo $row['events_participated']; ?> events</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-8 py-5 text-center">
                                <span class="px-3 py-1 rounded-full bg-nexus-400/10 text-nexus-400 text-xs font-bold"><?php echo $row['events_won']; ?></span>
                            </td>
                            <td class="px-8 py-5 text-right font-bold text-white text-lg font-display">
                                <?php echo number_format($row['total_points']); ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
