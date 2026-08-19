import Link from 'next/link';
import { Car, Shield, Clock, ArrowRight, MapPin } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-900 flex items-center justify-center shadow-sm">
            <Car className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-slate-900">RideShare</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-slate-600 transition-colors">
            Log In
          </Link>
          <Link href="/register" className="bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-bold rounded-full px-6 py-2.5">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <h1 className="text-6xl sm:text-7xl md:text-[5.5rem] font-display font-bold text-slate-900 leading-[1.05] tracking-tight">
            Go anywhere with RideShare.
          </h1>
          <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
            Request a ride, hop in, and go. Fast, safe, and reliable transportation at your fingertips.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
            <Link href="/register?role=rider" className="btn-primary text-lg px-8 py-4 rounded-xl w-full sm:w-auto flex items-center justify-between shadow-soft">
              <span className="flex items-center gap-2 font-bold"><MapPin className="w-5 h-5" /> Book a Ride</span>
              <ArrowRight className="w-5 h-5 ml-6" />
            </Link>
            <Link href="/register?role=driver" className="btn-secondary text-lg px-8 py-4 rounded-xl w-full sm:w-auto font-bold border-2">
              Become a Driver
            </Link>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="relative w-full aspect-[4/3] rounded-3xl bg-slate-100 overflow-hidden shadow-soft">
            <div className="absolute inset-0 bg-slate-200 animate-pulse" />
            <img 
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200" 
              alt="City driving" 
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-95 transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-32">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-20 text-center tracking-tight">Why ride with us?</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Clock, title: 'Always on time', desc: 'Our advanced routing algorithms ensure you get picked up and dropped off via the fastest route possible.' },
              { icon: Shield, title: 'Safe & Secure', desc: 'Every driver is background-checked, and all rides are tracked in real-time with continuous GPS monitoring.' },
              { icon: Car, title: 'Premium Fleet', desc: 'From budget-friendly sedans to luxury SUVs, choose the perfect vehicle for any occasion.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Icon className="w-7 h-7 text-slate-900" />
                </div>
                <h3 className="font-display font-bold text-2xl text-slate-900">{title}</h3>
                <p className="text-slate-600 text-lg leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
