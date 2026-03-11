import { Link } from 'react-router-dom'
import { Calendar, Users, Wallet, Award, Clock, MapPin, ArrowRight, TrendingUp, CheckCircle, CreditCard, UserPlus } from 'lucide-react'

/* ── Mock data matching MySQL schema (users, events, registrations, wallets, certificates) ── */
const mockUser = {
  user_id: 1, first_name: 'Pratham', last_name: 'Sharma',
  email: 'pratham@mitadt.edu', role: 'participant',
  college: { college_id: 1, name: 'MIT ADT University', city: 'Pune' },
  department: { dept_name: 'Computer Applications' },
}

const mockStats = {
  registered_events: 5, upcoming_events: 3,
  wallet_balance: 1250.00, certificates_earned: 2,
}

/* Matches: events table + event_registrations table */
const mockUpcoming = [
  { event_id: 7, event_name: 'Code Sprint 2026', category: 'technical', start_datetime: '2026-04-15T09:00:00', venue_name: 'CS Auditorium', registration_count: 87, max_participants: 200 },
  { event_id: 12, event_name: 'Dance Battle Royale', category: 'cultural', start_datetime: '2026-04-15T14:00:00', venue_name: 'Main Stage', registration_count: 45, max_participants: 100 },
  { event_id: 18, event_name: 'Quiz Masters', category: 'academic', start_datetime: '2026-04-16T10:00:00', venue_name: 'Seminar Hall B', registration_count: 64, max_participants: 100 },
]

/* Matches: various tables activity log */
const mockActivity = [
  { type: 'registration', message: 'Registered for Robo Wars', time: '2 hours ago', icon: CheckCircle, color: 'text-green-400' },
  { type: 'wallet', message: 'Wallet topped up ₹500', time: '5 hours ago', icon: CreditCard, color: 'text-cyan-400' },
  { type: 'team', message: 'Joined team "Byte Bandits"', time: '1 day ago', icon: UserPlus, color: 'text-purple-400' },
  { type: 'registration', message: 'Registered for Code Sprint', time: '2 days ago', icon: CheckCircle, color: 'text-green-400' },
  { type: 'wallet', message: 'Paid ₹80 at Food Court', time: '3 days ago', icon: CreditCard, color: 'text-amber-400' },
]

const categoryColors = {
  technical: 'bg-cyan-400/15 text-cyan-400',
  cultural: 'bg-pink-400/15 text-pink-400',
  academic: 'bg-blue-400/15 text-blue-400',
  sports: 'bg-green-400/15 text-green-400',
  gaming: 'bg-amber-400/15 text-amber-400',
}

export default function DashboardPage() {
  const stats = [
    { icon: Calendar, label: 'Registered Events', value: mockStats.registered_events, color: 'from-cyan-400 to-blue-500', link: '/events' },
    { icon: Clock, label: 'Upcoming', value: mockStats.upcoming_events, color: 'from-purple-400 to-pink-500', link: '/schedule' },
    { icon: Wallet, label: 'Wallet Balance', value: `₹${mockStats.wallet_balance.toLocaleString()}`, color: 'from-green-400 to-emerald-500', link: '/wallet' },
    { icon: Award, label: 'Certificates', value: mockStats.certificates_earned, color: 'from-amber-400 to-orange-500', link: '/certificates' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Card */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-surface-700/60 to-surface-700/30 border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-nexus-400/5 blur-[60px]" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mb-1">
            Welcome back, {mockUser.first_name}! 👋
          </h1>
          <p className="text-gray-400">
            {mockUser.college.name} • {mockUser.department.dept_name}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color, link }, i) => (
          <Link to={link} key={label}
            className="group p-5 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold font-display text-white mb-0.5">{value}</div>
            <div className="text-xs text-gray-500 font-medium">{label}</div>
          </Link>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Upcoming Events — 3 cols */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-surface-700/30 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white font-display">Upcoming Events</h2>
            <Link to="/events" className="text-xs text-nexus-400 hover:underline flex items-center gap-1">View all <ArrowRight size={12}/></Link>
          </div>
          <div className="space-y-3">
            {mockUpcoming.map(evt => (
              <Link to={`/events/${evt.event_id}`} key={evt.event_id}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/40 hover:bg-surface-600/40 border border-white/5 hover:border-white/10 transition-all group">
                {/* Date badge */}
                <div className="w-14 h-14 rounded-xl bg-surface-700 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs text-nexus-400 font-semibold">{new Date(evt.start_datetime).toLocaleDateString('en', { month: 'short' })}</span>
                  <span className="text-lg font-bold text-white">{new Date(evt.start_datetime).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm group-hover:text-nexus-400 transition-colors truncate">{evt.event_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColors[evt.category]}`}>{evt.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={11}/> {new Date(evt.start_datetime).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1"><MapPin size={11}/> {evt.venue_name}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-xs text-gray-500">{evt.registration_count}/{evt.max_participants}</div>
                  <div className="w-16 h-1 bg-surface-500 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-nexus-400 rounded-full" style={{ width: `${(evt.registration_count / evt.max_participants) * 100}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity — 2 cols */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-700/30 border border-white/5">
          <h2 className="text-lg font-bold text-white font-display mb-5">Recent Activity</h2>
          <div className="space-y-4">
            {mockActivity.map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center shrink-0 ${act.color}`}>
                  <act.icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">{act.message}</p>
                  <span className="text-xs text-gray-600">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
