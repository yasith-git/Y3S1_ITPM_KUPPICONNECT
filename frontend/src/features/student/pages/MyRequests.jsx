import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClassRequests } from '../../../contexts/ClassRequestContext';

const STATUS_BADGE = {
  pending:      { cls: 'bg-amber-50  text-amber-700 border-amber-200',  label: 'Pending',      icon: '⏳' },
  acknowledged: { cls: 'bg-green-50  text-green-700 border-green-200',  label: 'Acknowledged', icon: '✅' },
  dismissed:    { cls: 'bg-slate-100 text-slate-500 border-slate-200',  label: 'Dismissed',    icon: '❌' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MyRequests() {
  const { myRequests, fetchStudentRequests, deleteRequest } = useClassRequests();

  useEffect(() => { fetchStudentRequests(); }, []);

  async function handleDelete(id) {
    if (!window.confirm('Cancel this request?')) return;
    try { await deleteRequest(id); } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Student Portal</p>
        <h1 className="text-3xl font-bold text-ink">My Requests</h1>
        <p className="text-sub text-sm mt-1">Topics you've requested conductors to cover.</p>
      </div>

      {myRequests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-5xl block mb-4">💡</span>
          <p className="font-bold text-ink text-lg mb-2">No requests yet</p>
          <p className="text-sub text-sm mb-6">
            Visit a class page and click "Request a Topic" to ask a conductor to cover something.
          </p>
          <Link
            to="/student/classes"
            className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-6 py-3 rounded-full transition-all shadow-sm inline-block"
          >
            Browse Classes
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myRequests.map(req => {
            const badge = STATUS_BADGE[req.status] ?? STATUS_BADGE.pending;
            return (
              <div
                key={req._id}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-primary border border-sky-200">
                        {req.subject}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.icon} {badge.label}
                      </span>
                      <span className="ml-auto text-dim text-xs">{timeAgo(req.createdAt)}</span>
                    </div>
                    <h3 className="font-bold text-ink text-base mb-1">{req.topic}</h3>
                    {req.description && (
                      <p className="text-sub text-sm mb-2 leading-relaxed">{req.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-dim">
                      {req.conductor && (
                        <span>👤 To: <span className="font-semibold text-ink">{req.conductor.name}</span></span>
                      )}
                      {req.relatedClass && (
                        <span>📚 Re: <span className="font-semibold text-ink">{req.relatedClass.title}</span></span>
                      )}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleDelete(req._id)}
                      className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 text-err border border-red-100 hover:bg-red-100 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
