<?php
require_once __DIR__ . '/config.php';
$activePage = basename($_SERVER['PHP_SELF'], ".php");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?> 2026 — College Fest Ecosystem</title>
    
    <!-- Tailwind Play CDN (Not for production, but good for this migration) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
    // Global Config for API calls
    window.NEXUS_TOKEN = '<?php echo $_SESSION['access_token'] ?? ''; ?>';
    window.API_BASE = 'api/index.php/api/v1'; // Simplified for built-in server

    async function apiFetch(endpoint, options = {}) {
        const headers = { 
            'Authorization': `Bearer ${window.NEXUS_TOKEN}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}) 
        };
        const response = await fetch(`${window.API_BASE}${endpoint}`, { ...options, headers });
        return response.json();
    }
    </script>
    <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            surface: {
              900: '#0a0e1a',
              800: '#0f1629',
              700: '#161d35',
              600: '#1e2745',
              500: '#2a3355',
              400: '#364168',
            },
            nexus: {
              400: '#06e8e1',
              500: '#00cbc8',
              600: '#00a2a4',
            },
            accent: {
              400: '#f472b6',
              500: '#ec4899',
              600: '#db2777',
            }
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            display: ['Outfit', 'Inter', 'sans-serif'],
          }
        }
      }
    }
    </script>
    
    <!-- AOS (Animate On Scroll) -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    
    <!-- Three.js (Optional but good for hero) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"></script>
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-surface-900 text-gray-200">
    <!-- Navbar -->
    <nav id="main-nav" class="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <!-- Logo -->
            <a href="index.php" class="flex items-center gap-2 group">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold text-lg font-display group-hover:scale-110 transition-transform">N</div>
                <span class="text-xl font-bold font-display bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">NexusFest</span>
            </a>

            <!-- Desktop links -->
            <div class="hidden md:flex items-center gap-8">
                <a href="index.php" class="text-sm <?php echo $activePage == 'index' ? 'text-nexus-400 font-bold' : 'text-gray-300 hover:text-nexus-400' ?> transition-colors font-medium">Home</a>
                <a href="events.php" class="text-sm <?php echo $activePage == 'events' ? 'text-nexus-400 font-bold' : 'text-gray-300 hover:text-nexus-400' ?> transition-colors font-medium">Events</a>
                <a href="leaderboard.php" class="text-sm <?php echo $activePage == 'leaderboard' ? 'text-nexus-400 font-bold' : 'text-gray-300 hover:text-nexus-400' ?> transition-colors font-medium">Leaderboard</a>
                
                <?php if (isLoggedIn()): ?>
                    <button onclick="toggleSidebar()" class="flex items-center gap-2 px-4 py-2 bg-surface-800 border border-white/5 hover:border-nexus-400/30 rounded-xl transition-all group">
                        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                            <?php echo substr($_SESSION['first_name'] ?? 'U', 0, 1); ?>
                        </div>
                        <span class="text-sm font-semibold text-white group-hover:text-nexus-400 transition-colors"><?php echo htmlspecialchars($_SESSION['first_name'] ?? 'User'); ?></span>
                        <i data-lucide="menu" size="16" class="text-gray-400 ml-1"></i>
                    </button>
                <?php else: ?>
                    <a href="login.php" class="px-5 py-2.5 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white text-sm font-semibold hover:shadow-[0_0_25px_rgba(6,232,225,0.3)] hover:scale-105 transition-all duration-300">
                        Login
                    </a>
                <?php endif; ?>
            </div>

            <!-- Mobile toggle -->
            <button class="md:hidden text-gray-300" id="menu-toggle" onclick="toggleMobileMenu()">
                <i data-lucide="menu" size="24"></i>
            </button>
        </div>

        <!-- Mobile menu -->
        <div id="mobile-menu" class="hidden md:hidden bg-surface-800/95 backdrop-blur-xl border-t border-white/5 absolute w-full z-40 transition-all duration-300 ease-in-out shadow-2xl">
            <div class="flex flex-col p-6 gap-2">
                <a href="index.php" class="text-gray-300 hover:text-white hover:bg-white/5 rounded-xl px-4 py-3 font-medium transition-colors">Home</a>
                <a href="events.php" class="text-gray-300 hover:text-white hover:bg-white/5 rounded-xl px-4 py-3 font-medium transition-colors">Events</a>
                <a href="leaderboard.php" class="text-gray-300 hover:text-white hover:bg-white/5 rounded-xl px-4 py-3 font-medium transition-colors">Leaderboard</a>
                <?php if (isLoggedIn()): ?>
                    <button onclick="toggleMobileMenu(); toggleSidebar();" class="text-left text-nexus-400 hover:bg-nexus-400/10 rounded-xl px-4 py-3 font-bold transition-colors flex items-center justify-between">
                        My Account Menu <i data-lucide="arrow-right" size="16"></i>
                    </button>
                <?php else: ?>
                    <a href="login.php" class="mt-2 px-5 py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold text-center w-full shadow-lg border border-white/10">Login</a>
                <?php endif; ?>
            </div>
        </div>
    </nav>
    <div class="pt-24"> <!-- Added padding for fixed nav -->

    <?php if (isLoggedIn()): ?>
    <!-- Application Sidebar (Off-canvas Drawer) -->
    <div id="app-sidebar-backdrop" onclick="toggleSidebar()" class="fixed inset-0 bg-surface-900/80 backdrop-blur-sm z-[60] hidden opacity-0 transition-opacity duration-300"></div>
    
    <div id="app-sidebar" class="fixed top-0 right-0 h-full w-80 bg-surface-800 border-l border-white/10 shadow-2xl z-[70] transform translate-x-full transition-transform duration-300 flex flex-col">
        <!-- Sidebar Header -->
        <div class="p-6 border-b border-white/5 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-lg font-bold text-white uppercase shadow-lg border border-white/20">
                    <?php echo substr($_SESSION['first_name'] ?? 'U', 0, 1); ?>
                </div>
                <div>
                    <h3 class="text-white font-bold leading-tight"><?php echo htmlspecialchars($_SESSION['first_name'] . ' ' . ($_SESSION['last_name'] ?? '')); ?></h3>
                    <p class="text-[10px] text-nexus-400 font-bold uppercase tracking-widest mt-0.5"><?php echo htmlspecialchars($_SESSION['role'] ?? 'Participant'); ?></p>
                </div>
            </div>
            <button onclick="toggleSidebar()" class="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <i data-lucide="x" size="20"></i>
            </button>
        </div>

        <!-- Sidebar Content (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            
            <!-- Contextual Dashboard -->
            <div>
                <div class="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-2">Main Functions</div>
                <div class="space-y-1">
                    <a href="dashboard.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                        <i data-lucide="layout-dashboard" size="18" class="text-gray-500 group-hover:text-nexus-400 transition-colors"></i>
                        <span class="font-medium text-sm">Dashboard Overview</span>
                    </a>
                    
                    <?php if ($_SESSION['role'] === 'participant'): ?>
                        <a href="profile.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                            <i data-lucide="user" size="18" class="text-gray-500 group-hover:text-nexus-400 transition-colors"></i>
                            <span class="font-medium text-sm">My Profile</span>
                        </a>
                        <a href="wallet.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                            <i data-lucide="wallet" size="18" class="text-gray-500 group-hover:text-nexus-400 transition-colors"></i>
                            <span class="font-medium text-sm">Virtual Wallet</span>
                        </a>
                        <a href="teams.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                            <i data-lucide="users" size="18" class="text-gray-500 group-hover:text-nexus-400 transition-colors"></i>
                            <span class="font-medium text-sm">My Teams</span>
                        </a>
                        <a href="schedule.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                            <i data-lucide="calendar-clock" size="18" class="text-gray-500 group-hover:text-nexus-400 transition-colors"></i>
                            <span class="font-medium text-sm">My Schedule</span>
                        </a>
                        <a href="certificates.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                            <i data-lucide="award" size="18" class="text-gray-500 group-hover:text-nexus-400 transition-colors"></i>
                            <span class="font-medium text-sm">Certificates</span>
                        </a>
                    <?php endif; ?>

                    <?php if ($_SESSION['role'] === 'admin' || $_SESSION['role'] === 'super_admin'): ?>
                        <div class="pt-4 mt-2 border-t border-white/5">
                            <div class="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-2">Admin Tools</div>
                            <a href="admin_dashboard.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-amber-400/80 hover:text-amber-400 hover:bg-amber-400/10 transition-all group">
                                <i data-lucide="shield" size="18" class="group-hover:scale-110 transition-transform"></i>
                                <span class="font-bold text-sm">Admin Control Center</span>
                            </a>
                            <a href="admin_events.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                                <i data-lucide="calendar-plus" size="18" class="text-gray-500 group-hover:text-white transition-colors"></i>
                                <span class="font-medium text-sm">Manage Events</span>
                            </a>
                            <a href="admin_users.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                                <i data-lucide="users" size="18" class="text-gray-500 group-hover:text-white transition-colors"></i>
                                <span class="font-medium text-sm">Manage Users</span>
                            </a>
                        </div>
                    <?php endif; ?>

                    <?php if ($_SESSION['role'] === 'coordinator' || $_SESSION['role'] === 'admin'): ?>
                        <div class="pt-4 mt-2 border-t border-white/5">
                            <div class="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-2">Event Ops</div>
                            <a href="manage_event.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-400/80 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all group">
                                <i data-lucide="radio" size="18" class="group-hover:scale-110 transition-transform"></i>
                                <span class="font-bold text-sm">Assigned Events</span>
                            </a>
                            <a href="scanner.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                                <i data-lucide="scan-line" size="18" class="text-gray-500 group-hover:text-white transition-colors"></i>
                                <span class="font-medium text-sm">QR Code Scanner</span>
                            </a>
                            <a href="results_submit.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                                <i data-lucide="trophy" size="18" class="text-gray-500 group-hover:text-white transition-colors"></i>
                                <span class="font-medium text-sm">Declare Results</span>
                            </a>
                        </div>
                    <?php endif; ?>

                </div>
            </div>
            
        </div>

        <!-- Sidebar Footer Action -->
        <div class="p-4 border-t border-white/5 bg-surface-900/50">
            <a href="logout.php" class="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/20 transition-all">
                <i data-lucide="log-out" size="18"></i> Secure Logout
            </a>
        </div>
    </div>
    
    <script>
        function toggleSidebar() {
            const sidebar = document.getElementById('app-sidebar');
            const backdrop = document.getElementById('app-sidebar-backdrop');
            
            if (sidebar.classList.contains('translate-x-full')) {
                // Open Sidebar
                sidebar.classList.remove('translate-x-full');
                backdrop.classList.remove('hidden');
                setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
                document.body.style.overflow = 'hidden'; // block scrolling
            } else {
                // Close Sidebar
                sidebar.classList.add('translate-x-full');
                backdrop.classList.add('opacity-0');
                setTimeout(() => backdrop.classList.add('hidden'), 300);
                document.body.style.overflow = '';
            }
        }
        
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            if (menu.classList.contains('hidden')) {
                menu.classList.remove('hidden');
            } else {
                menu.classList.add('hidden');
            }
        }
    </script>
    
    <style>
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
    </style>
    <?php endif; ?>
