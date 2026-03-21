import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useClasses } from '../../../contexts/ClassesContext';
import { useEnrollments } from '../../../contexts/EnrollmentsContext';
import { useClassRequests } from '../../../contexts/ClassRequestContext';
import { dummyUsers } from '../../../data/dummyData';
import { api } from '../../../services/api';
import Comments from '../../content/components/Comments';
import Rating from '../../content/components/Rating';
import UploadNotes from '../../content/components/UploadNotes';
import AISummary from '../../content/components/AISummary';
import ClassAnnouncements from '../../content/components/ClassAnnouncements';

/**
 * ClassDetails — Public class detail page (used by both guests and logged-in students).
 *
 * Lives in features/landing/pages/ (shared, not Member-specific) because it must
 * be accessible without a login for browsing.
 *
 * Registration flow:
 *  1. Student clicks "Register for this Class"
 *  2. RegisterModal opens, student confirms name / email / phone
 *  3. POST /api/registration/enroll is called (Member 3 — registration/ backend)
 *  4. On success the enrollment is also saved to localStorage for instant UI feedback
 *  5. alreadyEnrolled flag replaces the register button with a ✓ confirmation
 *
 * Duplicate-registration prevention:
 *  - Backend: unique index on (student, class) + email cross-check
 *  - Frontend: isEnrolled() + isEnrolledByEmail() from EnrollmentsContext
 */
function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function StarIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/**
 * Returns a human-readable location string — never exposes raw URLs.
 * Physical classes show the venue text; online classes show "Online".
 */
function displayLocation(cls) {
  if (cls.classType === 'physical') return cls.location || '—';
  if (cls.classType === 'online')   return 'Online';
  // Legacy: if location/meetingLink looks like a URL, replace with "Online"
  const val = cls.location || cls.meetingLink || '';
  if (val.startsWith('http')) return 'Online';
  return val || '—';
}

function StarRating({ rating }) {
  const full = Math.floor(rating);
  return (
    <span className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }, (_, i) => <StarIcon key={i} filled={i < full} />)}
    </span>
  );
}

/* ── Registration Modal ── */
function RegisterModal({ cls, user, onClose, onSuccess }) {
  const { enroll, isEnrolled, isEnrolledByEmail, fetchMyEnrollments, fetchMyClasses } = useEnrollments();
  const { incrementEnrolled }  = useClasses();

  // Pre-fill phone from the student's saved profile
  const savedPhone = (() => {
    try {
      const s = localStorage.getItem(`kuppi_student_profile_${user?.id}`);
      return s ? (JSON.parse(s).phone || '') : '';
    } catch { return ''; }
  })();

  const [form, setForm]       = useState({ name: user?.name || '', email: user?.email || '', phone: savedPhone });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  function patch(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '', form: '' }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())  e.name  = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format.';
    if (!form.phone.trim()) e.phone = 'Phone number is required so the conductor can reach you.';
    else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone)) e.phone = 'Invalid phone number format.';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Front-end duplicate guard — checked again here in case alreadyEnrolled
    // state hasn't refreshed (e.g. two tabs open at the same time)
    if (isEnrolled(cls.id, user?.id) || isEnrolledByEmail(cls.id, user?.email)) {
      setErrors({ form: 'You are already registered for this class.' });
      return;
    }

    setLoading(true);

    /*
     * Call the real backend API (Member 3 — registration/ module).
     * The backend enforces the unique constraint at the DB level and
     * sends the meeting link / venue details to the student's email.
     */
    api.post('/registration/enroll', {
      classId: cls.id,
      studentDetails: { phone: form.phone.trim() },
    })
      .then(async () => {
        // Persist locally for immediate UI feedback
        enroll(cls, { id: user?.id, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
        incrementEnrolled(cls.id);
        // Sync MongoDB IDs so "Leave Class" in MyClasses can call the real API
        try { await fetchMyEnrollments(user?.id); } catch { /* non-fatal */ }
        // Refresh split class lists so dashboard count updates immediately
        fetchMyClasses().catch(() => {});
        setLoading(false);
        onSuccess({ name: form.name.trim(), email: form.email.trim() });
      })
      .catch(err => {
        setLoading(false);
        const msg = err.message || 'Registration failed. Please try again.';
        setErrors({ form: msg });
      });
  }

  const inputCls = name =>
    `w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
      errors[name]
        ? 'border-err bg-red-50 focus:ring-2 focus:ring-err/20'
        : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
    }`;

  return (
    <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-bold text-ink text-lg">Register for Class</h2>
          <p className="text-dim text-sm mt-0.5">{cls.title}</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 text-err text-sm px-4 py-3 rounded-xl">{errors.form}</div>
          )}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Full Name <span className="text-err">*</span></label>
            <input type="text" value={form.name} onChange={e => patch('name', e.target.value)}
              placeholder="Enter your full name" className={inputCls('name')} />
            {errors.name && <p className="text-err text-xs mt-1.5">⚠ {errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Email Address <span className="text-err">*</span></label>
            <input type="email" value={form.email} onChange={e => patch('email', e.target.value)}
              placeholder="Enter your email address" className={inputCls('email')} />
            {errors.email && <p className="text-err text-xs mt-1.5">⚠ {errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Phone Number <span className="text-err">*</span>
              <span className="text-dim font-normal text-xs ml-1">— so the conductor can contact you</span>
            </label>
            <input type="tel" value={form.phone} onChange={e => patch('phone', e.target.value)}
              placeholder="e.g. +94 77 123 4567" className={inputCls('phone')} />
            {errors.phone && <p className="text-err text-xs mt-1.5">⚠ {errors.phone}</p>}
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-1.5 text-xs text-sub">
            <p><span className="font-bold text-ink">Class:</span> {cls.title}</p>
            <p><span className="font-bold text-ink">Date:</span> {cls.date} at {cls.time}</p>
            <p><span className="font-bold text-ink">Fee:</span> Rs. {cls.fee?.toLocaleString()}</p>
            <p><span className="font-bold text-ink">Conductor:</span> {cls.conductor}</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-sub py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70">
              {loading ? 'Registering...' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Email Confirmation Modal ── */
function EmailConfirmModal({ studentName, studentEmail, cls, onClose }) {
  const body = `Dear ${studentName},

Your registration has been confirmed!

────────────────────────
 Class Details
────────────────────────
Class:     ${cls.title}
Subject:   ${cls.subject}
Date:      ${cls.date}
Time:      ${cls.time}
Conductor: ${cls.conductor}
Fee:       Rs. ${cls.fee?.toLocaleString()}
${cls.meetingLink ? `Meeting:   ${cls.meetingLink}` : ''}

A reminder email will be sent 2 days before the class date.

Thank you for choosing KuppiConnect!

Best regards,
KuppiConnect Team`;

  return (
    <div className="fixed inset-0 bg-ink/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-ok to-emerald-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🎉</div>
            <div>
              <p className="text-white font-bold text-base">Registration Successful!</p>
              <p className="text-white/80 text-sm">Confirmation email sent to {studentEmail}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 space-y-1 text-xs">
            <p><span className="font-bold text-ink w-16 inline-block">From:</span><span className="text-dim">noreply@kuppiconnect.lk</span></p>
            <p><span className="font-bold text-ink w-16 inline-block">To:</span><span className="text-dim">{studentEmail}</span></p>
            <p><span className="font-bold text-ink w-16 inline-block">Subject:</span><span className="text-dim">Registration Confirmed – {cls.title}</span></p>
          </div>
          <pre className="text-xs text-sub leading-relaxed whitespace-pre-wrap font-sans border-l-2 border-ok pl-4">{body}</pre>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <span>⏰</span>
            <span>A <strong>reminder email</strong> will be automatically sent 2 days before the class date.</span>
          </div>
          <button onClick={onClose}
            className="mt-5 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm">
            Great, got it!
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Topic Request Modal ── */
function RequestTopicModal({ cls, user, onClose }) {
  const { submitRequest } = useClassRequests();
  const SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Computer Science', 'English', 'Economics', 'Statistics', 'Other',
  ];
  const [form, setForm]     = useState({ subject: cls.subject || '', topic: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  function patch(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); }

  function validate() {
    const e = {};
    if (!form.subject) e.subject = 'Please select a subject.';
    if (!form.topic.trim()) e.topic = 'Please describe the topic.';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const conductorId = cls.conductorData?._id || cls.conductorId;
      await submitRequest({
        conductorId,
        relatedClassId: cls.id,
        subject:     form.subject,
        topic:       form.topic.trim(),
        description: form.description.trim(),
      });
      setDone(true);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to send request.' });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = name =>
    `w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
      errors[name]
        ? 'border-err bg-red-50 focus:ring-2 focus:ring-err/20'
        : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
    }`;

  if (done) {
    return (
      <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
          <h2 className="font-bold text-ink text-lg mb-2">Request Sent!</h2>
          <p className="text-sub text-sm mb-5">The conductor has been notified of your topic request.</p>
          <button onClick={onClose} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl text-sm transition-all">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-bold text-ink text-lg">Request a Topic</h2>
          <p className="text-dim text-sm mt-0.5">Ask the conductor to cover a specific topic</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 text-err text-sm px-4 py-3 rounded-xl">⚠ {errors.form}</div>
          )}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Subject <span className="text-err">*</span></label>
            <select value={form.subject} onChange={e => patch('subject', e.target.value)} className={inputCls('subject')}>
              <option value="">Select subject…</option>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
            {errors.subject && <p className="text-err text-xs mt-1.5">⚠ {errors.subject}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Topic / Lesson <span className="text-err">*</span></label>
            <input
              type="text" value={form.topic}
              onChange={e => patch('topic', e.target.value)}
              placeholder="e.g. Integration by parts, Thermodynamics laws…"
              className={inputCls('topic')}
            />
            {errors.topic && <p className="text-err text-xs mt-1.5">⚠ {errors.topic}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Details <span className="text-dim font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description} rows={3}
              onChange={e => patch('description', e.target.value)}
              placeholder="Add any extra context that would help the conductor…"
              className={`${inputCls('description')} resize-none`}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-sub py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Helpers ── */
/** Aggregate all localStorage ratings for every class a conductor has taught */
function useConductorRating(conductorId, conductorClasses) {
  const [avg, setAvg]   = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!conductorId || !conductorClasses.length) { setAvg(null); setCount(0); return; }
    let total = 0;
    let n     = 0;
    conductorClasses.forEach(c => {
      try {
        const raw = localStorage.getItem(`kuppi_ratings_${c.id}`);
        if (!raw) return;
        const list = JSON.parse(raw);
        list.forEach(r => { total += r.rating; n++; });
      } catch { /* silent */ }
    });
    setCount(n);
    setAvg(n > 0 ? parseFloat((total / n).toFixed(1)) : null);
  }, [conductorId, conductorClasses]);

  return { avg, count };
}

/* ── Main Component ── */
export default function ClassDetails() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { classes, fetchClasses } = useClasses();

  /*
   * Pull both helpers from EnrollmentsContext so we can check enrollment
   * by student ID *and* by email address — this prevents re-registration
   * even when the same person uses a different account.
   */
  const { isEnrolled, isEnrolledByEmail, fetchMyEnrollments, fetchMyClasses } = useEnrollments();
  const [showRegister, setShowRegister]     = useState(false);
  const [showRequest, setShowRequest]       = useState(false);
  const [emailData, setEmailData]           = useState(null);
  const [activeTab, setActiveTab]           = useState('discussion');

  // MongoDB _id is a string
  const cls = classes.find(c => c.id === id || c._id === id);

  // All classes by this conductor — computed before any early return so hooks stay unconditional
  const allConductorClasses = classes.filter(c => c.conductorId === cls?.conductorId);

  // Aggregate ratings from localStorage across all conductor classes (runs even if cls is null)
  const { avg: localRatingAvg, count: localRatingCount } = useConductorRating(cls?.conductorId, allConductorClasses);

  if (!cls) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <h1 className="text-2xl font-bold text-ink mb-2">Class Not Found</h1>
          <p className="text-sub text-sm mb-6">The class you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all shadow-sm">
            Browse Classes
          </Link>
        </div>
      </div>
    );
  }

  const storedProfile = (() => {
    try {
      const s = localStorage.getItem(`kuppi_profile_${cls.conductorId}`);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  })();
  const conductor      = storedProfile ?? (cls.conductorData ?? dummyUsers.find(u => u.id?.toString() === cls.conductorId));

  const relatedClasses = allConductorClasses.filter(c => c.id !== cls.id);

  // Derived stats — used when backend/dummy data doesn't supply them
  const displayRating      = conductor?.rating ?? localRatingAvg;
  const displayRatingCount = localRatingCount;
  const displayClassCount  = conductor?.classesHeld ?? allConductorClasses.length;
  const displayStudents    = conductor?.totalStudents
    ?? allConductorClasses.reduce((s, c) => s + (c.enrolled ?? 0), 0);
  const isFull         = (cls.enrolled ?? 0) >= cls.seats;
  const pct            = Math.min(100, ((cls.enrolled ?? 0) / Math.max(1, cls.seats)) * 100);
  const userId = user?.id?.toString() ?? user?._id?.toString();
  const alreadyEnrolled = user?.role === 'student' &&
    (isEnrolled(cls.id, userId) || isEnrolledByEmail(cls.id, user?.email));

  function handleLogout() { logout(); navigate('/'); }

  function handleRegisterClick() {
    if (!user) { navigate('/login'); return; }
    setShowRegister(true);
  }

  function handleRequestClick() {
    if (!user) { navigate('/login'); return; }
    setShowRequest(true);
  }

  return (
    <div className="min-h-screen bg-white">
      {showRegister && (
        <RegisterModal cls={cls} user={user} onClose={() => setShowRegister(false)}
          onSuccess={d => {
            setShowRegister(false);
            setEmailData(d);
            // Refresh both contexts so the student dashboard and class list
            // immediately reflect the new enrollment without a page reload.
            fetchMyEnrollments(user?.id ?? user?._id);
            fetchMyClasses().catch(() => {});
            fetchClasses();
          }} />
      )}
      {showRequest && user?.role === 'student' && (
        <RequestTopicModal cls={cls} user={user} onClose={() => setShowRequest(false)} />
      )}
      {emailData && (
        <EmailConfirmModal studentName={emailData.name} studentEmail={emailData.email}
          cls={cls} onClose={() => setEmailData(null)} />
      )}

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">K</span>
            <span className="font-bold text-ink text-base tracking-tight">KuppiConnect</span>
          </Link>
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <span className="hidden sm:block text-dim text-sm mr-1">Hi, <span className="text-ink font-semibold">{user.name.split(' ')[0]}</span></span>
                <Link to={user.role === 'conductor' ? '/conductor' : '/student'}
                  className="text-sub hover:text-ink text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">Dashboard</Link>
                <button onClick={handleLogout}
                  className="border border-slate-200 text-sub hover:text-err hover:border-err/30 text-sm font-medium transition-all px-4 py-2 rounded-full ml-1">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sub hover:text-ink text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">Sign In</Link>
                <Link to="/register"
                  className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2 rounded-full transition-all shadow-sm ml-2 hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)] hover:-translate-y-0.5">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Breadcrumb ── */}
      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-xs text-dim">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sub hover:text-primary font-medium transition-colors">
            <BackIcon /> Back
          </button>
          <span>/</span>
          <Link to="/" className="hover:text-primary transition-colors">Classes</Link>
          <span>/</span>
          <span className="text-ink font-medium truncate max-w-[200px]">{cls.subject}</span>
        </div>
      </div>

      {/* ── Class Header ── */}
      <div className="bg-sky-50 border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <span className="inline-block bg-white border border-sky-200 text-primary text-xs font-bold px-3 py-1 rounded-full mb-4">{cls.subject}</span>
          <h1 className="text-3xl font-extrabold text-ink mb-4 leading-tight">{cls.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-sub">
            <span className="flex items-center gap-1.5">📅 <span>{cls.date}</span></span>
            <span className="flex items-center gap-1.5">🕐 <span>{cls.time}</span></span>
            {cls.duration && <span className="flex items-center gap-1.5">⏱ <span>{cls.duration}</span></span>}
            <span className="flex items-center gap-1.5">📍 <span>{displayLocation(cls)}</span></span>
            <span className="flex items-center gap-1.5">💰 <span className="font-semibold text-ink">Rs. {cls.fee?.toLocaleString()}</span></span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm">
              <h2 className="font-bold text-ink text-lg mb-4">About This Class</h2>
              <p className="text-sub text-sm leading-relaxed">{cls.description || 'No description provided.'}</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm">
              <h2 className="font-bold text-ink text-lg mb-5">Class Details</h2>
              <dl className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Date',     value: cls.date,                   icon: '📅' },
                  { label: 'Time',     value: cls.time,                   icon: '🕐' },
                  { label: 'Duration', value: cls.duration || '—',        icon: '⏱' },
                  { label: 'Location', value: displayLocation(cls),       icon: '📍' },
                  { label: 'Fee',      value: `Rs. ${cls.fee?.toLocaleString()}`, icon: '💰' },
                  { label: 'Subject',  value: cls.subject,                icon: '📚' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-start gap-3 p-4 bg-sky-50 rounded-xl border border-sky-100">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <dt className="text-xs text-dim font-medium mb-0.5">{label}</dt>
                      <dd className="text-sm font-semibold text-ink break-all">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-sub font-medium">Enrollment</span>
                  <span className="text-ink font-bold">{cls.enrolled} / {cls.seats} seats</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${isFull ? 'bg-err' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                </div>
                <p className={`text-xs mt-2 font-medium ${isFull ? 'text-err' : 'text-ok'}`}>
                  {isFull ? 'This class is fully booked.' : `${cls.seats - cls.enrolled} seats remaining.`}
                </p>
              </div>
            </div>

            {relatedClasses.length > 0 && (
              <div>
                <h2 className="font-bold text-ink text-lg mb-4">More By {conductor?.name ?? cls.conductor}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {relatedClasses.map(rc => (
                    <Link key={rc.id} to={`/class/${rc.id}`}
                      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(14,165,233,0.08)] hover:-translate-y-0.5 transition-all block group">
                      <span className="inline-block bg-sky-50 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-200 mb-3">{rc.subject}</span>
                      <h3 className="text-sm font-bold text-ink group-hover:text-primary transition-colors leading-snug mb-2">{rc.title}</h3>
                      <p className="text-xs text-dim">{rc.date} · Rs. {rc.fee?.toLocaleString()}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">

            {/* ── Price & Registration card ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-3xl font-extrabold text-primary">Rs. {cls.fee?.toLocaleString()}</span>
                <span className="text-xs text-dim font-medium">per session</span>
              </div>
              <div className="mb-5">
                <div className="flex justify-between text-xs text-dim mb-1.5">
                  <span>{cls.enrolled} enrolled</span>
                  <span>{cls.seats} total seats</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${isFull ? 'bg-err' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {alreadyEnrolled ? (
                <div className="w-full py-3 rounded-xl bg-green-50 border border-green-200 text-ok text-sm font-bold text-center">
                  ✓ You are registered for this class
                </div>
              ) : isFull ? (
                <div className="w-full py-3 rounded-xl bg-slate-100 text-dim text-sm font-bold text-center">Class is Full</div>
              ) : user?.role === 'conductor' ? (
                <div className="w-full py-3 rounded-xl bg-sky-50 border border-sky-200 text-primary text-sm font-semibold text-center">
                  Conductors cannot register for classes
                </div>
              ) : (
                <button onClick={handleRegisterClick}
                  className="block w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold text-center transition-all shadow-sm hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)] hover:-translate-y-0.5">
                  {user ? 'Register for this Class' : 'Sign In to Register'}
                </button>
              )}

              {!user && (
                <p className="text-center text-xs text-dim mt-3">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary font-semibold hover:underline">Register free</Link>
                </p>
              )}
            </div>

            {/* ── Conductor card ── */}
            {conductor && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <p className="text-primary text-xs font-bold uppercase tracking-widest mb-4">Your Conductor</p>

                {/* Avatar + name/title/university */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-sm flex items-center justify-center bg-gradient-to-br from-sky-400 to-primary">
                    {(conductor.photo || conductor.profilePicture)
                      ? <img src={conductor.photo ?? conductor.profilePicture} alt={conductor.name} className="w-full h-full object-cover" />
                      : <span className="text-white font-extrabold text-xl">{conductor.name?.charAt(0)}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink text-base leading-tight">{conductor.name}</h3>
                    {conductor.title && <p className="text-dim text-xs mt-0.5">{conductor.title}</p>}
                    {conductor.university && (
                      <p className="text-dim text-xs flex items-center gap-1 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        {conductor.university}
                      </p>
                    )}
                  </div>
                </div>

                {/* Overall rating row */}
                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                  <StarRating rating={displayRating ?? 0} />
                  {displayRating ? (
                    <>
                      <span className="text-sm font-bold text-ink">{displayRating}</span>
                      <span className="text-xs text-dim">/ 5.0</span>
                      {displayRatingCount > 0 && (
                        <span className="text-xs text-dim">({displayRatingCount} review{displayRatingCount !== 1 ? 's' : ''})</span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-dim italic">No reviews yet</span>
                  )}
                </div>

                {/* Bio */}
                {conductor.bio && (
                  <p className="text-xs text-sub leading-relaxed mb-4">{conductor.bio}</p>
                )}

                {/* Subject tags */}
                {conductor.subjects?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {conductor.subjects.map(s => (
                      <span key={s} className="bg-sky-50 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-sky-200">{s}</span>
                    ))}
                  </div>
                )}

                {/* Stats grid — always visible */}
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <div className="text-center p-3 bg-sky-50 rounded-xl border border-sky-100">
                    <p className="text-lg font-extrabold text-primary">
                      {displayStudents > 0 ? `${displayStudents}+` : '—'}
                    </p>
                    <p className="text-[11px] text-dim">Students Taught</p>
                  </div>
                  <div className="text-center p-3 bg-sky-50 rounded-xl border border-sky-100">
                    <p className="text-lg font-extrabold text-primary">
                      {displayClassCount > 0 ? displayClassCount : '—'}
                    </p>
                    <p className="text-[11px] text-dim">Classes Held</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Request a Topic — below conductor card ── */}
            {(user?.role === 'student' || !user) && (
              <button
                onClick={handleRequestClick}
                className="block w-full py-3 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-all text-center"
              >
                💡 Request a Topic
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Class Hub: Notes · Discussion · Rating · AI ── */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 border-b border-slate-100 mb-8">
          {[
            { key: 'discussion',    icon: '💬', label: 'Discussion' },
            { key: 'notes',         icon: '📄', label: 'Class Notes' },
            { key: 'rating',        icon: '⭐', label: 'Rate Class' },
            { key: 'ai',            icon: '🤖', label: 'AI Analysis' },
            { key: 'announcements', icon: '📢', label: 'Announcements' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-sub hover:text-ink hover:border-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {activeTab === 'discussion' && (
          <div className="space-y-6">
            <Comments classId={cls.id} conductorId={cls.conductorId} />
            <AISummary classId={cls.id} />
          </div>
        )}
        {activeTab === 'notes' && (
          <UploadNotes classId={cls.id} />
        )}
        {activeTab === 'rating' && (
          <Rating classId={cls.id} conductorId={cls.conductorId} />
        )}
        {activeTab === 'ai' && (
          <AISummary classId={cls.id} />
        )}
        {activeTab === 'announcements' && (
          <ClassAnnouncements classId={cls.id} conductorId={cls.conductorId} />
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-dim">
            <span className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">K</span>
            <span className="font-semibold text-ink">KuppiConnect</span>
            <span>· © 2026</span>
          </div>
          {(!user || user.role !== 'conductor') && (
            <div className="flex items-center gap-5 text-xs text-dim">
              <Link to="/" className="hover:text-ink transition-colors">Home</Link>
              {!user && <Link to="/login" className="hover:text-ink transition-colors">Sign In</Link>}
              {!user && <Link to="/register" className="hover:text-ink transition-colors">Register</Link>}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
