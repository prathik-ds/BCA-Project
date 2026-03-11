import { useState } from 'react'
import { User, Mail, Phone, Building2, BookOpen, QrCode, Edit2, Camera, Save, Shield, Calendar, MapPin } from 'lucide-react'

const mockProfile = {
  user_id: 1, first_name: 'Pratham', last_name: 'Sharma', email: 'pratham@mitadt.edu', phone: '+91 98765 43210', role: 'participant',
  college: { name: 'MIT ADT University', college_code: 'MITADT', city: 'Pune', state: 'Maharashtra' },
  department: { dept_name: 'Computer Applications' },
  qr_token: 'USR-QR-001-4F7B2E',
  stats: { events_registered: 5, events_attended: 3, certificates: 2, wallet_balance: 1250, team_count: 2 },
  created_at: '2026-02-15',
}

export default function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ first_name: mockProfile.first_name, last_name: mockProfile.last_name, phone: mockProfile.phone })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-display text-white">Profile</h1>

      {/* Profile Card */}
      <div className="relative p-8 rounded-2xl bg-gradient-to-br from-surface-700/60 to-surface-800/40 border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-nexus-400/5 blur-[60px]" />
        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white text-3xl font-bold font-display">{mockProfile.first_name[0]}{mockProfile.last_name[0]}</div>
            <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera size={20} className="text-white"/></button>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-white">{mockProfile.first_name} {mockProfile.last_name}</h2>
            <p className="text-gray-400">{mockProfile.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-nexus-400/15 text-nexus-400">{mockProfile.role}</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400">{mockProfile.college.name}</span>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
            {editing ? <><Save size={14}/> Save</> : <><Edit2 size={14}/> Edit Profile</>}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5 space-y-4">
          <h3 className="font-bold text-white text-sm">Quick Stats</h3>
          {[
            { label: 'Events Registered', value: mockProfile.stats.events_registered, color: 'text-cyan-400' },
            { label: 'Events Attended', value: mockProfile.stats.events_attended, color: 'text-green-400' },
            { label: 'Certificates', value: mockProfile.stats.certificates, color: 'text-amber-400' },
            { label: 'Teams', value: mockProfile.stats.team_count, color: 'text-purple-400' },
            { label: 'Wallet Balance', value: `₹${mockProfile.stats.wallet_balance}`, color: 'text-nexus-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-gray-400">{s.label}</span>
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Personal Info */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-700/30 border border-white/5 space-y-5">
          <h3 className="font-bold text-white text-sm">Personal Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: User, label: 'First Name', value: form.first_name, key: 'first_name' },
              { icon: User, label: 'Last Name', value: form.last_name, key: 'last_name' },
              { icon: Mail, label: 'Email', value: mockProfile.email, disabled: true },
              { icon: Phone, label: 'Phone', value: form.phone, key: 'phone' },
              { icon: Building2, label: 'College', value: mockProfile.college.name, disabled: true },
              { icon: BookOpen, label: 'Department', value: mockProfile.department.dept_name, disabled: true },
              { icon: MapPin, label: 'City', value: mockProfile.college.city, disabled: true },
              { icon: Calendar, label: 'Joined', value: new Date(mockProfile.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }), disabled: true },
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

      {/* QR Code */}
      <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5 flex items-center gap-6">
        <div className="w-28 h-28 rounded-2xl bg-white flex items-center justify-center shrink-0">
          <QrCode size={80} className="text-surface-900"/>
        </div>
        <div>
          <h3 className="font-bold text-white mb-1 flex items-center gap-2">Your Personal QR Code <Shield size={14} className="text-nexus-400"/></h3>
          <p className="text-sm text-gray-400 mb-2">Show this at event venues for instant check-in. HMAC-signed for security.</p>
          <code className="text-xs text-nexus-400 bg-nexus-400/10 px-3 py-1.5 rounded-lg font-mono">{mockProfile.qr_token}</code>
        </div>
      </div>
    </div>
  )
}
