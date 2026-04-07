import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useClasses } from '../../../contexts/ClassesContext';
import { useAnnouncements } from '../../../contexts/AnnouncementsContext';

const today = new Date().toISOString().split('T')[0];

function isActive(ann) {
  const now = new Date();
  return new Date(ann.startDate) <= now && new Date(ann.endDate) >= now;
}

const ALL_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'English', 'Economics', 'Statistics', 'Other',
];

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="text-dim shrink-0">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function AnnouncementCard({ ann }) {
  const initial = ann.title.charAt(0).toUpperCase();
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm
      hover:shadow-[0_8px_30px_rgba(14,165,233,0.1)] hover:border-primary/20 hover:-translate-y-0.5
      transition-all duration-200 flex flex-col">
      {ann.image ? (
        <img src={ann.image} alt={ann.title} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-28 bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center border-b border-sky-100">
          <span className="text-5xl font-extrabold text-primary/20 select-none tracking-tight">{initial}</span>
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-ink text-sm mb-2 leading-snug">{ann.title}</h3>
        <p className="text-dim text-xs leading-relaxed mb-4 flex-1 line-clamp-3">{ann.description}</p>
        <div className="flex items-center justify-between text-[11px] text-dim border-t border-slate-100 pt-3">
          <span>📅 {new Date(ann.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span className="bg-green-50 text-ok font-semibold px-2.5 py-0.5 rounded-full border border-green-100">
            Until {new Date(ann.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}

function ClassCard({ cls }) {
  const isFull = cls.enrolled >= cls.seats;
  const pct = Math.min(100, (cls.enrolled / cls.seats) * 100);

  return (
    <Link to={`/class/${cls.id}`}
      className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm transition-all duration-200 block
        hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(14,165,233,0.12)] hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <span className="bg-sky-50 text-primary text-xs font-bold px-3 py-1 rounded-full border border-sky-200">
          {cls.subject}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isFull ? 'bg-red-50 text-err' : 'bg-green-50 text-ok'
        }`}>
          {isFull ? 'Full' : `${cls.seats - cls.enrolled} left`}
        </span>
      </div>

      <h3 className="text-base font-bold text-ink mb-1 leading-snug group-hover:text-primary transition-colors">
        {cls.title}
      </h3>
      <p className="text-dim text-xs mb-4">{cls.conductor}</p>

      <div className="flex flex-wrap gap-3 text-xs text-sub mb-4">
        <span>📅 {cls.date}</span>
        <span>🕐 {cls.time}</span>
        <span>📍 {cls.location}</span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-[11px] text-dim mb-1.5">
          <span>{cls.enrolled} enrolled</span>
          <span>{cls.seats} seats</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-primary font-bold text-base">Rs. {cls.fee.toLocaleString()}</span>
        <span className="text-xs font-bold px-4 py-2 rounded-xl bg-sky-50 text-primary border border-sky-200
          group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all">
          View Details →
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { upcomingClasses } = useClasses();
  const { announcements } = useAnnouncements();

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All Modules');
  const [date, setDate] = useState('');

  const activeAnnouncements = useMemo(() => announcements.filter(isActive), [announcements]);

  // Build subject list from upcoming classes only
  const SUBJECTS = useMemo(
    () => ['All Modules', ...Array.from(new Set(upcomingClasses.map(c => c.subject))).filter(Boolean).sort()],
    [upcomingClasses]
  );

  const filteredClasses = useMemo(() => {
    const q = search.toLowerCase().trim();
    return upcomingClasses.filter(c => {
      const matchQ = !q || c.title.toLowerCase().includes(q)
        || (c.conductor ?? '').toLowerCase().includes(q)
        || (c.subject ?? '').toLowerCase().includes(q);
      const matchS = subject === 'All Modules' || c.subject === subject;
      const matchD = !date || c.date === date;
      return matchQ && matchS && matchD;
    });
  }, [upcomingClasses, search, subject, date]);

  const hasFilter = search || subject !== 'All Modules' || date;

  function clearFilters() {
    setSearch('');
    setSubject('All Modules');
    setDate('');
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">K</span>
            <span className="font-bold text-ink text-base tracking-tight">KuppiConnect</span>
          </Link>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <span className="hidden sm:block text-dim text-sm mr-1">
                  Hi, <span className="text-ink font-semibold">{user.name.split(' ')[0]}</span>
                </span>
                <Link
                  to={user.role === 'conductor' ? '/conductor' : '/student'}
                  className="text-sub hover:text-ink text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="border border-slate-200 text-sub hover:text-err hover:border-err/30 text-sm font-medium transition-all px-4 py-2 rounded-full ml-1">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sub hover:text-ink text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
                  Sign In
                </Link>
                <Link to="/register"
                  className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2 rounded-full transition-all shadow-sm ml-2
                    hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)] hover:-translate-y-0.5">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero + Search ── */}
      <section className="bg-sky-50 border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 bg-white border border-sky-200 text-primary text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 shadow-sm">
              ✦ Sri Lanka's #1 Kuppi Platform
            </span>
            <h1 className="text-4xl font-extrabold text-ink mb-3">
              Find your perfect <span className="text-primary">kuppi class.</span>
            </h1>
            <p className="text-sub text-sm max-w-md mx-auto">
              Search from 120+ sessions by subject, conductor, or date — then register instantly.
            </p>
          </div>

          {/* Search + filter bar */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col sm:flex-row gap-2">
              {/* Text search */}
              <div className="flex-1 flex items-center gap-2 px-3">
                <SearchIcon />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search class, subject or conductor..."
                  className="flex-1 text-sm text-ink placeholder-dim py-2.5 focus:outline-none bg-transparent"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="text-dim hover:text-ink transition-colors text-xl leading-none">×</button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 items-center px-2 sm:px-0">
                {/* Subject filter */}
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="text-sm text-ink border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white cursor-pointer transition-all">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>

                {/* Date filter */}
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="text-sm text-ink border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white cursor-pointer transition-all" />

                {hasFilter && (
                  <button onClick={clearFilters}
                    className="text-xs text-dim hover:text-primary transition-colors whitespace-nowrap px-1">
                    Clear
                  </button>
                )}

                <button
                  className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm whitespace-nowrap">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Active Announcements ── */}
      {activeAnnouncements.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Latest Updates</p>
              <h2 className="text-2xl font-bold text-ink">Announcements</h2>
            </div>
            <span className="bg-green-50 text-ok text-xs font-semibold px-3 py-1.5 rounded-full border border-green-100">
              {activeAnnouncements.length} active
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeAnnouncements.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)}
          </div>
        </section>
      )}

      {/* ── Classes ── */}
      <section className={`max-w-7xl mx-auto px-6 pb-20 ${activeAnnouncements.length > 0 ? '' : 'pt-16'}`}>
        <div className="border-t border-slate-100 pt-12">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">
                {hasFilter
                  ? `${filteredClasses.length} result${filteredClasses.length !== 1 ? 's' : ''} found`
                  : 'All Classes'}
              </p>
              <h2 className="text-2xl font-bold text-ink">
                {hasFilter ? 'Search Results' : 'Upcoming Kuppi Sessions'}
              </h2>
            </div>
            {hasFilter && (
              <button onClick={clearFilters}
                className="text-sm text-primary hover:text-primary-dark font-semibold transition-colors hover:underline underline-offset-4">
                Clear filters
              </button>
            )}
          </div>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-20 bg-sky-50 rounded-2xl border border-sky-100">
              <span className="text-5xl mb-4 block">🔍</span>
              <h3 className="font-bold text-ink text-lg mb-2">No upcoming classes found</h3>
              <p className="text-sub text-sm mb-4">Try adjusting your search or clearing the filters.</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={clearFilters}
                  className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all shadow-sm">
                  Show All Upcoming
                </button>
                <Link to="/past-classes"
                  className="border border-slate-300 text-sub hover:text-ink text-sm font-semibold px-6 py-2.5 rounded-full transition-all">
                  Browse Past Classes →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClasses.map(cls => <ClassCard key={cls.id} cls={cls} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-dim">
            <span className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">K</span>
            <span className="font-semibold text-ink">KuppiConnect</span>
            <span>· © 2026</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-dim">
            <Link to="/" className="hover:text-ink transition-colors">Home</Link>
            <Link to="/past-classes" className="hover:text-ink transition-colors">Past Classes</Link>
            {!user && <Link to="/login" className="hover:text-ink transition-colors">Sign In</Link>}
            {!user && <Link to="/register" className="hover:text-ink transition-colors">Register</Link>}
          </div>
        </div>
      </footer>
    </div>
  );
}
