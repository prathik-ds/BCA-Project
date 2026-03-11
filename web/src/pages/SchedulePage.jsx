import { useState } from 'react'
import { Clock, MapPin, Users, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const days = [
  { label: 'Day 1', date: 'Apr 15', day: 'Tuesday' },
  { label: 'Day 2', date: 'Apr 16', day: 'Wednesday' },
  { label: 'Day 3', date: 'Apr 17', day: 'Thursday' },
]

const mockSchedule = {
  'Day 1': [
    { time: '08:00 AM', events: [{ event_id: 7, event_name: 'Basketball 3v3', category: 'sports', venue: 'Basketball Court', duration: '10 hrs', type: 'team' }] },
    { time: '09:00 AM', events: [{ event_id: 1, event_name: 'Code Sprint 2026', category: 'technical', venue: 'CS Auditorium', duration: '8 hrs', type: 'team' }, { event_id: 10, event_name: 'Debate Championship', category: 'academic', venue: 'Seminar Hall A', duration: '4 hrs', type: 'solo' }] },
    { time: '10:00 AM', events: [{ event_id: 11, event_name: 'Singing Competition', category: 'cultural', venue: 'Amphitheatre', duration: '3 hrs', type: 'solo' }] },
    { time: '02:00 PM', events: [{ event_id: 2, event_name: 'Dance Battle Royale', category: 'cultural', venue: 'Main Stage', duration: '4 hrs', type: 'solo' }] },
    { time: '05:00 PM', events: [{ event_id: 12, event_name: 'DJ Night', category: 'cultural', venue: 'Main Stage', duration: '3 hrs', type: 'solo' }] },
  ],
  'Day 2': [
    { time: '09:00 AM', events: [{ event_id: 8, event_name: 'Startup Pitch', category: 'technical', venue: 'Incubation Center', duration: '4 hrs', type: 'team' }] },
    { time: '10:00 AM', events: [{ event_id: 3, event_name: 'Robo Wars', category: 'technical', venue: 'Sports Complex', duration: '6 hrs', type: 'team' }] },
    { time: '12:00 PM', events: [{ event_id: 4, event_name: 'E-Sports: Valorant', category: 'gaming', venue: 'Gaming Arena', duration: '8 hrs', type: 'team' }] },
    { time: '03:00 PM', events: [{ event_id: 13, event_name: 'Stand-up Comedy', category: 'cultural', venue: 'Amphitheatre', duration: '2 hrs', type: 'solo' }] },
  ],
  'Day 3': [
    { time: '06:00 AM', events: [{ event_id: 9, event_name: 'Photography Walk', category: 'cultural', venue: 'Campus Wide', duration: '4 hrs', type: 'solo' }] },
    { time: '09:00 AM', events: [{ event_id: 5, event_name: 'Art Exhibition', category: 'cultural', venue: 'Gallery Hall', duration: '8 hrs', type: 'solo' }] },
    { time: '11:00 AM', events: [{ event_id: 6, event_name: 'Quiz Masters', category: 'academic', venue: 'Seminar Hall B', duration: '3 hrs', type: 'team' }] },
    { time: '04:00 PM', events: [{ event_id: 14, event_name: 'Prize Distribution', category: 'cultural', venue: 'Main Auditorium', duration: '2 hrs', type: 'solo' }] },
  ],
}

const catColors = {
  technical: 'border-l-cyan-400 bg-cyan-400/5', cultural: 'border-l-pink-400 bg-pink-400/5',
  sports: 'border-l-green-400 bg-green-400/5', gaming: 'border-l-amber-400 bg-amber-400/5',
  academic: 'border-l-blue-400 bg-blue-400/5',
}
const catBadge = {
  technical: 'bg-cyan-400/15 text-cyan-400', cultural: 'bg-pink-400/15 text-pink-400',
  sports: 'bg-green-400/15 text-green-400', gaming: 'bg-amber-400/15 text-amber-400',
  academic: 'bg-blue-400/15 text-blue-400',
}

export default function SchedulePage() {
  const [activeDay, setActiveDay] = useState('Day 1')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Event Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">April 15–17, 2026 • 3 days of events</p>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-3">
        {days.map(d => (
          <button key={d.label} onClick={() => setActiveDay(d.label)}
            className={`flex-1 p-4 rounded-2xl text-center transition-all ${activeDay === d.label ? 'bg-nexus-400/10 border-2 border-nexus-400/30' : 'bg-surface-700/30 border border-white/5 hover:bg-surface-600/30'}`}>
            <div className={`text-lg font-bold ${activeDay === d.label ? 'text-nexus-400' : 'text-white'}`}>{d.label}</div>
            <div className="text-xs text-gray-500">{d.date} • {d.day}</div>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-surface-500/50 hidden sm:block" />
        <div className="space-y-6">
          {mockSchedule[activeDay]?.map((slot, si) => (
            <div key={si} className="flex gap-4 sm:gap-6">
              {/* Time */}
              <div className="w-16 sm:w-20 shrink-0 text-right pt-4">
                <span className="text-sm font-semibold text-nexus-400">{slot.time}</span>
              </div>
              {/* Dot */}
              <div className="hidden sm:flex flex-col items-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-nexus-400 mt-5 ring-4 ring-nexus-400/20" />
              </div>
              {/* Event cards */}
              <div className="flex-1 space-y-3">
                {slot.events.map(evt => (
                  <Link to={`/events/${evt.event_id}`} key={evt.event_id}
                    className={`block p-4 rounded-xl border-l-4 ${catColors[evt.category]} border border-white/5 hover:border-white/15 transition-all hover:-translate-y-0.5 group`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${catBadge[evt.category]}`}>{evt.category}</span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1"><Users size={10}/> {evt.type}</span>
                    </div>
                    <h3 className="font-bold text-white group-hover:text-nexus-400 transition-colors">{evt.event_name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={10}/> {evt.venue}</span>
                      <span className="flex items-center gap-1"><Clock size={10}/> {evt.duration}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
