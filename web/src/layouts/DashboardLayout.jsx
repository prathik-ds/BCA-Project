import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, Calendar, Users, Trophy, Clock, Award, User, LogOut, Menu, X, Bell, ChevronDown, ScanLine, Star } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/teams', icon: Users, label: 'My Teams' },
  { to: '/schedule', icon: Clock, label: 'Schedule' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/results', icon: Star, label: 'Results' },
  { to: '/certificates', icon: Award, label: 'Certificates' },
  { to: '/profile', icon: User, label: 'Profile' },
  { divider: true, label: 'Coordinator Section' },
  { to: '/scanner', icon: ScanLine, label: 'QR Scanner' },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('nexus_token')
    const stored = localStorage.getItem('nexus_user')
    if (!token || !stored) {
      navigate('/login')
      return
    }
    setUser(JSON.parse(stored))
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('nexus_token')
    localStorage.removeItem('nexus_user')
    navigate('/login')
  }

  const initials = user ? (user.first_name?.[0] || '') + (user.last_name?.[0] || '') : '??'

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-800/80 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold font-display text-sm group-hover:scale-110 transition-transform">N</div>
            <span className="text-lg font-bold font-display bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">NexusFest</span>
          </Link>
          <button className="lg:hidden ml-auto text-gray-400" onClick={() => setSidebarOpen(false)}><X size={20}/></button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.filter(item => {
            if (item.label === 'Coordinator Section' || item.label === 'QR Scanner') {
              return ['coordinator', 'admin', 'super_admin'].includes(user?.role)
            }
            return true
          }).map((item, i) => item.divider ? (
            <div key={i} className="pt-4 pb-1 px-4">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{item.label}</span>
            </div>
          ) : (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-nexus-400/10 text-nexus-400 border border-nexus-400/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          
          {['coordinator', 'admin', 'super_admin'].includes(user?.role) && (
            <Link to="/coordinator/dashboard" className="flex items-center gap-3 px-4 py-3 mt-4 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
               <Trophy size={16} /> COORDINATOR PORTAL
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-1">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/40">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold text-xs">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.first_name || 'User'} {user?.last_name || ''}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email || ''}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-2 w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-white/5 bg-surface-800/40 backdrop-blur-xl flex items-center px-6 gap-4 sticky top-0 z-30">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}><Menu size={22}/></button>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold text-xs">{initials}</div>
              <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
