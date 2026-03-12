import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, Wallet, Settings, TrendingUp, AlertCircle, CheckCircle, ArrowRight, ShieldCheck, Database, FileText, ChevronRight } from 'lucide-react'

/* Mock Admin Data */
const adminStats = [
  { label: 'Total Registrations', value: '5,240', change: '+12%', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { label: 'Revenue Generated', value: '₹4,85,000', change: '+8%', icon: Wallet, color: 'text-green-400', bg: 'bg-green-400/10' },
  { label: 'Active Events', value: '42', change: 'Live', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { label: 'Pending Verification', value: '128', change: 'Urgent', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
]

const recentActions = [
  { user: 'Admin_Karan', action: 'Approved results for Code Sprint', time: '5 mins ago' },
  { user: 'Admin_Neha', action: 'Created new event: Robo Wars 2.0', time: '12 mins ago' },
  { user: 'System', action: 'Auto-generated 450 certificates', time: '1 hour ago' },
  { user: 'Admin_Rahul', action: 'Modified wallet balance for #USR294', time: '2 hours ago' },
]

export default function AdminDashboardPage() {
  const location = useLocation()
  const isMainDashboard = location.pathname === '/admin/dashboard'

  if (!isMainDashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-surface-800/20 rounded-3xl border border-white/5 border-dashed">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
          <Settings size={40} className="text-amber-500 animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)} Module</h2>
        <p className="text-gray-500 max-w-sm text-center">This administrative module is currently being optimized for high-traffic operations. Check back shortly.</p>
        <Link to="/admin/dashboard" className="mt-8 flex items-center gap-2 text-amber-500 font-bold hover:underline">
          <ChevronRight size={16} className="rotate-180" /> Back to Command Center
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-2xl bg-gradient-to-br from-surface-700/60 to-surface-800/40 border border-white/5 shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-2 flex items-center gap-3">
            <ShieldCheck className="text-amber-400" size={32} />
            Administrative Command Center
          </h1>
          <p className="text-gray-400">Manage students, events, finance, and system configuration.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all">
            Generate Report
          </button>
          <button className="px-5 py-2.5 rounded-xl bg-surface-600 border border-white/10 text-white font-bold text-sm hover:bg-surface-500 transition-all">
            System Settings
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-surface-700/30 border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-surface-800 ${stat.color === 'text-amber-400' ? 'text-amber-400' : 'text-green-400'}`}>
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Manage Users', icon: Users, link: '/admin/users' },
              { label: 'Event Control', icon: Calendar, link: '/admin/events' },
              { label: 'Finance/Wallet', icon: Wallet, link: '/admin/finance' },
              { label: 'Issue Certificates', icon: FileText, link: '/admin/certificates' },
              { label: 'Database Logs', icon: Database, link: '/admin/logs' },
              { label: 'Global Settings', icon: Settings, link: '/admin/settings' },
            ].map((btn, i) => (
              <Link to={btn.link} key={i} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-700/40 border border-white/5 hover:bg-surface-600/40 hover:border-amber-500/30 transition-all group">
                <btn.icon size={32} className="text-gray-400 group-hover:text-amber-400 transition-colors mb-3" />
                <span className="text-sm font-semibold text-gray-300 group-hover:text-white">{btn.label}</span>
              </Link>
            ))}
          </div>

          {/* Pending Tasks Section */}
          <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-400" />
              Tasks Requiring Attention
            </h2>
            <div className="space-y-4">
              {[
                { title: 'Approve Result: Robo Wars', desc: 'Coordinator submitted results for verification.', priority: 'High' },
                { title: 'Wallet Top-up Request', desc: '5 students requested offline cash top-ups.', priority: 'Medium' },
                { title: 'Event Conflict Detected', desc: 'Technical Quiz & Dance Battle have venue overlap.', priority: 'High' },
              ].map((task, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 border border-white/5 hover:border-white/10 transition-all">
                  <div>
                    <h3 className="text-sm font-bold text-white">{task.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{task.desc}</p>
                  </div>
                  <button className="text-xs font-bold text-amber-400 hover:underline">Review Now</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Clock size={20} className="text-gray-400" />
            Admin Audit Log
          </h2>
          <div className="space-y-6">
            {recentActions.map((action, i) => (
              <div key={i} className="relative pl-6 border-l border-white/10 last:border-0 pb-6 last:pb-0">
                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <p className="text-sm text-gray-300 font-medium">{action.action}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-amber-500/80 font-bold uppercase tracking-widest">{action.user}</span>
                  <span className="text-xs text-gray-600">{action.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 rounded-xl border border-white/5 bg-white/5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            View All Logs
          </button>
        </div>
      </div>
    </div>
  )
}
