/**
 * StudentHome — Member 3 (Registration feature)
 *
 * Main dashboard for logged-in students.
 * Shows upcoming class reminders, stats, available classes,
 * and a quick view of upcoming enrolled classes.
 *
 * NOTE: Meeting links are NEVER shown here.
 * They are delivered to the student via email at registration time.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useClasses } from '../../../contexts/ClassesContext';
import { useAnnouncements } from '../../../contexts/AnnouncementsContext';
import { useEnrollments } from '../../../contexts/EnrollmentsContext';

function ReminderEmailModal({ enrollment, onClose }) {
  return (
    <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">⏰</div>
            <div>
              <p className="text-white font-bold">Class Reminder Email Sent!</p>
              <p className="text-white/80 text-sm">To: {enrollment.email}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-1 text-xs">
            <p><span className="font-bold text-ink w-16 inline-block">From:</span><span className="text-dim">noreply@kuppiconnect.lk</span></p>
            <p><span className="font-bold text-ink w-16 inline-block">To:</span><span className="text-dim">{enrollment.email}</span></p>
            <p><span className="font-bold text-ink w-16 inline-block">Subject:</span><span className="text-dim">Class Reminder – {enrollment.classTitle}</span></p>
          </div>
          {/* Reminder email preview — classLocation is safe to display (never a raw URL) */}
          <pre className="text-xs text-sub leading-relaxed whitespace-pre-wrap font-sans border-l-2 border-amber-400 pl-4">{`Dear ${enrollment.studentName},

This is a friendly reminder that your upcoming class is soon:

Class:     ${enrollment.classTitle}
Subject:   ${enrollment.classSubject}
Date:      ${enrollment.classDate} at ${enrollment.classTime}
Conductor: ${enrollment.conductor}
Location:  ${enrollment.classLocation || 'See your registration confirmation email'}

Please be prepared and join on time. Good luck!

Best regards,
KuppiConnect Team`}</pre>
          <button onClick={onClose}
            className="mt-5 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentHome() {
  const { user } = useAuth();
  const { classes, upcomingClasses } = useClasses();
  const { announcements } = useAnnouncements();
  const { registeredClasses, completedClasses, fetchMyClasses, getStudentEnrollments, fetchMyEnrollments } = useEnrollments();
  const [reminderModal, setReminderModal] = useState(null);

  // Sync from API on every mount so all counts are accurate
  useEffect(() => {
    fetchMyClasses();
    if (user?.id) fetchMyEnrollments(user.id);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const myEnrollments = getStudentEnrollments(user?.id);
  const now = new Date();
  const in2Days = new Date(Date.now() + 2 * 86_400_000);
  // Use API-sourced split lists for display; fall back to local enrollments during first load
  const registered  = registeredClasses.length ? registeredClasses : myEnrollments.filter(e => new Date(e.classDate) > now);
  const completed   = completedClasses.length  ? completedClasses  : myEnrollments.filter(e => new Date(e.classDate) <= now);
  const reminders   = registered.filter(e => new Date(e.classDate) <= in2Days);

  const activeAnnouncements = announcements.filter(a => {
    const n = new Date();
    return new Date(a.startDate) <= n && new Date(a.endDate) >= n;
  });
  const myClassIds  = new Set(myEnrollments.map(e => e.classId));
  // Upcoming = classes NOT yet registered by this student
  const upcomingUnregistered = (upcomingClasses.length ? upcomingClasses : classes)
    .filter(c => !myClassIds.has(String(c.id)));
  const featured = upcomingUnregistered.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      {reminderModal && (
        <ReminderEmailModal enrollment={reminderModal} onClose={() => setReminderModal(null)} />
      )}

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary to-sky-400 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-white rounded-full" />
        </div>
        <div className="relative">
          <p className="text-sky-100 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-3xl font-extrabold mb-2">{user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sky-100 text-sm max-w-md">
            You have <strong className="text-white">{registered.length}</strong> registered class{registered.length !== 1 ? 'es' : ''} and{' '}
            <strong className="text-white">{completed.length}</strong> completed.
          </p>          <div className="mt-5 flex gap-3 flex-wrap">
            <Link to="/student/classes"
              className="bg-white text-primary text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-sky-50 transition-all shadow-sm">
              Browse Classes
            </Link>
            <Link to="/student/myclasses"
              className="bg-white/20 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-white/30 transition-all border border-white/30">
              My Classes
            </Link>
          </div>
        </div>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-amber-700 uppercase tracking-widest">⏰ Class Reminders</h2>
          {reminders.map(r => (
            <div key={r.id} className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-xl mt-0.5">📅</span>
                <div>
                  <p className="text-sm font-bold text-amber-900">{r.classTitle}</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {r.classDate} at {r.classTime} · {r.conductor}
                    {/* Show safe location only — meeting links are sent via email */}
                    {r.classLocation && <> · 📍 {r.classLocation}</>}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReminderModal(r)}
                className="shrink-0 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg transition-all">
                View Email
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Registered',  value: registered.length,                color: 'text-primary',    bg: 'bg-sky-50 border-sky-200' },
          { label: 'Upcoming',    value: upcomingUnregistered.length,       color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
          { label: 'Completed',   value: completed.length,                  color: 'text-ok',         bg: 'bg-green-50 border-green-200' },
          { label: 'Available',   value: upcomingUnregistered.filter(c => c.enrolled < c.seats).length, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-dim mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Announcements */}
      {activeAnnouncements.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-ink mb-3">📢 Announcements</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {activeAnnouncements.slice(0, 4).map(ann => (
              <div key={ann.id} className="bg-white border border-rim rounded-xl p-4 shadow-sm">
                <p className="text-[11px] text-dim mb-1">{ann.startDate} – {ann.endDate}</p>
                <p className="font-bold text-ink text-sm">{ann.title}</p>
                <p className="text-sub text-xs mt-1 line-clamp-2">{ann.description || ann.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured available classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">📖 Available Classes</h2>
          <Link to="/student/classes" className="text-primary text-sm font-bold hover:underline">View all →</Link>
        </div>
        {featured.length === 0 ? (
          <div className="bg-white border border-rim rounded-2xl p-8 text-center">
            <p className="text-3xl mb-3">🎉</p>
            <p className="font-bold text-ink mb-1">You're all caught up!</p>
            <p className="text-sub text-sm">No new available classes at this moment.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {featured.map(cls => (
              <Link key={cls.id} to={`/class/${cls.id}`}
                className="bg-white border border-rim rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group block">
                <span className="inline-block bg-sky-50 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-sky-200 mb-3">
                  {cls.subject}
                </span>
                <h3 className="font-bold text-ink text-sm leading-tight group-hover:text-primary transition-colors mb-1">{cls.title}</h3>
                <p className="text-dim text-xs mb-3">{cls.conductor}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sub">{cls.date}</span>
                  <span className="font-extrabold text-primary">Rs. {cls.fee?.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My upcoming classes quick view */}
      {registered.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">🗓 My Upcoming Classes</h2>
            <Link to="/student/myclasses" className="text-primary text-sm font-bold hover:underline">See all →</Link>
          </div>
          <div className="space-y-3">
            {registered.slice(0, 3).map(e => (
              <div key={e.id} className="bg-white border border-rim rounded-xl px-5 py-4 flex items-center justify-between gap-4 shadow-sm">
                <div>
                  <span className="inline-block bg-sky-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200 mb-1">{e.classSubject}</span>
                  <p className="font-bold text-ink text-sm">{e.classTitle}</p>
                  <p className="text-xs text-dim mt-0.5">{e.classDate} · {e.classTime} · {e.conductor}</p>
                </div>
                {/* Meeting links are not stored here — they were emailed at registration */}
                <Link to={`/class/${e.classId}`}
                  className="shrink-0 text-xs border border-primary text-primary font-bold px-4 py-2 rounded-xl hover:bg-sky-50 transition-all">
                  Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

