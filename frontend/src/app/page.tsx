import Link from 'next/link';
import { Zap, Car, Shield, Star, ArrowRight, MapPin } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface overflow-hidden">
      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-800/15 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">RideShare</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="btn-primary py-2 px-5 text-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live platform — Real-time tracking
        </div>

        <h1 className="text-5xl sm:text-7xl font-display font-extrabold text-white leading-none mb-6">
          Your ride,{' '}
          <span className="bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">
            on demand
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Book rides instantly, track your driver in real-time, and arrive safely.
          Powered by Socket.IO, MongoDB, and Redis for sub-second updates.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register?role=rider" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
            <MapPin className="w-5 h-5" /> Book a Ride
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/register?role=driver" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
            <Car className="w-5 h-5" /> Become a Driver
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'Real-Time Tracking', desc: 'Live GPS updates via Socket.IO — watch your driver move on the map second by second.', color: 'from-brand-500 to-brand-700' },
            { icon: Shield, title: 'Safe & Secure', desc: 'JWT authentication, role-based access, OTP ride verification, and rate limiting built in.', color: 'from-green-500 to-emerald-700' },
            { icon: Star, title: 'Surge Pricing', desc: 'Dynamic fare calculation based on real-time supply/demand ratios with transparent pricing.', color: 'from-amber-500 to-orange-700' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="glass-card p-6 group hover:border-brand-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-20 text-center">
        <p className="text-sm text-slate-600 mb-4 uppercase tracking-widest font-medium">Built with production-grade technology</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['Next.js 14', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB', 'Redis', 'Socket.IO', 'GraphQL', 'Docker', 'Mapbox'].map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-medium">
              {t}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
