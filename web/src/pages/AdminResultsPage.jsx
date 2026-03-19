import { useState, useEffect } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import api from '../api/axios'

export default function AdminResultsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [winners, setWinners] = useState({ first: '', second: '', third: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/events')
      .then(res => setEvents(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
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
      setMessage('Results saved successfully!')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save results')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-amber-500" size={48}/></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3"><ShieldCheck className="text-amber-400" size={28}/> Update Results</h1>

      {/* Event Selector */}
      <div>
        <label className="block text-gray-400 text-sm mb-2">Select Event</label>
        <select value={selectedEvent || ''} onChange={e => selectEvent(e.target.value)}
          className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition">
          <option value="">-- Choose an event --</option>
          {events.map(e => <option key={e.event_id} value={e.event_id}>{e.event_name}</option>)}
        </select>
      </div>

      {selectedEvent && (
        <div className="p-6 bg-surface-800/50 rounded-2xl border border-white/5 space-y-5">
          <h2 className="text-lg font-bold text-white">Assign Winners</h2>
          
          {loadingRegs ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-amber-500" size={32}/></div>
          ) : registrations.length === 0 ? (
            <p className="text-gray-500">No registrations found for this event.</p>
          ) : (
            <div className="space-y-4">
              {['first', 'second', 'third'].map((pos, i) => (
                <div key={pos}>
                  <label className="block text-gray-400 text-sm mb-1.5">{i+1}{['st','nd','rd'][i]} Place</label>
                  <select value={winners[pos]} onChange={e => setWinners({...winners, [pos]: e.target.value})}
                    className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition">
                    <option value="">-- Select participant --</option>
                    {registrations.map(r => (
                      <option key={r.registration_id} value={r.user_id || r.registration_id}>
                        {r.first_name} {r.last_name} ({r.email})
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {message && (
                <div className={`p-3 rounded-xl text-sm ${message.includes('success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {message}
                </div>
              )}

              <button onClick={handleSubmitResults} disabled={saving}
                className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : 'Save Results'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
