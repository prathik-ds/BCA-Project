import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, Plus, X, Loader2 } from 'lucide-react'
import api from '../api/axios'

export default function WalletPage() {
  const [wallet, setWallet] = useState({ balance: 0 })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [walRes, txnRes] = await Promise.all([
        api.get('/wallet/balance').catch(() => ({ data: { data: { balance: 0 } } })),
        api.get('/wallet/transactions').catch(() => ({ data: { data: [] } })),
      ])
      setWallet(walRes.data.data || { balance: 0 })
      setTransactions(txnRes.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmount)
    if (!amt || amt <= 0) return
    setSaving(true)
    try {
      await api.post('/wallet/topup', { amount: amt })
      setShowTopUp(false)
      setTopUpAmount('')
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Top-up failed')
    } finally { setSaving(false) }
  }

  const filtered = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType)
  const totalSpent = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
  const totalAdded = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + parseFloat(t.amount || 0), 0)

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-nexus-400" size={48}/></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-display text-white">Digital Wallet</h1>

      {/* Balance Card */}
      <div className="relative p-8 rounded-2xl bg-gradient-to-br from-surface-700/80 to-surface-800/60 border border-nexus-400/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-nexus-400/8 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-accent-500/8 blur-[60px]" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Available Balance</p>
            <div className="text-5xl font-black font-display text-white mb-4">₹{parseFloat(wallet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-sm"><ArrowDownLeft size={14} className="text-green-400"/> <span className="text-gray-400">Added: <span className="text-green-400 font-semibold">₹{totalAdded.toFixed(0)}</span></span></div>
              <div className="flex items-center gap-1.5 text-sm"><ArrowUpRight size={14} className="text-red-400"/> <span className="text-gray-400">Spent: <span className="text-red-400 font-semibold">₹{totalSpent.toFixed(0)}</span></span></div>
            </div>
          </div>
          <button onClick={() => setShowTopUp(true)} className="px-6 py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold text-sm hover:shadow-[0_0_25px_rgba(6,232,225,0.3)] hover:scale-105 transition-all flex items-center gap-2"><Plus size={16}/> Top Up</button>
        </div>
      </div>

      {/* Quick Top-Up */}
      {showTopUp && (
        <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Quick Top-Up</h3>
            <button onClick={() => setShowTopUp(false)} className="text-gray-500 hover:text-white"><X size={18}/></button>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[100, 200, 500, 1000].map(amt => (
              <button key={amt} onClick={() => setTopUpAmount(String(amt))} className={`py-3 rounded-xl text-sm font-semibold transition-all ${topUpAmount === String(amt) ? 'bg-nexus-400/15 text-nexus-400 border border-nexus-400/30' : 'bg-surface-600/40 text-gray-300 border border-white/5 hover:bg-surface-500/40'}`}>₹{amt}</button>
            ))}
          </div>
          <div className="flex gap-3">
            <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} placeholder="Custom amount" className="flex-1 px-4 py-3 rounded-xl bg-surface-700/50 border border-white/10 text-white text-sm focus:outline-none focus:border-nexus-400/50 transition-all"/>
            <button onClick={handleTopUp} disabled={saving} className="px-8 py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all disabled:opacity-50 flex items-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin"/> Adding...</> : `Add ₹${topUpAmount || '0'}`}
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="p-6 rounded-2xl bg-surface-700/30 border border-white/5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white">Transaction History</h3>
          <div className="flex gap-2">
            {['all', 'credit', 'debit'].map(f => (
              <button key={f} onClick={() => setFilterType(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === f ? 'bg-nexus-400/15 text-nexus-400' : 'bg-surface-600/40 text-gray-400 hover:text-white'}`}>{f === 'all' ? 'All' : f === 'credit' ? '↓ Added' : '↑ Spent'}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(txn => (
              <div key={txn.transaction_id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/30 hover:bg-surface-600/30 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.type === 'credit' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                  {txn.type === 'credit' ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{txn.description}</p>
                  <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })} • {txn.reference_id || ''}</p>
                </div>
                <div className={`text-sm font-bold ${txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.type === 'credit' ? '+' : '-'}₹{parseFloat(txn.amount || 0).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
