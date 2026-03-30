<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

$userId = $_SESSION['user_id'];
$db = getDB();

$certificates = [];
try {
    $stmt = $db->prepare("
        SELECT c.*, e.event_name 
        FROM certificates c
        JOIN events e ON c.event_id = e.event_id
        WHERE c.user_id = :user
        ORDER BY c.issued_at DESC
    ");
    $stmt->execute([':user' => $userId]);
    $certificates = $stmt->fetchAll();
} catch (Exception $e) {
    // If certificates table doesn't exist yet or query fails, just default to empty array
    $certificates = [];
}

$typeConfig = [
    'participation' => ['label' => 'Participation', 'color' => 'text-blue-400', 'bg' => 'bg-blue-400/10', 'border' => 'border-blue-400/30'],
    'winner_first'  => ['label' => '🥇 1st Place', 'color' => 'text-amber-400', 'bg' => 'bg-amber-400/10', 'border' => 'border-amber-400/30'],
    'winner_second' => ['label' => '🥈 2nd Place', 'color' => 'text-gray-300', 'bg' => 'bg-gray-300/10', 'border' => 'border-gray-300/30'],
    'winner_third'  => ['label' => '🥉 3rd Place', 'color' => 'text-orange-400', 'bg' => 'bg-orange-400/10', 'border' => 'border-orange-400/30'],
];

require_once __DIR__ . '/includes/header.php';

$winnerCount = 0;
$participationCount = 0;
foreach ($certificates as $c) {
    if (strpos($c['cert_type'], 'winner') === 0) {
        $winnerCount++;
    } elseif ($c['cert_type'] === 'participation') {
        $participationCount++;
    }
}
$totalCount = count($certificates);
?>

<div class="max-w-4xl mx-auto space-y-6 px-6 py-10 animate-slide-up">
    <div>
        <h1 class="text-2xl font-bold font-display text-white">My Certificates</h1>
        <p class="text-sm text-gray-500 mt-1"><?php echo $totalCount; ?> certificates earned • Auto-generated after events</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 animate-slide-up" style="animation-delay: 0.1s">
        <div class="p-5 rounded-2xl bg-amber-400/5 border border-amber-400/20 text-center">
            <div class="text-2xl font-bold font-display text-amber-400"><?php echo $winnerCount; ?></div>
            <div class="text-xs text-gray-500">Winner</div>
        </div>
        <div class="p-5 rounded-2xl bg-blue-400/5 border border-blue-400/20 text-center">
            <div class="text-2xl font-bold font-display text-blue-400"><?php echo $participationCount; ?></div>
            <div class="text-xs text-gray-500">Participation</div>
        </div>
        <div class="p-5 rounded-2xl bg-nexus-400/5 border border-nexus-400/20 text-center">
            <div class="text-2xl font-bold font-display text-nexus-400"><?php echo $totalCount; ?></div>
            <div class="text-xs text-gray-500">Total</div>
        </div>
    </div>

    <?php if (empty($certificates)): ?>
        <div class="p-8 rounded-2xl bg-surface-700/30 border border-white/5 text-center animate-slide-up" style="animation-delay: 0.2s">
            <i data-lucide="award" size="48" class="text-gray-600 mx-auto mb-4"></i>
            <h3 class="text-lg font-bold text-white mb-2">No Certificates Yet</h3>
            <p class="text-gray-500 max-w-md mx-auto">Certificates are automatically generated after event results are declared. Register and participate in events to earn certificates!</p>
        </div>
    <?php else: ?>
        <div class="space-y-4 animate-slide-up" style="animation-delay: 0.2s">
            <?php foreach ($certificates as $cert): 
                $cfg = $typeConfig[$cert['cert_type']] ?? $typeConfig['participation'];
            ?>
                <div class="p-6 rounded-2xl bg-surface-700/30 border <?php echo $cfg['border']; ?> hover:bg-surface-600/30 transition-all">
                    <div class="flex flex-col sm:flex-row items-start gap-4">
                        <div class="w-14 h-14 rounded-2xl <?php echo $cfg['bg']; ?> flex items-center justify-center shrink-0">
                            <i data-lucide="award" size="24" class="<?php echo $cfg['color']; ?>"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold <?php echo $cfg['bg'] . ' ' . $cfg['color']; ?>">
                                <?php echo htmlspecialchars($cfg['label']); ?>
                            </span>
                            <h3 class="text-lg font-bold text-white mt-1"><?php echo htmlspecialchars($cert['event_name']); ?></h3>
                            <div class="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                <span class="flex items-center gap-1">
                                    <i data-lucide="clock" size="11"></i> 
                                    <?php echo date('M j, Y', strtotime($cert['issued_at'])); ?>
                                </span>
                                <span class="font-mono"><?php echo htmlspecialchars($cert['verification_code']); ?></span>
                            </div>
                        </div>
                        <button class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-nexus-400 to-accent-500 text-white text-sm font-semibold hover:shadow-[0_0_15px_rgba(6,232,225,0.3)] transition-all flex items-center gap-2" onclick="alert('Downloading certificate PDF...')">
                            <i data-lucide="download" size="14"></i> Download
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
