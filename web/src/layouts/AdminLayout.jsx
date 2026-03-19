import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, Wallet, Settings, ShieldCheck, LogOut, Menu, X, Bell, Database, FileBarChart, Siren, Trophy } from 'lucide-react'

const adminNavItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/events', icon: Calendar, label: 'Event Control' },
  { to: '/admin/users', icon: Users, label: 'Participants' },
  { to: '/admin/results', icon: ShieldCheck, label: 'Declare Results' },
  { to: '/admin/results/view', icon: Trophy, label: 'Result Preview' },
]

export default function AdminLayout() {
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
    if (u.role !== 'admin' && u.role !== 'super_admin') {
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

  const initials = user ? (user.first_name?.[0] || '') + (user.last_name?.[0] || '') : 'A'

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-800/80 backdrop-blur-xl border-r border-amber-500/10 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center px-6 border-b border-white/5 bg-amber-500/5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold font-display text-sm group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">A</div>
            <div className="flex flex-col">
              <span className="text-lg font-bold font-display text-white leading-none">NexusFest</span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Admin Portal</span>
            </div>
          </Link>
          <button className="lg:hidden ml-auto text-gray-400" onClick={() => setSidebarOpen(false)}><X size={20}/></button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs uppercase">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.first_name || 'Admin'} {user?.last_name || ''}</div>
              <div className="text-[10px] font-bold text-amber-500 uppercase">{user?.role || 'Admin'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-2 w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all">
            <LogOut size={16} /> Exit Portal
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-white/5 bg-surface-800/40 backdrop-blur-xl flex items-center px-6 gap-4 sticky top-0 z-30">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}><Menu size={22}/></button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold">
              <Siren size={12}/> ADMIN ACCESS
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
