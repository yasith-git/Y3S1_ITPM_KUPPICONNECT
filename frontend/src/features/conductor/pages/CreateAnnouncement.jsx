import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useAnnouncements } from '../../../contexts/AnnouncementsContext';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getStatus(ann) {
  const now = new Date();
  if (new Date(ann.endDate) < now) return 'expired';
  if (new Date(ann.startDate) > now) return 'pending';
  return 'active';
}

const STATUS_STYLES = {
  active:  { label: '● Active',  cls: 'bg-green-50 text-ok border-green-200' },
  pending: { label: '○ Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  expired: { label: '✕ Expired', cls: 'bg-red-50 text-err border-red-100' },
};

const EMPTY = { title: '', description: '', startDate: '', endDate: '', displayDuration: 1, imagePreview: null, imageFile: null };

function validate(form) {
  const e = {};
  if (!form.title.trim())       e.title       = 'Title is required.';
  if (!form.description.trim()) e.description = 'Description is required.';
  if (!form.startDate)          e.startDate   = 'Start date is required.';
  if (!form.endDate)            e.endDate     = 'End date is required.';
  else if (form.endDate < form.startDate) e.endDate = 'End date must be after start date.';
  return e;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-err text-xs mt-1.5">⚠ {msg}</p>;
}

export default function CreateAnnouncement() {
  const { user } = useAuth();
  const { myAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement, loading } = useAnnouncements();

  const myAnns = myAnnouncements;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const fileRef = useRef();

  function inputCls(name) {
    return `w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
      errors[name]
        ? 'border-err bg-red-50 focus:ring-2 focus:ring-err/20'
        : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
    }`;
  }

  function patch(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, imageFile: file }));
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, imagePreview: ev.target.result }));
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removeImage() {
    setForm(f => ({ ...f, imagePreview: null, imageFile: null }));
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    try {
      if (editId !== null) {
        await updateAnnouncement(editId, form);
        setEditId(null);
      } else {
        await addAnnouncement(form);
      }
      setForm(EMPTY);
      setErrors({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setApiError(err.message || 'Failed to save announcement. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(ann) {
    setEditId(ann.id);
    setForm({
      title:           ann.title ?? '',
      description:     ann.description ?? ann.body ?? '',
      // slice to 16 chars converts ISO "2026-04-07T14:30:00.000Z" → "2026-04-07T14:30"
      // which is the correct format for datetime-local inputs
      startDate:       ann.startDate ? ann.startDate.slice(0, 16) : '',
      endDate:         ann.endDate   ? ann.endDate.slice(0, 16)   : '',
      displayDuration: ann.displayDuration ?? 1,
      imagePreview:    ann.image ?? null,
      imageFile:       null,
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id) {
    deleteAnnouncement(id);
    if (editId === id) { setEditId(null); setForm(EMPTY); setErrors({}); }
  }

  function handleCancel() {
    setEditId(null);
    setForm(EMPTY);
    setErrors({});
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Conductor Portal</p>
          <h1 className="text-3xl font-bold text-ink">Announcements</h1>
          <p className="text-sub text-sm mt-1">
            Published announcements appear on the public home page under "Active Announcements".
          </p>
        </div>
        <Link to="/conductor/dashboard"
          className="shrink-0 text-sub hover:text-ink text-sm font-medium transition-colors px-4 py-2.5 rounded-xl hover:bg-white border border-slate-200 flex items-center gap-1.5">
          ← Dashboard
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">

        {/* ── Left: Form ── */}
        <div className="lg:col-span-2">
          <div className={`bg-white border rounded-2xl p-6 shadow-sm lg:sticky lg:top-8 transition-all ${
            editId !== null ? 'border-primary ring-2 ring-primary/10' : 'border-slate-100'
          }`}>
            <h2 className="font-bold text-ink text-base mb-5">
              {editId !== null ? '✏️ Edit Announcement' : '➕ New Announcement'}
            </h2>

            {saved && (
              <div className="bg-green-50 border border-green-200 text-ok rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
                ✓ Saved successfully!
              </div>
            )}

            {apiError && (
              <div className="bg-red-50 border border-red-200 text-err rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
                ⚠ {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Image upload */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Image <span className="text-dim font-normal">(optional)</span>
                </label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                {form.imagePreview ? (
                  <div className="relative">
                    <img src={form.imagePreview} alt="preview"
                      className="w-full h-32 object-cover rounded-xl border border-slate-200" />
                    <button type="button" onClick={removeImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-dim hover:text-err hover:border-err/30 transition-all shadow-sm text-lg leading-none">
                      ×
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-dim hover:border-primary/50 hover:bg-sky-50 hover:text-primary transition-all">
                    <span className="text-2xl">📸</span>
                    <span className="text-xs font-medium">Click to upload image</span>
                    <span className="text-[11px]">JPG, PNG up to 5 MB</span>
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Title <span className="text-err">*</span></label>
                <input type="text" value={form.title}
                  onChange={e => patch('title', e.target.value)}
                  placeholder="Announcement title..."
                  className={inputCls('title')} />
                <FieldError msg={errors.title} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Description <span className="text-err">*</span></label>
                <textarea value={form.description} rows={4}
                  onChange={e => patch('description', e.target.value)}
                  placeholder="Write what students need to know..."
                  className={`${inputCls('description')} resize-none`} />
                <FieldError msg={errors.description} />
              </div>

              {/* Dates — datetime-local lets you set exact time for quick testing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Start Date & Time <span className="text-err">*</span></label>
                  <input type="datetime-local" value={form.startDate}
                    onChange={e => patch('startDate', e.target.value)}
                    className={inputCls('startDate')} />
                  <FieldError msg={errors.startDate} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">End Date & Time <span className="text-err">*</span></label>
                  <input type="datetime-local" value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={e => patch('endDate', e.target.value)}
                    className={inputCls('endDate')} />
                  <FieldError msg={errors.endDate} />
                </div>
              </div>

              {/* Slide display duration */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Slide Duration
                  <span className="text-dim font-normal ml-1">(mins per carousel slide, 1–60)</span>
                </label>
                <input type="number" min="1" max="60" value={form.displayDuration}
                  onChange={e => patch('displayDuration', Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                  className={inputCls('displayDuration')} />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)] disabled:opacity-60 disabled:cursor-not-allowed">
                  {saving ? 'Saving…' : editId !== null ? 'Save Changes' : 'Publish Announcement'}
                </button>
                {editId !== null && (
                  <button type="button" onClick={handleCancel}
                    className="px-5 py-3 border border-slate-200 text-sub rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ── Right: List ── */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-ink text-base">My Announcements</h2>
            <span className="text-xs text-dim bg-slate-100 px-3 py-1.5 rounded-full">{myAnns.length} total</span>
          </div>

          {loading && (
            <div className="text-center py-12 text-sub text-sm">Loading your announcements…</div>
          )}

          {!loading && myAnns.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-5xl block mb-3">📢</span>
              <p className="font-bold text-ink mb-1">No announcements yet</p>
              <p className="text-sub text-sm">Create your first announcement using the form.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myAnns.map(ann => {
                const status = getStatus(ann);
                const { label, cls } = STATUS_STYLES[status];
                const isEditing = editId === ann.id;
                return (
                  <div key={ann.id}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                      isEditing ? 'border-primary ring-2 ring-primary/15 shadow-sm' : 'border-slate-100 shadow-sm hover:border-slate-200'
                    }`}>
                    <div className="flex gap-4 p-5">
                      {ann.image ? (
                        <img src={ann.image} alt="" className="w-20 h-20 object-cover rounded-xl shrink-0 border border-slate-100" />
                      ) : (
                        <div className="w-20 h-20 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100 shrink-0">
                          <span className="text-2xl font-extrabold text-primary/25 select-none">
                            {ann.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-ink text-sm leading-snug">{ann.title}</h3>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${cls}`}>
                            {label}
                          </span>
                        </div>
                        <p className="text-dim text-xs mb-2 line-clamp-2 leading-relaxed">{ann.description ?? ann.body}</p>
                        <p className="text-[11px] text-dim">📅 {fmtDate(ann.startDate)} → {fmtDate(ann.endDate)}</p>
                        <p className="text-[11px] text-dim mt-0.5">⏱ Slide: {ann.displayDuration ?? 1} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-5 pb-4">
                      <button onClick={() => handleEdit(ann)}
                        className="text-xs font-semibold text-primary bg-sky-50 border border-sky-200 hover:bg-sky-100 px-4 py-2 rounded-xl transition-all">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(ann.id)}
                        className="text-xs font-semibold text-err bg-red-50 border border-red-100 hover:bg-red-100 px-4 py-2 rounded-xl transition-all">
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
