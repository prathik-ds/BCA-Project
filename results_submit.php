<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

if ($_SESSION['role'] !== 'coordinator' && $_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'super_admin') {
    header("Location: dashboard.php");
    exit;
}

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-4xl mx-auto space-y-6 px-6 py-10" x-data="resultsSubmitApp()">
    <div class="flex flex-col gap-2 p-8 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 mb-8 animate-slide-up">
        <h1 class="text-3xl font-bold text-white flex items-center gap-3">
            <i data-lucide="trophy" class="text-amber-500" size="32"></i> Official Proclamation
        </h1>
        <p class="text-gray-400 text-sm">Assign positions for your assigned event. This will update the leaderboard and trigger certificate generation for winners.</p>
    </div>

    <div :class="selectedEvent ? 'opacity-100 transition-all duration-500 transform translate-y-0' : 'opacity-80'" class="animate-slide-up" style="animation-delay: 0.1s">
        <label class="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Event Select</label>
        <select x-model="selectedEvent" @change="selectEvent"
            class="w-full bg-surface-800 border-2 border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500/40 transition-all">
            <option value="">-- Choose an event --</option>
            <template x-for="e in events" :key="e.event_id">
                <option :value="e.event_id" x-text="`${e.event_name} (${e.status})`"></option>
            </template>
        </select>
    </div>

    <div x-show="selectedEvent" style="display: none;" class="p-8 bg-surface-800/60 rounded-3xl border border-white/5 space-y-8 animate-scale-in">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">The Podium Select</h2>
        
        <div x-show="loadingRegs" class="flex justify-center py-12">
            <i data-lucide="loader-2" class="animate-spin text-indigo-500" size="40"></i>
        </div>
        
        <div x-show="!loadingRegs && registrations.length === 0" class="text-center py-12 bg-white/2 rounded-2xl border border-dashed border-white/10">
            <i data-lucide="alert-circle" class="mx-auto text-gray-600 mb-2" size="32"></i>
            <p class="text-gray-500 font-medium text-sm">No regular participants detected. Results cannot be declared without players.</p>
        </div>
        
        <div x-show="!loadingRegs && registrations.length > 0" class="space-y-6">
            <template x-for="posObj in podiumInfo" :key="posObj.pos">
                <div :class="`p-4 rounded-2xl border bg-surface-900 shadow-xl ${posObj.border}`">
                    <label :class="`block text-[10px] font-black tracking-widest uppercase mb-2 ${posObj.color}`" x-text="posObj.label"></label>
                    <select x-model="winners[posObj.pos]"
                        class="w-full bg-transparent text-white font-bold outline-none text-sm transition appearance-none cursor-pointer">
                        <option value="" class="bg-surface-900 text-gray-400">-- SELECT WINNER --</option>
                        <template x-for="r in registrations" :key="r.registration_id">
                            <option :value="r.user_id" class="bg-surface-900" x-text="`${r.first_name} ${r.last_name||''} (${r.college_code||''})`"></option>
                        </template>
                    </select>
                </div>
            </template>

            <div x-show="message" style="display: none;" :class="`p-5 rounded-2xl text-sm font-bold flex items-center gap-3 ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`">
                <i :data-lucide="message.includes('success') ? 'check-circle' : 'alert-circle'" size="20"></i>
                <span x-text="message"></span>
            </div>

            <button @click="handleSubmitResults" :disabled="saving"
                class="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                <template x-if="saving">
                    <i data-lucide="loader-2" size="18" class="animate-spin"></i>
                </template>
                <span x-text="saving ? 'TRANSMITTING...' : 'OFFICIAL SUBMIT RESULT'"></span>
            </button>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script>
document.addEventListener('alpine:init', () => {
    Alpine.data('resultsSubmitApp', () => ({
        events: [],
        loading: true,
        selectedEvent: '',
        registrations: [],
        loadingRegs: false,
        winners: { first: '', second: '', third: '' },
        saving: false,
        message: '',
        userId: <?php echo json_encode($_SESSION['user_id']); ?>,
        podiumInfo: [
            { pos: 'first', label: '1st PLACE — CHAMPION', color: 'text-amber-400', border: 'border-amber-400/20' },
            { pos: 'second', label: '2nd PLACE — RUNNER UP', color: 'text-gray-300', border: 'border-gray-300/20' },
            { pos: 'third', label: '3rd PLACE — SECOND RUNNER UP', color: 'text-orange-400', border: 'border-orange-400/20' }
        ],

        async init() {
            try {
                const res = await fetch('api/index.php/api/v1/events');
                const data = await res.json();
                const allEvts = data.data || [];
                // Only show events mapped to this coordinator
                this.events = allEvts.filter(e => Number(e.coordinator_id) === Number(this.userId));
            } catch (err) {
                console.error(err);
            } finally {
                this.loading = false;
                setTimeout(() => lucide.createIcons(), 50);
            }
        },

        async selectEvent() {
            this.message = '';
            this.winners = { first: '', second: '', third: '' };
            if (!this.selectedEvent) {
                this.registrations = [];
                return;
            }
            this.loadingRegs = true;
            try {
                const res = await fetch(`api/index.php/api/v1/event/${this.selectedEvent}/registrations`, {
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

        async handleSubmitResults() {
            if (!this.winners.first) {
                this.message = 'Please select at least a 1st place winner';
                setTimeout(() => lucide.createIcons(), 50);
                return;
            }
            this.saving = true;
            this.message = '';
            
            try {
                const winnersArray = [];
                if (this.winners.first) winnersArray.push({ user_id: parseInt(this.winners.first), position: 'first' });
                if (this.winners.second) winnersArray.push({ user_id: parseInt(this.winners.second), position: 'second' });
                if (this.winners.third) winnersArray.push({ user_id: parseInt(this.winners.third), position: 'third' });
                
                const res = await fetch('api/index.php/api/v1/results', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${window.NEXUS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        event_id: parseInt(this.selectedEvent),
                        winners: winnersArray
                    })
                });
                
                const responseData = await res.json();
                
                if (!res.ok) {
                    throw new Error(responseData.message || 'Failed to submit results');
                }
                
                this.message = 'Results submitted successfully! Total 3 winners updated.';
            } catch (err) {
                this.message = err.message || 'Failed to submit results';
            } finally {
                this.saving = false;
                setTimeout(() => lucide.createIcons(), 50);
            }
        }
    }));
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
