<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

$userId = $_SESSION['user_id'];
$db = getDB();

$error = '';
$success = '';

// Handle Create / Join team
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] === 'create') {
        $teamName = trim($_POST['team_name'] ?? '');
        $eventId = $_POST['event_id'] ?? '';
        
        if (!$teamName || !$eventId) {
            $error = 'Please fill all fields';
        } else {
            $inviteCode = strtoupper(substr(md5(uniqid()), 0, 8));
            try {
                $db->beginTransaction();
                $stmt = $db->prepare("INSERT INTO teams (team_name, event_id, creator_id, invite_code) VALUES (:name, :event, :creator, :code)");
                $stmt->execute([
                    ':name' => $teamName,
                    ':event' => $eventId,
                    ':creator' => $userId,
                    ':code' => $inviteCode
                ]);
                $teamId = $db->lastInsertId();
                
                $stmt = $db->prepare("INSERT INTO team_members (team_id, user_id, is_leader) VALUES (:team, :user, 1)");
                $stmt->execute([
                    ':team' => $teamId,
                    ':user' => $userId
                ]);
                $db->commit();
                $success = 'Team created successfully!';
            } catch (Exception $e) {
                $db->rollBack();
                $error = 'Failed to create team: ' . $e->getMessage();
            }
        }
    } elseif (isset($_POST['action']) && $_POST['action'] === 'join') {
        $joinCode = trim($_POST['invite_code'] ?? '');
        if (!$joinCode) {
            $error = 'Enter invite code';
        } else {
            try {
                $stmt = $db->prepare("SELECT team_id FROM teams WHERE invite_code = :code");
                $stmt->execute([':code' => $joinCode]);
                $team = $stmt->fetch();
                
                if ($team) {
                    $stmt = $db->prepare("INSERT INTO team_members (team_id, user_id, is_leader) VALUES (:team, :user, 0)");
                    $stmt->execute([
                        ':team' => $team['team_id'],
                        ':user' => $userId
                    ]);
                    $success = 'Joined team successfully!';
                } else {
                    $error = 'Invalid invite code';
                }
            } catch (PDOException $e) {
                // If unique constraint violation (already joined)
                if ($e->getCode() == 23000) {
                    $error = 'You are already in this team';
                } else {
                    $error = 'Failed to join team: ' . $e->getMessage();
                }
            }
        }
    }
}

// Fetch user's teams
$stmt = $db->prepare("
    SELECT t.*, e.event_name, tm.is_leader 
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.team_id
    JOIN events e ON t.event_id = e.event_id
    WHERE tm.user_id = :user
");
$stmt->execute([':user' => $userId]);
$myTeams = $stmt->fetchAll();

// Fetch events for Create Team dropdown
$stmt = $db->query("SELECT event_id, event_name FROM events WHERE event_type = 'team' AND status = 'published' ORDER BY event_name ASC");
$teamEvents = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-5xl mx-auto space-y-6 px-6 py-10" x-data="{ showCreate: false, showJoin: false, copied: null }">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold font-display text-white">My Teams</h1>
            <p class="text-sm text-gray-500 mt-1">Create or join teams for team events</p>
        </div>
        <div class="flex gap-3">
            <button @click="showJoin = true" class="px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
                <i data-lucide="log-in" size="16"></i> Join Team
            </button>
            <button @click="showCreate = true" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-nexus-400 to-accent-500 text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all flex items-center gap-2">
                <i data-lucide="plus" size="16"></i> Create Team
            </button>
        </div>
    </div>

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

    <?php if (empty($myTeams)): ?>
        <div class="p-8 rounded-2xl bg-surface-700/30 border border-white/5 text-center">
            <div class="flex justify-center mb-4"><i data-lucide="users" size="48" class="text-gray-600"></i></div>
            <p class="text-gray-400 mb-2">Create or join a team using the buttons above.</p>
            <p class="text-xs text-gray-500">Teams will appear here after you create or join one.</p>
        </div>
    <?php else: ?>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 animate-slide-up">
            <?php foreach ($myTeams as $team): ?>
                <div class="p-6 rounded-2xl bg-surface-700/40 border border-white/5 relative group overflow-hidden">
                    <div class="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-10 transition-opacity">
                        <i data-lucide="users" size="64"></i>
                    </div>
                    <?php if ($team['is_leader']): ?>
                        <div class="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                            <i data-lucide="crown" size="12"></i> Leader
                        </div>
                    <?php endif; ?>
                    
                    <h3 class="text-xl font-bold text-white mb-1 pr-24"><?php echo htmlspecialchars($team['team_name']); ?></h3>
                    <p class="text-sm text-nexus-400 mb-6 bg-nexus-400/10 px-3 py-1 rounded-full inline-block border border-nexus-400/20"><?php echo htmlspecialchars($team['event_name']); ?></p>
                    
                    <div class="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Invite Code</p>
                            <div class="flex items-center gap-2">
                                <code class="text-sm font-mono font-bold text-white bg-surface-800 px-2 py-1 rounded"><?php echo htmlspecialchars($team['invite_code']); ?></code>
                                <button type="button" onclick="navigator.clipboard.writeText('<?php echo htmlspecialchars($team['invite_code']); ?>'); alert('Copied!')" class="text-gray-500 hover:text-white transition-colors">
                                    <i data-lucide="copy" size="14"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <!-- Create Team Modal -->
    <div x-show="showCreate" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showCreate = false"></div>
        <div class="relative w-full max-w-md p-6 rounded-2xl bg-surface-800 border border-white/10 shadow-2xl animate-scale-in">
            <div class="flex items-center justify-between mb-5">
                <h3 class="text-lg font-bold text-white">Create a Team</h3>
                <button @click="showCreate = false" class="text-gray-500 hover:text-white transition-colors">
                    <i data-lucide="x" size="20"></i>
                </button>
            </div>
            
            <form action="teams.php" method="POST" class="space-y-4">
                <input type="hidden" name="action" value="create">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1.5">Team Name</label>
                    <input type="text" name="team_name" required class="w-full px-4 py-3 rounded-xl bg-surface-900/50 border border-white/10 text-white text-sm focus:outline-none focus:border-nexus-400/50 transition-all" placeholder="e.g. Byte Bandits">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1.5">Select Event</label>
                    <select name="event_id" required class="w-full px-4 py-3 rounded-xl bg-surface-900/50 border border-white/10 text-white text-sm focus:outline-none focus:border-nexus-400/50 transition-all">
                        <option value="">Choose an event...</option>
                        <?php foreach ($teamEvents as $evt): ?>
                            <option value="<?php echo $evt['event_id']; ?>"><?php echo htmlspecialchars($evt['event_name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <button type="submit" class="w-full py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all">
                    Create Team
                </button>
            </form>
        </div>
    </div>

    <!-- Join Team Modal -->
    <div x-show="showJoin" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showJoin = false"></div>
        <div class="relative w-full max-w-md p-6 rounded-2xl bg-surface-800 border border-white/10 shadow-2xl animate-scale-in">
            <div class="flex items-center justify-between mb-5">
                <h3 class="text-lg font-bold text-white">Join a Team</h3>
                <button @click="showJoin = false" class="text-gray-500 hover:text-white transition-colors">
                    <i data-lucide="x" size="20"></i>
                </button>
            </div>
            
            <form action="teams.php" method="POST" class="space-y-4">
                <input type="hidden" name="action" value="join">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1.5">Invite Code</label>
                    <input type="text" name="invite_code" required class="w-full px-4 py-3 rounded-xl bg-surface-900/50 border border-white/10 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-nexus-400/50 transition-all uppercase" placeholder="XX-XXXXXX">
                </div>
                <button type="submit" class="w-full py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all">
                    Join Team
                </button>
            </form>
        </div>
    </div>
</div>

<!-- Add AlpineJS for simple modal toggles, since inline React states are gone -->
<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
