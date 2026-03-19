import { useState, useEffect } from 'react'
import { Clock, MapPin, Users, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const catColors = {
  technical: 'border-l-cyan-400 bg-cyan-400/5', cultural: 'border-l-pink-400 bg-pink-400/5',
  sports: 'border-l-green-400 bg-green-400/5', gaming: 'border-l-amber-400 bg-amber-400/5',
  academic: 'border-l-blue-400 bg-blue-400/5',
}
const catBadge = {
  technical: 'bg-cyan-400/15 text-cyan-400', cultural: 'bg-pink-400/15 text-pink-400',
  sports: 'bg-green-400/15 text-green-400', gaming: 'bg-amber-400/15 text-amber-400',
  academic: 'bg-blue-400/15 text-blue-400',
}

export default function SchedulePage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/events')
      .then(res => setEvents(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  // Group events by date
  const grouped = {}
  events.forEach(evt => {
    const date = new Date(evt.start_datetime).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(evt)
  })
  // Sort each group by time
  Object.values(grouped).forEach(g => g.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)))
  const days = Object.keys(grouped)
  const [activeDay, setActiveDay] = useState(null)

  useEffect(() => {
    if (days.length > 0 && !activeDay) setActiveDay(days[0])
  }, [days, activeDay])

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-nexus-400" size={48}/></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Event Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">{events.length} events across {days.length} day{days.length !== 1 ? 's' : ''}</p>
      </div>

      {events.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-700/30 border border-white/5 text-center">
          <Clock size={48} className="text-gray-600 mx-auto mb-4"/>
          <p className="text-gray-500">No events scheduled yet. Events will appear here once admin creates them.</p>
        </div>
      ) : (
        <>
          {/* Day Tabs */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {days.map((d, i) => (
              <button key={d} onClick={() => setActiveDay(d)}
                className={`flex-1 min-w-[120px] p-4 rounded-2xl text-center transition-all ${activeDay === d ? 'bg-nexus-400/10 border-2 border-nexus-400/30' : 'bg-surface-700/30 border border-white/5 hover:bg-surface-600/30'}`}>
                <div className={`text-lg font-bold ${activeDay === d ? 'text-nexus-400' : 'text-white'}`}>Day {i + 1}</div>
                <div className="text-xs text-gray-500">{d}</div>
              </button>
            ))}
          </div>

          {/* Timeline */}
          {activeDay && grouped[activeDay] && (
            <div className="space-y-4">
              {grouped[activeDay].map(evt => {
                const cat = evt.category_name?.toLowerCase() || ''
                return (
                  <Link to={`/events/${evt.event_id}`} key={evt.event_id}
                    className={`block p-4 rounded-xl border-l-4 ${catColors[cat] || 'border-l-gray-400 bg-gray-400/5'} border border-white/5 hover:border-white/15 transition-all hover:-translate-y-0.5 group`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${catBadge[cat] || 'bg-white/10 text-gray-400'}`}>{evt.category_name || 'General'}</span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1"><Users size={10}/> {evt.event_type}</span>
                    </div>
                    <h3 className="font-bold text-white group-hover:text-nexus-400 transition-colors">{evt.event_name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={10}/> {new Date(evt.start_datetime).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })} – {new Date(evt.end_datetime).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}</span>
                      {evt.venue_name && <span className="flex items-center gap-1"><MapPin size={10}/> {evt.venue_name}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
