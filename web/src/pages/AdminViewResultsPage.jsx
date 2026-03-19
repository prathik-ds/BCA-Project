import { useState, useEffect } from 'react'
import { Trophy, Award, Star, Search, Loader2, Calendar, Edit2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function AdminViewResultsPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadResults = async () => {
    setLoading(true)
    try {
      const res = await api.get('/results')
      setResults(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [])

  const filtered = results.filter(r => 
    r.event_name.toLowerCase().includes(search.toLowerCase()) ||
    r.category_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-amber-500" size={48}/></div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-surface-800 p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Trophy className="text-amber-500" size={28}/> Result Preview
          </h1>
          <p className="text-gray-400 text-sm mt-1">Review all declared winners across events.</p>
        </div>
        
        <div className="relative w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
           <input 
             value={search} onChange={e => setSearch(e.target.value)}
             placeholder="Search by event..."
             className="w-full pl-10 pr-4 py-2 bg-surface-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
           />
        </div>
      </div>

      <div className="bg-surface-800 rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Event Name</th>
              <th className="px-6 py-4 text-center">1st Place</th>
              <th className="px-6 py-4 text-center">2nd Place</th>
              <th className="px-6 py-4 text-center">3rd Place</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(event => (
              <tr key={event.event_id} className="hover:bg-white/5 transition group">
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{event.event_name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{event.category_name}</div>
                </td>
                
                {['first', 'second', 'third'].map(pos => {
                  const winner = event.winners?.find(w => w.position === pos);
                  const colors = { first: 'text-amber-400', second: 'text-gray-300', third: 'text-orange-400' };
                  
                  return (
                    <td key={pos} className="px-6 py-4 text-center">
                      {winner ? (
                        <div className="space-y-0.5">
                          <div className={`text-sm font-bold ${colors[pos]}`}>{winner.winner_name} {winner.last_name || ''}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{winner.college_code}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-700 italic">No entry</span>
                      )}
                    </td>
                  );
                })}

                <td className="px-6 py-4 text-right">
                  <Link to="/admin/results" className="p-2 inline-flex rounded-lg bg-surface-700 hover:bg-amber-500/20 hover:text-amber-500 text-gray-400 transition">
                    <Edit2 size={16}/>
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No results found mapping this criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
