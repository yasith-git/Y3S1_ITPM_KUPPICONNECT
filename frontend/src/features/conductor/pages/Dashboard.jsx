import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useClasses } from '../../../contexts/ClassesContext';
import { useAnnouncements } from '../../../contexts/AnnouncementsContext';
import { useClassRequests } from '../../../contexts/ClassRequestContext';

const today = new Date().toISOString().split('T')[0];

export default function Dashboard() {
  const { user } = useAuth();
  const { classes, loading, fetchClasses } = useClasses();
  const { announcements } = useAnnouncements();
  const { pendingCount } = useClassRequests();

  // Refresh classes whenever dashboard mounts
  useEffect(() => { fetchClasses(); }, []);

  const userId = user?.id?.toString() ?? user?._id?.toString();

  const myClasses = classes.filter(c => c.conductorId === userId);

  const myAnnouncements = announcements.filter(
    a => (a.conductorId ?? a.author)?.toString() === userId
  );

  const totalEnrolled = myClasses.reduce((s, c) => s + (c.enrolled ?? 0), 0);
  const totalSeats    = myClasses.reduce((s, c) => s + (c.seats    ?? 0), 0);
  const fillRate      = totalSeats > 0 ? Math.round((totalEnrolled / totalSeats) * 100) : 0;

  const activeAnns = myAnnouncements.filter(
    a => (!a.startDate || a.startDate <= today) && (!a.endDate || a.endDate >= today)
  ).length;

  const stats = [
    { label: 'My Classes',       value: myClasses.length, icon: '📚', colorVal: 'text-primary',   colorBg: 'bg-sky-50    border-sky-200'    },
    { label: 'Enrolled',         value: totalEnrolled,    icon: '🎓', colorVal: 'text-ok',         colorBg: 'bg-green-50  border-green-200'  },
    { label: 'Fill Rate',        value: `${fillRate}%`,   icon: '📊', colorVal: 'text-amber-600',  colorBg: 'bg-amber-50  border-amber-200'  },
    { label: 'Student Requests', value: pendingCount,     icon: '💡', colorVal: 'text-violet-600', colorBg: 'bg-violet-50 border-violet-200' },
  ];

  const actions = [
    { icon: '➕', label: 'Create New Class',  desc: 'Schedule a kuppi session',         to: '/conductor/create',        primary: true  },
    { icon: '💡', label: 'View Requests',     desc: `${pendingCount} pending`,           to: '/conductor/requests',      primary: false },
    { icon: '👥', label: 'View Students',     desc: 'See who enrolled',                 to: '/conductor/students',      primary: false },
    { icon: '📢', label: 'Add Announcement', desc: 'Post a public notice',              to: '/conductor/announcements', primary: false },
  ];

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Conductor Portal</p>
        <h1 className="text-3xl font-bold text-ink">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sub text-sm mt-1">Here's a snapshot of your activity on KuppiConnect.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`bg-white border rounded-2xl p-5 shadow-sm ${s.colorBg.split(' ')[1]}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3 ${s.colorBg}`}>
              {s.icon}
            </div>
            <p className={`text-2xl font-extrabold mb-0.5 ${s.colorVal}`}>{s.value}</p>
            <p className="text-dim text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending requests banner */}
      {pendingCount > 0 && (
        <Link
          to="/conductor/requests"
          className="mb-6 flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-2xl p-4 hover:bg-violet-100 transition-all"
        >
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <p className="font-bold text-ink text-sm">
              You have <span className="text-violet-600">{pendingCount} pending student request{pendingCount > 1 ? 's' : ''}</span>
            </p>
            <p className="text-dim text-xs mt-0.5">Students are asking you to cover specific topics</p>
          </div>
          <span className="text-primary font-bold text-xs">View →</span>
        </Link>
      )}

      {/* Quick actions */}
      <h2 className="font-bold text-ink text-base mb-4">Quick Actions</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {actions.map(a => (
          <Link
            key={a.label}
            to={a.to}
            className={`rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 shadow-sm block ${
              a.primary
                ? 'bg-primary border-primary text-white hover:bg-primary-dark hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)]'
                : 'bg-white border-slate-100 hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(14,165,233,0.08)]'
            }`}
          >
            <span className="text-2xl block mb-2">{a.icon}</span>
            <p className={`font-bold text-sm mb-1 ${a.primary ? 'text-white' : 'text-ink'}`}>{a.label}</p>
            <p className={`text-xs ${a.primary ? 'text-white/80' : 'text-dim'}`}>{a.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent classes */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-ink text-base">My Recent Classes</h2>
        {myClasses.length > 0 && (
          <Link to="/conductor/classes" className="text-primary text-xs font-semibold hover:underline underline-offset-4">
            View All →
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sub text-sm">Loading classes…</p>
        </div>
      ) : myClasses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-5xl block mb-4">📚</span>
          <p className="font-bold text-ink text-lg mb-2">No classes yet</p>
          <p className="text-sub text-sm mb-6">Create your first kuppi session to get started.</p>
          <Link
            to="/conductor/create"
            className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-6 py-3 rounded-full transition-all shadow-sm inline-block"
          >
            Create a Class
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myClasses.slice(0, 4).map(cls => {
            const isFull = (cls.enrolled ?? 0) >= cls.seats;
            const pct    = Math.min(100, ((cls.enrolled ?? 0) / Math.max(1, cls.seats)) * 100);
            return (
              <div key={cls.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-primary/20 transition-all">
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 shrink-0 text-2xl">📚</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="font-bold text-ink text-sm">{cls.title}</p>
                      <p className="text-dim text-xs mt-0.5">
                        {cls.date} · {cls.time}
                        {cls.meetingLink && (
                          <> · <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Join Link</a></>
                        )}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${isFull ? 'bg-red-50 text-err' : 'bg-green-50 text-ok'}`}>
                      {isFull ? 'Class Full' : `${cls.seats - (cls.enrolled ?? 0)} seats left`}
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[11px] text-dim mb-1">
                      <span>{cls.enrolled ?? 0} enrolled</span>
                      <span>{cls.seats} seats</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isFull ? 'bg-err' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Link
                    to={`/class/${cls.id}`}
                    className="text-xs font-semibold text-white bg-primary px-3 py-2 rounded-xl hover:bg-primary-dark transition-all text-center"
                  >
                    View
                  </Link>
                  <Link
                    to={`/conductor/edit/${cls.id}`}
                    className="text-xs font-semibold text-primary bg-sky-50 border border-sky-200 px-3 py-2 rounded-xl hover:bg-sky-100 transition-all text-center"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
