import { useState, useEffect } from 'react'
import { Trophy, Award, Star, Search, Filter, Loader2, Calendar } from 'lucide-react'
import api from '../api/axios'

const positionStyles = {
  first: { 
    icon: Trophy, 
    color: 'text-amber-400', 
    bg: 'bg-amber-400/10', 
    border: 'border-amber-400/20',
    label: '1st Place'
  },
  second: { 
    icon: Award, 
    color: 'text-gray-300', 
    bg: 'bg-gray-300/10', 
    border: 'border-gray-300/20',
    label: '2nd Place'
  },
  third: { 
    icon: Star, 
    color: 'text-orange-400', 
    bg: 'bg-orange-400/10', 
    border: 'border-orange-400/20',
    label: '3rd Place'
  }
}

export default function ResultsPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/results')
      .then(res => setResults(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredResults = results.filter(r => 
    r.event_name.toLowerCase().includes(search.toLowerCase()) ||
    r.category_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-nexus-400" size={48} />
        <p className="text-gray-500 font-medium">Fetching contest results...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-br from-surface-700/60 to-surface-800/40 border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-nexus-400/5 blur-[80px]" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-400/10 text-nexus-400 text-xs font-bold uppercase tracking-widest">
              <Trophy size={14} /> Official Announcements
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-white">Event Results</h1>
            <p className="text-gray-400 max-w-md">Celebrating the champions of NexusFest 2026. Congratulations to all participants!</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search results..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-nexus-400/50 transition-all"
            />
          </div>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="text-center py-20 bg-surface-700/20 rounded-3xl border border-white/5">
          <Award className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white">No results found</h3>
          <p className="text-gray-500 mt-2">Try searching for a different event or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map(event => (
            <div key={event.event_id} className="group relative bg-surface-800/40 border border-white/5 rounded-3xl overflow-hidden hover:border-nexus-400/30 transition-all duration-300 hover:-translate-y-1">
              {/* Category Badge */}
              <div className="absolute top-4 right-4 z-10">
                <span className="px-2.5 py-1 rounded-lg bg-surface-900/80 backdrop-blur-md text-[10px] font-bold text-gray-400 border border-white/5 uppercase">
                  {event.category_name}
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-nexus-400 transition-colors line-clamp-1">{event.event_name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Calendar size={12} /> {new Date(event.start_datetime).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-3">
                  {['first', 'second', 'third'].map(pos => {
                    const winner = event.winners?.find(w => w.position === pos);
                    const style = positionStyles[pos];
                    
                    return (
                      <div key={pos} className={`flex items-center gap-3 p-3 rounded-2xl border ${winner ? style.bg + ' ' + style.border : 'bg-white/2 border-white/5 opacity-40'}`}>
                        <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.color} flex items-center justify-center shrink-0`}>
                          <style.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{style.label}</div>
                          {winner ? (
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-white truncate">{winner.winner_name} {winner.last_name || ''}</span>
                                <span className="text-[10px] font-mono text-gray-400 shrink-0">{winner.college_code}</span>
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-gray-600">No winner declared</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-white/2 border-t border-white/5 flex justify-center">
                 <button className="text-xs font-bold text-nexus-400 hover:text-white transition-colors">View Detailed Scoreboard</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
