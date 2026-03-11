import { useState } from 'react'
import { Users, Copy, Check, Plus, LogIn, Crown, UserMinus, ChevronRight, X, Mail, Shield } from 'lucide-react'

const mockTeams = [
  { team_id: 1, team_name: 'Byte Bandits', event: { event_id: 1, event_name: 'Code Sprint 2026', category: 'technical' }, invite_code: 'BB-7X9K2M', role: 'leader', members: [
    { user_id: 1, first_name: 'Pratham', last_name: 'Sharma', college: 'MIT ADT University', role: 'leader' },
    { user_id: 2, first_name: 'Neha', last_name: 'Kulkarni', college: 'MIT ADT University', role: 'member' },
    { user_id: 3, first_name: 'Rohan', last_name: 'Mehta', college: 'VIT Pune', role: 'member' },
  ], max_size: 4, created_at: '2026-03-10' },
  { team_id: 2, team_name: 'Circuit Breakers', event: { event_id: 3, event_name: 'Robo Wars', category: 'technical' }, invite_code: 'CB-3P8L5N', role: 'member', members: [
    { user_id: 5, first_name: 'Aditya', last_name: 'Joshi', college: 'COEP Tech', role: 'leader' },
    { user_id: 1, first_name: 'Pratham', last_name: 'Sharma', college: 'MIT ADT University', role: 'member' },
  ], max_size: 5, created_at: '2026-03-08' },
]

const catColors = { technical: 'bg-cyan-400/15 text-cyan-400', cultural: 'bg-pink-400/15 text-pink-400', sports: 'bg-green-400/15 text-green-400', gaming: 'bg-amber-400/15 text-amber-400' }

export default function TeamsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [copied, setCopied] = useState(null)
  const [newTeam, setNewTeam] = useState({ name: '', event_id: '' })
  const [joinCode, setJoinCode] = useState('')

  const copyCode = (code) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 2000) }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">My Teams</h1>
          <p className="text-sm text-gray-500 mt-1">{mockTeams.length} teams joined</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowJoin(true)} className="px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"><LogIn size={16}/> Join Team</button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-nexus-400 to-accent-500 text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all flex items-center gap-2"><Plus size={16}/> Create Team</button>
        </div>
      </div>

      {/* Teams list */}
      <div className="space-y-4">
        {mockTeams.map(team => (
          <div key={team.team_id} className="p-6 rounded-2xl bg-surface-700/30 border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white">{team.team_name}</h3>
                  {team.role === 'leader' && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/15 text-amber-400 flex items-center gap-1"><Crown size={10}/> Leader</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${catColors[team.event.category] || 'bg-white/5 text-gray-400'}`}>{team.event.category}</span>
                  <span className="text-sm text-gray-400">{team.event.event_name}</span>
                </div>
              </div>
              {/* Invite code */}
              <button onClick={() => copyCode(team.invite_code)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-600/50 border border-white/5 hover:border-nexus-400/30 transition-all group">
                <code className="text-sm text-nexus-400 font-mono">{team.invite_code}</code>
                {copied === team.invite_code ? <Check size={14} className="text-green-400"/> : <Copy size={14} className="text-gray-500 group-hover:text-nexus-400"/>}
              </button>
            </div>
            {/* Members */}
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs text-gray-500 mr-2">Members ({team.members.length}/{team.max_size})</span>
              <div className="flex-1 h-1 bg-surface-500 rounded-full overflow-hidden"><div className="h-full bg-nexus-400 rounded-full" style={{ width: `${(team.members.length / team.max_size) * 100}%` }}/></div>
            </div>
            <div className="space-y-2">
              {team.members.map(m => (
                <div key={m.user_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-800/40">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-400/30 to-accent-500/30 flex items-center justify-center text-white text-xs font-bold">{m.first_name[0]}{m.last_name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white font-medium">{m.first_name} {m.last_name}</span>
                    <span className="text-xs text-gray-500 ml-2">{m.college}</span>
                  </div>
                  {m.role === 'leader' && <Crown size={14} className="text-amber-400"/>}
                  {team.role === 'leader' && m.role !== 'leader' && <button className="text-gray-600 hover:text-red-400 transition-colors"><UserMinus size={14}/></button>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      {showCreate && (
        <Modal title="Create a Team" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Team Name</label><input className="w-full px-4 py-3 rounded-xl bg-surface-700/50 border border-white/10 text-white text-sm focus:outline-none focus:border-nexus-400/50 transition-all" placeholder="e.g. Byte Bandits" value={newTeam.name} onChange={e => setNewTeam(p => ({...p, name: e.target.value}))}/></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Select Event</label><select className="w-full px-4 py-3 rounded-xl bg-surface-700/50 border border-white/10 text-white text-sm focus:outline-none focus:border-nexus-400/50 transition-all"><option value="">Choose an event...</option><option>Code Sprint 2026</option><option>Robo Wars</option><option>Quiz Masters</option></select></div>
            <button className="w-full py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all">Create Team</button>
          </div>
        </Modal>
      )}

      {/* Join Team Modal */}
      {showJoin && (
        <Modal title="Join a Team" onClose={() => setShowJoin(false)}>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Invite Code</label><input className="w-full px-4 py-3 rounded-xl bg-surface-700/50 border border-white/10 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-nexus-400/50 transition-all" placeholder="XX-XXXXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}/></div>
            <button className="w-full py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all">Join Team</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-surface-700 border border-white/10 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}
