import { Download, ExternalLink, CheckCircle, Clock, Award } from 'lucide-react'

const mockCertificates = [
  { cert_id: 1, verification_code: 'NF-CERT-2026-48291', cert_type: 'winner_gold', event: { event_name: 'Code Sprint 2026', category: 'technical' }, issued_at: '2026-04-15T18:00:00', downloaded: true },
  { cert_id: 2, verification_code: 'NF-CERT-2026-73625', cert_type: 'participation', event: { event_name: 'Quiz Masters', category: 'academic' }, issued_at: '2026-04-17T15:00:00', downloaded: false },
  { cert_id: 3, verification_code: 'NF-CERT-2026-91047', cert_type: 'winner_silver', event: { event_name: 'E-Sports: Valorant', category: 'gaming' }, issued_at: '2026-04-16T21:00:00', downloaded: true },
]

const typeConfig = {
  participation: { label: 'Participation', icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
  winner_gold: { label: '🥇 1st Place', icon: Award, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  winner_silver: { label: '🥈 2nd Place', icon: Award, color: 'text-gray-300', bg: 'bg-gray-300/10', border: 'border-gray-300/30' },
  winner_bronze: { label: '🥉 3rd Place', icon: Award, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  volunteer: { label: 'Volunteer', icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
}

const catBadge = { technical: 'bg-cyan-400/15 text-cyan-400', cultural: 'bg-pink-400/15 text-pink-400', academic: 'bg-blue-400/15 text-blue-400', gaming: 'bg-amber-400/15 text-amber-400', sports: 'bg-green-400/15 text-green-400' }

export default function CertificatesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">My Certificates</h1>
        <p className="text-sm text-gray-500 mt-1">{mockCertificates.length} certificates earned</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-amber-400/5 border border-amber-400/20 text-center">
          <div className="text-2xl font-bold font-display text-amber-400">{mockCertificates.filter(c => c.cert_type.startsWith('winner')).length}</div>
          <div className="text-xs text-gray-500">Winner</div>
        </div>
        <div className="p-5 rounded-2xl bg-blue-400/5 border border-blue-400/20 text-center">
          <div className="text-2xl font-bold font-display text-blue-400">{mockCertificates.filter(c => c.cert_type === 'participation').length}</div>
          <div className="text-xs text-gray-500">Participation</div>
        </div>
        <div className="p-5 rounded-2xl bg-nexus-400/5 border border-nexus-400/20 text-center">
          <div className="text-2xl font-bold font-display text-nexus-400">{mockCertificates.length}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>

      {/* Certificate cards */}
      <div className="space-y-4">
        {mockCertificates.map(cert => {
          const cfg = typeConfig[cert.cert_type] || typeConfig.participation
          return (
            <div key={cert.cert_id} className={`p-6 rounded-2xl bg-surface-700/30 border ${cfg.border} hover:bg-surface-600/30 transition-all`}>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <cfg.icon size={24} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${catBadge[cert.event.category]}`}>{cert.event.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{cert.event.event_name}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={11}/> {new Date(cert.issued_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="font-mono">{cert.verification_code}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-nexus-400 to-accent-500 text-white text-sm font-semibold hover:shadow-[0_0_15px_rgba(6,232,225,0.3)] transition-all flex items-center gap-2">
                    <Download size={14}/> Download
                  </button>
                  <button className="px-3 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                    <ExternalLink size={14}/>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
