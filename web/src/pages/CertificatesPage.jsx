import { useState, useEffect } from 'react'
import { Download, Clock, Award, Eye, X, Loader2 } from 'lucide-react'

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // certificates are issued after event results — most students won't have any initially
    setCertificates([])
    setLoading(false)
  }, [])

  const typeConfig = {
    participation:  { label: 'Participation', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
    winner_first:   { label: '🥇 1st Place', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
    winner_second:  { label: '🥈 2nd Place', color: 'text-gray-300', bg: 'bg-gray-300/10', border: 'border-gray-300/30' },
    winner_third:   { label: '🥉 3rd Place', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  }

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-nexus-400" size={48}/></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">My Certificates</h1>
        <p className="text-sm text-gray-500 mt-1">{certificates.length} certificates earned • Auto-generated after events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-amber-400/5 border border-amber-400/20 text-center">
          <div className="text-2xl font-bold font-display text-amber-400">{certificates.filter(c => c.cert_type?.startsWith('winner')).length}</div>
          <div className="text-xs text-gray-500">Winner</div>
        </div>
        <div className="p-5 rounded-2xl bg-blue-400/5 border border-blue-400/20 text-center">
          <div className="text-2xl font-bold font-display text-blue-400">{certificates.filter(c => c.cert_type === 'participation').length}</div>
          <div className="text-xs text-gray-500">Participation</div>
        </div>
        <div className="p-5 rounded-2xl bg-nexus-400/5 border border-nexus-400/20 text-center">
          <div className="text-2xl font-bold font-display text-nexus-400">{certificates.length}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-700/30 border border-white/5 text-center">
          <Award size={48} className="text-gray-600 mx-auto mb-4"/>
          <h3 className="text-lg font-bold text-white mb-2">No Certificates Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">Certificates are automatically generated after event results are declared. Register and participate in events to earn certificates!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map(cert => {
            const cfg = typeConfig[cert.cert_type] || typeConfig.participation
            return (
              <div key={cert.cert_id} className={`p-6 rounded-2xl bg-surface-700/30 border ${cfg.border} hover:bg-surface-600/30 transition-all`}>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <Award size={24} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    <h3 className="text-lg font-bold text-white mt-1">{cert.event_name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Clock size={11} /> {new Date(cert.issued_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="font-mono">{cert.verification_code}</span>
                    </div>
                  </div>
                  <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-nexus-400 to-accent-500 text-white text-sm font-semibold hover:shadow-[0_0_15px_rgba(6,232,225,0.3)] transition-all flex items-center gap-2">
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
