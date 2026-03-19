import { useState, useEffect } from 'react'
import { Calendar, Search, Filter, Loader2, CheckCircle, Clock, Users, X, MapPin, RefreshCw, ScanLine, Trophy, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function CoordinatorEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [showRegsModal, setShowRegsModal] = useState(false)
  const [search, setSearch] = useState('')

  const loadData = async () => {
    try {
      const stored = localStorage.getItem('nexus_user')
      const u = stored ? JSON.parse(stored) : null
      const res = await api.get('/events')
      const allEvts = res.data.data || []
      const myEvts = allEvts.filter(e => Number(e.coordinator_id) === Number(u?.user_id))
      setEvents(myEvts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openRegistrations = async (eventId) => {
    setSelectedEventId(eventId)
    setShowRegsModal(true)
    setLoadingRegs(true)
    try {
      const res = await api.get(`/admin/events/${eventId}/registrations`)
      setRegistrations(res.data.data || [])
    } catch (err) {
      setRegistrations([])
    } finally {
      setLoadingRegs(false)
    }
  }

  const updateEventStatus = async (eventId, newStatus) => {
    try {
      await api.patch(`/admin/events/${eventId}`, { status: newStatus })
      setEvents(prev => prev.map(e => e.event_id === eventId ? { ...e, status: newStatus } : e))
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const handleManualCheckIn = async (regId) => {
    try {
      await api.post('/attendance/manual', { 
        event_id: selectedEventId, 
        registration_id: regId 
      })
      setRegistrations(prev => prev.map(r => r.registration_id === regId ? { ...r, status: 'checked_in' } : r))
    } catch (err) {
      alert(err.response?.data?.message || 'Manual check-in failed')
    }
  }

  const handleUndoCheckIn = async (regId) => {
    if (!confirm("Are you sure you want to UNDO this check-in?")) return;
    try {
      await api.post('/attendance/undo', { 
        event_id: selectedEventId, 
        registration_id: regId 
      })
      setRegistrations(prev => prev.map(r => r.registration_id === regId ? { ...r, status: 'confirmed' } : r))
    } catch (err) {
      alert(err.response?.data?.message || 'Undo failed')
    }
  }

  const filteredEvents = events.filter(e => 
    e.event_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-indigo-500" size={48}/></div>

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-surface-800 border border-white/5 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="text-indigo-400" size={28}/> My Assigned Events
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage check-ins, status updates, and results for your events.</p>
        </div>
        
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
           <input 
             value={search} onChange={e => setSearch(e.target.value)}
             placeholder="Search your events..."
             className="w-full pl-10 pr-4 py-2 bg-surface-900 border border-indigo-500/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50"
           />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="p-20 text-center bg-surface-800/40 rounded-3xl border border-white/5 border-dashed">
          <Calendar className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-lg font-bold text-white">No Assigned Events Found</h3>
          <p className="text-gray-500 mt-2">Only events assigned to your ID will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredEvents.map(evt => (
            <div key={evt.event_id} className="bg-surface-800 border border-white/5 rounded-3xl overflow-hidden shadow-lg hover:border-indigo-500/20 transition-all flex flex-col">
              {/* Event Header */}
              <div className="p-6 pb-4 border-b border-white/5 relative">
                 <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      evt.status === 'published' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      evt.status === 'ongoing' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' :
                      evt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-gray-500/10 text-gray-400 border-white/10'
                    }`}>
                      {evt.status}
                    </span>
                    <div className="text-right text-xs text-gray-500">
                       <Clock size={12} className="inline mr-1" /> {new Date(evt.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                 </div>
                 <h3 className="text-lg font-bold text-white mb-2 leading-tight">{evt.event_name}</h3>
                 <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <MapPin size={10} className="text-indigo-400"/> {evt.venue_name || 'No Venue Set'}
                 </div>
              </div>

              {/* Stats & Actions */}
              <div className="p-6 flex-1 space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => openRegistrations(evt.event_id)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-900 border border-white/5 hover:border-indigo-500/20 transition-all group">
                       <Users size={18} className="text-gray-500 group-hover:text-indigo-400 mb-1.5 transition-colors"/>
                       <span className="text-[10px] font-bold text-white">{evt.registered_count || 0}</span>
                       <span className="text-[8px] font-bold text-gray-600 uppercase">Participants</span>
                    </button>
                    <Link to="/coordinator/scanner" className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-900 border border-white/5 hover:border-indigo-500/20 transition-all group">
                       <ScanLine size={18} className="text-gray-500 group-hover:text-indigo-400 mb-1.5 transition-colors"/>
                       <span className="text-[10px] font-bold text-white">Scanner</span>
                       <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Attendance</span>
                    </Link>
                 </div>

                 {/* Quick Status Control */}
                 <div className="space-y-2">
                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Mark Status</div>
                    <div className="flex gap-2">
                       {evt.status === 'published' && (
                         <button onClick={() => updateEventStatus(evt.event_id, 'ongoing')} className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg transition-colors">START EVENT</button>
                       )}
                       {evt.status === 'ongoing' && (
                         <button onClick={() => updateEventStatus(evt.event_id, 'completed')} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors">FINISH EVENT</button>
                       )}
                       {evt.status === 'completed' && (
                         <div className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 text-center text-[10px] font-bold rounded-lg border border-emerald-500/20">EVENT COMPLETED</div>
                       )}
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-white/2 border-t border-white/5">
                 <Link to="/coordinator/results" className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl border border-indigo-500/20 flex items-center justify-center gap-2 transition-all">
                    <Trophy size={14}/> Enter Final Results
                 </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participants Modal (Coordinator Version) */}
      {showRegsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface-800 w-full max-w-4xl max-h-[85vh] rounded-3xl border border-white/10 flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">Participant List</h2>
                <p className="text-gray-500 text-xs">Verify names and attendance for the event.</p>
              </div>
              <button onClick={() => setShowRegsModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingRegs ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={40}/></div>
              ) : registrations.length === 0 ? (
                <p className="text-center py-20 text-gray-500">No participants registered yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registrations.map(r => (
                    <div key={r.registration_id} className="p-4 rounded-2xl bg-surface-900 border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          {r.first_name?.[0]}{r.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{r.first_name} {r.last_name}</p>
                          <p className="text-[10px] text-gray-500">{r.email}</p>
                          <p className="text-[10px] text-indigo-400 font-bold mt-0.5">{r.college_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status === 'checked_in' ? (
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle size={12}/> CHECKED IN
                            </div>
                            <button onClick={() => handleUndoCheckIn(r.registration_id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all" title="Cancel Check-in">
                              <X size={14}/>
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleManualCheckIn(r.registration_id)} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 transition-all">
                            CHECK IN
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 bg-white/2 rounded-b-3xl">
              <button onClick={() => setShowRegsModal(false)} className="w-full py-3 bg-surface-700 hover:bg-surface-600 text-white text-sm font-bold rounded-2xl transition">Close Modal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

