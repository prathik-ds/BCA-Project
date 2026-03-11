import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, Calendar, Users, Wallet, Trophy, Clock, Award, User, LogOut, Menu, X, Bell, Search, ChevronDown } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/teams', icon: Users, label: 'My Teams' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/schedule', icon: Clock, label: 'Schedule' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/certificates', icon: Award, label: 'Certificates' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-800/80 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold font-display text-sm group-hover:scale-110 transition-transform">N</div>
            <span className="text-lg font-bold font-display bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">NexusFest</span>
          </Link>
          <button className="lg:hidden ml-auto text-gray-400" onClick={() => setSidebarOpen(false)}><X size={20}/></button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-nexus-400/10 text-nexus-400 border border-nexus-400/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/40">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold text-xs">PS</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">Pratham Sharma</div>
              <div className="text-xs text-gray-500 truncate">MIT ADT University</div>
            </div>
          </div>
          <button onClick={() => navigate('/login')} className="mt-2 w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-20 border-b border-white/5 bg-surface-800/40 backdrop-blur-xl flex items-center px-6 gap-4 sticky top-0 z-30">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}><Menu size={22}/></button>

          {/* Search */}
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search events, teams, participants..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-700/50 border border-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-nexus-400/30 transition-all" />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full" />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold text-xs">PS</div>
              <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
