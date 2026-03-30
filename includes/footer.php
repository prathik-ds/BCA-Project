</div> <!-- End of Navbar Spacer -->

    <footer class="border-t border-white/5 py-16 bg-surface-900">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold font-display">N</div>
              <span class="text-lg font-bold font-display bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">NexusFest</span>
            </div>
            <p class="text-sm text-gray-500 leading-relaxed">The unified college event management ecosystem. Built for the next generation of fest experiences.</p>
          </div>
          <div>
            <h4 class="font-semibold text-white mb-4 text-sm">Platform</h4>
            <ul class="space-y-2.5">
              <li><a href="events.php" class="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Events</a></li>
              <li><a href="schedule.php" class="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Schedule</a></li>
              <li><a href="leaderboard.php" class="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Leaderboard</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold text-white mb-4 text-sm">Community</h4>
            <ul class="space-y-2.5">
              <li><a href="#" class="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Colleges</a></li>
              <li><a href="login.php" class="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Coordinators</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold text-white mb-4 text-sm">Support</h4>
            <ul class="space-y-2.5">
              <li><a href="#" class="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Help Center</a></li>
              <li><a href="#" class="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p class="text-xs text-gray-600">© 2026 NexusFest. Crafted with ❤️ for the college community.</p>
          <div class="flex gap-6">
            <a href="#" class="text-xs text-gray-600 hover:text-nexus-400 transition-colors">Twitter</a>
            <a href="#" class="text-xs text-gray-600 hover:text-nexus-400 transition-colors">Instagram</a>
            <a href="#" class="text-xs text-gray-600 hover:text-nexus-400 transition-colors">LinkedIn</a>
            <a href="#" class="text-xs text-gray-600 hover:text-nexus-400 transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Scripts -->
    <script>
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('main-nav');
            if (window.scrollY > 40) {
                nav.classList.add('bg-surface-900/90', 'backdrop-blur-xl', 'border-b', 'border-white/5', 'shadow-lg', 'shadow-black/20');
            } else {
                nav.classList.remove('bg-surface-900/90', 'backdrop-blur-xl', 'border-b', 'border-white/5', 'shadow-lg', 'shadow-black/20');
            }
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Initialize AOS
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 50
        });

        // Initialize Lucide icons
        lucide.createIcons();
    </script>
</body>
</html>
