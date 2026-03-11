import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, CheckCircle, XCircle, QrCode, Clock, MapPin, Users, Wifi, WifiOff, Upload, ChevronDown, AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * QR Attendance Scanner — Coordinator Interface
 * 
 * Flow:
 * 1. Coordinator selects an event
 * 2. Activates camera to scan participant QR codes
 * 3. System verifies HMAC token → shows participant info → marks attendance
 * 4. Supports offline queue with sync when back online
 */

const mockEvents = [
  { event_id: 1, event_name: 'Code Sprint 2026', venue: 'CS Auditorium', registered: 87 },
  { event_id: 2, event_name: 'Dance Battle Royale', venue: 'Main Stage', registered: 45 },
  { event_id: 3, event_name: 'Robo Wars', venue: 'Sports Complex', registered: 32 },
  { event_id: 4, event_name: 'E-Sports: Valorant', venue: 'Gaming Arena', registered: 120 },
  { event_id: 6, event_name: 'Quiz Masters', venue: 'Seminar Hall B', registered: 64 },
]

const mockScanResults = [
  { success: true, name: 'Pratham Sharma', college: 'MIT ADT University', checkType: 'check_in', photo: null, time: '10:15 AM' },
  { success: true, name: 'Neha Kulkarni', college: 'MIT ADT University', checkType: 'check_in', photo: null, time: '10:14 AM' },
  { success: true, name: 'Rohan Mehta', college: 'VIT Pune', checkType: 'check_in', photo: null, time: '10:12 AM' },
  { success: false, name: null, error: 'Invalid QR code', time: '10:11 AM' },
  { success: true, name: 'Aditya Joshi', college: 'COEP Tech', checkType: 'check_in', photo: null, time: '10:08 AM' },
]

export default function QRScannerPage() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanHistory, setScanHistory] = useState(mockScanResults)
  const [lastScan, setLastScan] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineQueue, setOfflineQueue] = useState([])
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [stats, setStats] = useState({ checked_in: 5, total: 87 })
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Camera start/stop
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
    } catch (err) {
      console.error('Camera access denied:', err)
      alert('Camera access is required for QR scanning. Please enable camera permissions.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // Simulate scan (in production, use a QR decoding library like jsQR)
  const simulateScan = () => {
    const names = ['Shreya Patil', 'Karan Singh', 'Priya Deshmukh', 'Arjun Nair', 'Meera Das']
    const colleges = ['MIT ADT', 'COEP Tech', 'VIT Pune', 'Symbiosis', 'PICT']
    const isSuccess = Math.random() > 0.15

    const result = isSuccess ? {
      success: true,
      name: names[Math.floor(Math.random() * names.length)],
      college: colleges[Math.floor(Math.random() * colleges.length)],
      checkType: 'check_in',
      time: new Date().toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
    } : {
      success: false,
      error: ['Invalid QR code', 'Not registered for this event', 'Already checked in'][Math.floor(Math.random() * 3)],
      time: new Date().toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
    }

    setLastScan(result)
    setScanHistory(prev => [result, ...prev])
    if (result.success) setStats(prev => ({ ...prev, checked_in: prev.checked_in + 1 }))

    // Auto-clear after 3s
    setTimeout(() => setLastScan(null), 3000)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">QR Attendance Scanner</h1>
          <p className="text-sm text-gray-500 mt-1">Scan participant QR codes to mark attendance</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/20">
              <Wifi size={12} className="text-green-400" /><span className="text-xs text-green-400 font-medium">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20">
              <WifiOff size={12} className="text-amber-400" /><span className="text-xs text-amber-400 font-medium">Offline ({offlineQueue.length} queued)</span>
            </div>
          )}
        </div>
      </div>

      {/* Event Selector */}
      <div className="relative">
        <button onClick={() => setShowEventPicker(!showEventPicker)}
          className="w-full p-4 rounded-2xl bg-surface-700/30 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between text-left">
          {selectedEvent ? (
            <div>
              <div className="text-sm font-bold text-white">{selectedEvent.event_name}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1"><MapPin size={10} /> {selectedEvent.venue}</span>
                <span className="flex items-center gap-1"><Users size={10} /> {selectedEvent.registered} registered</span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Select an event to start scanning...</span>
          )}
          <ChevronDown size={16} className={`text-gray-500 transition-transform ${showEventPicker ? 'rotate-180' : ''}`} />
        </button>
        {showEventPicker && (
          <div className="absolute z-20 w-full mt-2 p-2 rounded-2xl bg-surface-700 border border-white/10 shadow-xl animate-slide-up">
            {mockEvents.map(evt => (
              <button key={evt.event_id} onClick={() => { setSelectedEvent(evt); setShowEventPicker(false); setStats({ checked_in: 0, total: evt.registered }) }}
                className={`w-full p-3 rounded-xl text-left transition-all ${selectedEvent?.event_id === evt.event_id ? 'bg-nexus-400/10 text-nexus-400' : 'hover:bg-white/5 text-white'}`}>
                <div className="text-sm font-medium">{evt.event_name}</div>
                <div className="text-xs text-gray-500">{evt.venue} • {evt.registered} registered</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Camera / Scanner — 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            {/* Camera view */}
            <div className="relative rounded-2xl overflow-hidden bg-surface-800 border border-white/5 aspect-[4/3]">
              {scanning ? (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {/* Scan overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-56 h-56 border-2 border-nexus-400/60 rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-nexus-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-nexus-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-nexus-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-nexus-400 rounded-br-lg" />
                      {/* Scanning line animation */}
                      <div className="absolute left-2 right-2 h-0.5 bg-nexus-400 shadow-[0_0_10px_rgba(6,232,225,0.5)] animate-[scan_2s_ease-in-out_infinite]"
                        style={{ animation: 'scan 2s ease-in-out infinite' }} />
                    </div>
                  </div>
                  {/* Scan button */}
                  <button onClick={simulateScan}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl bg-nexus-400 text-surface-900 font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,232,225,0.4)]">
                    📸 Simulate Scan
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-nexus-400/10 flex items-center justify-center">
                    <Camera size={36} className="text-nexus-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Camera ready to scan</p>
                  <button onClick={startCamera}
                    className="px-8 py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-bold text-sm hover:shadow-[0_0_25px_rgba(6,232,225,0.3)] transition-all">
                    Start Scanning
                  </button>
                </div>
              )}

              {/* Last scan result overlay */}
              {lastScan && (
                <div className={`absolute top-4 left-4 right-4 p-4 rounded-xl backdrop-blur-xl border animate-slide-up ${
                  lastScan.success ? 'bg-green-900/80 border-green-400/40' : 'bg-red-900/80 border-red-400/40'
                }`}>
                  <div className="flex items-center gap-3">
                    {lastScan.success ? (
                      <CheckCircle size={28} className="text-green-400 shrink-0" />
                    ) : (
                      <XCircle size={28} className="text-red-400 shrink-0" />
                    )}
                    <div>
                      {lastScan.success ? (
                        <>
                          <div className="text-sm font-bold text-white">{lastScan.name}</div>
                          <div className="text-xs text-green-300">{lastScan.college} • {lastScan.checkType === 'check_in' ? '✅ Checked In' : '👋 Checked Out'}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-bold text-white">Scan Failed</div>
                          <div className="text-xs text-red-300">{lastScan.error}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Control buttons */}
            <div className="flex gap-3">
              {scanning ? (
                <button onClick={stopCamera} className="flex-1 py-3 rounded-xl border border-red-400/30 text-red-400 font-semibold text-sm hover:bg-red-400/5 transition-all">
                  Stop Camera
                </button>
              ) : (
                <button onClick={startCamera} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-nexus-400 to-accent-500 text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all">
                  Start Camera
                </button>
              )}
              {!isOnline && offlineQueue.length > 0 && (
                <button className="px-6 py-3 rounded-xl border border-amber-400/30 text-amber-400 font-semibold text-sm hover:bg-amber-400/5 transition-all flex items-center gap-2">
                  <Upload size={14} /> Sync {offlineQueue.length} Records
                </button>
              )}
            </div>
          </div>

          {/* Stats + History — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            {/* Live stats */}
            <div className="p-5 rounded-2xl bg-surface-700/30 border border-white/5">
              <h3 className="text-sm font-bold text-white mb-3">Attendance Progress</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-black font-display text-nexus-400">{stats.checked_in}</span>
                <span className="text-lg text-gray-500 pb-0.5">/ {stats.total}</span>
              </div>
              <div className="w-full h-2 bg-surface-500 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-nexus-400 to-accent-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.checked_in / stats.total) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">{Math.round((stats.checked_in / stats.total) * 100)}% attendance rate</p>
            </div>

            {/* Scan history */}
            <div className="p-5 rounded-2xl bg-surface-700/30 border border-white/5">
              <h3 className="text-sm font-bold text-white mb-3">Scan History</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {scanHistory.map((scan, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                    scan.success ? 'bg-surface-800/40' : 'bg-red-900/10'
                  }`}>
                    {scan.success ? (
                      <CheckCircle size={16} className="text-green-400 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      {scan.success ? (
                        <>
                          <div className="text-sm text-white font-medium truncate">{scan.name}</div>
                          <div className="text-[10px] text-gray-500">{scan.college}</div>
                        </>
                      ) : (
                        <div className="text-sm text-red-400">{scan.error}</div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">{scan.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for scanning animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 8px; }
          50% { top: calc(100% - 10px); }
        }
      `}</style>
    </div>
  )
}
