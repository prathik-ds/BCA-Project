import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Calendar, ScanLine, Trophy, Users, Clock, ArrowRight, Loader2, CheckCircle, AlertCircle, Siren } from 'lucide-react'
import api from '../api/axios'
import { motion, AnimatePresence } from 'framer-motion'
import LoadingScreen from '../components/LoadingScreen'

export default function CoordinatorDashboardPage() {
  const [stats, setStats] = useState({ myEvents: 0, totalParticipants: 0, activeEvents: 0 })
  const [assignedEvents, setAssignedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('nexus_user')
    if (stored) setUser(JSON.parse(stored))

    const loadData = async () => {
      try {
        const u = JSON.parse(stored)
        const res = await api.get('/events')
        const allEvts = res.data.data || []
        const myEvts = allEvts.filter(e => Number(e.coordinator_id) === Number(u.user_id))
        
        setAssignedEvents(myEvts)
        setStats({
          myEvents: myEvts.length,
          totalParticipants: myEvts.reduce((sum, e) => sum + (parseInt(e.registered_count) || 0), 0),
          activeEvents: myEvts.filter(e => e.status === 'published' || e.status === 'ongoing').length
        })
      } catch (err) {
        console.error(err)
      } finally {
        setTimeout(() => setLoading(false), 800)
      }
    }
    loadData()
  }, [])

  if (loading) return <LoadingScreen />

  const quickActions = [
    { label: 'Scan Participants', link: '/coordinator/scanner', icon: ScanLine, color: 'bg-indigo-500', desc: 'Verify QR codes for attendance' },
    { label: 'Assign Winners', link: '/coordinator/results', icon: Trophy, color: 'bg-amber-500', desc: 'Declare results for completed events' },
    { label: 'Verify List', link: '/coordinator/events', icon: Users, color: 'bg-emerald-500', desc: 'Manually check participant names' },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <motion.div 
      initial="hidden" animate="show" variants={container}
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={item} className="relative p-8 rounded-3xl bg-surface-800 border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-500/5 blur-[80px]" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-display text-white">Hello, {user?.first_name || 'Coordinator'}!</h1>
            <p className="text-gray-400">Everything looks ready for your assigned events today.</p>
          </div>
          <div className="flex gap-4">
             <div className="px-5 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="text-xs font-bold text-indigo-400 uppercase mb-1">My Events</div>
                <div className="text-2xl font-bold text-white leading-none">{stats.myEvents}</div>
             </div>
             <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs font-bold text-emerald-400 uppercase mb-1">Participants</div>
                <div className="text-2xl font-bold text-white leading-none">{stats.totalParticipants}</div>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Action Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map(action => (
          <Link key={action.label} to={action.link} className="p-6 rounded-3xl bg-surface-800 border border-white/5 hover:border-white/10 transition-all group">
            <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <action.icon size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{action.label}</h3>
            <p className="text-xs text-gray-500 mb-4">{action.desc}</p>
            <div className="flex items-center text-xs font-bold text-indigo-400 gap-1 group-hover:gap-2 transition-all">
              Go to Page <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Lower Section Grid */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Events Summary (Left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock size={20} className="text-indigo-400"/> Live Event Monitoring
          </h2>
          
          {assignedEvents.length === 0 ? (
            <div className="p-12 text-center bg-surface-800/40 rounded-3xl border border-white/5 border-dashed">
               <AlertCircle className="mx-auto text-gray-600 mb-3" size={32} />
               <p className="text-gray-500">No events assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedEvents.map(evt => (
                <div key={evt.event_id} className="p-6 rounded-3xl bg-surface-800 border border-white/5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs ring-4 ring-indigo-500/5">
                        {evt.event_name[0]}
                      </div>
                      <div>
                        <h3 className="text-white font-bold">{evt.event_name}</h3>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{evt.venue_name || 'Main Hall'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${
                      evt.status === 'published' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      evt.status === 'ongoing' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {evt.status?.toUpperCase()}
                    </span>
                  </div>

                  {/* Attendance Bar Simulation (In real app, fetch actual check_in count) */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                       <span className="text-gray-400 uppercase">Check-in Progress</span>
                       <span className="text-white">{(parseInt(evt.registered_count) || 0)} Total</span>
                    </div>
                    <div className="h-2 w-full bg-surface-900 rounded-full overflow-hidden border border-white/5">
                       <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-surface-800 bg-surface-700"></div>)}
                        <div className="w-6 h-6 rounded-full border-2 border-surface-800 bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">+{evt.registered_count}</div>
                     </div>
                     <Link to="/coordinator/events" className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">Manage Controls <ArrowRight size={12}/></Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coordinator Checklist (Right 1/3) */}
        <div className="space-y-6">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-400"/> Tasks
           </h2>
           <div className="p-6 rounded-3xl bg-surface-800 border border-white/5 space-y-4">
              {[
                { label: 'Check venue readiness', done: true },
                { label: 'Verify sound system', done: true },
                { label: 'Commence QR scanning', done: false },
                { label: 'Start event on portal', done: false },
                { label: 'Declare final winners', done: false }
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-3 group cursor-pointer">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${task.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/10 group-hover:border-indigo-500'}`}>
                    {task.done && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span className={`text-sm ${task.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{task.label}</span>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-white/5">
                 <p className="text-[10px] text-gray-500 text-center italic">"Excellence is not an act, but a habit."</p>
              </div>
           </div>

           <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><Siren size={48}/></div>
              <h4 className="text-sm font-bold text-indigo-400 mb-1">Need help?</h4>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">Contact your Department Head or the Admin team immediately for any venue issues.</p>
              <button className="w-full py-2 bg-indigo-500 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-indigo-500/20">QUICK SUPPORT</button>
           </div>
         </div>
      </motion.div>
    </motion.div>
  )
}
