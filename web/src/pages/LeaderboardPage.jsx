import { useState, useEffect } from 'react'
import { Trophy, ChevronUp, ChevronDown, Minus, RefreshCw, Building2, Users, GraduationCap } from 'lucide-react'

/* ── Mock data matching MySQL leaderboard + colleges + departments tables ── */
const mockColleges = [
  { rank: 1, college_name: 'COEP Technological University', college_code: 'COEP', city: 'Pune', total_points: 2450, events_won: 12, events_participated: 28, change: 'up' },
  { rank: 2, college_name: 'MIT ADT University', college_code: 'MITADT', city: 'Pune', total_points: 2180, events_won: 10, events_participated: 32, change: 'up' },
  { rank: 3, college_name: 'VIT Pune', college_code: 'VIT', city: 'Pune', total_points: 1950, events_won: 8, events_participated: 25, change: 'down' },
  { rank: 4, college_name: 'Symbiosis Institute of Technology', college_code: 'SIT', city: 'Pune', total_points: 1740, events_won: 7, events_participated: 22, change: 'same' },
  { rank: 5, college_name: 'PICT Pune', college_code: 'PICT', city: 'Pune', total_points: 1520, events_won: 6, events_participated: 20, change: 'up' },
  { rank: 6, college_name: 'Sinhgad College of Engineering', college_code: 'SCOE', city: 'Pune', total_points: 1380, events_won: 5, events_participated: 18, change: 'down' },
  { rank: 7, college_name: 'Cummins College of Engineering', college_code: 'CCEW', city: 'Pune', total_points: 1200, events_won: 4, events_participated: 15, change: 'same' },
  { rank: 8, college_name: 'Bharati Vidyapeeth COE', college_code: 'BVCOE', city: 'Pune', total_points: 980, events_won: 3, events_participated: 14, change: 'up' },
]

const mockDepartments = [
  { rank: 1, dept_name: 'Computer Science', college: 'COEP Tech', total_points: 890, events_won: 5, events_participated: 12, change: 'up' },
  { rank: 2, dept_name: 'Computer Applications', college: 'MIT ADT', total_points: 780, events_won: 4, events_participated: 14, change: 'up' },
  { rank: 3, dept_name: 'Information Technology', college: 'VIT Pune', total_points: 720, events_won: 3, events_participated: 10, change: 'same' },
  { rank: 4, dept_name: 'Electronics & Comm.', college: 'COEP Tech', total_points: 650, events_won: 3, events_participated: 9, change: 'down' },
  { rank: 5, dept_name: 'Mechanical Engg.', college: 'Symbiosis', total_points: 580, events_won: 2, events_participated: 8, change: 'up' },
  { rank: 6, dept_name: 'Data Science', college: 'MIT ADT', total_points: 520, events_won: 2, events_participated: 7, change: 'same' },
  { rank: 7, dept_name: 'AI & ML', college: 'PICT', total_points: 480, events_won: 2, events_participated: 8, change: 'up' },
  { rank: 8, dept_name: 'Computer Engg.', college: 'Sinhgad', total_points: 410, events_won: 1, events_participated: 6, change: 'down' },
]

const mockIndividual = [
  { rank: 1, name: 'Aditya Joshi', college: 'COEP Tech', dept: 'CS', points: 340, events: 6, change: 'up' },
  { rank: 2, name: 'Sneha Patil', college: 'MIT ADT', dept: 'BCA', points: 310, events: 5, change: 'same' },
  { rank: 3, name: 'Rahul Verma', college: 'VIT Pune', dept: 'IT', points: 280, events: 7, change: 'down' },
  { rank: 4, name: 'Pratham Sharma', college: 'MIT ADT', dept: 'BCA', points: 250, events: 5, change: 'up', isCurrentUser: true },
  { rank: 5, name: 'Priya Deshmukh', college: 'Symbiosis', dept: 'CS', points: 220, events: 4, change: 'same' },
  { rank: 6, name: 'Karan Singh', college: 'PICT', dept: 'AIML', points: 195, events: 4, change: 'up' },
  { rank: 7, name: 'Neha Kulkarni', college: 'MIT ADT', dept: 'BCA', points: 180, events: 3, change: 'down' },
  { rank: 8, name: 'Rohan Mehta', college: 'VIT Pune', dept: 'IT', points: 165, events: 4, change: 'same' },
]

const podiumStyles = [
  { bg: 'from-amber-400/20 to-amber-600/5', border: 'border-amber-400/40', text: 'text-amber-400', icon: '🥇' },
  { bg: 'from-gray-300/15 to-gray-500/5', border: 'border-gray-400/30', text: 'text-gray-300', icon: '🥈' },
  { bg: 'from-orange-400/15 to-orange-600/5', border: 'border-orange-400/30', text: 'text-orange-400', icon: '🥉' },
]

const tabs = [
  { key: 'colleges', label: 'Colleges', icon: Building2 },
  { key: 'departments', label: 'Departments', icon: GraduationCap },
  { key: 'individual', label: 'Individual', icon: Users },
  { key: 'technical', label: 'Technical', icon: null },
  { key: 'cultural', label: 'Cultural', icon: null },
  { key: 'sports', label: 'Sports', icon: null },
]

const ChangeArrow = ({ change }) =>
  change === 'up' ? <ChevronUp size={14} className="text-green-400" /> :
  change === 'down' ? <ChevronDown size={14} className="text-red-400" /> :
  <Minus size={12} className="text-gray-600" />

export default function LeaderboardPage() {
  const [tab, setTab] = useState('colleges')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  // Simulated live refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => { setRefreshing(false); setLastUpdated(new Date()) }, 800)
  }

  const getData = () => {
    if (tab === 'colleges') return mockColleges
    if (tab === 'departments') return mockDepartments
    return mockIndividual
  }

  const data = getData()

  // Map top 3 in podium order: [2nd, 1st, 3rd]
  const podiumOrder = data.length >= 3 ? [data[1], data[0], data[2]] : data.slice(0, 3)
  const podiumIdx = [1, 0, 2]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-1">Inter-college rankings • {lastUpdated.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh}
            className={`p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw size={16} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${tab === t.key ? 'bg-nexus-400/15 text-nexus-400 border border-nexus-400/30' : 'bg-surface-700/40 text-gray-400 border border-white/5 hover:text-white'}`}>
            {t.icon && <t.icon size={14} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Podium — Top 3 */}
      <div className="grid grid-cols-3 gap-4">
        {podiumOrder.map((entry, i) => {
          const idx = podiumIdx[i]
          const style = podiumStyles[idx]
          const name = tab === 'colleges' ? entry.college_name || entry.college :
                       tab === 'departments' ? entry.dept_name : entry.name
          const sub = tab === 'colleges' ? entry.city :
                      tab === 'departments' ? entry.college : entry.college
          const pts = entry.total_points || entry.points
          return (
            <div key={idx} className={`p-5 rounded-2xl bg-gradient-to-b ${style.bg} border ${style.border} text-center transition-all hover:-translate-y-1 hover:shadow-lg ${idx === 0 ? 'sm:-mt-4' : ''}`}>
              <div className="text-3xl mb-2">{style.icon}</div>
              <div className={`text-base font-bold ${style.text} mb-0.5 truncate`}>{name}</div>
              <div className="text-xs text-gray-500 mb-2">{sub}</div>
              <div className="text-2xl font-black font-display text-white">{pts.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Points</div>
            </div>
          )
        })}
      </div>

      {/* Full Rankings Table */}
      <div className="rounded-2xl bg-surface-700/30 border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-white/5 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-5">{tab === 'colleges' ? 'College' : tab === 'departments' ? 'Department' : 'Participant'}</div>
          <div className="col-span-2 text-center">Points</div>
          <div className="col-span-2 text-center">Won</div>
          <div className="col-span-2 text-center">Events</div>
        </div>
        {data.map((entry, i) => {
          const isMe = entry.isCurrentUser
          return (
            <div key={i} className={`grid grid-cols-12 gap-2 px-6 py-4 items-center hover:bg-surface-600/20 transition-all ${i < 3 ? 'bg-surface-700/20' : ''} ${isMe ? 'bg-nexus-400/5 border-l-2 border-nexus-400' : ''}`}>
              <div className="col-span-1 flex items-center gap-1">
                <span className={`text-sm font-bold ${i < 3 ? 'text-white' : 'text-gray-500'}`}>{entry.rank}</span>
                <ChangeArrow change={entry.change} />
              </div>
              <div className="col-span-5">
                <div className="text-sm font-medium text-white flex items-center gap-1.5">
                  {tab === 'colleges' ? entry.college_name : tab === 'departments' ? entry.dept_name : entry.name}
                  {isMe && <span className="px-1.5 py-0.5 rounded text-[9px] bg-nexus-400/20 text-nexus-400 font-bold">YOU</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {tab === 'colleges' ? `${entry.college_code} • ${entry.city}` : tab === 'departments' ? entry.college : `${entry.college} • ${entry.dept}`}
                </div>
              </div>
              <div className="col-span-2 text-center text-sm font-bold text-nexus-400">{(entry.total_points || entry.points).toLocaleString()}</div>
              <div className="col-span-2 text-center text-sm text-gray-300">{entry.events_won ?? '-'}</div>
              <div className="col-span-2 text-center text-sm text-gray-400">{entry.events_participated || entry.events}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
