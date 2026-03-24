import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../../services/api';

function fmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const TYPE = {
  general: { label: 'General', cls: 'bg-sky-50 text-primary border-sky-200' },
  urgent:  { label: '🚨 Urgent', cls: 'bg-red-50 text-err border-red-200' },
  event:   { label: '📅 Event',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function ClassAnnouncements({ classId, conductorId }) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState('');
  const [showForm, setShowForm]           = useState(false);
  const [form, setForm]                   = useState({ title: '', content: '', type: 'general' });
  const [posting, setPosting]             = useState(false);
  const [formError, setFormError]         = useState('');

  const isOwner = user?.role === 'conductor' &&
    (String(user.id ?? user._id) === String(conductorId));

  useEffect(() => {
    if (!classId || !user) { setLoading(false); return; }
    api.get(`/announcements/class/${classId}`)
      .then(res => setAnnouncements(res.data ?? []))
      .catch(err => {
        if (err.statusCode === 403) setFetchError('access');
        else setFetchError(err.message || 'Failed to load announcements.');
      })
      .finally(() => setLoading(false));
  }, [classId, user]);

  async function handlePost(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Title and content are required.');
      return;
    }
    setPosting(true);
    setFormError('');
    try {
      const res = await api.post('/announcements', { class: classId, ...form });
      setAnnouncements(prev => [res.data, ...prev]);
      setForm({ title: '', content: '', type: 'general' });
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || 'Failed to post announcement.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-7 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-ink text-lg">📢 Class Announcements</h2>
          {announcements.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
              {announcements.length}
            </span>
          )}
        </div>
        {isOwner && (
          <button
            onClick={() => { setShowForm(v => !v); setFormError(''); }}
            className="text-sm font-bold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            {showForm ? '✕ Cancel' : '+ Post Announcement'}
          </button>
        )}
      </div>

      {/* Conductor post form */}
      {showForm && isOwner && (
        <form onSubmit={handlePost} className="mb-6 bg-sky-50 border border-sky-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-ink">New Announcement</h3>
          {formError && <p className="text-xs text-err">⚠ {formError}</p>}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Title <span className="text-err">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Class rescheduled to Friday"
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-white"
            >
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Content <span className="text-err">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Write your announcement here…"
              rows={4}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(''); }}
              className="text-sm text-dim hover:text-ink px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={posting}
              className="text-sm font-bold text-white bg-primary hover:bg-primary-dark px-6 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {/* Not logged in */}
      {!user && (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-4xl mb-3">📢</p>
          <p className="text-sm text-sub">
            <a href="/login" className="text-primary font-semibold hover:underline">Sign in</a>
            {' '}to view class announcements.
          </p>
        </div>
      )}

      {/* Enrolled-only */}
      {user && fetchError === 'access' && (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-sm font-semibold text-ink mb-1">Announcements are for enrolled students</p>
          <p className="text-xs text-dim">Register for this class to see announcements from the conductor.</p>
        </div>
      )}

      {/* Other error */}
      {user && fetchError && fetchError !== 'access' && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-err">
          ⚠ {fetchError}
        </div>
      )}

      {/* Loading */}
      {user && !fetchError && loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-primary/25 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {user && !fetchError && !loading && announcements.length === 0 && (
        <div className="text-center py-12 text-dim">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-sm font-semibold text-ink">No announcements yet.</p>
          {isOwner && (
            <p className="text-xs mt-1">Post your first announcement using the button above.</p>
          )}
        </div>
      )}

      {/* Announcement list */}
      {user && !fetchError && !loading && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map(ann => {
            const style = TYPE[ann.type] || TYPE.general;
            return (
              <div
                key={ann._id}
                className="border border-slate-100 rounded-2xl p-5 hover:shadow-sm hover:border-slate-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-ink text-sm leading-tight">{ann.title}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${style.cls}`}>
                    {style.label}
                  </span>
                </div>
                <p className="text-sm text-sub leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                <p className="text-[11px] text-dim mt-3">{fmt(ann.sentAt || ann.createdAt)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
