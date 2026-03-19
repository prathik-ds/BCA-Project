import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Clock, MapPin, Trophy, Users, Filter, ChevronRight, X, SlidersHorizontal, CheckCircle, Loader2 } from 'lucide-react'
import api from '../api/axios'

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

const formatLabel = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [scope, setScope] = useState('all')
  const [type, setType] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [myRegistrations, setMyRegistrations] = useState([])
  const [confirmUnregisterId, setConfirmUnregisterId] = useState(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [eventsRes, regsRes] = await Promise.all([
          api.get('/events').catch(() => ({ data: { data: [] } })),
          api.get('/registrations/my').catch(() => ({ data: { data: [] } }))
        ])
        setEvents(eventsRes.data?.data || [])
        setMyRegistrations(regsRes.data?.data || [])
      } catch (err) {
        console.error('Failed to fetch events:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const filtered = useMemo(() => {
    return events.filter(e => {
      const cat = (e.category_name || '').toLowerCase()
      if (search && !e.event_name.toLowerCase().includes(search.toLowerCase())) return false
      if (category !== 'all' && cat !== category) return false
      if (scope !== 'all' && e.scope !== scope) return false
      if (type !== 'all' && e.event_type !== type) return false
      return true
    })
  }, [events, search, category, scope, type])

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
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-nexus-400" size={40} />
          <p className="text-gray-500 animate-pulse">Syncing with Nexus Grid...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((evt, i) => (
            <div key={evt.event_id}
              className="group p-5 rounded-2xl bg-surface-700/30 border border-white/5 hover:border-white/15 hover:bg-surface-600/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-slide-up"
              style={{ animationDelay: `${i * 0.04}s` }}>
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${categoryColors[evt.category_name?.toLowerCase()] || 'bg-white/5 text-gray-400'}`}>
                  {formatLabel(evt.category_name)}
                </span>
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
                <span>{(evt.registered_count || evt.registration_count || 0)}/{evt.max_participants}</span>
              </div>
              <div className="w-full h-1.5 bg-surface-500 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-nexus-400 to-accent-500 rounded-full transition-all duration-700"
                  style={{ width: `${((evt.registered_count || evt.registration_count || 0) / (evt.max_participants || 1)) * 100}%` }} />
              </div>

              {/* CTA */}
              {(() => {
                const myReg = myRegistrations.find(r => Number(r.event_id) === Number(evt.event_id));
                const isRegistered = !!myReg;
                const isConfirming = confirmUnregisterId === evt.event_id;
                
                return (
                      isRegistered ? (
                        <div className="space-y-2">
                          {/* Success Indicator */}
                          <div className="w-full py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-default">
                            <CheckCircle size={14} /> Registered!
                          </div>
                          
                          {/* Separate Unregister Button */}
                          <button 
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              if (myReg && myReg.registration_id) {
                                if (!isConfirming) {
                                  setConfirmUnregisterId(evt.event_id);
                                  // Auto reset confirm status after 3 seconds
                                  setTimeout(() => {
                                      setConfirmUnregisterId(prev => prev === evt.event_id ? null : prev);
                                  }, 3000);
                                  return;
                                }

                                try {
                                  await api.delete(`/registrations/${myReg.registration_id}`);
                                  setMyRegistrations(prev => prev.filter(r => Number(r.event_id) !== Number(evt.event_id)));
                                  setConfirmUnregisterId(null);
                                  // Instantly decrement count on UI
                                  setEvents(prev => prev.map(e => Number(e.event_id) === Number(evt.event_id) ? {...e, registered_count: Math.max(0, (e.registered_count || e.registration_count || 1) - 1)} : e));
                                } catch(err) {
                                  alert(err.response?.data?.message || 'Cancellation failed');
                                  setConfirmUnregisterId(null);
                                }
                              } else {
                                alert("Please refresh the page to cancel a newly added registration.");
                              }
                            }}
                            className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                              isConfirming 
                                ? 'bg-red-500 text-white border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                                : 'text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all'
                            }`}>
                            {isConfirming ? (
                              <>Click to Confirm Cancel <X size={12} /></>
                            ) : (
                              <>Unregister from Event <X size={12} /></>
                            )}
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              const res = await api.post('/registrations', { event_id: evt.event_id });
                              setMyRegistrations(prev => [...prev, { event_id: evt.event_id, registration_id: res.data?.data?.registration_id }]);
                              // Instantly increment count on UI
                              setEvents(prev => prev.map(e => Number(e.event_id) === Number(evt.event_id) ? {...e, registered_count: (e.registered_count || e.registration_count || 0) + 1} : e));
                            } catch(err) {
                              alert(err.response?.data?.message || 'Registration failed');
                            }
                          }}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 group/btn bg-white/5 text-white hover:bg-gradient-to-r hover:from-nexus-400 hover:to-accent-500">
                          Register Now <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      )
                )
              })()}
            </div>
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
