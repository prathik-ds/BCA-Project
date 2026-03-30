<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

if ($_SESSION['role'] !== 'coordinator' && $_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'super_admin') {
    header("Location: dashboard.php");
    exit;
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-7xl mx-auto space-y-8 px-6 py-10" x-data="coordinatorDashboardApp()">
    <!-- Welcome Section -->
    <div class="relative p-8 rounded-3xl bg-surface-800 border border-white/5 overflow-hidden animate-slide-up">
        <div class="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-500/5 blur-[80px]"></div>
        <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-2">
                <h1 class="text-3xl font-bold font-display text-white">Hello, <?php echo htmlspecialchars($_SESSION['first_name']); ?>!</h1>
                <p class="text-gray-400">Everything looks ready for your assigned events today.</p>
            </div>
            <div class="flex gap-4">
                <div class="px-5 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                    <div class="text-xs font-bold text-indigo-400 uppercase mb-1">My Events</div>
                    <div class="text-2xl font-bold text-white leading-none" x-text="stats.myEvents"></div>
                </div>
                <div class="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div class="text-xs font-bold text-emerald-400 uppercase mb-1">Participants</div>
                    <div class="text-2xl font-bold text-white leading-none" x-text="stats.totalParticipants"></div>
                </div>
            </div>
        </div>
    </div>

    <div x-show="loading" class="flex justify-center py-32">
        <i data-lucide="loader-2" class="animate-spin text-indigo-500" size="48"></i>
    </div>

    <!-- Quick Action Grid -->
    <div x-show="!loading" class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style="animation-delay: 0.1s">
        <a href="scanner.php" class="p-6 rounded-3xl bg-surface-800 border border-white/5 hover:border-white/10 transition-all group">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <i data-lucide="scan-line" size="22"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">Scan Participants</h3>
            <p class="text-xs text-gray-500 mb-4">Verify QR codes for attendance</p>
            <div class="flex items-center text-xs font-bold text-indigo-400 gap-1 group-hover:gap-2 transition-all">
                Go to Page <i data-lucide="arrow-right" size="14"></i>
            </div>
        </a>
        <a href="results_submit.php" class="p-6 rounded-3xl bg-surface-800 border border-white/5 hover:border-white/10 transition-all group">
            <div class="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <i data-lucide="trophy" size="22"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">Assign Winners</h3>
            <p class="text-xs text-gray-500 mb-4">Declare results for completed events</p>
            <div class="flex items-center text-xs font-bold text-indigo-400 gap-1 group-hover:gap-2 transition-all">
                Go to Page <i data-lucide="arrow-right" size="14"></i>
            </div>
        </a>
        <a href="manage_event.php" class="p-6 rounded-3xl bg-surface-800 border border-white/5 hover:border-white/10 transition-all group">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <i data-lucide="users" size="22"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">Verify List</h3>
            <p class="text-xs text-gray-500 mb-4">Manually check participant names</p>
            <div class="flex items-center text-xs font-bold text-indigo-400 gap-1 group-hover:gap-2 transition-all">
                Go to Page <i data-lucide="arrow-right" size="14"></i>
            </div>
        </a>
    </div>

    <!-- Lower Section Grid -->
    <div x-show="!loading" class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up" style="animation-delay: 0.2s">
        <!-- My Events Summary (Left 2/3) -->
        <div class="lg:col-span-2 space-y-6">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <i data-lucide="clock" size="20" class="text-indigo-400"></i> Live Event Monitoring
            </h2>
            
            <template x-if="assignedEvents.length === 0">
                <div class="p-12 text-center bg-surface-800/40 rounded-3xl border border-white/5 border-dashed">
                    <i data-lucide="alert-circle" class="mx-auto text-gray-600 mb-3" size="32"></i>
                    <p class="text-gray-500">No events assigned yet.</p>
                </div>
            </template>
            
            <template x-if="assignedEvents.length > 0">
                <div class="space-y-4">
                    <template x-for="evt in assignedEvents" :key="evt.event_id">
                        <div class="p-6 rounded-3xl bg-surface-800 border border-white/5 flex flex-col gap-4 hover:border-indigo-500/20 transition-colors">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs ring-4 ring-indigo-500/5" x-text="(evt.event_name || 'E')[0]">
                                    </div>
                                    <div>
                                        <h3 class="text-white font-bold" x-text="evt.event_name"></h3>
                                        <p class="text-[10px] text-gray-500 uppercase font-black tracking-widest" x-text="evt.venue_name || 'Main Hall'"></p>
                                    </div>
                                </div>
                                <span :class="`px-3 py-1 text-[10px] font-bold rounded-full border ${
                                    evt.status === 'published' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                    evt.status === 'ongoing' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`" x-text="evt.status?.toUpperCase() || ''">
                                </span>
                            </div>

                            <div class="space-y-2">
                                <div class="flex justify-between text-[10px] font-bold">
                                    <span class="text-gray-400 uppercase">Check-in Progress</span>
                                    <span class="text-white" x-text="`${parseInt(evt.registered_count) || 0} Total`"></span>
                                </div>
                                <div class="h-2 w-full bg-surface-900 rounded-full overflow-hidden border border-white/5">
                                    <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style="width: 65%"></div>
                                </div>
                            </div>

                            <div class="flex items-center justify-between pt-2">
                                <div class="flex -space-x-2">
                                    <template x-for="i in [1,2,3]" :key="i">
                                        <div class="w-6 h-6 rounded-full border-2 border-surface-800 bg-surface-700"></div>
                                    </template>
                                    <div class="w-6 h-6 rounded-full border-2 border-surface-800 bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold" x-text="`+${evt.registered_count || 0}`"></div>
                                </div>
                                <a href="manage_event.php" class="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">Manage Controls <i data-lucide="arrow-right" size="12"></i></a>
                            </div>
                        </div>
                    </template>
                </div>
            </template>
        </div>

        <!-- Coordinator Checklist (Right 1/3) -->
        <div class="space-y-6">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <i data-lucide="check-circle" size="20" class="text-emerald-400"></i> Tasks
            </h2>
            <div class="p-6 rounded-3xl bg-surface-800 border border-white/5 space-y-4">
                <template x-for="(task, i) in tasks" :key="i">
                    <div class="flex items-center gap-3 group cursor-pointer" @click="task.done = !task.done">
                        <div :class="`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${task.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/10 group-hover:border-indigo-500'}`">
                            <template x-if="task.done">
                                <i data-lucide="check-circle" size="12" class="text-white"></i>
                            </template>
                        </div>
                        <span :class="`text-sm transition-colors ${task.done ? 'text-gray-500 line-through' : 'text-gray-300'}`" x-text="task.label"></span>
                    </div>
                </template>
                <div class="pt-4 mt-4 border-t border-white/5">
                    <p class="text-[10px] text-gray-500 text-center italic">"Excellence is not an act, but a habit."</p>
                </div>
            </div>

            <div class="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><i data-lucide="siren" size="48"></i></div>
                <h4 class="text-sm font-bold text-indigo-400 mb-1">Need help?</h4>
                <p class="text-xs text-gray-500 mb-3 leading-relaxed">Contact your Department Head or the Admin team immediately for any venue issues.</p>
                <button class="w-full py-2 bg-indigo-500 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-colors">QUICK SUPPORT</button>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script>
document.addEventListener('alpine:init', () => {
    Alpine.data('coordinatorDashboardApp', () => ({
        assignedEvents: [],
        loading: true,
        stats: { myEvents: 0, totalParticipants: 0, activeEvents: 0 },
        userId: <?php echo json_encode($_SESSION['user_id']); ?>,
        tasks: [
            { label: 'Check venue readiness', done: true },
            { label: 'Verify sound system', done: true },
            { label: 'Commence QR scanning', done: false },
            { label: 'Start event on portal', done: false },
            { label: 'Declare final winners', done: false }
        ],

        async init() {
            try {
                const res = await fetch('api/index.php/api/v1/events');
                const data = await res.json();
                const allEvts = data.data || [];
                const myEvts = allEvts.filter(e => Number(e.coordinator_id) === Number(this.userId));
                
                this.assignedEvents = myEvts;
                this.stats = {
                    myEvents: myEvts.length,
                    totalParticipants: myEvts.reduce((sum, e) => sum + (parseInt(e.registered_count) || 0), 0),
                    activeEvents: myEvts.filter(e => e.status === 'published' || e.status === 'ongoing').length
                };
            } catch (err) {
                console.error(err);
            } finally {
                this.loading = false;
                setTimeout(() => lucide.createIcons(), 50);
            }
        }
    }));
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
