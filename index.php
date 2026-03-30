<?php
require_once __DIR__ . '/includes/header.php';

// Fetch stats for the counter section
$db = getDB();
$eventCount = $db->query("SELECT COUNT(*) FROM events")->fetchColumn();
$collegeCount = $db->query("SELECT COUNT(*) FROM colleges")->fetchColumn();
$participantCount = $db->query("SELECT COUNT(*) FROM users WHERE role = 'participant'")->fetchColumn();

// Fetch featured events
$featuredEvents = $db->query("
    SELECT e.*, c.category_name, v.venue_name 
    FROM events e 
    JOIN event_categories c ON e.category_id = c.category_id 
    LEFT JOIN venues v ON e.venue_id = v.venue_id
    WHERE e.status = 'published'
    ORDER BY e.start_datetime ASC
    LIMIT 6
")->fetchAll();
?>

<!-- Hero Section -->
<section class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
    <!-- Three.js Canvas Container -->
    <div id="hero-canvas-container" class="absolute inset-0 z-0 opacity-60"></div>

    <div class="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- Left: Text Content -->
        <div class="text-left" data-aos="fade-up">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nexus-400/10 border border-nexus-400/20 mb-8 backdrop-blur-sm">
                <i data-lucide="sparkles" size="14" class="text-nexus-400"></i>
                <span class="text-sm text-nexus-400 font-medium">April 15–17, 2026 • Pune, India</span>
            </div>

            <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black font-display mb-6 tracking-tight leading-[1.1]">
                <span class="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">Nexus</span>
                <span class="bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">Fest</span>
                <span class="block text-gray-500 mt-2 font-bold text-4xl lg:text-5xl italic opacity-50">Evolutionizing Fests.</span>
            </h1>

            <p class="text-lg text-gray-400 max-w-xl mb-12 leading-relaxed">
                Experience the unified college event management ecosystem. Where <span class="text-nexus-400 font-semibold">Innovation</span> meets <span class="text-accent-400 font-semibold">Celebration</span> in an immersive digital world.
            </p>

            <!-- Countdown Card -->
            <div class="flex flex-wrap gap-4 mb-12" id="countdown-timer">
                <div class="w-16 sm:w-20 py-3 rounded-2xl bg-surface-800/80 backdrop-blur-md border border-white/5 text-center">
                    <div class="text-xl sm:text-2xl font-bold font-display text-white" id="days">00</div>
                    <div class="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Days</div>
                </div>
                <div class="w-16 sm:w-20 py-3 rounded-2xl bg-surface-800/80 backdrop-blur-md border border-white/5 text-center">
                    <div class="text-xl sm:text-2xl font-bold font-display text-white" id="hours">00</div>
                    <div class="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Hrs</div>
                </div>
                <div class="w-16 sm:w-20 py-3 rounded-2xl bg-surface-800/80 backdrop-blur-md border border-white/5 text-center">
                    <div class="text-xl sm:text-2xl font-bold font-display text-white" id="minutes">00</div>
                    <div class="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Min</div>
                </div>
                <div class="w-16 sm:w-20 py-3 rounded-2xl bg-surface-800/80 backdrop-blur-md border border-white/5 text-center">
                    <div class="text-xl sm:text-2xl font-bold font-display text-white" id="seconds">00</div>
                    <div class="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Sec</div>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-4">
                <a href="login.php" class="group px-8 py-4 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-2xl text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(6,232,225,0.4)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                    Join Now <i data-lucide="arrow-right" size="20" class="group-hover:translate-x-1 transition-transform"></i>
                </a>
                <a href="events.php" class="px-8 py-4 border border-white/10 rounded-2xl text-white font-bold text-lg hover:bg-white/5 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                    Explore Events
                </a>
            </div>
        </div>

        <!-- Right: 3D Visualization Placeholder Space -->
        <div class="relative h-[500px] w-full hidden lg:block" data-aos="zoom-out" data-aos-delay="200">
            <div class="absolute inset-0 bg-nexus-400/10 blur-[150px] rounded-full animate-pulse-glow" style="animation-duration: 4s"></div>
        </div>
    </div>
</section>

<!-- Feature Stats -->
<section class="py-20 relative overflow-hidden">
    <div class="max-w-6xl mx-auto px-6">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <?php
            $stats = [
                ['icon' => 'calendar', 'value' => $eventCount.'+', 'label' => 'Events', 'color' => 'from-cyan-400 to-blue-500', 'delay' => '0'],
                ['icon' => 'users', 'value' => $collegeCount.'+', 'label' => 'Colleges', 'color' => 'from-purple-400 to-pink-500', 'delay' => '100'],
                ['icon' => 'trophy', 'value' => '₹5L+', 'label' => 'Prize Pool', 'color' => 'from-amber-400 to-orange-500', 'delay' => '200'],
                ['icon' => 'ticket', 'value' => $participantCount.'+', 'label' => 'Participants', 'color' => 'from-green-400 to-emerald-500', 'delay' => '300'],
            ];
            foreach ($stats as $s):
            ?>
            <div class="group relative p-6 sm:p-8 rounded-2xl bg-surface-700/50 backdrop-blur-sm border border-white/5 hover:border-white/15 transition-all duration-500 hover:-translate-y-2 hover:shadow-lg cursor-default" data-aos="fade-up" data-aos-delay="<?php echo $s['delay']; ?>">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br <?php echo $s['color']; ?> flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <i data-lucide="<?php echo $s['icon']; ?>" size="22" class="text-white"></i>
                </div>
                <div class="text-3xl sm:text-4xl font-black font-display text-white mb-1"><?php echo $s['value']; ?></div>
                <div class="text-sm text-gray-400 font-medium"><?php echo $s['label']; ?></div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- Featured Events -->
<section id="events" class="py-24 relative">
    <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16" data-aos="fade-up">
            <h2 class="text-4xl sm:text-5xl font-black font-display mb-4">
                <span class="bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">Featured</span> Events
            </h2>
            <p class="text-gray-400 max-w-xl mx-auto">From hackathons to dance-offs, scavenger hunts to robo wars — there's something for everyone.</p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <?php foreach ($featuredEvents as $index => $evt): ?>
            <div class="group p-6 rounded-2xl bg-surface-700/40 backdrop-blur-sm border border-nexus-400/20 hover:bg-surface-600/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl cursor-pointer" 
                 data-aos="fade-up" data-aos-delay="<?php echo ($index % 3) * 100; ?>">
                <div class="flex items-center gap-2 mb-4">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-nexus-400/15 text-nexus-400"><?php echo htmlspecialchars($evt['category_name']); ?></span>
                    <span class="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400"><?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $evt['scope']))); ?></span>
                </div>
                <h3 class="text-xl font-bold text-white mb-2 group-hover:text-nexus-400 transition-colors"><?php echo htmlspecialchars($evt['event_name']); ?></h3>
                <div class="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <i data-lucide="clock" size="14"></i> <?php echo date('M j • g A', strtotime($evt['start_datetime'])); ?>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <i data-lucide="trophy" size="14" class="text-amber-400"></i> Prize Pool: ₹<?php echo number_format($evt['prize_pool']); ?>
                </div>
                <a href="login.php" class="w-full py-3 rounded-xl bg-white/5 text-white font-semibold text-sm hover:bg-gradient-to-r hover:from-nexus-400 hover:to-accent-500 transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                    Register Now <i data-lucide="chevron-right" size="16" class="group-hover/btn:translate-x-1 transition-transform"></i>
                </a>
            </div>
            <?php endforeach; ?>
        </div>

        <div class="text-center mt-12">
            <a href="events.php" class="px-8 py-3 border-2 border-nexus-400/30 rounded-xl text-nexus-400 font-semibold hover:bg-nexus-400/10 hover:border-nexus-400 transition-all inline-block">
                View All Events →
            </a>
        </div>
    </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>

<script>
// --- Three.js Hero Scene ---
const container = document.getElementById('hero-canvas-container');
if (container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Geometry
    const geometry = new THREE.IcosahedronGeometry(2, 0);
    const material = new THREE.MeshPhongMaterial({
        color: 0x06e8e1,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const core = new THREE.Mesh(geometry, material);
    scene.add(core);

    // Inner Core
    const innerGeom = new THREE.OctahedronGeometry(1, 0);
    const innerMat = new THREE.MeshPhongMaterial({
        color: 0xf472b6,
        emissive: 0xf472b6,
        emissiveIntensity: 0.5,
        wireframe: true
    });
    const innerCore = new THREE.Mesh(innerGeom, innerMat);
    scene.add(innerCore);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x06e8e1, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);
        core.rotation.x += 0.005;
        core.rotation.y += 0.005;
        innerCore.rotation.x -= 0.01;
        innerCore.rotation.y -= 0.01;
        
        // Float effect
        const time = Date.now() * 0.001;
        core.position.y = Math.sin(time) * 0.2;
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- Countdown Timer ---
const targetDate = new Date('2026-04-15T09:00:00').getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
        document.getElementById('countdown-timer').innerHTML = '<div class="text-nexus-400 font-bold">EVENT LIVE!</div>';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('days').innerText = String(days).padStart(2, '0');
    document.getElementById('hours').innerText = String(hours).padStart(2, '0');
    document.getElementById('minutes').innerText = String(minutes).padStart(2, '0');
    document.getElementById('seconds').innerText = String(seconds).padStart(2, '0');
}

setInterval(updateCountdown, 1000);
updateCountdown();
</script>
