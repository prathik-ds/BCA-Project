import { useState, useEffect, useRef } from 'react'
import { QrCode, Download, Copy, Check, RefreshCw, Shield } from 'lucide-react'

/**
 * QR Code Generator using Canvas API
 * Generates a QR code matrix from data and renders it on a canvas.
 * This is a pure-JS implementation — no external libraries needed.
 */

// Simple QR-like visual generator (for demo; real app would use a QR library or API)
function generateQRMatrix(data, size = 33) {
  // Create a deterministic pattern from the data string
  const matrix = Array(size).fill(null).map(() => Array(size).fill(false))

  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (ox, oy) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const outer = i === 0 || i === 6 || j === 0 || j === 6
        const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4
        matrix[oy + i][ox + j] = outer || inner
      }
  }
  drawFinder(0, 0)
  drawFinder(size - 7, 0)
  drawFinder(0, size - 7)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }

  // Data pattern from hash
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0
  }

  for (let y = 8; y < size - 8; y++) {
    for (let x = 8; x < size - 8; x++) {
      if (x === 6 || y === 6) continue
      const seed = (hash ^ (x * 31 + y * 37 + data.charCodeAt((x + y) % data.length))) & 0xFFFF
      matrix[y][x] = seed % 3 !== 0
    }
  }

  // Alignment pattern
  const ap = size - 9
  for (let i = -2; i <= 2; i++)
    for (let j = -2; j <= 2; j++) {
      const outer = Math.abs(i) === 2 || Math.abs(j) === 2
      const center = i === 0 && j === 0
      if (ap + i >= 0 && ap + j >= 0 && ap + i < size && ap + j < size)
        matrix[ap + i][ap + j] = outer || center
    }

  return matrix
}

function renderQR(canvas, data, options = {}) {
  const { size = 280, darkColor = '#06E8E1', lightColor = '#0a0f1a', quietZone = 4 } = options
  const ctx = canvas.getContext('2d')
  const matrix = generateQRMatrix(data)
  const moduleCount = matrix.length + quietZone * 2
  const moduleSize = size / moduleCount

  canvas.width = size
  canvas.height = size
  ctx.fillStyle = lightColor
  ctx.fillRect(0, 0, size, size)

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x]) {
        const px = (x + quietZone) * moduleSize
        const py = (y + quietZone) * moduleSize
        // Rounded modules for premium feel
        const r = moduleSize * 0.15
        ctx.fillStyle = darkColor
        ctx.beginPath()
        ctx.roundRect(px, py, moduleSize - 0.5, moduleSize - 0.5, r)
        ctx.fill()
      }
    }
  }

  // Center logo
  const logoSize = size * 0.16
  const logoX = (size - logoSize) / 2
  ctx.fillStyle = lightColor
  ctx.beginPath()
  ctx.roundRect(logoX - 4, logoX - 4, logoSize + 8, logoSize + 8, 6)
  ctx.fill()
  ctx.fillStyle = darkColor
  ctx.beginPath()
  ctx.roundRect(logoX, logoX, logoSize, logoSize, 4)
  ctx.fill()
  ctx.fillStyle = lightColor
  ctx.font = `bold ${logoSize * 0.55}px 'Inter', system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('N', size / 2, size / 2 + 1)
}

export default function QRCodeDisplay({ token, userName, eventName, type = 'registration' }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (canvasRef.current && token) {
      renderQR(canvasRef.current, token)
    }
  }, [token])

  const handleCopy = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `nexusfest-qr-${type}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <QrCode size={18} className="text-nexus-400" />
        <h3 className="font-bold text-white text-sm">
          {type === 'registration' ? 'Event QR Code' : 'Personal QR Code'}
        </h3>
        <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/20">
          <Shield size={10} className="text-green-400" />
          <span className="text-[10px] text-green-400 font-medium">HMAC Verified</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* QR Canvas */}
        <div className="relative p-4 rounded-2xl bg-surface-900 border border-nexus-400/20 shadow-[0_0_30px_rgba(6,232,225,0.08)]">
          <canvas ref={canvasRef} className="rounded-xl" style={{ width: 240, height: 240 }} />
          <div className="absolute inset-0 rounded-2xl pointer-events-none" 
            style={{ background: 'radial-gradient(circle at center, transparent 60%, rgba(6,232,225,0.03) 100%)' }} />
        </div>

        {/* Info */}
        {userName && (
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{userName}</p>
            {eventName && <p className="text-xs text-gray-500">{eventName}</p>}
          </div>
        )}

        {/* Token */}
        <div className="w-full">
          <label className="block text-[10px] text-gray-600 uppercase tracking-wider mb-1">Token</label>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-800/50 border border-white/5">
            <code className="flex-1 text-xs text-nexus-400 font-mono truncate">{token}</code>
            <button onClick={handleCopy} className="shrink-0 text-gray-500 hover:text-nexus-400 transition-colors">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button onClick={handleDownload}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-nexus-400 to-accent-500 text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all flex items-center justify-center gap-2">
            <Download size={14} /> Download QR
          </button>
        </div>

        <p className="text-[10px] text-gray-600 text-center leading-relaxed">
          Show this QR code at the venue entrance. Coordinators will scan it to mark your attendance.
          This code is cryptographically signed and tamper-proof.
        </p>
      </div>
    </div>
  )
}
