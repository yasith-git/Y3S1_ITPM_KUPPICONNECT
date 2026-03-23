import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dummyAnnouncements, dummyClasses } from '../../../data/dummyData';

function LandingPage() {
  const pinned   = dummyAnnouncements.filter((a) => a.pinned);
  const featured = dummyClasses.slice(0, 3);
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar — 60% white, clean ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">K</span>
            <span className="font-bold text-ink text-base tracking-tight">KuppiConnect</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/announcements"
              className="text-sub hover:text-ink text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
              Announcements
            </Link>
            <Link to="/login"
              className="text-sub hover:text-ink text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
              Sign In
            </Link>
            <Link to="/register"
              className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2 rounded-full
                         transition-all shadow-sm ml-2 hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)] hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero — 60% white, typography-led ── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left: Text content */}
          <div className="flex-1 max-w-xl">
            <span className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 text-primary text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              ✦ Sri Lanka's #1 Kuppi Platform
            </span>
            <h1 className="text-5xl font-extrabold text-ink leading-tight mb-5">
              Find your perfect<br />
              <span className="text-primary">kuppi class.</span>
            </h1>
            <p className="text-sub text-lg leading-relaxed mb-8 max-w-md">
              Connect with expert conductors, register for sessions, and ace your university exams — all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register"
                className="bg-primary hover:bg-primary-dark text-white font-bold px-7 py-3.5 rounded-full
                           transition-all shadow-[0_4px_14px_rgba(14,165,233,0.3)]
                           hover:shadow-[0_6px_22px_rgba(14,165,233,0.45)] hover:-translate-y-0.5 text-sm">
                Join for Free →
              </Link>
              <Link to="/login"
                className="border border-slate-200 hover:border-primary/40 text-ink font-semibold px-7 py-3.5 rounded-full
                           transition-all hover:bg-sky-50 text-sm hover:-translate-y-0.5">
                Sign In
              </Link>
            </div>
            <p className="text-dim text-xs mt-5">Free to join · No credit card required</p>
          </div>

          {/* Right: Decorative class card (desktop only) */}
          <div className="hidden lg:block relative flex-1 max-w-md py-8">
            {/* Background tilt */}
            <div className="absolute inset-8 bg-sky-50 rounded-3xl -rotate-3 pointer-events-none" />
            {/* Main class card */}
            <div className="relative bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mx-6">
              <div className="flex items-start justify-between mb-4">
                <span className="bg-sky-50 text-primary text-xs font-bold px-3 py-1 rounded-full border border-sky-200">Chemistry</span>
                <span className="bg-green-50 text-ok text-xs font-semibold px-2.5 py-1 rounded-full">✅ 3 seats left</span>
              </div>
              <h3 className="font-bold text-ink text-base mb-1">Advanced Organic Chemistry</h3>
              <p className="text-dim text-xs mb-3">Dr. Kamal Perera · University of Colombo</p>
              <div className="flex gap-4 text-xs text-sub mb-4">
                <span>📅 Sat, Mar 28</span>
                <span>🕐 10:00 AM</span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-dim mb-1"><span>18 enrolled</span><span>21 seats</span></div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '86%' }} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-primary font-bold text-base">Rs. 500</span>
                <span className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl cursor-default">Register →</span>
              </div>
            </div>
            {/* Floating stat — top right */}
            <div className="absolute top-1 right-0 bg-white rounded-2xl shadow-md border border-slate-100 p-4 w-38 z-10">
              <p className="text-xs text-dim font-medium mb-1">Total Students</p>
              <p className="text-xl font-extrabold text-ink">4,200+</p>
              <p className="text-[11px] text-ok font-semibold mt-0.5">↑ Growing fast</p>
            </div>
            {/* Floating stat — bottom left */}
            <div className="absolute bottom-1 left-0 bg-white rounded-2xl shadow-md border border-slate-100 p-4 w-36 z-10">
              <p className="text-xs text-dim font-medium mb-1">Active Classes</p>
              <p className="text-xl font-extrabold text-ink">120+</p>
              <p className="text-[11px] text-primary font-semibold mt-0.5">30+ subjects</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip — 30% sky-50 ── */}
      <section className="bg-sky-50 border-y border-sky-100">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '120+',   label: 'Active Classes',    icon: '📚' },
            { value: '4,200+', label: 'Students Enrolled', icon: '🎓' },
            { value: '85+',    label: 'Expert Conductors', icon: '🎤' },
            { value: '30+',    label: 'Subjects Covered',  icon: '🏆' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <span className="text-2xl block mb-2">{s.icon}</span>
              <p className="text-2xl font-extrabold text-primary mb-0.5">{s.value}</p>
              <p className="text-sub text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Announcement ticker ── */}
      {pinned.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-100">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
            <span className="bg-amber-400 text-amber-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shrink-0">
              Notice
            </span>
            {pinned.map((a) => (
              <span key={a.id} className="text-sm text-amber-800 font-medium">
                {a.title}: {a.body}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Featured Classes — 60% white ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">This Week</p>
            <h2 className="text-3xl font-bold text-ink">Featured Classes</h2>
          </div>
          <Link to="/login" className="text-primary hover:text-primary-dark text-sm font-semibold transition hover:underline underline-offset-4">
            View all →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {featured.map((cls) => (
            <div key={cls.id}
              onMouseEnter={() => setHoveredCard(cls.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`bg-white border rounded-2xl p-6 transition-all duration-300 cursor-default group ${
                hoveredCard === cls.id
                  ? 'border-primary/30 shadow-[0_8px_30px_rgba(14,165,233,0.12)] -translate-y-1'
                  : 'border-slate-100 shadow-sm'
              }`}>
              <div className="flex items-start justify-between mb-4">
                <span className="bg-sky-50 text-primary text-xs font-bold px-3 py-1 rounded-full border border-sky-200">
                  {cls.subject}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  cls.enrolled >= cls.seats ? 'bg-red-50 text-err' : 'bg-green-50 text-ok'
                }`}>
                  {cls.enrolled >= cls.seats ? 'Full' : `${cls.seats - cls.enrolled} left`}
                </span>
              </div>
              <h3 className={`text-base font-bold mb-1 transition-colors ${hoveredCard === cls.id ? 'text-primary' : 'text-ink'}`}>
                {cls.title}
              </h3>
              <p className="text-dim text-xs mb-3">{cls.conductor}</p>
              <div className="flex gap-3 text-xs text-sub mb-4">
                <span>📅 {cls.date}</span>
                <span>🕐 {cls.time}</span>
              </div>
              {/* Seats progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-dim mb-1">
                  <span>{cls.enrolled} enrolled</span>
                  <span>{cls.seats} seats</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (cls.enrolled / cls.seats) * 100)}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-primary font-bold text-base">Rs. {cls.fee}</span>
                <Link to="/login"
                  className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 rounded-xl
                             transition-all hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)]">
                  Register →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works — 30% sky-50 ── */}
      <section className="bg-sky-50 border-y border-sky-100">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-3xl font-bold text-ink">How KuppiConnect Works</h2>
            <p className="text-sub text-sm mt-3 max-w-md mx-auto">Three steps to find and attend the perfect kuppi class</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '🔍', title: 'Find Your Class', desc: 'Browse sessions by subject, conductor, date, or budget. Filter to exactly what you need.' },
              { step: '02', icon: '📝', title: 'Register & Secure', desc: 'Instantly claim your seat with a quick registration. Get a confirmation with all details.' },
              { step: '03', icon: '🎓', title: 'Learn & Succeed', desc: 'Attend your session, access shared materials, and rate your experience.' },
            ].map((item) => (
              <div key={item.step}
                className="bg-white rounded-2xl p-7 border border-slate-100 hover:border-primary/25
                           hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(14,165,233,0.1)]
                           transition-all duration-300 group cursor-default">
                <div className="w-12 h-12 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-center text-2xl mb-5
                                group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                  {item.icon}
                </div>
                <p className="text-primary text-xs font-bold tracking-widest mb-1.5">{item.step}</p>
                <h3 className="font-bold text-ink text-base mb-2">{item.title}</h3>
                <p className="text-dim text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — 10% accent: the ONE colored section ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-primary rounded-3xl px-10 py-14 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative z-10">
            <p className="text-sky-200 text-xs font-bold uppercase tracking-widest mb-3">Ready to Start?</p>
            <h2 className="text-3xl font-extrabold text-white mb-3">Ready to ace your exams?</h2>
            <p className="text-sky-100 max-w-md mx-auto mb-8 text-sm leading-relaxed">
              Join thousands of Sri Lankan students already learning smarter with KuppiConnect.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/register"
                className="bg-white text-primary font-bold px-7 py-3 rounded-full hover:bg-sky-50
                           transition-all shadow-lg hover:shadow-xl text-sm hover:-translate-y-0.5">
                Create Free Account
              </Link>
              <Link to="/login"
                className="border border-white/40 text-white font-semibold px-7 py-3 rounded-full
                           hover:bg-white/15 hover:border-white/70 transition-all text-sm hover:-translate-y-0.5">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer — 60% white ── */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-dim">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">K</span>
            <span className="font-semibold text-ink">KuppiConnect</span>
            <span>· © 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/announcements" className="hover:text-ink transition-colors">Announcements</Link>
            <Link to="/login"         className="hover:text-ink transition-colors">Login</Link>
            <Link to="/register"      className="hover:text-ink transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
