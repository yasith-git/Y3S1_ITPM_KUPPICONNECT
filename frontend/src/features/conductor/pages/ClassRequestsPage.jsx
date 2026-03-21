import { useState, useEffect } from 'react';
import { useClassRequests } from '../../../contexts/ClassRequestContext';

const STATUS_TABS = [
  { key: 'all',          label: 'All Requests',  icon: '📋' },
  { key: 'pending',      label: 'Pending',        icon: '⏳' },
  { key: 'acknowledged', label: 'Acknowledged',   icon: '✅' },
  { key: 'dismissed',    label: 'Dismissed',      icon: '❌' },
];

const STATUS_BADGE = {
  pending:      'bg-amber-50 text-amber-700 border-amber-200',
  acknowledged: 'bg-green-50  text-green-700  border-green-200',
  dismissed:    'bg-slate-100 text-slate-500   border-slate-200',
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

export default function ClassRequestsPage() {
  const { conductorRequests, loading, fetchConductorRequests, updateStatus } = useClassRequests();
  const [activeTab, setActiveTab] = useState('all');
  const [actionId, setActionId]  = useState(null);
  const [toast, setToast]        = useState(null);

  useEffect(() => {
    fetchConductorRequests(activeTab !== 'all' ? { status: activeTab } : {});
  }, [activeTab]);

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleStatus(requestId, status) {
    try {
      setActionId(requestId);
      await updateStatus(requestId, status);
      showToast(status === 'acknowledged' ? 'Request acknowledged' : 'Request dismissed');
    } catch {
      showToast('Something went wrong', 'err');
    } finally {
      setActionId(null);
    }
  }

  const displayed = activeTab === 'all'
    ? conductorRequests
    : conductorRequests.filter(r => r.status === activeTab);

  const pendingCount = conductorRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Conductor Portal</p>
        <h1 className="text-3xl font-bold text-ink">Student Requests</h1>
        <p className="text-sub text-sm mt-1">
          Topics and lessons your students are asking for.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-5 text-sm rounded-xl px-4 py-3 flex items-center gap-2 border ${
          toast.type === 'err'
            ? 'bg-red-50 border-red-200 text-err'
            : 'bg-green-50 border-green-200 text-ok'
        }`}>
          {toast.type === 'err' ? '⚠' : '✓'} {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-sub border-slate-200 hover:border-primary/30 hover:text-ink'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] px-1 bg-err text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sub text-sm">Loading requests…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-5xl block mb-4">💡</span>
          <p className="font-bold text-ink text-lg mb-2">No requests yet</p>
          <p className="text-sub text-sm">
            {activeTab === 'all'
              ? 'When students request topics, they will appear here.'
              : `No ${activeTab} requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(req => (
            <div
              key={req._id}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary/20 transition-all overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Student avatar */}
                  <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-primary rounded-full flex items-center justify-center text-white font-extrabold text-base shrink-0 shadow-sm">
                    {req.student?.name?.charAt(0) ?? '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-ink text-sm">{req.student?.name ?? 'Unknown Student'}</span>
                      <span className="text-dim text-xs">{req.student?.email}</span>
                      <span className="ml-auto text-dim text-xs shrink-0">{timeAgo(req.createdAt)}</span>
                    </div>

                    {/* Subject + Topic */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-primary border border-sky-200">
                        {req.subject}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[req.status]}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </div>

                    <h3 className="font-bold text-ink text-base mb-1">{req.topic}</h3>

                    {req.description && (
                      <p className="text-sub text-sm mb-2 leading-relaxed">{req.description}</p>
                    )}

                    {req.relatedClass && (
                      <p className="text-xs text-dim flex items-center gap-1">
                        <span>📚</span>
                        <span>Re: <span className="font-semibold text-ink">{req.relatedClass.title}</span></span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions — only for pending */}
              {req.status === 'pending' && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 justify-end">
                  <button
                    disabled={actionId === req._id}
                    onClick={() => handleStatus(req._id, 'acknowledged')}
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-green-50 text-ok border border-green-200 hover:bg-green-100 transition-all disabled:opacity-60"
                  >
                    ✅ Acknowledge
                  </button>
                  <button
                    disabled={actionId === req._id}
                    onClick={() => handleStatus(req._id, 'dismissed')}
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 text-sub border border-slate-200 hover:bg-slate-200 transition-all disabled:opacity-60"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
