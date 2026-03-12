import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Clock, MapPin, Trophy, Users, Filter, ChevronRight, X, SlidersHorizontal, CheckCircle } from 'lucide-react'

/* ── Mock data matching MySQL `events` table exactly ── */
const mockEvents = [
  { event_id: 1, event_name: 'Code Sprint 2026', category: 'technical', event_type: 'team', scope: 'inter_college', start_datetime: '2026-04-15T09:00:00', end_datetime: '2026-04-15T17:00:00', venue_name: 'CS Auditorium', max_participants: 200, entry_fee: 100, points_first: 100, points_second: 60, points_third: 30, status: 'registration_open', registration_count: 87, description: 'A 8-hour coding marathon. Build innovative solutions to real-world problems.' },
  { event_id: 2, event_name: 'Dance Battle Royale', category: 'cultural', event_type: 'solo', scope: 'open', start_datetime: '2026-04-15T14:00:00', end_datetime: '2026-04-15T18:00:00', venue_name: 'Main Stage', max_participants: 100, entry_fee: 0, points_first: 80, points_second: 50, points_third: 25, status: 'registration_open', registration_count: 45, description: 'Show your moves in this high-energy dance competition across multiple styles.' },
  { event_id: 3, event_name: 'Robo Wars', category: 'technical', event_type: 'team', scope: 'inter_college', start_datetime: '2026-04-16T10:00:00', end_datetime: '2026-04-16T16:00:00', venue_name: 'Sports Complex', max_participants: 60, entry_fee: 500, points_first: 120, points_second: 70, points_third: 40, status: 'registration_open', registration_count: 32, description: 'Build and battle robots in this thrilling engineering competition.' },
  { event_id: 4, event_name: 'E-Sports: Valorant', category: 'gaming', event_type: 'team', scope: 'open', start_datetime: '2026-04-16T12:00:00', end_datetime: '2026-04-16T20:00:00', venue_name: 'Gaming Arena', max_participants: 256, entry_fee: 200, points_first: 90, points_second: 55, points_third: 30, status: 'registration_open', registration_count: 120, description: '5v5 tactical FPS tournament. Compete for glory and massive prizes.' },
  { event_id: 5, event_name: 'Art Exhibition', category: 'cultural', event_type: 'solo', scope: 'intra_college', start_datetime: '2026-04-17T09:00:00', end_datetime: '2026-04-17T17:00:00', venue_name: 'Gallery Hall', max_participants: 50, entry_fee: 0, points_first: 50, points_second: 30, points_third: 15, status: 'registration_open', registration_count: 28, description: 'Showcase your artistic talent through paintings, sculptures, and digital art.' },
  { event_id: 6, event_name: 'Quiz Masters', category: 'academic', event_type: 'team', scope: 'inter_college', start_datetime: '2026-04-17T11:00:00', end_datetime: '2026-04-17T14:00:00', venue_name: 'Seminar Hall B', max_participants: 100, entry_fee: 50, points_first: 70, points_second: 45, points_third: 20, status: 'registration_open', registration_count: 64, description: 'Test your knowledge across science, tech, pop culture, and current affairs.' },
  { event_id: 7, event_name: 'Basketball 3v3', category: 'sports', event_type: 'team', scope: 'inter_college', start_datetime: '2026-04-15T08:00:00', end_datetime: '2026-04-15T18:00:00', venue_name: 'Basketball Court', max_participants: 48, entry_fee: 150, points_first: 80, points_second: 50, points_third: 25, status: 'registration_open', registration_count: 36, description: 'Fast-paced 3-on-3 basketball tournament with knockout rounds.' },
  { event_id: 8, event_name: 'Startup Pitch', category: 'technical', event_type: 'team', scope: 'open', start_datetime: '2026-04-16T09:00:00', end_datetime: '2026-04-16T13:00:00', venue_name: 'Incubation Center', max_participants: 40, entry_fee: 0, points_first: 100, points_second: 60, points_third: 30, status: 'registration_open', registration_count: 22, description: 'Pitch your startup idea to real investors and industry mentors.' },
  { event_id: 9, event_name: 'Photography Walk', category: 'cultural', event_type: 'solo', scope: 'open', start_datetime: '2026-04-17T06:00:00', end_datetime: '2026-04-17T10:00:00', venue_name: 'Campus Wide', max_participants: 80, entry_fee: 0, points_first: 40, points_second: 25, points_third: 10, status: 'registration_open', registration_count: 55, description: 'Capture the essence of NexusFest through your lens. Theme revealed on the day.' },
]

const categories = ['all', 'technical', 'cultural', 'sports', 'gaming', 'academic']
const scopes = ['all', 'intra_college', 'inter_college', 'open']
const types = ['all', 'solo', 'team']

const categoryColors = {
  technical: 'bg-cyan-400/15 text-cyan-400 border-cyan-400/30',
  cultural: 'bg-pink-400/15 text-pink-400 border-pink-400/30',
  academic: 'bg-blue-400/15 text-blue-400 border-blue-400/30',
  sports: 'bg-green-400/15 text-green-400 border-green-400/30',
  gaming: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
}

const formatLabel = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function EventsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [scope, setScope] = useState('all')
  const [type, setType] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [registeredId, setRegisteredId] = useState(null)

  const filtered = useMemo(() => {
    return mockEvents.filter(e => {
      if (search && !e.event_name.toLowerCase().includes(search.toLowerCase())) return false
      if (category !== 'all' && e.category !== category) return false
      if (scope !== 'all' && e.scope !== scope) return false
      if (type !== 'all' && e.event_type !== type) return false
      return true
    })
  }, [search, category, scope, type])

  const activeFilters = [category, scope, type].filter(f => f !== 'all').length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Browse Events</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} events available for registration</p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-700/50 border border-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-nexus-400/30 transition-all" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={16}/></button>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`px-5 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${showFilters || activeFilters ? 'bg-nexus-400/10 border-nexus-400/30 text-nexus-400' : 'bg-surface-700/50 border-white/5 text-gray-400 hover:text-white'}`}>
          <SlidersHorizontal size={16} />
          Filters {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-nexus-400 text-surface-900 text-xs font-bold flex items-center justify-center">{activeFilters}</span>}
        </button>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat ? 'bg-nexus-400/15 text-nexus-400 border border-nexus-400/30' : 'bg-surface-700/40 text-gray-400 border border-white/5 hover:text-white hover:bg-surface-600/40'}`}>
            {formatLabel(cat)}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="p-5 rounded-2xl bg-surface-700/30 border border-white/5 grid sm:grid-cols-2 gap-4 animate-slide-up">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">Scope</label>
            <div className="flex flex-wrap gap-2">
              {scopes.map(s => (
                <button key={s} onClick={() => setScope(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${scope === s ? 'bg-nexus-400/15 text-nexus-400' : 'bg-surface-600/40 text-gray-400 hover:text-white'}`}>
                  {formatLabel(s)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${type === t ? 'bg-nexus-400/15 text-nexus-400' : 'bg-surface-600/40 text-gray-400 hover:text-white'}`}>
                  {formatLabel(t)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((evt, i) => (
            <Link to={`/events/${evt.event_id}`} key={evt.event_id}
              className="group p-5 rounded-2xl bg-surface-700/30 border border-white/5 hover:border-white/15 hover:bg-surface-600/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-slide-up"
              style={{ animationDelay: `${i * 0.04}s` }}>
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${categoryColors[evt.category]}`}>{formatLabel(evt.category)}</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 text-gray-400">{formatLabel(evt.scope)}</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 text-gray-400 flex items-center gap-1">
                  <Users size={10}/> {formatLabel(evt.event_type)}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-nexus-400 transition-colors">{evt.event_name}</h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{evt.description}</p>

              {/* Meta */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock size={12} /> {new Date(evt.start_datetime).toLocaleDateString('en', { month: 'short', day: 'numeric' })} • {new Date(evt.start_datetime).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin size={12} /> {evt.venue_name}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Trophy size={12} className="text-amber-400" /> Prize: ₹{(evt.points_first * 500).toLocaleString()}
                </div>
              </div>

              {/* Entry fee + Registration bar */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{evt.entry_fee > 0 ? `₹${evt.entry_fee} entry` : '🎉 Free entry'}</span>
                <span>{evt.registration_count}/{evt.max_participants}</span>
              </div>
              <div className="w-full h-1.5 bg-surface-500 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-nexus-400 to-accent-500 rounded-full transition-all duration-700"
                  style={{ width: `${(evt.registration_count / evt.max_participants) * 100}%` }} />
              </div>

              {/* CTA */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRegisteredId(evt.event_id);
                  setTimeout(() => setRegisteredId(null), 3000);
                }}
                disabled={registeredId === evt.event_id}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 group/btn ${
                  registeredId === evt.event_id 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-white/5 text-white hover:bg-gradient-to-r hover:from-nexus-400 hover:to-accent-500'
                }`}>
                {registeredId === evt.event_id ? (
                  <><CheckCircle size={14} /> Registered!</>
                ) : (
                  <>Register Now <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" /></>
                )}
              </button>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
          <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
          <button onClick={() => { setSearch(''); setCategory('all'); setScope('all'); setType('all') }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-nexus-400/10 text-nexus-400 text-sm font-medium hover:bg-nexus-400/20 transition-all">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
