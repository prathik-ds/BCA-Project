<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

$userId = $_SESSION['user_id'];
$db = getDB();

$error = '';
$success = '';

// Handle Top-Up
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'topup') {
    $amount = (float)($_POST['amount'] ?? 0);
    
    if ($amount < WALLET_MIN_TOPUP) {
        $error = "Minimum top-up amount is ₹" . WALLET_MIN_TOPUP;
    } else {
        $db->beginTransaction();
        try {
            // Get wallet
            $stmt = $db->prepare("SELECT wallet_id, balance, is_frozen FROM wallets WHERE user_id = :user FOR UPDATE");
            $stmt->execute([':user' => $userId]);
            $wallet = $stmt->fetch();

            if (!$wallet) {
                // Should not happen if DB is seeded correctly, but as safety:
                $db->prepare("INSERT INTO wallets (user_id, balance) VALUES (:user, 0)")->execute([':user' => $userId]);
                $stmt->execute([':user' => $userId]);
                $wallet = $stmt->fetch();
            }

            if ($wallet['is_frozen']) {
                $error = "Your wallet is frozen. Contact admin.";
                $db->rollBack();
            } elseif ($wallet['balance'] + $amount > WALLET_MAX_BALANCE) {
                $error = "Maximum wallet balance is ₹" . WALLET_MAX_BALANCE;
                $db->rollBack();
            } else {
                $currentBalance = (float)$wallet['balance'];
                $newBalance = $currentBalance + $amount;
                $refId = 'TOPUP_' . date('Ymd') . '_' . str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);

                // Update balance
                $db->prepare("UPDATE wallets SET balance = :bal WHERE wallet_id = :id")
                   ->execute([':bal' => $newBalance, ':id' => $wallet['wallet_id']]);

                // Record transaction
                $db->prepare("
                    INSERT INTO wallet_transactions 
                        (wallet_id, type, category, amount, balance_before, balance_after, reference_id, description)
                    VALUES (:wallet, 'credit', 'topup', :amount, :before, :after, :ref, 'Wallet top-up (Manual)')
                ")->execute([
                    ':wallet' => $wallet['wallet_id'],
                    ':amount' => $amount,
                    ':before' => $currentBalance,
                    ':after'  => $newBalance,
                    ':ref'    => $refId,
                ]);

                $db->commit();
                $success = "Successfully added ₹$amount to your wallet!";
            }
        } catch (Exception $e) {
            $db->rollBack();
            $error = "Top-up failed: " . $e->getMessage();
        }
    }
}

// Fetch Wallet Data
$stmt = $db->prepare("SELECT balance FROM wallets WHERE user_id = :user");
$stmt->execute([':user' => $userId]);
$wallet = $stmt->fetch() ?: ['balance' => 0];

// Fetch Transactions
$filterType = $_GET['type'] ?? 'all';
$query = "
    SELECT t.*, fs.stall_name 
    FROM wallet_transactions t 
    JOIN wallets w ON t.wallet_id = w.wallet_id 
    LEFT JOIN food_stalls fs ON t.stall_id = fs.stall_id
    WHERE w.user_id = :user
";
if ($filterType === 'credit' || $filterType === 'debit') {
    $query .= " AND t.type = :type";
}
$query .= " ORDER BY t.created_at DESC LIMIT 50";

$stmt = $db->prepare($query);
$params = [':user' => $userId];
if ($filterType !== 'all') $params[':type'] = $filterType;
$stmt->execute($params);
$transactions = $stmt->fetchAll();

// Calculate stats
$totalAdded = 0;
$totalSpent = 0;
foreach ($transactions as $t) {
    if ($t['type'] === 'credit') $totalAdded += $t['amount'];
    else $totalSpent += $t['amount'];
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-4xl mx-auto px-6 py-12 space-y-8">
    <div class="flex items-center justify-between mb-2">
        <h1 class="text-2xl font-bold font-display text-white">Digital Wallet</h1>
        <a href="dashboard.php" class="text-xs text-gray-500 hover:text-white flex items-center gap-1">
            <i data-lucide="arrow-left" size="14"></i> Back to Dashboard
        </a>
    </div>

    <!-- Balance Card -->
    <div class="relative p-8 rounded-3xl bg-gradient-to-br from-surface-700/80 to-surface-800/60 border border-nexus-400/20 overflow-hidden shadow-2xl animate-slide-up">
        <div class="absolute top-0 right-0 w-48 h-48 rounded-full bg-nexus-400/8 blur-[80px]"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-accent-500/8 blur-[60px]"></div>
        
        <div class="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
                <p class="text-sm text-gray-400 mb-1">Available Balance</p>
                <div class="text-5xl font-black font-display text-white mb-4">₹<?php echo number_format($wallet['balance'], 2); ?></div>
                <div class="flex gap-6">
                    <div class="flex items-center gap-2 text-sm">
                        <i data-lucide="arrow-down-left" size="14" class="text-green-400"></i>
                        <span class="text-gray-400">Added: <span class="text-green-400 font-bold">₹<?php echo number_format($totalAdded, 0); ?></span></span>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                        <i data-lucide="arrow-up-right" size="14" class="text-red-400"></i>
                        <span class="text-gray-400">Spent: <span class="text-red-400 font-bold">₹<?php echo number_format($totalSpent, 0); ?></span></span>
                    </div>
                </div>
            </div>
            <button onclick="document.getElementById('topup-form').scrollIntoView({behavior: 'smooth'})" class="px-8 py-3.5 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-2xl text-white font-bold text-sm hover:shadow-[0_0_25px_rgba(6,232,225,0.3)] hover:scale-105 transition-all flex items-center gap-2 group">
                <i data-lucide="plus" size="18" class="group-hover:rotate-90 transition-transform"></i> Top Up
            </button>
        </div>
    </div>

    <!-- Feedback Messages -->
    <?php if ($error): ?>
        <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-shake">
            <i data-lucide="alert-circle" size="18"></i> <?php echo htmlspecialchars($error); ?>
        </div>
    <?php endif; ?>
    <?php if ($success): ?>
        <div class="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-3 animate-slide-up">
            <i data-lucide="check-circle" size="18"></i> <?php echo htmlspecialchars($success); ?>
        </div>
    <?php endif; ?>

    <!-- Top Up Section -->
    <div id="topup-form" class="p-8 rounded-3xl bg-surface-700/30 border border-white/5 animate-slide-up" style="animation-delay: 0.1s">
        <h3 class="font-bold text-white mb-6 flex items-center gap-2">
            <i data-lucide="plus-circle" class="text-nexus-400" size="20"></i> Add Funds
        </h3>
        
        <form action="wallet.php" method="POST" class="space-y-6">
            <input type="hidden" name="action" value="topup">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <?php foreach ([100, 200, 500, 1000] as $amt): ?>
                    <button type="button" onclick="document.getElementById('topup_amount').value = '<?php echo $amt; ?>'" class="py-3.5 rounded-xl bg-surface-800 border border-white/5 text-gray-300 font-bold hover:bg-surface-700 hover:border-nexus-400/30 transition-all">
                        ₹<?php echo $amt; ?>
                    </button>
                <?php endforeach; ?>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex-1 relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                    <input type="number" name="amount" id="topup_amount" required min="50" step="10" placeholder="Enter custom amount" 
                           class="w-full pl-8 pr-4 py-4 rounded-2xl bg-surface-900/50 border border-white/10 text-white font-bold placeholder-gray-600 focus:outline-none focus:border-nexus-400/50">
                </div>
                <button type="submit" class="px-10 py-4 bg-white text-surface-900 rounded-2xl font-black hover:bg-nexus-400 hover:text-white transition-all">
                    Add Now
                </button>
            </div>
            <p class="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Minimum top-up: ₹50.00 • Max balance: ₹5,000.00</p>
        </form>
    </div>

    <!-- Transaction History -->
    <div class="p-8 rounded-3xl bg-surface-700/30 border border-white/5 animate-slide-up" style="animation-delay: 0.2s">
        <div class="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <h3 class="font-bold text-white flex items-center gap-2">
                <i data-lucide="history" class="text-accent-400" size="20"></i> Transaction History
            </h3>
            <div class="flex p-1 bg-surface-900/50 rounded-xl border border-white/5">
                <a href="wallet.php?type=all" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all <?php echo $filterType == 'all' ? 'bg-surface-700 text-white' : 'text-gray-500 hover:text-gray-300' ?>">All</a>
                <a href="wallet.php?type=credit" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all <?php echo $filterType == 'credit' ? 'bg-green-500/10 text-green-400' : 'text-gray-500 hover:text-gray-300' ?>">Added</a>
                <a href="wallet.php?type=debit" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all <?php echo $filterType == 'debit' ? 'bg-red-500/10 text-red-400' : 'text-gray-500 hover:text-gray-300' ?>">Spent</a>
            </div>
        </div>

        <?php if (empty($transactions)): ?>
            <div class="text-center py-16 opacity-30">
                <i data-lucide="database" size="48" class="mx-auto mb-4"></i>
                <p class="font-bold uppercase tracking-widest text-xs">No transactions recorded</p>
            </div>
        <?php else: ?>
            <div class="space-y-3">
                <?php foreach ($transactions as $txn): ?>
                    <?php $isCredit = $txn['type'] === 'credit'; ?>
                    <div class="flex items-center gap-4 p-5 rounded-2xl bg-surface-800/40 border border-white/5 hover:bg-surface-700/40 transition-all group">
                        <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 <?php echo $isCredit ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'; ?>">
                            <i data-lucide="<?php echo $isCredit ? 'arrow-down-left' : 'arrow-up-right'; ?>" size="20"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-bold text-white truncate"><?php echo htmlspecialchars($txn['description']); ?></p>
                            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                <?php echo date('M j, Y • g:i A', strtotime($txn['created_at'])); ?> 
                                <?php if ($txn['reference_id']): ?>• #<?php echo htmlspecialchars($txn['reference_id']); ?><?php endif; ?>
                            </p>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-black font-display <?php echo $isCredit ? 'text-green-400' : 'text-red-400'; ?>">
                                <?php echo $isCredit ? '+' : '-'; ?>₹<?php echo number_format($txn['amount'], 2); ?>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
