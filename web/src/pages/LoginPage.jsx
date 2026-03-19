import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, User, Building2, Phone, ChevronLeft, AlertCircle } from 'lucide-react'
import api from '../api/axios'

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false)
  const [role, setRole] = useState('participant') // 'participant' | 'admin'
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '', college_id: '1' })
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isSignup ? '/auth/register' : '/auth/login'
      const { data } = await api.post(endpoint, form)

      if (data.status === 'success') {
        localStorage.setItem('nexus_token', data.data.access_token)
        localStorage.setItem('nexus_user', JSON.stringify(data.data.user))

        if (data.data.user.role === 'admin' || data.data.user.role === 'super_admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-800 to-surface-900" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-nexus-400/8 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full bg-accent-500/8 blur-[80px]" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />

        <div className="relative z-10 p-16 max-w-lg">
          <Link to="/" className="flex items-center gap-3 mb-12 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold text-xl font-display group-hover:scale-110 transition-transform">N</div>
            <span className="text-2xl font-bold font-display bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">NexusFest</span>
          </Link>

          <h2 className="text-4xl font-bold font-display text-white mb-4 leading-tight">
            {isSignup ? 'Join the biggest fest of 2026' : 'Welcome back, champion'}
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-10">
            {isSignup
              ? '5,000+ participants from 30+ colleges are already registered. Don\'t miss out.'
              : 'Your events, teams, wallet, and certificates — everything is right where you left it.'}
          </p>

          <div className="space-y-4">
            {[
              { icon: '🎭', text: '50+ events across 6 categories' },
              { icon: '💰', text: 'Digital wallet for cashless payments' },
              { icon: '🏆', text: 'Real-time inter-college leaderboard' },
              { icon: '📜', text: 'Auto-generated certificates with QR' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 text-gray-300">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold font-display">N</div>
              <span className="text-xl font-bold font-display bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">NexusFest</span>
            </Link>
          </div>

          {/* Role Switcher */}
          <div className="flex p-1 bg-surface-800/50 border border-white/5 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => { setRole('participant'); setIsSignup(false); }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${role === 'participant' ? 'bg-surface-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Participant
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setIsSignup(false); }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${role === 'admin' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Administrator
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-display text-white mb-2">
              {role === 'admin' ? 'Admin Gateway' : isSignup ? 'Create your account' : 'Sign in'}
            </h1>
            <p className="text-gray-400">
              {role === 'admin'
                ? 'Authorized personnel only. Access monitored.'
                : isSignup ? 'Already have an account? ' : 'Don\'t have an account? '}
              {role !== 'admin' && (
                <button onClick={() => setIsSignup(!isSignup)} className="text-nexus-400 font-semibold hover:underline">
                  {isSignup ? 'Sign in' : 'Register'}
                </button>
              )}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm animate-shake">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Signup fields */}
            {isSignup && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <InputField icon={User} label="First Name" value={form.first_name} onChange={v => update('first_name', v)} placeholder="Pratham" />
                  <InputField icon={User} label="Last Name" value={form.last_name} onChange={v => update('last_name', v)} placeholder="Sharma" />
                </div>
                <InputField icon={Phone} label="Phone" type="tel" value={form.phone} onChange={v => update('phone', v)} placeholder="+91 98765 43210" />
                <InputField icon={Building2} label="College ID" value={form.college_id} onChange={v => update('college_id', v)} placeholder="1" />
              </>
            )}

            <InputField icon={Mail} label="Email" type="email" value={form.email} onChange={v => update('email', v)} placeholder="your@email.com" />

            <div className="relative">
              <InputField icon={Lock} label="Password" type={showPass ? 'text' : 'password'} value={form.password} onChange={v => update('password', v)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-[38px] text-gray-500 hover:text-gray-300 transition-colors">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!isSignup && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-nexus-400 hover:underline">Forgot password?</button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold text-base transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 ${role === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                  : 'bg-gradient-to-r from-nexus-400 to-accent-500 hover:shadow-[0_0_30px_rgba(6,232,225,0.3)]'
                } hover:scale-[1.02] active:scale-[0.98]`}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{role === 'admin' ? 'Enter Admin Panel' : isSignup ? 'Create Account' : 'Sign In'} <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Divider & Social Login - Hidden for Admin */}
          {role !== 'admin' && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-gray-500">or continue with</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button className="w-full py-3.5 rounded-xl border border-white/10 bg-surface-700/40 hover:bg-surface-600/60 text-white font-medium flex items-center justify-center gap-3 transition-all hover:border-white/20">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Sign in with Google
              </button>
            </>
          )}

          {role === 'admin' && (
            <div className="mt-8 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center">
                System Security Notice
              </p>
              <p className="text-[11px] text-gray-500 text-center mt-1">
                IP Address {Math.floor(Math.random() * 255)}.{Math.floor(Math.random() * 255)}.X.X is being logged for audit trails. Unofficial attempts are reported.
              </p>
            </div>
          )}

          <p className="text-xs text-gray-600 text-center mt-8">
            By continuing, you agree to NexusFest's <a href="#" className="text-gray-400 hover:text-nexus-400">Terms</a> and <a href="#" className="text-gray-400 hover:text-nexus-400">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

function InputField({ icon: Icon, label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-surface-700/50 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-nexus-400/50 focus:ring-1 focus:ring-nexus-400/20 transition-all" />
      </div>
    </div>
  )
}
