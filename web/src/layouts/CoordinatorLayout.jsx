import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, Calendar, ScanLine, Trophy, LogOut, Menu, X, Bell, UserCheck, Settings, Siren } from 'lucide-react'

const coordNavItems = [
  { to: '/coordinator/dashboard', icon: LayoutDashboard, label: 'Control Center' },
  { to: '/coordinator/events', icon: Calendar, label: 'My assigned events' },
  { to: '/coordinator/scanner', icon: ScanLine, label: 'Verify attendance' },
  { divider: true, label: 'Management' },
  { to: '/coordinator/results', icon: Trophy, label: 'Enter results' },
]

export default function CoordinatorLayout() {
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
    const u = JSON.parse(stored)
    if (u.role !== 'coordinator' && u.role !== 'admin' && u.role !== 'super_admin') {
      navigate('/dashboard')
      return
    }
    setUser(u)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('nexus_token')
    localStorage.removeItem('nexus_user')
    navigate('/login')
  }

  const initials = user ? (user.first_name?.[0] || '') + (user.last_name?.[0] || '') : 'C'

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-800/80 backdrop-blur-2xl border-r border-indigo-500/10 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center px-6 border-b border-white/5 bg-indigo-500/5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold font-display text-sm group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">C</div>
            <div className="flex flex-col">
              <span className="text-lg font-bold font-display text-white leading-none">NexusFest</span>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Event Coordinator</span>
            </div>
          </Link>
          <button className="lg:hidden ml-auto text-gray-400" onClick={() => setSidebarOpen(false)}><X size={20}/></button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {coordNavItems.map((item, i) => item.divider ? (
            <div key={i} className="pt-4 pb-1 px-4">
               <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">{item.label}</span>
            </div>
          ) : (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/5 border border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.first_name || 'Coord'} {user?.last_name || ''}</div>
              <div className="text-[10px] font-bold text-indigo-400 uppercase">Assigned Events</div>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-2 w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-white/5 bg-surface-800/40 backdrop-blur-xl flex items-center px-6 gap-4 sticky top-0 z-30">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}><Menu size={22}/></button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-bold">
               COORD ACCESS
            </div>
            <button className="relative p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
               <Bell size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
