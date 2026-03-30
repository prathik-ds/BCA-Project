<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

// Restricted to Coordinators & Admins
if (!in_array($_SESSION['role'], ['coordinator', 'admin', 'super_admin'])) {
    header("Location: dashboard.php");
    exit;
}

$db = getDB();

// Fetch events for selection
$stmt = $db->query("SELECT event_id, event_name, venue_name, registered_count FROM events WHERE status = 'published' ORDER BY start_datetime ASC");
$events = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<!-- Include html5-qrcode library -->
<script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>

<div class="max-w-5xl mx-auto px-6 py-12 space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-up">
        <div>
            <h1 class="text-2xl font-bold font-display text-white">QR Attendance Scanner</h1>
            <p class="text-sm text-gray-500 mt-1">Select an event and scan participant QR codes</p>
        </div>
        <div id="connection-status" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/20">
            <i data-lucide="wifi" size="12" class="text-green-400"></i>
            <span class="text-xs text-green-400 font-medium">Online</span>
        </div>
    </div>

    <!-- Event Selector -->
    <div class="relative z-30 animate-slide-up" style="animation-delay: 0.1s">
        <select id="event-selector" onchange="handleEventSelect(this.value)" class="w-full p-4 rounded-2xl bg-surface-700/30 border border-white/10 text-white font-bold focus:outline-none focus:border-nexus-400 appearance-none cursor-pointer">
            <option value="">-- Select Event to Start Scanning --</option>
            <?php foreach ($events as $evt): ?>
                <option value="<?php echo $evt['event_id']; ?>" data-name="<?php echo htmlspecialchars($evt['event_name']); ?>" data-total="<?php echo $evt['registered_count']; ?>">
                    <?php echo htmlspecialchars($evt['event_name']); ?> (<?php echo $evt['registered_count']; ?> Registered)
                </option>
            <?php endforeach; ?>
        </select>
        <i data-lucide="chevron-down" size="18" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"></i>
    </div>

    <!-- Scanner Interface (Initially Hidden) -->
    <div id="scanner-interface" class="hidden grid lg:grid-cols-5 gap-8">
        <!-- Left: Scanner View (3 columns) -->
        <div class="lg:col-span-3 space-y-6">
            <div class="relative rounded-3xl overflow-hidden bg-surface-800 border border-white/10 aspect-[4/3] shadow-2xl">
                <div id="reader" class="w-full h-full"></div>
                
                <!-- Feedback Overlay -->
                <div id="scan-feedback" class="hidden absolute top-4 left-4 right-4 p-5 rounded-2xl backdrop-blur-xl border z-20 animate-slide-up">
                    <div class="flex items-center gap-4">
                        <div id="feedback-icon" class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"></div>
                        <div>
                            <div id="feedback-title" class="text-sm font-bold text-white"></div>
                            <div id="feedback-message" class="text-xs"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Manual Entry -->
            <div class="flex gap-3 animate-slide-up">
                <input type="text" id="manual-token" placeholder="Paste QR token manually..." 
                       class="flex-1 px-5 py-4 bg-surface-700/50 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-nexus-400">
                <button onclick="processScan(document.getElementById('manual-token').value)" class="px-8 py-4 bg-surface-700 hover:bg-surface-600 rounded-2xl text-white font-bold text-sm transition-all group">
                    Scan <i data-lucide="send" size="14" class="inline ml-1 group-hover:translate-x-1 transition-transform"></i>
                </button>
            </div>
            
            <button id="camera-ctrl" onclick="toggleCamera()" class="w-full py-4 rounded-2xl bg-gradient-to-r from-nexus-400 to-accent-500 text-white font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <i data-lucide="camera" size="20"></i> Start Camera
            </button>
        </div>

        <!-- Right: Stats & History (2 columns) -->
        <div class="lg:col-span-2 space-y-6">
            <div class="p-6 rounded-3xl bg-surface-700/30 border border-white/5 space-y-4 animate-slide-up" style="animation-delay: 0.2s">
                <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest">Attendance Progress</h3>
                <div class="flex items-end gap-2">
                    <span id="stat-count" class="text-4xl font-black font-display text-nexus-400">0</span>
                    <span id="stat-total" class="text-lg text-gray-600 font-bold pb-1">/ 0</span>
                </div>
                <div class="w-full h-2.5 bg-surface-900 rounded-full overflow-hidden">
                    <div id="stat-progress" class="h-full bg-gradient-to-r from-nexus-400 to-accent-500 rounded-full transition-all duration-700" style="width: 0%"></div>
                </div>
            </div>

            <div class="p-6 rounded-3xl bg-surface-700/30 border border-white/5 animate-slide-up" style="animation-delay: 0.3s">
                <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Recent Scans</h3>
                <div id="scan-history" class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <p class="text-xs text-gray-600 italic text-center py-8">Waiting for first scan...</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Empty State -->
    <div id="empty-state" class="text-center py-32 animate-slide-up">
        <div class="w-24 h-24 bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-600 border border-white/5">
            <i data-lucide="camera" size="48"></i>
        </div>
        <h2 class="text-xl font-bold text-gray-400">Camera Ready</h2>
        <p class="text-gray-500 mt-2 max-w-xs mx-auto">Please select an event from the list above to begin marking attendance.</p>
    </div>
</div>

<script>
let html5QrCode = null;
let selectedEventId = null;
let isScanning = false;
let stats = { checked_in: 0, total: 0 };

function handleEventSelect(id) {
    if (!id) {
        document.getElementById('scanner-interface').classList.add('hidden');
        document.getElementById('empty-state').classList.remove('hidden');
        return;
    }
    
    const option = document.querySelector(`#event-selector option[value="${id}"]`);
    selectedEventId = id;
    stats.total = parseInt(option.dataset.total);
    document.getElementById('stat-total').innerText = '/ ' + stats.total;
    
    document.getElementById('scanner-interface').classList.remove('hidden');
    document.getElementById('empty-state').classList.add('hidden');
    
    // Load existing stats for this event
    loadStats();
}

async function loadStats() {
    // In a real app, you'd fetch this via AJAX. Here we simulate it.
    // For now, keep it simple.
    updateStatsUI();
}

function updateStatsUI() {
    const pct = stats.total > 0 ? (stats.checked_in / stats.total) * 100 : 0;
    document.getElementById('stat-count').innerText = stats.checked_in;
    document.getElementById('stat-progress').style.width = pct + '%';
}

function toggleCamera() {
    if (isScanning) {
        stopCamera();
    } else {
        startCamera();
    }
}

function startCamera() {
    if (!selectedEventId) return alert("Select an event first!");
    
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
        processScan(decodedText);
    }).catch(err => {
        console.error(err);
        alert("Camera failed: " + err);
    });
    
    isScanning = true;
    document.getElementById('camera-ctrl').innerHTML = '<i data-lucide="camera-off" size="20"></i> Stop Camera';
    document.getElementById('camera-ctrl').classList.replace('from-nexus-400', 'from-red-500');
    lucide.createIcons();
}

function stopCamera() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            isScanning = false;
            document.getElementById('camera-ctrl').innerHTML = '<i data-lucide="camera" size="20"></i> Start Camera';
            document.getElementById('camera-ctrl').classList.replace('from-red-500', 'from-nexus-400');
            lucide.createIcons();
        });
    }
}

async function processScan(token) {
    if (!token) return;
    if (!selectedEventId) return alert("Select an event first!");

    // Feedback visual
    const feedback = document.getElementById('scan-feedback');
    const icon = document.getElementById('feedback-icon');
    const title = document.getElementById('feedback-title');
    const message = document.getElementById('feedback-message');

    try {
        const res = await apiFetch('/attendance/scan', {
            method: 'POST',
            body: JSON.stringify({ qr_token: token, event_id: selectedEventId })
        });

        feedback.classList.remove('hidden');
        if (res.status === 'success') {
            feedback.className = "absolute top-4 left-4 right-4 p-5 rounded-2xl backdrop-blur-xl border border-green-400/40 bg-green-900/90 z-20 animate-slide-up";
            icon.className = "w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-green-400 text-green-900";
            icon.innerHTML = '<i data-lucide="check" size="20"></i>';
            title.innerText = res.data.participant_name;
            message.className = "text-xs text-green-300";
            message.innerText = (res.data.check_type === 'check_in' ? 'Checked In Successfully' : 'Checked Out Successfully');
            
            stats.checked_in = res.data.event_total_checked_in || (stats.checked_in + 1);
            updateStatsUI();
            addToHistory(res.data.participant_name, true, res.data.check_type);
        } else {
            throw new Error(res.message || "Invalid QR Code");
        }
    } catch (err) {
        feedback.classList.remove('hidden');
        feedback.className = "absolute top-4 left-4 right-4 p-5 rounded-2xl backdrop-blur-xl border border-red-400/40 bg-red-900/90 z-20 animate-slide-up";
        icon.className = "w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-400 text-red-900";
        icon.innerHTML = '<i data-lucide="x" size="20"></i>';
        title.innerText = "Scan Failed";
        message.className = "text-xs text-red-300";
        message.innerText = err.message;
        addToHistory(token.substring(0,8) + '...', false);
    }
    
    lucide.createIcons();
    setTimeout(() => feedback.classList.add('hidden'), 3500);
}

function addToHistory(name, success, type = '') {
    const history = document.getElementById('scan-history');
    if (history.querySelector('p')) history.innerHTML = '';
    
    const div = document.createElement('div');
    div.className = `flex items-center gap-3 p-4 rounded-2xl border border-white/5 animate-slide-up ${success ? 'bg-surface-800/60' : 'bg-red-400/5 border-red-500/10'}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${success ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}">
            <i data-lucide="${success ? 'check-circle' : 'x-circle'}" size="16"></i>
        </div>
        <div class="flex-1 min-w-0">
            <div class="text-xs font-bold text-white truncate">${name}</div>
            <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">${success ? (type === 'check_in' ? 'Check In' : 'Check Out') : 'Error'}</div>
        </div>
        <div class="text-[10px] text-gray-600 font-bold">${time}</div>
    `;
    
    history.prepend(div);
    lucide.createIcons();
}
</script>

<style>
#reader {
    border: none !important;
}
#reader > div:first-child {
    display: none;
}
video {
    border-radius: 20px;
    object-fit: cover !important;
}
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
}
</style>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
