import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Trophy, MapPin, Ticket, ChevronRight, Sparkles, Zap, Star, Menu, X, ArrowRight, Clock, Award, Wallet } from 'lucide-react'

/* ─── Countdown Hook ─── */
function useCountdown(targetDate) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(targetDate) - new Date())
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  return time
}

/* ─── Animate on scroll ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ═══════════════════════════════════════════════ */
/*                  NAVBAR                         */
/* ═══════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-surface-900/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold text-lg font-display group-hover:scale-110 transition-transform">N</div>
          <span className="text-xl font-bold font-display bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">NexusFest</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {['Events', 'Schedule', 'Leaderboard', 'About'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-gray-300 hover:text-nexus-400 transition-colors font-medium">{l}</a>
          ))}
          <Link to="/login" className="px-5 py-2.5 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white text-sm font-semibold hover:shadow-[0_0_25px_rgba(6,232,225,0.3)] hover:scale-105 transition-all duration-300">
            Login
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-gray-300" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-surface-800/95 backdrop-blur-xl border-t border-white/5 animate-slide-up">
          <div className="flex flex-col p-6 gap-4">
            {['Events', 'Schedule', 'Leaderboard', 'About'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-gray-300 hover:text-nexus-400 py-2 font-medium" onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
            <Link to="/login" className="mt-2 px-5 py-3 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-xl text-white font-semibold text-center w-full" onClick={() => setMenuOpen(false)}>Login</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

/* ═══════════════════════════════════════════════ */
/*              HERO SECTION                       */
/* ═══════════════════════════════════════════════ */
function Hero() {
  const countdown = useCountdown('2026-04-15T09:00:00')

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-nexus-400/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-500/5 blur-[100px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nexus-400/20 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nexus-400/10 border border-nexus-400/20 mb-8 animate-slide-up">
          <Sparkles size={14} className="text-nexus-400" />
          <span className="text-sm text-nexus-400 font-medium">April 15–17, 2026 • Pune, India</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black font-display mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">Nexus</span>
          <span className="bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">Fest</span>
          <span className="bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text text-transparent block text-3xl sm:text-4xl lg:text-5xl mt-2 font-bold">2026</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 animate-slide-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
          Where <span className="text-nexus-400 font-semibold">Innovation</span> Meets <span className="text-accent-400 font-semibold">Celebration</span>.
          The unified college event management ecosystem.
        </p>

        {/* Countdown */}
        <div className="flex justify-center gap-3 sm:gap-5 mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { value: countdown.days, label: 'Days' },
            { value: countdown.hours, label: 'Hours' },
            { value: countdown.minutes, label: 'Minutes' },
            { value: countdown.seconds, label: 'Seconds' },
          ].map(({ value, label }) => (
            <div key={label} className="w-20 sm:w-24 py-4 sm:py-5 rounded-2xl bg-surface-700/60 backdrop-blur-sm border border-white/10 hover:border-nexus-400/30 transition-all group hover:shadow-[0_0_20px_rgba(6,232,225,0.15)]">
              <div className="text-2xl sm:text-4xl font-bold font-display text-white group-hover:text-nexus-400 transition-colors">
                {String(value).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Link to="/login" className="group px-8 py-4 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-2xl text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(6,232,225,0.35)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
            Register Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/events" className="px-8 py-4 border-2 border-nexus-400/40 rounded-2xl text-nexus-400 font-bold text-lg hover:bg-nexus-400/10 hover:border-nexus-400 transition-all duration-300 flex items-center justify-center">
            Explore Events
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 animate-float">
        <span className="text-xs tracking-wider uppercase">Scroll</span>
        <div className="w-5 h-8 rounded-full border-2 border-gray-600 flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-gray-500 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════ */
/*             FEATURE STATS                       */
/* ═══════════════════════════════════════════════ */
function FeatureStats() {
  const [ref, visible] = useInView()
  const stats = [
    { icon: Calendar, value: '50+', label: 'Events', color: 'from-cyan-400 to-blue-500', delay: '0s' },
    { icon: Users, value: '30+', label: 'Colleges', color: 'from-purple-400 to-pink-500', delay: '0.1s' },
    { icon: Trophy, value: '₹5L+', label: 'Prize Pool', color: 'from-amber-400 to-orange-500', delay: '0.2s' },
    { icon: Ticket, value: '5000+', label: 'Participants', color: 'from-green-400 to-emerald-500', delay: '0.3s' },
  ]

  return (
    <section ref={ref} className="py-20 relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map(({ icon: Icon, value, label, color, delay }) => (
            <div key={label}
              className={`group relative p-6 sm:p-8 rounded-2xl bg-surface-700/50 backdrop-blur-sm border border-white/5 hover:border-white/15 transition-all duration-500 hover:-translate-y-2 hover:shadow-lg cursor-default ${visible ? 'animate-slide-up' : 'opacity-0'}`}
              style={{ animationDelay: delay }}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={22} className="text-white" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-display text-white mb-1">{value}</div>
              <div className="text-sm text-gray-400 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════ */
/*            FEATURED EVENTS                      */
/* ═══════════════════════════════════════════════ */
function FeaturedEvents() {
  const [ref, visible] = useInView()
  const events = [
    { name: 'Code Sprint 2026', type: 'Technical', scope: 'Inter College', date: 'Apr 15 • 9 AM', prize: '₹50,000', spots: '87/200', color: 'border-cyan-400/30', badge: 'bg-cyan-400/15 text-cyan-400' },
    { name: 'Dance Battle Royale', type: 'Cultural', scope: 'Open', date: 'Apr 15 • 2 PM', prize: '₹25,000', spots: '45/100', color: 'border-pink-400/30', badge: 'bg-pink-400/15 text-pink-400' },
    { name: 'Robo Wars', type: 'Technical', scope: 'Inter College', date: 'Apr 16 • 10 AM', prize: '₹40,000', spots: '32/60', color: 'border-amber-400/30', badge: 'bg-amber-400/15 text-amber-400' },
    { name: 'E-Sports Tournament', type: 'Gaming', scope: 'Open', date: 'Apr 16 • 12 PM', prize: '₹30,000', spots: '120/256', color: 'border-green-400/30', badge: 'bg-green-400/15 text-green-400' },
    { name: 'Art Exhibition', type: 'Cultural', scope: 'Intra College', date: 'Apr 17 • 9 AM', prize: '₹15,000', spots: '28/50', color: 'border-purple-400/30', badge: 'bg-purple-400/15 text-purple-400' },
    { name: 'Quiz Masters', type: 'Academic', scope: 'Inter College', date: 'Apr 17 • 11 AM', prize: '₹20,000', spots: '64/100', color: 'border-blue-400/30', badge: 'bg-blue-400/15 text-blue-400' },
  ]

  return (
    <section id="events" ref={ref} className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${visible ? 'animate-slide-up' : 'opacity-0'}`}>
          <h2 className="text-4xl sm:text-5xl font-black font-display mb-4">
            <span className="bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">Featured</span> Events
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">From hackathons to dance-offs, scavenger hunts to robo wars — there's something for everyone.</p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt, i) => (
            <div key={evt.name}
              className={`group p-6 rounded-2xl bg-surface-700/40 backdrop-blur-sm border ${evt.color} hover:bg-surface-600/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl cursor-pointer ${visible ? 'animate-slide-up' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${evt.badge}`}>{evt.type}</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400">{evt.scope}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-nexus-400 transition-colors">{evt.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Clock size={14} /> {evt.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Trophy size={14} className="text-amber-400" /> Prize: {evt.prize}
              </div>
              {/* Registration bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Registered</span>
                  <span>{evt.spots}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-500 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-nexus-400 to-accent-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(parseInt(evt.spots) / parseInt(evt.spots.split('/')[1])) * 100}%` }} />
                </div>
              </div>
              <Link to="/login" className="w-full py-3 rounded-xl bg-white/5 text-white font-semibold text-sm hover:bg-gradient-to-r hover:from-nexus-400 hover:to-accent-500 transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                Register Now <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/events" className="px-8 py-3 border-2 border-nexus-400/30 rounded-xl text-nexus-400 font-semibold hover:bg-nexus-400/10 hover:border-nexus-400 transition-all inline-block">
            View All Events →
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════ */
/*           HOW IT WORKS                          */
/* ═══════════════════════════════════════════════ */
function HowItWorks() {
  const [ref, visible] = useInView()
  const steps = [
    { icon: Users, title: 'Register', desc: 'Create your account, verify your college, and set up your profile in seconds.', color: 'from-cyan-400 to-blue-500' },
    { icon: Calendar, title: 'Explore & Register', desc: 'Browse 50+ events, form teams, and register with one click.', color: 'from-purple-400 to-pink-500' },
    { icon: MapPin, title: 'Check In via QR', desc: 'Flash your personal QR code at the venue for instant attendance.', color: 'from-amber-400 to-orange-500' },
    { icon: Award, title: 'Win & Celebrate', desc: 'Compete, climb the leaderboard, earn certificates, and make memories.', color: 'from-green-400 to-emerald-500' },
  ]

  return (
    <section ref={ref} className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-nexus-400/[0.02] to-transparent" />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className={`text-center mb-16 ${visible ? 'animate-slide-up' : 'opacity-0'}`}>
          <h2 className="text-4xl sm:text-5xl font-black font-display mb-4">
            How It <span className="bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">From registration to celebration — everything happens on NexusFest.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.title}
              className={`relative p-6 rounded-2xl bg-surface-700/40 border border-white/5 hover:border-white/15 transition-all duration-500 hover:-translate-y-2 group ${visible ? 'animate-slide-up' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-6xl font-black font-display text-surface-500/50 absolute top-4 right-4">{i + 1}</div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <step.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════ */
/*          ECOSYSTEM FEATURES                     */
/* ═══════════════════════════════════════════════ */
function EcosystemFeatures() {
  const [ref, visible] = useInView()
  const features = [
    { icon: Zap, title: 'Real-time Leaderboard', desc: 'Watch your college climb the ranks live across 30+ competing institutions.', color: 'text-amber-400' },
    { icon: Wallet, title: 'Digital Wallet', desc: 'Go cashless at food stalls. Top-up, pay via QR, track spending — all in-app.', color: 'text-green-400' },
    { icon: Award, title: 'Auto Certificates', desc: 'Participation and winner certificates generated instantly with QR verification.', color: 'text-purple-400' },
    { icon: MapPin, title: 'Scavenger Hunt', desc: 'Scan QR codes hidden across campus. Solve clues. Race for the treasure.', color: 'text-pink-400' },
    { icon: Star, title: 'Face Verification', desc: 'AI-powered identity check ensures only registered participants enter events.', color: 'text-cyan-400' },
    { icon: Sparkles, title: 'Offline-Ready', desc: 'Coordinators can scan attendance even without internet. Auto-syncs later.', color: 'text-blue-400' },
  ]

  return (
    <section ref={ref} className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className={`text-center mb-16 ${visible ? 'animate-slide-up' : 'opacity-0'}`}>
          <h2 className="text-4xl sm:text-5xl font-black font-display mb-4">
            The <span className="bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">Ecosystem</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">Not just an event portal — a complete fest management universe.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={f.title}
              className={`p-6 rounded-2xl bg-surface-700/30 border border-white/5 hover:border-white/15 transition-all duration-500 hover:-translate-y-1 group ${visible ? 'animate-slide-up' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 0.07}s` }}>
              <f.icon size={28} className={`${f.color} mb-4 group-hover:scale-110 transition-transform`} />
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════ */
/*                CTA SECTION                      */
/* ═══════════════════════════════════════════════ */
function CTASection() {
  const [ref, visible] = useInView()
  return (
    <section ref={ref} className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className={`relative p-12 sm:p-16 rounded-3xl bg-gradient-to-br from-surface-700/80 to-surface-800/80 border border-nexus-400/20 overflow-hidden ${visible ? 'animate-slide-up' : 'opacity-0'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-nexus-400/10 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-accent-500/10 blur-[60px]" />
          <div className="relative z-10 text-center">
            <h2 className="text-4xl sm:text-5xl font-black font-display mb-4 text-white">Ready to make <span className="bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">history</span>?</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg">Join 5,000+ participants from 30+ colleges. Register today and be part of the biggest inter-college fest of 2026.</p>
            <Link to="/login" className="group px-10 py-4 bg-gradient-to-r from-nexus-400 to-accent-500 rounded-2xl text-white font-bold text-lg hover:shadow-[0_0_40px_rgba(6,232,225,0.3)] hover:scale-105 transition-all duration-300 animate-pulse-glow inline-flex items-center gap-2">
              Register Now — It's Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════ */
/*                  FOOTER                         */
/* ═══════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-nexus-400 to-accent-500 flex items-center justify-center text-white font-bold font-display">N</div>
              <span className="text-lg font-bold font-display bg-gradient-to-r from-nexus-400 to-accent-400 bg-clip-text text-transparent">NexusFest</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">The unified college event management ecosystem. Built for the next generation of fest experiences.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Platform</h4>
            <ul className="space-y-2.5">
              <li><Link to="/events" className="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Events</Link></li>
              <li><Link to="/schedule" className="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Schedule</Link></li>
              <li><Link to="/leaderboard" className="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Leaderboard</Link></li>
              <li><Link to="/certificates" className="text-sm text-gray-500 hover:text-nexus-400 transition-colors">Certificates</Link></li>
            </ul>
          </div>
          {[
            { title: 'Community', links: [{l:'Colleges', to:'#'}, {l:'Coordinators', to:'/login'}, {l:'Volunteers', to:'/login'}, {l:'Sponsors', to:'#'}] },
            { title: 'Support', links: [{l:'Help Center', to:'#'}, {l:'Contact Us', to:'#'}, {l:'Privacy Policy', to:'#'}, {l:'Terms', to:'#'}] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(item => (
                  <li key={item.l}>
                    <Link to={item.to} className="text-sm text-gray-500 hover:text-nexus-400 transition-colors">
                      {item.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">© 2026 NexusFest. Crafted with ❤️ for the college community.</p>
          <div className="flex gap-6">
            {['Twitter', 'Instagram', 'LinkedIn', 'GitHub'].map(s => <a key={s} href="#" className="text-xs text-gray-600 hover:text-nexus-400 transition-colors">{s}</a>)}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════ */
/*              LANDING PAGE                       */
/* ═══════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <Hero />
      <FeatureStats />
      <FeaturedEvents />
      <HowItWorks />
      <EcosystemFeatures />
      <CTASection />
      <Footer />
    </div>
  )
}
