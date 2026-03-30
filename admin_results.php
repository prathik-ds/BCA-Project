<?php
require_once __DIR__ . '/includes/config.php';
requireLogin();

// ensure admin
if (!in_array($_SESSION['role'], ['admin', 'super_admin'])) {
    header("Location: dashboard.php");
    exit;
}

$db = getDB();
$stmt = $db->query("SELECT event_id, event_name FROM events ORDER BY event_name ASC");
$events = $stmt->fetchAll(PDO::FETCH_ASSOC);

require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-4xl mx-auto space-y-6 px-6 py-10" x-data="adminResultsApp()">
    <h1 class="text-3xl font-bold text-white flex items-center gap-3 animate-slide-up">
        <i data-lucide="shield-check" class="text-amber-400" size="28"></i> Update Results
    </h1>

    <!-- Event Selector -->
    <div class="animate-slide-up" style="animation-delay: 0.1s">
        <label class="block text-gray-400 text-sm mb-2">Select Event</label>
        <select x-model="selectedEvent" @change="selectEvent"
            class="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition">
            <option value="">-- Choose an event --</option>
            <?php foreach ($events as $evt): ?>
                <option value="<?php echo $evt['event_id']; ?>"><?php echo htmlspecialchars($evt['event_name']); ?></option>
            <?php endforeach; ?>
        </select>
    </div>

    <!-- Assignment Card -->
    <div x-show="selectedEvent" style="display: none;" class="p-6 bg-surface-800/50 rounded-2xl border border-white/5 space-y-5 animate-slide-up" style="animation-delay: 0.2s">
        <h2 class="text-lg font-bold text-white">Assign Winners</h2>
        
        <div x-show="loadingRegs" class="flex justify-center py-8">
            <i data-lucide="loader-2" class="animate-spin text-amber-500" size="32"></i>
        </div>

        <div x-show="!loadingRegs && registrations.length === 0" class="text-gray-500">
            No registrations found for this event.
        </div>

        <div x-show="!loadingRegs && registrations.length > 0" class="space-y-4">
            
            <template x-for="(pos, i) in ['first', 'second', 'third']" :key="pos">
                <div>
                    <label class="block text-gray-400 text-sm mb-1.5" x-text="`${i+1}${['st','nd','rd'][i]} Place`"></label>
                    <select x-model="winners[pos]"
                        class="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition">
                        <option value="">-- Select participant --</option>
                        <template x-for="r in registrations" :key="r.user_id || _r.registration_id">
                            <option :value="r.user_id" x-text="`${r.first_name} ${r.last_name} (${r.email})`"></option>
                        </template>
                    </select>
                </div>
            </template>

            <div x-show="message" x-text="message"
                :class="`p-3 rounded-xl text-sm ${message.includes('success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`">
            </div>

            <button @click="handleSubmitResults" :disabled="saving"
                class="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <template x-if="saving">
                    <i data-lucide="loader-2" size="16" class="animate-spin"></i>
                </template>
                <span x-text="saving ? 'Saving...' : 'Save Results'"></span>
            </button>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script>
document.addEventListener('alpine:init', () => {
    Alpine.data('adminResultsApp', () => ({
        selectedEvent: '',
        loadingRegs: false,
        registrations: [],
        winners: { first: '', second: '', third: '' },
        saving: false,
        message: '',

        async selectEvent() {
            this.message = '';
            this.winners = { first: '', second: '', third: '' };
            if (!this.selectedEvent) {
                this.registrations = [];
                return;
            }
            this.loadingRegs = true;
            try {
                // Fetch registrations for the event
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
                // Re-initialize lucide icons if needed
                setTimeout(() => lucide.createIcons(), 50);
            }
        },

        async handleSubmitResults() {
            if (!this.winners.first) {
                this.message = 'Please select at least a 1st place winner';
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
                    throw new Error(responseData.message || 'Failed to save results');
                }
                
                this.message = 'Results saved successfully!';
            } catch (err) {
                this.message = err.message || 'Failed to save results';
            } finally {
                this.saving = false;
            }
        }
    }))
})
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
