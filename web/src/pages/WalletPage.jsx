import { useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, Plus, QrCode, X, CreditCard, ShoppingBag, Coffee, UtensilsCrossed, Filter } from 'lucide-react'

const mockWallet = { wallet_id: 1, user_id: 1, balance: 1250.00, is_frozen: false }

const mockTransactions = [
  { transaction_id: 1, type: 'credit', amount: 500, description: 'Wallet Top-up via UPI', reference_id: 'TXN-001', created_at: '2026-03-11T14:30:00' },
  { transaction_id: 2, type: 'debit', amount: 80, description: 'Food Court — Biryani Stall', reference_id: 'TXN-002', stall_name: 'Biryani Express', created_at: '2026-03-11T13:15:00' },
  { transaction_id: 3, type: 'debit', amount: 40, description: 'Juice Bar — Fresh Lime', reference_id: 'TXN-003', stall_name: 'Fresh Sips', created_at: '2026-03-11T12:00:00' },
  { transaction_id: 4, type: 'credit', amount: 1000, description: 'Wallet Top-up via UPI', reference_id: 'TXN-004', created_at: '2026-03-10T09:00:00' },
  { transaction_id: 5, type: 'debit', amount: 100, description: 'Code Sprint 2026 — Entry Fee', reference_id: 'REG-007', created_at: '2026-03-09T18:00:00' },
  { transaction_id: 6, type: 'debit', amount: 60, description: 'Snack Corner — Samosa Plate', reference_id: 'TXN-006', stall_name: 'Snack Attack', created_at: '2026-03-09T16:30:00' },
  { transaction_id: 7, type: 'debit', amount: 150, description: 'NexusFest Merch — T-shirt', reference_id: 'TXN-007', stall_name: 'NexusFest Store', created_at: '2026-03-09T11:00:00' },
  { transaction_id: 8, type: 'credit', amount: 200, description: 'Refund — Cancelled Registration', reference_id: 'REF-001', created_at: '2026-03-08T15:00:00' },
]

export default function WalletPage() {
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [filterType, setFilterType] = useState('all')

  const filtered = filterType === 'all' ? mockTransactions : mockTransactions.filter(t => t.type === filterType)
  const totalSpent = mockTransactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const totalAdded = mockTransactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)

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
            <div className="text-5xl font-black font-display text-white mb-4">₹{mockWallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-sm"><ArrowDownLeft size={14} className="text-green-400"/> <span className="text-gray-400">Added: <span className="text-green-400 font-semibold">₹{totalAdded}</span></span></div>
              <div className="flex items-center gap-1.5 text-sm"><ArrowUpRight size={14} className="text-red-400"/> <span className="text-gray-400">Spent: <span className="text-red-400 font-semibold">₹{totalSpent}</span></span></div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowTopUp(true)} className="px-6 py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold text-sm hover:shadow-[0_0_25px_rgba(6,232,225,0.3)] hover:scale-105 transition-all flex items-center gap-2"><Plus size={16}/> Top Up</button>
            <button className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/5 transition-all flex items-center gap-2"><QrCode size={16}/> Pay</button>
          </div>
        </div>
      </div>

      {/* Quick Amount Top-Up */}
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
            <button className="px-8 py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(6,232,225,0.3)] transition-all">Add ₹{topUpAmount || '0'}</button>
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
        <div className="space-y-2">
          {filtered.map(txn => (
            <div key={txn.transaction_id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/30 hover:bg-surface-600/30 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.type === 'credit' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                {txn.type === 'credit' ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{txn.description}</p>
                <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })} • {new Date(txn.created_at).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })} • {txn.reference_id}</p>
              </div>
              <div className={`text-sm font-bold ${txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
