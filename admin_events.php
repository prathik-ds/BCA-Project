<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

// Restricted to Admin
if ($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'super_admin') {
    header("Location: dashboard.php");
    exit;
}

$db = getDB();
$error = '';
$success = '';

// Handle Event CRUD
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    $eventId = (int)($_POST['event_id'] ?? 0);

    try {
        if ($action === 'save') {
           $name = trim($_POST['event_name']);
           $desc = trim($_POST['description']);
           $catId = (int)$_POST['category_id'];
           $type = $_POST['event_type'];
           $scope = $_POST['scope'];
           $start = $_POST['start_datetime'];
           $end = $_POST['end_datetime'];
           $fee = (float)$_POST['entry_fee'];
           $max = (int)$_POST['max_participants'];
           $status = $_POST['status'];
           $coordId = $_POST['coordinator_id'] ? (int)$_POST['coordinator_id'] : null;

           if ($eventId > 0) {
               $stmt = $db->prepare("
                   UPDATE events 
                   SET event_name = :name, description = :desc, category_id = :cat, event_type = :type,
                       scope = :scope, start_datetime = :start, end_datetime = :end, entry_fee = :fee,
                       max_participants = :max, status = :status, coordinator_id = :coord
                   WHERE event_id = :id
               ");
               $stmt->execute([
                   ':name' => $name, ':desc' => $desc, ':cat' => $catId, ':type' => $type,
                   ':scope' => $scope, ':start' => $start, ':end' => $end, ':fee' => $fee,
                   ':max' => $max, ':status' => $status, ':coord' => $coordId, ':id' => $eventId
               ]);
               $success = "Event updated successfully!";
           } else {
               $stmt = $db->prepare("
                   INSERT INTO events (event_name, description, category_id, event_type, scope, start_datetime, end_datetime, entry_fee, max_participants, status, coordinator_id)
                   VALUES (:name, :desc, :cat, :type, :scope, :start, :end, :fee, :max, :status, :coord)
               ");
               $stmt->execute([
                   ':name' => $name, ':desc' => $desc, ':cat' => $catId, ':type' => $type,
                   ':scope' => $scope, ':start' => $start, ':end' => $end, ':fee' => $fee,
                   ':max' => $max, ':status' => $status, ':coord' => $coordId
               ]);
               $success = "New event created successfully!";
           }
        } elseif ($action === 'delete') {
            $db->prepare("DELETE FROM events WHERE event_id = :id")->execute([':id' => $eventId]);
            $success = "Event deleted successfully!";
        }
    } catch (Exception $e) {
        $error = "Operation failed: " . $e->getMessage();
    }
}

// Fetch Events
$stmt = $db->query("
    SELECT e.*, c.category_name, u.first_name as coord_first, u.last_name as coord_last,
           (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.event_id AND r.status != 'cancelled') AS registered_count 
    FROM events e 
    LEFT JOIN event_categories c ON e.category_id = c.category_id 
    LEFT JOIN users u ON e.coordinator_id = u.user_id 
    ORDER BY e.created_at DESC
");
$events = $stmt->fetchAll();

// Fetch Categories & Coordinators for the form
$categories = $db->query("SELECT * FROM event_categories ORDER BY display_order ASC")->fetchAll();
$coordinators = $db->query("SELECT user_id, first_name, last_name FROM users WHERE role = 'coordinator' ORDER BY first_name ASC")->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-7xl mx-auto px-6 py-12 space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-up">
        <div>
            <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                <i data-lucide="calendar" class="text-amber-400" size="28"></i> Event Control
            </h1>
            <p class="text-gray-500 text-sm mt-1"><?php echo count($events); ?> events managed</p>
        </div>
        <button onclick="openModal()" class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-2xl hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:scale-105 transition-all">
            <i data-lucide="plus" size="20"></i> Create New Event
        </button>
    </div>

    <?php if ($error): ?>
        <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-shake">
            <?php echo htmlspecialchars($error); ?>
        </div>
    <?php endif; ?>
    <?php if ($success): ?>
        <div class="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm animate-slide-up">
            <?php echo htmlspecialchars($success); ?>
        </div>
    <?php endif; ?>

    <div class="bg-surface-800/50 rounded-3xl border border-white/5 overflow-hidden animate-slide-up" style="animation-delay: 0.1s">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-surface-900/50 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                        <th class="px-8 py-5">Event Details</th>
                        <th class="px-8 py-5">Date & Time</th>
                        <th class="px-8 py-5 text-center">Registrations</th>
                        <th class="px-8 py-5">Status</th>
                        <th class="px-8 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <?php if (empty($events)): ?>
                        <tr><td colspan="5" class="px-8 py-20 text-center text-gray-600">No events found. Start by creating one!</td></tr>
                    <?php else: ?>
                        <?php foreach ($events as $e): 
                            $date = new DateTime($e['start_datetime']);
                        ?>
                            <tr class="hover:bg-white/[0.02] transition-colors group">
                                <td class="px-8 py-5">
                                    <div class="font-bold text-white group-hover:text-amber-400 transition-colors"><?php echo htmlspecialchars($e['event_name']); ?></div>
                                    <div class="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                                        <?php echo htmlspecialchars($e['category_name']); ?> • <?php echo ucfirst($e['event_type']); ?>
                                    </div>
                                </td>
                                <td class="px-8 py-5">
                                    <div class="text-sm font-medium text-gray-300"><?php echo $date->format('d M, Y'); ?></div>
                                    <div class="text-xs text-gray-600"><?php echo $date->format('h:i A'); ?></div>
                                </td>
                                <td class="px-8 py-5 text-center">
                                    <div class="text-lg font-bold text-white"><?php echo $e['registered_count']; ?></div>
                                    <div class="text-[10px] text-gray-600 font-bold uppercase tracking-widest">/ <?php echo $e['max_participants']; ?></div>
                                </td>
                                <td class="px-8 py-5">
                                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest 
                                        <?php echo $e['status'] === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'; ?>">
                                        <?php echo $e['status']; ?>
                                    </span>
                                </td>
                                <td class="px-8 py-5 text-right">
                                    <div class="flex justify-end gap-2">
                                        <button onclick='openModal(<?php echo json_encode($e); ?>)' class="p-2.5 rounded-xl bg-surface-700 hover:bg-amber-500/10 hover:text-amber-400 text-gray-500 transition-all">
                                            <i data-lucide="edit-2" size="16"></i>
                                        </button>
                                        <form action="admin_events.php" method="POST" class="inline" onsubmit="return confirm('Delete this event? This cannot be undone.')">
                                            <input type="hidden" name="action" value="delete">
                                            <input type="hidden" name="event_id" value="<?php echo $e['event_id']; ?>">
                                            <button type="submit" class="p-2.5 rounded-xl bg-surface-700 hover:bg-red-500/10 hover:text-red-400 text-gray-500 transition-all">
                                                <i data-lucide="trash-2" size="16"></i>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Event Modal -->
<div id="event-modal" class="hidden fixed inset-0 z-[100] bg-surface-900/90 backdrop-blur-sm flex items-center justify-center p-6">
    <div class="bg-surface-800 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
        <div class="p-8 border-b border-white/5 flex items-center justify-between bg-surface-900/50">
            <h2 id="modal-title" class="text-xl font-bold text-white">Create New Event</h2>
            <button onclick="closeModal()" class="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all"><i data-lucide="x" size="20"></i></button>
        </div>
        
        <form action="admin_events.php" method="POST" id="event-form" class="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="event_id" id="form-id" value="">
            
            <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Event Name</label>
                <input type="text" name="event_name" id="form-name" required class="w-full bg-surface-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-amber-400 outline-none transition-all">
            </div>

            <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Description</label>
                <textarea name="description" id="form-desc" rows="3" required class="w-full bg-surface-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-amber-400 outline-none transition-all resize-none"></textarea>
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                <select name="category_id" id="form-cat" class="w-full bg-surface-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-amber-400 outline-none cursor-pointer">
                    <?php foreach ($categories as $cat): ?>
                        <option value="<?php echo $cat['category_id']; ?>"><?php echo htmlspecialchars($cat['category_name']); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Coordinator</label>
                <select name="coordinator_id" id="form-coord" class="w-full bg-surface-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-amber-400 outline-none cursor-pointer">
                    <option value="">-- No Coordinator --</option>
                    <?php foreach ($coordinators as $c): ?>
                        <option value="<?php echo $c['user_id']; ?>"><?php echo htmlspecialchars($c['first_name'] . ' ' . $c['last_name']); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Start Time</label>
                <input type="datetime-local" name="start_datetime" id="form-start" required class="w-full bg-surface-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-amber-400 outline-none transition-all">
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">End Time</label>
                <input type="datetime-local" name="end_datetime" id="form-end" required class="w-full bg-surface-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-amber-400 outline-none transition-all">
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Entry Fee (₹)</label>
                <input type="number" name="entry_fee" id="form-fee" value="0" min="0" class="w-full bg-surface-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-amber-400 outline-none transition-all">
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Max Slack</label>
                <input type="number" name="max_participants" id="form-max" value="100" min="1" class="w-full bg-surface-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-amber-400 outline-none transition-all">
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Type</label>
                <select name="event_type" id="form-type" class="w-full bg-surface-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-amber-400 outline-none">
                    <option value="solo">Solo</option>
                    <option value="team">Team</option>
                </select>
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Status</label>
                <select name="status" id="form-status" class="w-full bg-surface-900 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-amber-400 outline-none">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <div class="md:col-span-2 pt-6 flex gap-4">
                <button type="button" onclick="closeModal()" class="flex-1 py-4 bg-surface-900 text-gray-500 rounded-2xl font-black hover:text-white transition-all">Cancel</button>
                <button type="submit" class="flex-1 py-4 bg-white text-surface-900 rounded-2xl font-black hover:bg-amber-400 hover:text-white transition-all">Save Event</button>
            </div>
        </form>
    </div>
</div>

<script>
function openModal(e = null) {
    const modal = document.getElementById('event-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('event-form');
    
    if (e) {
        title.innerText = "Edit Event: " + e.event_name;
        document.getElementById('form-id').value = e.event_id;
        document.getElementById('form-name').value = e.event_name;
        document.getElementById('form-desc').value = e.description;
        document.getElementById('form-cat').value = e.category_id;
        document.getElementById('form-coord').value = e.coordinator_id || "";
        document.getElementById('form-start').value = e.start_datetime.replace(' ', 'T').substring(0, 16);
        document.getElementById('form-end').value = e.end_datetime.replace(' ', 'T').substring(0, 16);
        document.getElementById('form-fee').value = e.entry_fee;
        document.getElementById('form-max').value = e.max_participants;
        document.getElementById('form-type').value = e.event_type;
        document.getElementById('form-status').value = e.status;
    } else {
        title.innerText = "Create New Event";
        form.reset();
        document.getElementById('form-id').value = "";
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('event-modal').classList.add('hidden');
}
</script>

<style>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
</style>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
