import { useState, useEffect } from 'react'
import { Trophy, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../api/axios'

export default function CoordinatorResultsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [winners, setWinners] = useState({ first: '', second: '', third: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = localStorage.getItem('nexus_user')
        const u = stored ? JSON.parse(stored) : null
        const res = await api.get('/events')
        const allEvts = res.data.data || []
        // Only show events where status is UPCOMING or ONGOING or COMPLETED
        // Filtering for this coordinator
        const myEvts = allEvts.filter(e => Number(e.coordinator_id) === Number(u?.user_id))
        setEvents(myEvts)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const selectEvent = async (eventId) => {
    setSelectedEvent(eventId)
    setMessage('')
    setWinners({ first: '', second: '', third: '' })
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

  const handleSubmitResults = async () => {
    if (!winners.first) { setMessage('Please select at least a 1st place winner'); return }
    setSaving(true)
    setMessage('')
    try {
      const winnersArray = []
      if (winners.first) winnersArray.push({ user_id: parseInt(winners.first), position: 'first' })
      if (winners.second) winnersArray.push({ user_id: parseInt(winners.second), position: 'second' })
      if (winners.third) winnersArray.push({ user_id: parseInt(winners.third), position: 'third' })
      
      await api.post('/results', { event_id: parseInt(selectedEvent), winners: winnersArray })
      setMessage('Results submitted successfully! Total 3 winners updated.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit results')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-indigo-500" size={48}/></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 p-8 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Trophy className="text-amber-500" size={32}/> Official Proclamation
        </h1>
        <p className="text-gray-400 text-sm">Assign positions for your assigned event. This will update the leaderboard and trigger certificate generation for winners.</p>
      </div>

      <div className={selectedEvent ? 'opacity-100 transition-all duration-500 transform translate-y-0' : 'opacity-80'}>
        <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Event Select</label>
        <select value={selectedEvent || ''} onChange={e => selectEvent(e.target.value)}
          className="w-full bg-surface-800 border-2 border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500/40 transition-all">
          <option value="">-- Choose an event --</option>
          {events.map(e => <option key={e.event_id} value={e.event_id}>{e.event_name} ({e.status})</option>)}
        </select>
      </div>

      {selectedEvent && (
        <div className="p-8 bg-surface-800/60 rounded-3xl border border-white/5 space-y-8 animate-in slide-in-from-bottom-5 duration-500">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">The Podium Select</h2>
          
          {loadingRegs ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-500" size={40}/></div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12 bg-white/2 rounded-2xl border border-dashed border-white/10">
               <AlertCircle className="mx-auto text-gray-600 mb-2" size={32} />
               <p className="text-gray-500 font-medium text-sm">No regular participants detected. Results cannot be declared without players.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {[
                { pos: 'first', label: '1st PLACE — CHAMPION', color: 'text-amber-400', border: 'border-amber-400/20' },
                { pos: 'second', label: '2nd PLACE — RUNNER UP', color: 'text-gray-300', border: 'border-gray-300/20' },
                { pos: 'third', label: '3rd PLACE — SECOND RUNNER UP', color: 'text-orange-400', border: 'border-orange-400/20' }
              ].map(({ pos, label, color, border }) => (
                <div key={pos} className={`p-4 rounded-2xl border bg-surface-900 shadow-xl ${border}`}>
                  <label className={`block text-[10px] font-black tracking-widest uppercase mb-2 ${color}`}>{label}</label>
                  <select value={winners[pos]} onChange={e => setWinners({...winners, [pos]: e.target.value})}
                    className="w-full bg-transparent text-white font-bold outline-none text-sm transition appearance-none">
                    <option value="" className="bg-surface-900">-- SELECT WINNER --</option>
                    {registrations.map(r => (
                      <option key={r.registration_id} value={r.user_id} className="bg-surface-900">
                        {r.first_name} {r.last_name} ({r.college_code})
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {message && (
                <div className={`p-5 rounded-2xl text-sm font-bold flex items-center gap-3 ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                   {message.includes('success') ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                   {message}
                </div>
              )}

              <button onClick={handleSubmitResults} disabled={saving}
                className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                {saving ? <><Loader2 size={18} className="animate-spin"/> TRANSMITTING...</> : 'OFFICIAL SUBMIT RESULT'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
