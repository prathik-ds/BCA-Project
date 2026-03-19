import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Calendar, ShieldCheck, Clock, Plus, ArrowRight, Loader2 } from 'lucide-react'
import api from '../api/axios'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalEvents: 0, totalUsers: 0, totalRegistrations: 0 })
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const evRes = await api.get('/events')
        const evts = evRes.data.data || []
        setEvents(evts.slice(0, 5))
        
        const totalRegs = evts.reduce((sum, e) => sum + (parseInt(e.registered_count) || 0), 0)
        setStats({
          totalEvents: evts.length,
          totalUsers: totalRegs,
          totalRegistrations: totalRegs,
        })
      } catch (err) {
        console.error('Dashboard load failed:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-amber-500" size={48} />
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Total Registrations', value: stats.totalRegistrations, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-2xl bg-gradient-to-br from-surface-700/60 to-surface-800/40 border border-white/5">
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-2 flex items-center gap-3">
            <ShieldCheck className="text-amber-400" size={32} />
            Admin Command Center
          </h1>
          <p className="text-gray-400">Manage events, participants, and results.</p>
        </div>
        <Link to="/admin/events" className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition">
          <Plus size={18} /> Create Event
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-surface-700/30 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/events" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-amber-500/30 transition-all group">
          <Calendar size={32} className="text-gray-400 group-hover:text-amber-400 transition-colors mb-3" />
          <span className="text-sm font-semibold text-gray-300 group-hover:text-white">Manage Events</span>
        </Link>
        <Link to="/admin/users" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-amber-500/30 transition-all group">
          <Users size={32} className="text-gray-400 group-hover:text-amber-400 transition-colors mb-3" />
          <span className="text-sm font-semibold text-gray-300 group-hover:text-white">View Participants</span>
        </Link>
        <Link to="/admin/results" className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-amber-500/30 transition-all group">
          <ShieldCheck size={32} className="text-gray-400 group-hover:text-amber-400 transition-colors mb-3" />
          <span className="text-sm font-semibold text-gray-300 group-hover:text-white">Update Results</span>
        </Link>
      </div>

      {/* Recent Events Table */}
      <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Clock size={20} className="text-gray-400"/> Recent Events</h2>
          <Link to="/admin/events" className="text-xs text-amber-400 hover:underline flex items-center gap-1">View all <ArrowRight size={12}/></Link>
        </div>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events yet. Create your first event!</p>
        ) : (
          <div className="space-y-3">
            {events.map(evt => (
              <div key={evt.event_id} className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 border border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-white">{evt.event_name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{new Date(evt.start_datetime).toLocaleDateString()} • {evt.category_name}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${evt.status === 'published' ? 'bg-green-500/20 text-green-400' : evt.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {evt.status?.toUpperCase()}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">{evt.registered_count || 0} registered</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
