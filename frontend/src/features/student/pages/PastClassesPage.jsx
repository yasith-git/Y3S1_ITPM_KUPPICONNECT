import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClasses } from '../../../contexts/ClassesContext';

const SUBJECTS = [
  'All',
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

function PastClassCard({ cls }) {
  const fmtDate = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtTime = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Link to={`/class/${cls.id}`}
      className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm transition-all duration-200 block
        hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-4">
        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
          {cls.subject}
        </span>
        <span className="bg-green-50 text-ok text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
          ✓ Completed
        </span>
      </div>

      <h3 className="text-base font-bold text-ink mb-1 leading-snug group-hover:text-primary transition-colors">
        {cls.title}
      </h3>
      <p className="text-dim text-xs mb-4">{cls.conductor}</p>

      <div className="flex flex-wrap gap-3 text-xs text-sub mb-4">
        <span>📅 {fmtDate(cls.dateTime ?? cls.date)}</span>
        <span>🕐 {cls.dateTime ? fmtTime(cls.dateTime) : cls.time}</span>
        {cls.classType === 'physical' && cls.location
          ? <span>📍 {cls.location}</span>
          : <span>💻 Online</span>}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-sub font-semibold text-sm">Rs. {cls.fee?.toLocaleString?.() ?? cls.fee}</span>
        <span className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200
          group-hover:bg-sky-50 group-hover:text-primary group-hover:border-sky-200 transition-colors">
          View Details →
        </span>
      </div>
    </Link>
  );
}

export default function PastClassesPage() {
  const { pastClasses, fetchPast } = useClasses();

  const [search,  setSearch]  = useState('');
  const [subject, setSubject] = useState('All');
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch whenever filters or page change
  useEffect(() => {
    setLoading(true);
    fetchPast({ subject, search, page, limit: 12 }).finally(() => setLoading(false));
  }, [subject, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setLoading(true);
      fetchPast({ subject, search, page: 1, limit: 12 }).finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubjectChange(s) {
    setSubject(s);
    setPage(1);
  }

  function clearFilters() {
    setSearch('');
    setSubject('All');
    setPage(1);
  }

  const { items = [], total = 0, pages = 1 } = pastClasses;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Nav bar ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm">K</span>
              <span className="font-black text-ink text-lg tracking-tight">KuppiConnect</span>
            </Link>
            <span className="hidden sm:block text-dim text-xs">·</span>
            <span className="hidden sm:block text-dim text-xs font-medium">Past Classes</span>
          </div>
          <Link to="/"
            className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
            ← Upcoming Classes
          </Link>
        </div>
      </header>

      {/* ── Hero banner ── */}
      <section className="bg-gradient-to-br from-slate-700 to-slate-900 text-white py-14 px-6 flex items-center justify-center">
        <p className="text-slate-300 text-sm leading-relaxed text-center max-w-lg">
          Browse all completed sessions. Access class details, notes, and discussions.
        </p>
      </section>

      {/* ── Filters ── */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search title or conductor…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none
                focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-dim"
            />
          </div>

          {/* Subject pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {SUBJECTS.map(s => (
              <button key={s}
                onClick={() => handleSubjectChange(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  subject === s
                    ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                    : 'bg-white text-dim border-slate-200 hover:border-slate-400 hover:text-ink'
                }`}>
                {s}
              </button>
            ))}
            {(search || subject !== 'All') && (
              <button onClick={clearFilters}
                className="text-xs text-err font-semibold hover:underline ml-1">
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white border border-rim rounded-2xl">
            <span className="text-5xl mb-4 block">🎓</span>
            <h3 className="font-bold text-ink text-lg mb-2">No past classes found</h3>
            <p className="text-sub text-sm mb-6">Try adjusting your filters, or check back later.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {(search || subject !== 'All') && (
                <button onClick={clearFilters}
                  className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all">
                  Clear Filters
                </button>
              )}
              <Link to="/"
                className="border border-slate-300 text-sub hover:text-ink text-sm font-semibold px-6 py-2.5 rounded-full transition-all">
                ← Upcoming Classes
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {items.map(cls => <PastClassCard key={cls.id} cls={cls} />)}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-xl text-dim
                    hover:border-slate-400 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white">
                  ← Prev
                </button>

                {[...Array(pages)].map((_, i) => {
                  const p = i + 1;
                  if (p === 1 || p === pages || Math.abs(p - page) <= 1) {
                    return (
                      <button key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 text-sm font-bold rounded-xl transition-all ${
                          p === page
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-dim hover:border-slate-400 hover:text-ink'
                        }`}>
                        {p}
                      </button>
                    );
                  }
                  if (p === 2 && page > 3) return <span key={p} className="text-dim text-sm px-1">…</span>;
                  if (p === pages - 1 && page < pages - 2) return <span key={p} className="text-dim text-sm px-1">…</span>;
                  return null;
                })}

                <button
                  disabled={page >= pages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-xl text-dim
                    hover:border-slate-400 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
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
            <Link to="/announcements" className="hover:text-ink transition-colors">Announcements</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
