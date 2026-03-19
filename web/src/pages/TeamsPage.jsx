import { useState, useEffect } from 'react'
import { Users, Copy, Check, Plus, LogIn, Crown, X, Loader2 } from 'lucide-react'
import api from '../api/axios'

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [copied, setCopied] = useState(null)
  const [newTeam, setNewTeam] = useState({ team_name: '', event_id: '' })
  const [joinCode, setJoinCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/events').catch(() => ({ data: { data: [] } })),
    ]).then(([evRes]) => {
      setEvents(evRes.data.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const copyCode = (code) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 2000) }

  const handleCreate = async () => {
    if (!newTeam.team_name || !newTeam.event_id) { setError('Please fill all fields'); return }
    setSaving(true); setError('')
    try {
      await api.post('/teams', newTeam)
      setShowCreate(false)
      setNewTeam({ team_name: '', event_id: '' })
      alert('Team created successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team')
    } finally { setSaving(false) }
  }

  const handleJoin = async () => {
    if (!joinCode) { setError('Enter invite code'); return }
    setSaving(true); setError('')
    try {
      await api.post('/teams/join', { invite_code: joinCode })
      setShowJoin(false)
      setJoinCode('')
      alert('Joined team successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join team')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">My Teams</h1>
          <p className="text-sm text-gray-500 mt-1">Create or join teams for team events</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setShowJoin(true); setError('') }} className="px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"><LogIn size={16}/> Join Team</button>
          <button onClick={() => { setShowCreate(true); setError('') }} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-nexus-400 to-accent-500 text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all flex items-center gap-2"><Plus size={16}/> Create Team</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-nexus-400" size={40}/></div>
      ) : (
        <div className="p-8 rounded-2xl bg-surface-700/30 border border-white/5 text-center">
          <Users size={48} className="text-gray-600 mx-auto mb-4"/>
          <p className="text-gray-400 mb-2">Create or join a team using the buttons above.</p>
          <p className="text-xs text-gray-500">Teams will appear here after you create or join one.</p>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}/>
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-surface-700 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Create a Team</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Team Name</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-700/50 border border-white/10 text-white text-sm focus:outline-none focus:border-nexus-400/50 transition-all" placeholder="e.g. Byte Bandits" value={newTeam.team_name} onChange={e => setNewTeam(p => ({...p, team_name: e.target.value}))}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Select Event</label>
                <select value={newTeam.event_id} onChange={e => setNewTeam(p => ({...p, event_id: e.target.value}))} className="w-full px-4 py-3 rounded-xl bg-surface-700/50 border border-white/10 text-white text-sm focus:outline-none focus:border-nexus-400/50 transition-all">
                  <option value="">Choose an event...</option>
                  {events.filter(e => e.event_type === 'team').map(e => <option key={e.event_id} value={e.event_id}>{e.event_name}</option>)}
                </select>
              </div>
              <button onClick={handleCreate} disabled={saving} className="w-full py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={16} className="animate-spin"/> Creating...</> : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowJoin(false)}/>
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-surface-700 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Join a Team</h3>
              <button onClick={() => setShowJoin(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Invite Code</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-700/50 border border-white/10 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-nexus-400/50 transition-all" placeholder="XX-XXXXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}/>
              </div>
              <button onClick={handleJoin} disabled={saving} className="w-full py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={16} className="animate-spin"/> Joining...</> : 'Join Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
