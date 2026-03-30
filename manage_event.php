<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

if ($_SESSION['role'] !== 'coordinator' && $_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'super_admin') {
    header("Location: dashboard.php");
    exit;
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-7xl mx-auto space-y-6 px-6 py-10 pb-20" x-data="coordinatorEventsApp()">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-surface-800 border border-white/5 shadow-xl animate-slide-up">
        <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-3">
                <i data-lucide="calendar" class="text-indigo-400" size="28"></i> My Assigned Events
            </h1>
            <p class="text-gray-400 text-sm mt-1">Manage check-ins, status updates, and results for your events.</p>
        </div>
        
        <div class="relative w-full md:w-64">
            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size="16"></i>
            <input 
                x-model="search"
                placeholder="Search your events..."
                class="w-full pl-10 pr-4 py-2 bg-surface-900 border border-indigo-500/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
        </div>
    </div>

    <div x-show="loading" class="flex justify-center py-32">
        <i data-lucide="loader-2" class="animate-spin text-indigo-500" size="48"></i>
    </div>

    <template x-if="!loading && filteredEvents.length === 0">
        <div class="p-20 text-center bg-surface-800/40 rounded-3xl border border-white/5 border-dashed animate-slide-up" style="animation-delay: 0.1s">
            <i data-lucide="calendar" class="mx-auto text-gray-600 mb-4" size="48"></i>
            <h3 class="text-lg font-bold text-white">No Assigned Events Found</h3>
            <p class="text-gray-500 mt-2">Only events assigned to your ID will appear here.</p>
        </div>
    </template>

    <div x-show="!loading && filteredEvents.length > 0" class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 animate-slide-up" style="animation-delay: 0.1s">
        <template x-for="evt in filteredEvents" :key="evt.event_id">
            <div class="bg-surface-800 border border-white/5 rounded-3xl overflow-hidden shadow-lg hover:border-indigo-500/20 transition-all flex flex-col">
                <!-- Event Header -->
                <div class="p-6 pb-4 border-b border-white/5 relative">
                    <div class="flex justify-between items-start mb-4">
                        <span :class="`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            evt.status === 'published' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            evt.status === 'ongoing' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' :
                            evt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-gray-500/10 text-gray-400 border-white/10'
                        }`" x-text="evt.status"></span>
                        
                        <div class="text-right text-xs text-gray-500 flex items-center gap-1">
                            <i data-lucide="clock" size="12"></i> 
                            <span x-text="new Date(evt.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })"></span>
                        </div>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2 leading-tight" x-text="evt.event_name"></h3>
                    <div class="flex items-center gap-2 text-[10px] text-gray-400">
                        <i data-lucide="map-pin" size="10" class="text-indigo-400"></i>
                        <span x-text="evt.venue_name || 'No Venue Set'"></span>
                    </div>
                </div>

                <!-- Stats & Actions -->
                <div class="p-6 flex-1 space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <button @click="openRegistrations(evt.event_id)" class="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-900 border border-white/5 hover:border-indigo-500/20 transition-all group">
                            <i data-lucide="users" size="18" class="text-gray-500 group-hover:text-indigo-400 mb-1.5 transition-colors"></i>
                            <span class="text-[10px] font-bold text-white" x-text="evt.registered_count || 0"></span>
                            <span class="text-[8px] font-bold text-gray-600 uppercase">Participants</span>
                        </button>
                        <a href="scanner.php" class="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-900 border border-white/5 hover:border-indigo-500/20 transition-all group">
                            <i data-lucide="scan-line" size="18" class="text-gray-500 group-hover:text-indigo-400 mb-1.5 transition-colors"></i>
                            <span class="text-[10px] font-bold text-white">Scanner</span>
                            <span class="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Attendance</span>
                        </a>
                    </div>

                    <!-- Quick Status Control -->
                    <div class="space-y-2">
                        <div class="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Mark Status</div>
                        <div class="flex gap-2">
                            <template x-if="evt.status === 'published'">
                                <button @click="updateEventStatus(evt.event_id, 'ongoing')" class="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg transition-colors">START EVENT</button>
                            </template>
                            <template x-if="evt.status === 'ongoing'">
                                <button @click="updateEventStatus(evt.event_id, 'completed')" class="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors">FINISH EVENT</button>
                            </template>
                            <template x-if="evt.status === 'completed'">
                                <div class="flex-1 py-2 bg-emerald-500/10 text-emerald-400 text-center text-[10px] font-bold rounded-lg border border-emerald-500/20">EVENT COMPLETED</div>
                            </template>
                        </div>
                    </div>
                </div>

                <div class="p-4 bg-white/2 border-t border-white/5">
                    <a href="results_submit.php" class="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl border border-indigo-500/20 flex items-center justify-center gap-2 transition-all">
                        <i data-lucide="trophy" size="14"></i> Enter Final Results
                    </a>
                </div>
            </div>
        </template>
    </div>

    <!-- Participants Modal -->
    <div x-show="showRegsModal" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-surface-800 w-full max-w-4xl max-h-[85vh] rounded-3xl border border-white/10 flex flex-col shadow-2xl animate-scale-in">
            <div class="p-6 border-b border-white/5 flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">Participant List</h2>
                    <p class="text-gray-500 text-xs">Verify names and attendance for the event.</p>
                </div>
                <button @click="showRegsModal = false" class="p-2 hover:bg-white/5 rounded-lg text-gray-400"><i data-lucide="x" size="20"></i></button>
            </div>

            <div class="flex-1 overflow-y-auto p-6">
                <template x-if="loadingRegs">
                    <div class="flex justify-center py-20"><i data-lucide="loader-2" class="animate-spin text-indigo-500" size="40"></i></div>
                </template>
                
                <template x-if="!loadingRegs && registrations.length === 0">
                    <p class="text-center py-20 text-gray-500">No participants registered yet.</p>
                </template>
                
                <template x-if="!loadingRegs && registrations.length > 0">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <template x-for="r in registrations" :key="r.registration_id">
                            <div class="p-4 rounded-2xl bg-surface-900 border border-white/5 flex items-center justify-between group">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs" x-text="`${(r.first_name||'')[0]||''}${(r.last_name||'')[0]||''}`">
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-white" x-text="`${r.first_name} ${r.last_name}`"></p>
                                        <p class="text-[10px] text-gray-500" x-text="r.email"></p>
                                        <p class="text-[10px] text-indigo-400 font-bold mt-0.5" x-text="r.college_name"></p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <template x-if="r.status === 'checked_in'">
                                        <div class="flex items-center gap-2">
                                            <div class="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                                                <i data-lucide="check-circle" size="12"></i> CHECKED IN
                                            </div>
                                            <button @click="handleUndoCheckIn(r.registration_id)" class="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all" title="Cancel Check-in">
                                                <i data-lucide="x" size="14"></i>
                                            </button>
                                        </div>
                                    </template>
                                    <template x-if="r.status !== 'checked_in'">
                                        <button @click="handleManualCheckIn(r.registration_id)" class="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 transition-all">
                                            CHECK IN
                                        </button>
                                    </template>
                                </div>
                            </div>
                        </template>
                    </div>
                </template>
            </div>

            <div class="p-6 border-t border-white/5 bg-white/2 rounded-b-3xl">
                <button @click="showRegsModal = false" class="w-full py-3 bg-surface-700 hover:bg-surface-600 text-white text-sm font-bold rounded-2xl transition">Close Modal</button>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script>
document.addEventListener('alpine:init', () => {
    Alpine.data('coordinatorEventsApp', () => ({
        events: [],
        loading: true,
        selectedEventId: null,
        registrations: [],
        loadingRegs: false,
        showRegsModal: false,
        search: '',
        userId: <?php echo json_encode($_SESSION['user_id']); ?>,

        get filteredEvents() {
            if (this.search === '') return this.events;
            const searchLower = this.search.toLowerCase();
            return this.events.filter(e => e.event_name.toLowerCase().includes(searchLower));
        },

        async init() {
            try {
                const res = await fetch('api/index.php/api/v1/events');
                const data = await res.json();
                const allEvts = data.data || [];
                // Only show events where coordinator_id matches logged in user
                this.events = allEvts.filter(e => Number(e.coordinator_id) === Number(this.userId));
            } catch (err) {
                console.error(err);
            } finally {
                this.loading = false;
                setTimeout(() => lucide.createIcons(), 50);
            }
        },

        async openRegistrations(eventId) {
            this.selectedEventId = eventId;
            this.showRegsModal = true;
            this.loadingRegs = true;
            try {
                const res = await fetch(`api/index.php/api/v1/event/${eventId}/registrations`, {
                    headers: { 'Authorization': `Bearer ${window.NEXUS_TOKEN}` }
                });
                const data = await res.json();
                this.registrations = data.data || [];
            } catch (err) {
                console.error(err);
                this.registrations = [];
            } finally {
                this.loadingRegs = false;
                setTimeout(() => lucide.createIcons(), 50);
            }
        },

        async updateEventStatus(eventId, newStatus) {
            try {
                const res = await fetch(`api/index.php/api/v1/admin/events/${eventId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${window.NEXUS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                if (!res.ok) throw new Error('Failed to update status');
                
                this.events = this.events.map(e => e.event_id === eventId ? { ...e, status: newStatus } : e);
            } catch (err) {
                alert('Failed to update status');
            }
        },

        async handleManualCheckIn(regId) {
            try {
                const res = await fetch('api/index.php/api/v1/attendance/manual', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${window.NEXUS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        event_id: this.selectedEventId,
                        registration_id: regId
                    })
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Manual check-in failed');
                }
                
                this.registrations = this.registrations.map(r => r.registration_id === regId ? { ...r, status: 'checked_in' } : r);
                setTimeout(() => lucide.createIcons(), 50);
            } catch (err) {
                alert(err.message);
            }
        },

        async handleUndoCheckIn(regId) {
            if (!confirm("Are you sure you want to UNDO this check-in?")) return;
            try {
                /*
                // Depends on endpoint existence in backend, if no undo endpoint exists in PHP API, this will just throw.
                // Assuming `/attendance/undo` exists as per React UI API definition.
                */
                const res = await fetch('api/index.php/api/v1/attendance/undo', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${window.NEXUS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        event_id: this.selectedEventId,
                        registration_id: regId
                    })
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Undo failed');
                }
                
                this.registrations = this.registrations.map(r => r.registration_id === regId ? { ...r, status: 'confirmed' } : r);
                setTimeout(() => lucide.createIcons(), 50);
            } catch (err) {
                alert(err.message || 'Undo failed');
            }
        }
    }));
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
