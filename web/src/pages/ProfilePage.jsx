import { useState, useEffect } from 'react'
import { User, Mail, Phone, Building2, Calendar, Save, Edit2, Loader2 } from 'lucide-react'
import api from '../api/axios'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('nexus_user')
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      setForm({ first_name: u.first_name || '', last_name: u.last_name || '', phone: u.phone || '' })
    }
    api.get('/registrations/my')
      .then(res => setRegistrations(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-nexus-400" size={48}/></div>

  const initials = (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-display text-white">Profile</h1>

      {/* Profile Card */}
      <div className="relative p-8 rounded-2xl bg-gradient-to-br from-surface-700/60 to-surface-800/40 border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-nexus-400/5 blur-[60px]" />
        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white text-3xl font-bold font-display">{initials}</div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-white">{user?.first_name} {user?.last_name}</h2>
            <p className="text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-nexus-400/15 text-nexus-400">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5 space-y-4">
          <h3 className="font-bold text-white text-sm">Quick Stats</h3>
          {[
            { label: 'Events Registered', value: registrations.length, color: 'text-cyan-400' },
            { label: 'Confirmed', value: registrations.filter(r => r.status === 'confirmed').length, color: 'text-green-400' },
            { label: 'Upcoming', value: registrations.filter(r => new Date(r.start_datetime) > new Date()).length, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-gray-400">{s.label}</span>
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Personal Info */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-700/30 border border-white/5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Personal Information</h3>
            <button onClick={() => setEditing(!editing)} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white transition flex items-center gap-1.5">
              {editing ? <><Save size={12}/> Save</> : <><Edit2 size={12}/> Edit</>}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: User, label: 'First Name', value: form.first_name, key: 'first_name' },
              { icon: User, label: 'Last Name', value: form.last_name, key: 'last_name' },
              { icon: Mail, label: 'Email', value: user?.email || '', disabled: true },
              { icon: Phone, label: 'Phone', value: form.phone, key: 'phone' },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">{field.label}</label>
                <div className="relative">
                  <field.icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={field.value} disabled={!editing || field.disabled}
                    onChange={e => field.key && setForm(p => ({...p, [field.key]: e.target.value}))}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border transition-all ${editing && !field.disabled ? 'bg-surface-700/50 border-white/10 text-white focus:outline-none focus:border-nexus-400/50' : 'bg-surface-800/30 border-transparent text-gray-400'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Registrations */}
      <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5">
        <h3 className="font-bold text-white text-sm mb-4">My Registrations</h3>
        {registrations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No registrations yet. Go to Events to register!</p>
        ) : (
          <div className="space-y-2">
            {registrations.map(r => (
              <div key={r.registration_id} className="flex items-center justify-between p-4 rounded-xl bg-surface-800/40 border border-white/5">
                <div>
                  <h4 className="text-sm font-bold text-white">{r.event_name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{new Date(r.start_datetime).toLocaleDateString()} • {r.category_name}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  r.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                  r.status === 'waitlisted' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>{r.status?.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
