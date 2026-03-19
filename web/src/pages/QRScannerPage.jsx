import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, CheckCircle, XCircle, MapPin, Users, Wifi, WifiOff, Upload, ChevronDown, Loader2 } from 'lucide-react'
import api from '../api/axios'

export default function QRScannerPage() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanHistory, setScanHistory] = useState([])
  const [lastScan, setLastScan] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineQueue, setOfflineQueue] = useState([])
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [stats, setStats] = useState({ checked_in: 0, checked_out: 0, total: 0 })
  const [manualToken, setManualToken] = useState('')
  const [loading, setLoading] = useState(true)
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)

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

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const loadEventStats = async (eventId) => {
    try {
      const { data } = await api.get(`/attendance/event/${eventId}`)
      if (data.status === 'success' && data.data && data.data.summary) {
        setStats({
          checked_in: parseInt(data.data.summary.total_checked_in || 0),
          checked_out: parseInt(data.data.summary.total_checked_out || 0),
          total: parseInt(data.data.summary.total_registered || 0)
        })
        if (data.data.records) {
           const history = data.data.records.map(r => ({
              success: true,
              name: r.participant_name,
              college: r.college_name,
              checkType: r.check_type,
              time: new Date(r.scanned_at).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
           }))
           setScanHistory(history)
        }
      }
    } catch (err) {
      console.error('Failed to load event stats', err)
    }
  }

  const handleSelectEvent = (evt) => {
    setSelectedEvent(evt)
    setShowEventPicker(false)
    setStats({ checked_in: 0, checked_out: 0, total: evt.registered_count || 0 })
    setScanHistory([])
    loadEventStats(evt.event_id)
  }

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

  const processScan = async (token) => {
    if (!selectedEvent) {
      alert("Please select an event first");
      return;
    }
    try {
      const { data } = await api.post('/attendance/scan', { qr_token: token, event_id: selectedEvent.event_id })
      if (data.status === 'success') {
         const result = {
            success: true,
            name: data.data.participant_name,
            college: '', // Endpoint doesn't return college immediately without a join, but we skip it here
            checkType: data.data.check_type,
            time: new Date().toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
         }
         addScanResult(result)
         loadEventStats(selectedEvent.event_id)
      }
    } catch (error) {
       const result = {
          success: false,
          error: error.response?.data?.message || 'Invalid QR code or scanning error',
          time: new Date().toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
       }
       addScanResult(result)
    }
  }

  const addScanResult = (result) => {
    setLastScan(result)
    setScanHistory(prev => [result, ...prev])
    setTimeout(() => setLastScan(null), 3000)
  }

  const handleManualScan = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      processScan(manualToken.trim())
      setManualToken('')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-nexus-400" size={40}/></div>
      ) : (
        <div className="relative z-20">
          <button onClick={() => setShowEventPicker(!showEventPicker)}
            className="w-full p-4 rounded-2xl bg-surface-700/30 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between text-left">
            {selectedEvent ? (
              <div>
                <div className="text-sm font-bold text-white">{selectedEvent.event_name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1"><MapPin size={10} /> {selectedEvent.venue_name || 'TBA'}</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {selectedEvent.registered_count || 0} registered</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Select an event to start scanning...</span>
            )}
            <ChevronDown size={16} className={`text-gray-500 transition-transform ${showEventPicker ? 'rotate-180' : ''}`} />
          </button>
          
          {showEventPicker && (
            <div className="absolute top-full left-0 right-0 z-30 w-full mt-2 p-2 rounded-2xl bg-surface-700 border border-white/10 shadow-xl animate-slide-up max-h-80 overflow-y-auto">
              {events.length === 0 && <div className="p-4 text-center text-gray-500 text-sm">No active events found.</div>}
              {events.map(evt => (
                <button key={evt.event_id} onClick={() => handleSelectEvent(evt)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${selectedEvent?.event_id === evt.event_id ? 'bg-nexus-400/10 text-nexus-400' : 'hover:bg-white/5 text-white'}`}>
                  <div className="text-sm font-medium">{evt.event_name}</div>
                  <div className="text-xs text-gray-500">{evt.venue_name || 'TBA'} • {evt.registered_count || 0} registered</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-56 h-56 border-2 border-nexus-400/60 rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-nexus-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-nexus-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-nexus-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-nexus-400 rounded-br-lg" />
                      <div className="absolute left-2 right-2 h-0.5 bg-nexus-400 shadow-[0_0_10px_rgba(6,232,225,0.5)] animate-[scan_2s_ease-in-out_infinite]"
                        style={{ animation: 'scan 2s ease-in-out infinite' }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-nexus-400/10 flex items-center justify-center">
                    <Camera size={36} className="text-nexus-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Camera ready to scan</p>
                  <button onClick={startCamera}
                    className="px-8 py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-bold text-sm hover:shadow-[0_0_25px_rgba(6,232,225,0.3)] transition-all">
                    Start Camera
                  </button>
                </div>
              )}

              {/* Last scan result overlay */}
              {lastScan && (
                <div className={`absolute top-4 left-4 right-4 p-4 rounded-xl backdrop-blur-xl border animate-slide-up z-10 ${
                  lastScan.success ? 'bg-green-900/90 border-green-400/40' : 'bg-red-900/90 border-red-400/40'
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
                          <div className="text-xs text-green-300">{lastScan.checkType === 'check_in' ? '✅ Checked In' : '👋 Checked Out'}</div>
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

            {/* Manual Token Entry for Testing */}
            <form onSubmit={handleManualScan} className="flex gap-2">
              <input 
                type="text" 
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                placeholder="Paste QR token manually..." 
                className="flex-1 px-4 py-3 bg-surface-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-nexus-400/50"
              />
              <button type="submit" className="px-5 py-3 bg-surface-700 hover:bg-surface-600 rounded-xl text-white text-sm font-semibold transition">Scan</button>
            </form>

            <div className="flex gap-3">
              {scanning ? (
                <button onClick={stopCamera} className="flex-1 py-3 rounded-xl border border-red-400/30 text-red-400 font-semibold text-sm hover:bg-red-400/5 transition-all">
                  Stop Camera
                </button>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-surface-700/30 border border-white/5">
              <h3 className="text-sm font-bold text-white mb-3">Attendance Progress</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-black font-display text-nexus-400">{stats.checked_in}</span>
                <span className="text-lg text-gray-500 pb-0.5">/ {stats.total}</span>
              </div>
              <div className="w-full h-2 bg-surface-500 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-nexus-400 to-accent-500 rounded-full transition-all duration-500"
                  style={{ width: stats.total > 0 ? `${(stats.checked_in / stats.total) * 100}%` : '0%' }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">{stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0}% attendance rate</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-700/30 border border-white/5">
              <h3 className="text-sm font-bold text-white mb-3">Scan History</h3>
              {scanHistory.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No scans recorded yet.</p>
              ) : (
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
                            <div className="text-[10px] text-gray-500">{scan.checkType === 'check_in' ? 'Check In' : 'Check Out'}</div>
                          </>
                        ) : (
                          <div className="text-sm text-red-400">{scan.error}</div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600 shrink-0">{scan.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0%, 100% { top: 8px; }
          50% { top: calc(100% - 10px); }
        }
      `}</style>
    </div>
  )
}
