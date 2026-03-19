import { useState, useEffect } from 'react'
import { Trophy, ChevronUp, ChevronDown, Minus, RefreshCw, Building2, Users, Loader2 } from 'lucide-react'
import api from '../api/axios'

const podiumStyles = [
  { bg: 'from-amber-400/20 to-amber-600/5', border: 'border-amber-400/40', text: 'text-amber-400', icon: '🥇' },
  { bg: 'from-gray-300/15 to-gray-500/5', border: 'border-gray-400/30', text: 'text-gray-300', icon: '🥈' },
  { bg: 'from-orange-400/15 to-orange-600/5', border: 'border-orange-400/30', text: 'text-orange-400', icon: '🥉' },
]

export default function LeaderboardPage() {
  const [tab, setTab] = useState('colleges')
  const [collegeData, setCollegeData] = useState([])
  const [individualData, setIndividualData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const [colRes, indRes] = await Promise.all([
        api.get('/leaderboard/colleges').catch(() => ({ data: { data: [] } })),
        api.get('/leaderboard/individual').catch(() => ({ data: { data: [] } })),
      ])
      setCollegeData(colRes.data.data || [])
      setIndividualData(indRes.data.data || [])
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData().finally(() => setRefreshing(false))
  }

  const data = tab === 'colleges' ? collegeData : individualData

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-nexus-400" size={48}/></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-1">Rankings based on event results</p>
        </div>
        <button onClick={handleRefresh}
          className={`p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('colleges')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${tab === 'colleges' ? 'bg-nexus-400/15 text-nexus-400 border border-nexus-400/30' : 'bg-surface-700/40 text-gray-400 border border-white/5 hover:text-white'}`}>
          <Building2 size={14} /> Colleges
        </button>
        <button onClick={() => setTab('individual')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${tab === 'individual' ? 'bg-nexus-400/15 text-nexus-400 border border-nexus-400/30' : 'bg-surface-700/40 text-gray-400 border border-white/5 hover:text-white'}`}>
          <Users size={14} /> Individual
        </button>
      </div>

      {data.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-700/30 border border-white/5 text-center">
          <Trophy size={48} className="text-gray-600 mx-auto mb-4"/>
          <p className="text-gray-500">No leaderboard data yet. Results will appear after events are completed and winners are declared.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {data.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {[data[1], data[0], data[2]].map((entry, i) => {
                const idx = [1, 0, 2][i]
                const style = podiumStyles[idx]
                const name = tab === 'colleges' ? (entry.college_name || entry.name) : (entry.first_name ? `${entry.first_name} ${entry.last_name}` : entry.name)
                const pts = entry.total_points || entry.points || 0
                return (
                  <div key={idx} className={`p-5 rounded-2xl bg-gradient-to-b ${style.bg} border ${style.border} text-center transition-all hover:-translate-y-1 hover:shadow-lg ${idx === 0 ? 'sm:-mt-4' : ''}`}>
                    <div className="text-3xl mb-2">{style.icon}</div>
                    <div className={`text-base font-bold ${style.text} mb-0.5 truncate`}>{name}</div>
                    <div className="text-2xl font-black font-display text-white">{parseInt(pts).toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Points</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Table */}
          <div className="rounded-2xl bg-surface-700/30 border border-white/5 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-white/5 text-xs text-gray-500 font-medium uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-7">{tab === 'colleges' ? 'College' : 'Participant'}</div>
              <div className="col-span-4 text-center">Points</div>
            </div>
            {data.map((entry, i) => {
              const name = tab === 'colleges' ? (entry.college_name || entry.name) : (entry.first_name ? `${entry.first_name} ${entry.last_name}` : entry.name)
              const pts = entry.total_points || entry.points || 0
              return (
                <div key={i} className={`grid grid-cols-12 gap-2 px-6 py-4 items-center hover:bg-surface-600/20 transition-all ${i < 3 ? 'bg-surface-700/20' : ''}`}>
                  <div className="col-span-1">
                    <span className={`text-sm font-bold ${i < 3 ? 'text-white' : 'text-gray-500'}`}>{i + 1}</span>
                  </div>
                  <div className="col-span-7">
                    <div className="text-sm font-medium text-white">{name}</div>
                    {tab === 'colleges' && <div className="text-xs text-gray-500">{entry.college_code || ''}</div>}
                    {tab === 'individual' && <div className="text-xs text-gray-500">{entry.college_name || entry.email || ''}</div>}
                  </div>
                  <div className="col-span-4 text-center text-sm font-bold text-nexus-400">{parseInt(pts).toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
