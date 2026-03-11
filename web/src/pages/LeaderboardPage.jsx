import { useState } from 'react'
import { Trophy, Medal, TrendingUp, Filter, ChevronUp, ChevronDown, Minus } from 'lucide-react'

const mockColleges = [
  { rank: 1, college_name: 'COEP Technological University', city: 'Pune', total_points: 2450, events_won: 12, events_participated: 28, change: 'up' },
  { rank: 2, college_name: 'MIT ADT University', city: 'Pune', total_points: 2180, events_won: 10, events_participated: 32, change: 'up' },
  { rank: 3, college_name: 'VIT Pune', city: 'Pune', total_points: 1950, events_won: 8, events_participated: 25, change: 'down' },
  { rank: 4, college_name: 'Symbiosis Institute of Technology', city: 'Pune', total_points: 1740, events_won: 7, events_participated: 22, change: 'same' },
  { rank: 5, college_name: 'PICT Pune', city: 'Pune', total_points: 1520, events_won: 6, events_participated: 20, change: 'up' },
  { rank: 6, college_name: 'Sinhgad College of Engineering', city: 'Pune', total_points: 1380, events_won: 5, events_participated: 18, change: 'down' },
  { rank: 7, college_name: 'Cummins College of Engineering', city: 'Pune', total_points: 1200, events_won: 4, events_participated: 15, change: 'same' },
  { rank: 8, college_name: 'Bharati Vidyapeeth COE', city: 'Pune', total_points: 980, events_won: 3, events_participated: 14, change: 'up' },
]

const mockIndividual = [
  { rank: 1, name: 'Aditya Joshi', college: 'COEP Tech', points: 340, events: 6 },
  { rank: 2, name: 'Sneha Patil', college: 'MIT ADT', points: 310, events: 5 },
  { rank: 3, name: 'Rahul Verma', college: 'VIT Pune', points: 280, events: 7 },
  { rank: 4, name: 'Pratham Sharma', college: 'MIT ADT', points: 250, events: 5 },
  { rank: 5, name: 'Priya Deshmukh', college: 'Symbiosis', points: 220, events: 4 },
  { rank: 6, name: 'Karan Singh', college: 'PICT', points: 195, events: 4 },
  { rank: 7, name: 'Neha Kulkarni', college: 'MIT ADT', points: 180, events: 3 },
  { rank: 8, name: 'Rohan Mehta', college: 'VIT Pune', points: 165, events: 4 },
]

const podiumStyles = [
  { bg: 'from-amber-400/20 to-amber-600/5', border: 'border-amber-400/40', text: 'text-amber-400', icon: '🥇', size: 'p-6' },
  { bg: 'from-gray-300/15 to-gray-500/5', border: 'border-gray-400/30', text: 'text-gray-300', icon: '🥈', size: 'p-5' },
  { bg: 'from-orange-400/15 to-orange-600/5', border: 'border-orange-400/30', text: 'text-orange-400', icon: '🥉', size: 'p-5' },
]

export default function LeaderboardPage() {
  const [tab, setTab] = useState('colleges')
  const tabs = ['colleges', 'individual', 'technical', 'cultural', 'sports']

  const ChangeIcon = ({ change }) => change === 'up' ? <ChevronUp size={14} className="text-green-400"/> : change === 'down' ? <ChevronDown size={14} className="text-red-400"/> : <Minus size={12} className="text-gray-600"/>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-1">Inter-college rankings • Live updated</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/20">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
          <span className="text-xs text-green-400 font-medium">Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${tab === t ? 'bg-nexus-400/15 text-nexus-400 border border-nexus-400/30' : 'bg-surface-700/40 text-gray-400 border border-white/5 hover:text-white'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Podium — Top 3 */}
      <div className="grid grid-cols-3 gap-4">
        {(tab === 'colleges' ? mockColleges : mockIndividual).slice(0, 3).map((item, i) => {
          const order = [1, 0, 2]
          const idx = order[i]
          const entry = (tab === 'colleges' ? mockColleges : mockIndividual)[idx]
          const style = podiumStyles[idx]
          return (
            <div key={idx} className={`${style.size} rounded-2xl bg-gradient-to-b ${style.bg} border ${style.border} text-center transition-all hover:-translate-y-1 hover:shadow-lg ${idx === 0 ? 'sm:-mt-4' : ''}`}>
              <div className="text-3xl mb-2">{style.icon}</div>
              <div className={`text-lg font-bold ${style.text} mb-1`}>{tab === 'colleges' ? entry.college_name : entry.name}</div>
              {tab === 'colleges' && <div className="text-xs text-gray-500 mb-2">{entry.city}</div>}
              {tab !== 'colleges' && <div className="text-xs text-gray-500 mb-2">{entry.college}</div>}
              <div className="text-2xl font-black font-display text-white">{tab === 'colleges' ? entry.total_points : entry.points}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Points</div>
            </div>
          )
        })}
      </div>

      {/* Full Rankings Table */}
      <div className="rounded-2xl bg-surface-700/30 border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-white/5 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-5">{tab === 'colleges' ? 'College' : 'Participant'}</div>
          <div className="col-span-2 text-center">Points</div>
          <div className="col-span-2 text-center">Won</div>
          <div className="col-span-2 text-center">Events</div>
        </div>
        {(tab === 'colleges' ? mockColleges : mockIndividual).map((entry, i) => (
          <div key={i} className={`grid grid-cols-12 gap-2 px-6 py-4 items-center hover:bg-surface-600/20 transition-all ${i < 3 ? 'bg-surface-700/20' : ''} ${entry.rank === 4 || (tab !== 'colleges' && entry.name === 'Pratham Sharma') ? 'bg-nexus-400/5 border-l-2 border-nexus-400' : ''}`}>
            <div className="col-span-1 flex items-center gap-1">
              <span className={`text-sm font-bold ${i < 3 ? 'text-white' : 'text-gray-500'}`}>{entry.rank}</span>
              {tab === 'colleges' && <ChangeIcon change={entry.change}/>}
            </div>
            <div className="col-span-5">
              <div className="text-sm font-medium text-white">{tab === 'colleges' ? entry.college_name : entry.name}</div>
              <div className="text-xs text-gray-500">{tab === 'colleges' ? entry.city : entry.college}</div>
            </div>
            <div className="col-span-2 text-center text-sm font-bold text-nexus-400">{tab === 'colleges' ? entry.total_points : entry.points}</div>
            <div className="col-span-2 text-center text-sm text-gray-300">{tab === 'colleges' ? entry.events_won : '-'}</div>
            <div className="col-span-2 text-center text-sm text-gray-400">{tab === 'colleges' ? entry.events_participated : entry.events}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
