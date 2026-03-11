import { useState, useRef, useEffect } from 'react'
import { Download, Eye, Share2, Award } from 'lucide-react'

/**
 * Certificate Preview & PDF Generator
 * 
 * Renders a certificate on HTML5 Canvas and exports to PDF-quality PNG.
 * Supports: participation, winner_first/second/third, volunteer, coordinator
 * 
 * In production, actual PDF generation happens on the backend via:
 * - POST /api/v1/certificates/generate (single)
 * - POST /api/v1/certificates/bulk-generate (all participants of an event)
 * 
 * This frontend component provides:
 * 1. Live canvas preview of the certificate
 * 2. Client-side PNG download
 * 3. Verification code display
 */

const CERT_COLORS = {
  participation: { accent: '#06E8E1', badge: '#06E8E1', label: 'Certificate of Participation' },
  winner_first:  { accent: '#FFD700', badge: '#FFD700', label: 'Certificate of Achievement — 1st Place' },
  winner_second: { accent: '#C0C0C0', badge: '#C0C0C0', label: 'Certificate of Achievement — 2nd Place' },
  winner_third:  { accent: '#CD7F32', badge: '#CD7F32', label: 'Certificate of Achievement — 3rd Place' },
  volunteer:     { accent: '#A78BFA', badge: '#A78BFA', label: 'Certificate of Volunteering' },
  coordinator:   { accent: '#F472B6', badge: '#F472B6', label: 'Certificate of Coordination' },
}

function renderCertificate(canvas, data) {
  const W = 1200, H = 850
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const cfg = CERT_COLORS[data.cert_type] || CERT_COLORS.participation

  // ── Background ──
  const bgGrad = ctx.createLinearGradient(0, 0, W, H)
  bgGrad.addColorStop(0, '#0a0f1e')
  bgGrad.addColorStop(1, '#0d1425')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // ── Border ──
  ctx.strokeStyle = cfg.accent + '40'
  ctx.lineWidth = 3
  ctx.strokeRect(30, 30, W - 60, H - 60)
  ctx.strokeStyle = cfg.accent + '15'
  ctx.lineWidth = 1
  ctx.strokeRect(40, 40, W - 80, H - 80)

  // ── Corner accents ──
  const drawCorner = (x, y, dx, dy) => {
    ctx.strokeStyle = cfg.accent
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, y + dy * 40)
    ctx.lineTo(x, y)
    ctx.lineTo(x + dx * 40, y)
    ctx.stroke()
  }
  drawCorner(30, 30, 1, 1)
  drawCorner(W - 30, 30, -1, 1)
  drawCorner(30, H - 30, 1, -1)
  drawCorner(W - 30, H - 30, -1, -1)

  // ── Decorative circles ──
  ctx.fillStyle = cfg.accent + '08'
  ctx.beginPath(); ctx.arc(100, 100, 120, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(W - 100, H - 100, 100, 0, Math.PI * 2); ctx.fill()

  // ── Logo + Title ──
  // Logo
  const logoSize = 44
  const logoX = W / 2 - logoSize / 2
  const grad = ctx.createLinearGradient(logoX, 70, logoX + logoSize, 70 + logoSize)
  grad.addColorStop(0, '#06E8E1')
  grad.addColorStop(1, '#EC4899')
  ctx.fillStyle = grad
  roundRect(ctx, logoX, 70, logoSize, logoSize, 10)
  ctx.fill()
  ctx.fillStyle = '#0a0f1e'
  ctx.font = 'bold 24px Inter, system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('N', W / 2, 92)

  // "NexusFest 2026"
  ctx.fillStyle = cfg.accent
  ctx.font = '600 14px Inter, system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('NEXUSFEST 2026', W / 2, 135)

  // ── Certificate Title ──
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px Inter, system-ui'
  ctx.fillText(cfg.label, W / 2, 200)

  // ── Decorative line ──
  const lineGrad = ctx.createLinearGradient(W / 2 - 100, 0, W / 2 + 100, 0)
  lineGrad.addColorStop(0, 'transparent')
  lineGrad.addColorStop(0.5, cfg.accent)
  lineGrad.addColorStop(1, 'transparent')
  ctx.strokeStyle = lineGrad
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W / 2 - 120, 225)
  ctx.lineTo(W / 2 + 120, 225)
  ctx.stroke()

  // ── "This is to certify that" ──
  ctx.fillStyle = '#94a3b8'
  ctx.font = '400 16px Inter, system-ui'
  ctx.fillText('This is to certify that', W / 2, 275)

  // ── Participant Name ──
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 42px Inter, system-ui'
  ctx.fillText(data.participant_name, W / 2, 330)

  // ── Name underline ──
  const nameWidth = ctx.measureText(data.participant_name).width
  ctx.strokeStyle = cfg.accent + '60'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W / 2 - nameWidth / 2, 348)
  ctx.lineTo(W / 2 + nameWidth / 2, 348)
  ctx.stroke()

  // ── College ──
  ctx.fillStyle = '#94a3b8'
  ctx.font = '400 16px Inter, system-ui'
  ctx.fillText(`from ${data.college_name}`, W / 2, 385)

  // ── Achievement text ──
  const achievement = data.cert_type === 'participation'
    ? `has successfully participated in`
    : data.cert_type.startsWith('winner')
      ? `has secured ${data.cert_type === 'winner_first' ? '1st' : data.cert_type === 'winner_second' ? '2nd' : '3rd'} place in`
      : `has served as ${data.cert_type} for`

  ctx.fillStyle = '#94a3b8'
  ctx.font = '400 16px Inter, system-ui'
  ctx.fillText(achievement, W / 2, 435)

  // ── Event Name ──
  ctx.fillStyle = cfg.accent
  ctx.font = 'bold 28px Inter, system-ui'
  ctx.fillText(data.event_name, W / 2, 480)

  // ── Date ──
  ctx.fillStyle = '#64748b'
  ctx.font = '400 14px Inter, system-ui'
  ctx.fillText(`held on ${data.event_date} at ${data.venue}`, W / 2, 520)

  // ── Signature area ──
  // Left: Coordinator
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(200, 660); ctx.lineTo(400, 660); ctx.stroke()
  ctx.fillStyle = '#94a3b8'
  ctx.font = '400 12px Inter, system-ui'
  ctx.fillText('Event Coordinator', 300, 685)

  // Right: Principal
  ctx.beginPath()
  ctx.moveTo(800, 660); ctx.lineTo(1000, 660); ctx.stroke()
  ctx.fillText('Principal / Director', 900, 685)

  // ── Medal badge for winners ──
  if (data.cert_type.startsWith('winner')) {
    const medal = data.cert_type === 'winner_first' ? '🥇' : data.cert_type === 'winner_second' ? '🥈' : '🥉'
    ctx.font = '48px serif'
    ctx.fillText(medal, W / 2, 580)
  }

  // ── Verification Code ──
  ctx.fillStyle = '#334155'
  ctx.font = '400 11px monospace'
  ctx.fillText(`Verification: ${data.verification_code}`, W / 2, 740)
  ctx.fillStyle = '#1e293b'
  ctx.font = '400 10px Inter, system-ui'
  ctx.fillText('Verify at nexusfest.edu/verify', W / 2, 760)

  // ── Footer ──
  ctx.fillStyle = '#1e293b'
  ctx.font = '400 10px Inter, system-ui'
  ctx.fillText('NexusFest 2026 — Unified College Event Management Ecosystem', W / 2, H - 50)
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function CertificatePreview({ certificate }) {
  const canvasRef = useRef(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (canvasRef.current && certificate) {
      renderCertificate(canvasRef.current, certificate)
      setRendered(true)
    }
  }, [certificate])

  const handleDownload = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `NexusFest-Certificate-${certificate.verification_code}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <canvas ref={canvasRef} className="w-full" style={{ aspectRatio: '1200/850' }} />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleDownload}
          className="flex-1 py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold text-sm hover:shadow-[0_0_25px_rgba(6,232,225,0.3)] transition-all flex items-center justify-center gap-2">
          <Download size={16} /> Download Certificate
        </button>
        <button className="px-5 py-3 rounded-xl border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/5 transition-all flex items-center gap-2">
          <Share2 size={16} /> Share
        </button>
      </div>
    </div>
  )
}
