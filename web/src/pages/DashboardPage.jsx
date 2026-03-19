import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Wallet, Award, Clock, MapPin, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import api from '../api/axios'

const categoryColors = {
  technical: 'bg-cyan-400/15 text-cyan-400',
  cultural: 'bg-pink-400/15 text-pink-400',
  academic: 'bg-blue-400/15 text-blue-400',
  sports: 'bg-green-400/15 text-green-400',
  gaming: 'bg-amber-400/15 text-amber-400',
}

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('nexus_user')
    if (stored) setUser(JSON.parse(stored))

    api.get('/events')
      .then(res => setEvents((res.data.data || []).slice(0, 5)))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { icon: Calendar, label: 'Active Events', value: events.length, color: 'from-cyan-400 to-blue-500', link: '/events' },
    { icon: Clock, label: 'Upcoming', value: events.filter(e => new Date(e.start_datetime) > new Date()).length, color: 'from-purple-400 to-pink-500', link: '/schedule' },
    { icon: Award, label: 'Categories', value: [...new Set(events.map(e => e.category_name))].length, color: 'from-amber-400 to-orange-500', link: '/events' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Card */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-surface-700/60 to-surface-700/30 border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-nexus-400/5 blur-[60px]" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mb-1">
            Welcome back, {user?.first_name || 'Student'}! 👋
          </h1>
          <p className="text-gray-400">{user?.email || ''}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ icon: Icon, label, value, color, link }) => (
          <Link to={link} key={label}
            className="group p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold font-display text-white mb-0.5">{value}</div>
            <div className="text-xs text-gray-500 font-medium">{label}</div>
          </Link>
        ))}
      </div>

      {/* Events List */}
      <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white font-display">Available Events</h2>
          <Link to="/events" className="text-xs text-nexus-400 hover:underline flex items-center gap-1">View all <ArrowRight size={12}/></Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-nexus-400" size={32}/></div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No events available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(evt => (
              <Link to={`/events/${evt.event_id}`} key={evt.event_id}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/40 hover:bg-surface-600/40 border border-white/5 hover:border-white/10 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-surface-700 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs text-nexus-400 font-semibold">{new Date(evt.start_datetime).toLocaleDateString('en', { month: 'short' })}</span>
                  <span className="text-lg font-bold text-white">{new Date(evt.start_datetime).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm group-hover:text-nexus-400 transition-colors truncate">{evt.event_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColors[evt.category_name?.toLowerCase()] || 'bg-white/5 text-gray-400'}`}>
                      {evt.category_name || 'General'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={11}/> {new Date(evt.start_datetime).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}</span>
                    {evt.venue_name && <span className="flex items-center gap-1"><MapPin size={11}/> {evt.venue_name}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500">{evt.registered_count || 0}/{evt.max_participants || '∞'}</div>
                  <span className={`text-xs font-bold ${evt.status === 'published' ? 'text-green-400' : 'text-gray-500'}`}>{evt.status?.toUpperCase()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
