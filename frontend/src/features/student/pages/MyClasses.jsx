import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEnrollments } from '../../../contexts/EnrollmentsContext';
import { useClasses } from '../../../contexts/ClassesContext';


function LeftClassToast({ enrollment, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-50 bg-ok text-white px-5 py-3.5 rounded-2xl shadow-xl
      flex items-center gap-3 text-sm font-semibold max-w-sm animate-fade-in border border-green-600">
      <span className="text-lg shrink-0">✅</span>
      <span className="flex-1">
        You've left <span className="font-bold">{enrollment.classTitle}</span>. A cancellation
        email has been sent to <span className="underline">{enrollment.email}</span>.
      </span>
      <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none shrink-0">
        &times;
      </button>
    </div>
  );
}

export default function MyClasses() {
  const { registeredClasses, completedClasses, cancelEnrollmentApi, fetchMyClasses } = useEnrollments();
  const { decrementEnrolled } = useClasses();

  const [tab, setTab]             = useState('registered');
  const [leftClass, setLeftClass] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError,   setLeaveError]   = useState(null);

  useEffect(() => {
    fetchMyClasses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const list = tab === 'registered' ? registeredClasses : completedClasses;

  async function handleLeave(enrollment) {
    setLeaveLoading(true);
    setLeaveError(null);
    try {
      await cancelEnrollmentApi(enrollment.id);
      decrementEnrolled(enrollment.classId);
      setLeavingId(null);
      setLeftClass(enrollment);
      fetchMyClasses(); // re-fetch so counts update immediately
    } catch (err) {
      setLeaveError(err.message || 'Failed to leave the class. Please try again.');
    } finally {
      setLeaveLoading(false);
    }
  }

  return (
    <>
      {leftClass && (
        <LeftClassToast enrollment={leftClass} onClose={() => setLeftClass(null)} />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-3xl font-bold text-ink">My Classes</h1>
          <p className="text-sub text-sm mt-1">Track your registered and completed sessions.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'registered', label: 'Registered', count: registeredClasses.length },
            { key: 'completed',  label: 'Completed',  count: completedClasses.length },
          ].map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === t.key ? 'bg-white text-ink shadow-sm' : 'text-dim hover:text-ink'
              }`}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="text-center py-20 bg-white border border-rim rounded-2xl">
            <p className="text-5xl mb-4">{tab === 'registered' ? '📅' : '🎓'}</p>
            <h3 className="font-bold text-ink text-lg mb-2">No {tab === 'registered' ? 'registered' : 'completed'} classes</h3>
            <p className="text-sub text-sm mb-6">
              {tab === 'registered'
                ? 'Register for upcoming classes to see them here.'
                : 'Your completed sessions will appear here.'}
            </p>
            {tab === 'registered' && (
              <Link to="/student/classes"
                className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all shadow-sm">
                Browse Classes
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {list.map(enrollment => {
              const eDate    = new Date(enrollment.classDate);
              const canLeave = eDate > new Date();
              const isPast   = eDate <= new Date();

              return (
                <div key={enrollment.id} className="bg-white border border-rim rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="bg-sky-50 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-sky-200">
                            {enrollment.classSubject}
                          </span>
                          {isPast
                            ? <span className="bg-green-50 text-ok text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">✓ Completed</span>
                            : <span className="bg-amber-50 text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">Registered</span>
                          }
                        </div>
                        <h3 className="font-bold text-ink text-lg mb-1 leading-tight">{enrollment.classTitle}</h3>
                        <p className="text-dim text-sm mb-4">{enrollment.conductor}</p>

                        <div className="grid sm:grid-cols-3 gap-3 text-xs">
                          {[
                            { icon: '📅', val: enrollment.classDate },
                            { icon: '🕐', val: enrollment.classTime },
                            { icon: '💰', val: `Rs. ${enrollment.classFee?.toLocaleString()}` },
                          ].map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-sub">
                              <span>{d.icon}</span><span>{d.val}</span>
                            </div>
                          ))}
                        </div>

                        {enrollment.classMeetingLink && (
                          <a href={enrollment.classMeetingLink} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline font-semibold">
                            📎 Join Meeting Link →
                          </a>
                        )}
                      </div>

                      {/* Leave action — only for registered (future) classes */}
                      {canLeave && (
                        <div className="shrink-0">
                          {leavingId === enrollment.id ? (
                            <div className="flex items-center gap-2">
                              {leaveError && <span className="text-xs text-err">{leaveError}</span>}
                              <span className="text-xs text-sub">Are you sure?</span>
                              <button
                                disabled={leaveLoading}
                                onClick={() => handleLeave(enrollment)}
                                className="text-xs bg-err text-white px-3 py-2 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-60">
                                {leaveLoading ? 'Leaving...' : 'Confirm'}
                              </button>
                              <button onClick={() => { setLeavingId(null); setLeaveError(null); }}
                                className="text-xs border border-slate-200 text-sub px-3 py-2 rounded-xl font-semibold hover:bg-slate-50">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setLeavingId(enrollment.id)}
                              className="text-xs border border-red-200 text-err px-4 py-2 rounded-xl font-semibold hover:bg-red-50 transition-all">
                              Leave Class
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Notes link */}
                    <div className="mt-5 pt-5 border-t border-slate-100">
                      <Link
                        to="/student/content"
                        className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                      >
                        📄 View Class Notes &amp; Materials →
                      </Link>
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-dim">
                    <span>Registered on {enrollment.registeredAt}</span>
                    {isPast ? (
                      <Link to={`/class/${enrollment.classId}`}
                        className="text-primary font-semibold hover:underline">
                        View Class Details →
                      </Link>
                    ) : (
                      <span>Confirmation emailed to {enrollment.email}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
