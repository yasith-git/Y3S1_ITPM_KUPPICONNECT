/**
 * StudentRegistrationPage — Member 3 (Registration feature)
 *
 * Browse and filter all available classes.
 * Clicking a card (or the Register button) navigates to /class/:id
 * where the full registration modal lives.
 *
 * Rules enforced:
 *  - A student who is already enrolled sees \u2713 Enrolled badge instead of Register button.
 *  - Meeting link URLs are NEVER shown here (sent via email only).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useClasses } from '../../../contexts/ClassesContext';
import { useEnrollments } from '../../../contexts/EnrollmentsContext';

const SUBJECTS = [
  'All', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'English', 'Economics', 'Statistics', 'Other',
];

const today = new Date().toISOString().split('T')[0];

/**
 * Returns a display-safe location string.
 * Online classes show \"Online\" — never the raw meeting URL.
 * Physical classes show the venue text.
 */
function displayLocation(cls) {
  if (cls.classType === 'physical') return cls.location || '';
  if (cls.classType === 'online')   return 'Online';
  // Legacy fallback: if stored value looks like a URL, mask it
  const val = cls.location || cls.meetingLink || '';
  if (val.startsWith('http')) return 'Online';
  return val;
}

export default function StudentRegistrationPage() {
  const { classes } = useClasses();
  /*
   * isEnrolledByEmail lets us show ✓ Enrolled even when the student changes
   * accounts but uses the same email address.
   */
  const { isEnrolled, isEnrolledByEmail } = useEnrollments();
  const { user } = useAuth();

  const [search, setSearch]       = useState('');
  const [subject, setSubject]     = useState('All');
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const filtered = classes.filter(cls => {
    if (subject !== 'All' && cls.subject !== subject) return false;
    if (upcomingOnly && cls.date < today) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        cls.title?.toLowerCase().includes(q) ||
        cls.conductor?.toLowerCase().includes(q) ||
        cls.subject?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Student Portal</p>
        <h1 className="text-3xl font-bold text-ink">Browse Classes</h1>
        <p className="text-sub text-sm mt-1">Find and register for upcoming kuppi classes.</p>
      </div>

      {/* Search + filter toolbar */}
      <div className="bg-white border border-rim rounded-2xl p-5 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-dim w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search classes, conductors, subjects..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-sub font-semibold cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={upcomingOnly}
              onChange={e => setUpcomingOnly(e.target.checked)}
              className="rounded accent-primary"
            />
            Upcoming only
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map(s => (
            <button key={s}
              onClick={() => setSubject(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                subject === s
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-sky-50 text-primary border-sky-200 hover:bg-sky-100'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-dim mb-4 font-medium">{filtered.length} class{filtered.length !== 1 ? 'es' : ''} found</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-rim rounded-2xl">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="font-bold text-ink text-lg mb-1">No classes found</h3>
          <p className="text-sub text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(cls => {
            const isFull  = cls.enrolled >= cls.seats;
            // Check enrollment by both ID and email for a reliable \u2713 Enrolled state
            const isReg   = isEnrolled(cls.id, user?.id) || isEnrolledByEmail(cls.id, user?.email);
            const isPast  = cls.date < today;
            const pct     = Math.min(100, (cls.enrolled / cls.seats) * 100);
            const location = displayLocation(cls);  // safe — never exposes raw URLs

            return (
              <div key={cls.id} className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col ${
                isReg ? 'border-primary/40' : 'border-rim'
              }`}>
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <span className="bg-sky-50 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-sky-200">{cls.subject}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                      isReg  ? 'bg-green-50 text-ok border border-green-200' :
                      isFull ? 'bg-red-50 text-err border border-red-200' :
                      isPast ? 'bg-slate-100 text-dim border border-slate-200' :
                               'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {isReg ? '✓ Enrolled' : isFull ? 'Full' : isPast ? 'Past' : 'Open'}
                    </span>
                  </div>
                  <h3 className="font-bold text-ink text-sm leading-tight mb-1">{cls.title}</h3>
                  <p className="text-dim text-xs mb-3">{cls.conductor}</p>
                  <div className="space-y-1 text-xs text-sub mb-4">
                    <p>📅 {cls.date} · {cls.time}</p>
                    {cls.duration && <p>⏱ {cls.duration}</p>}
                    {/* Show location text only — raw meeting URLs are never displayed */}
                    {location && <p>📍 {location}</p>}
                  </div>
                  <div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-err' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-dim mt-1">
                      <span>{cls.enrolled} enrolled</span>
                      <span>{cls.seats} seats</span>
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="font-extrabold text-primary">Rs. {cls.fee?.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <Link to={`/class/${cls.id}`}
                      className="text-xs text-sub border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all font-semibold">
                      Details
                    </Link>
                    {!isReg && !isFull && !isPast && (
                      <Link to={`/class/${cls.id}`}
                        className="text-xs bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark transition-all font-bold shadow-sm">
                        Register
                      </Link>
                    )}
                    {isReg && <span className="text-xs text-ok font-bold px-3 py-2">✓ Enrolled</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

