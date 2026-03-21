import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { dummyAnnouncements } from '../../../data/dummyData';

const today = new Date().toISOString().split('T')[0];

function getStatus(ann) {
  if (ann.endDate < today) return 'expired';
  if (ann.startDate > today) return 'pending';
  return 'active';
}

const STATUS_STYLES = {
  active:  { label: '● Active',  cls: 'bg-green-50 text-ok  border-green-100' },
  pending: { label: '○ Pending', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  expired: { label: '✕ Expired', cls: 'bg-red-50   text-err border-red-100' },
};

const EMPTY_FORM = { title: '', description: '', startDate: '', endDate: '', imagePreview: null };

export default function AddAnnouncement() {
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState(
    () => dummyAnnouncements.filter(a => a.conductorId === user?.id)
  );

  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  /* ── helpers ── */
  function patch(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => patch('imagePreview', ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';          // allow re-selecting same file
  }

  function removeImage() {
    patch('imagePreview', null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function validate() {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.startDate)          e.startDate   = 'Start date is required.';
    if (!form.endDate)            e.endDate     = 'End date is required.';
    else if (form.endDate < form.startDate) e.endDate = 'End date must be after start date.';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (editId !== null) {
      setAnnouncements(prev =>
        prev.map(a =>
          a.id === editId
            ? { ...a, title: form.title, description: form.description,
                startDate: form.startDate, endDate: form.endDate,
                image: form.imagePreview }
            : a
        )
      );
      setEditId(null);
    } else {
      const newAnn = {
        id: Date.now(),
        conductorId: user?.id,
        title: form.title,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        image: form.imagePreview,
        pinned: false,
      };
      setAnnouncements(prev => [newAnn, ...prev]);
    }

    setForm(EMPTY_FORM);
    setErrors({});
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleEdit(ann) {
    setEditId(ann.id);
    setForm({
      title: ann.title,
      description: ann.description ?? ann.body ?? '',
      startDate: ann.startDate,
      endDate: ann.endDate,
      imagePreview: ann.image ?? null,
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id) {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    if (editId === id) { setEditId(null); setForm(EMPTY_FORM); setErrors({}); }
  }

  function handleCancel() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  /* ── shared input style ── */
  function fieldCls(key) {
    return `w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
      errors[key]
        ? 'border-err bg-red-50 focus:ring-2 focus:ring-err/20'
        : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
    }`;
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Page header ── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Conductor Portal</p>
          <h1 className="text-3xl font-bold text-ink">Announcements</h1>
          <p className="text-sub text-sm mt-1">
            Publish announcements that appear on the public home page for students to see.
          </p>
        </div>
        <Link to="/conductor"
          className="shrink-0 text-sub hover:text-ink text-sm font-medium transition-colors px-4 py-2.5 rounded-xl hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5">
          ← Dashboard
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">

        {/* ── Left: Form (2 cols) ── */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-20">
            <h2 className="font-bold text-ink text-base mb-5">
              {editId !== null ? 'Edit Announcement' : 'New Announcement'}
            </h2>

            {/* Success toast */}
            {saved && (
              <div className="bg-green-50 border border-green-200 text-ok rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
                <span>✓</span> Saved successfully!
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
                      className="absolute top-2 right-2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-dim hover:text-err hover:border-err/30 transition-all shadow-sm text-base leading-none">
                      ×
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-dim hover:border-primary/50 hover:bg-sky-50 hover:text-primary transition-all cursor-pointer">
                    <span className="text-2xl">📸</span>
                    <span className="text-xs font-medium">Click to upload image</span>
                    <span className="text-[11px] text-dim">JPG, PNG up to 5 MB</span>
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Title</label>
                <input type="text" value={form.title}
                  onChange={e => patch('title', e.target.value)}
                  placeholder="Announcement title..."
                  className={fieldCls('title')} />
                {errors.title && <p className="text-err text-xs mt-1.5">⚠ {errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Description</label>
                <textarea value={form.description}
                  onChange={e => patch('description', e.target.value)}
                  placeholder="Write announcement details..."
                  rows={4}
                  className={`${fieldCls('description')} resize-none`} />
                {errors.description && <p className="text-err text-xs mt-1.5">⚠ {errors.description}</p>}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate}
                    onChange={e => patch('startDate', e.target.value)}
                    className={fieldCls('startDate')} />
                  {errors.startDate && <p className="text-err text-xs mt-1.5">⚠ {errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">End Date</label>
                  <input type="date" value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={e => patch('endDate', e.target.value)}
                    className={fieldCls('endDate')} />
                  {errors.endDate && <p className="text-err text-xs mt-1.5">⚠ {errors.endDate}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button type="submit"
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)]">
                  {editId !== null ? 'Save Changes' : 'Publish Announcement'}
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

        {/* ── Right: Announcements list (3 cols) ── */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-ink text-base">My Announcements</h2>
            <span className="text-xs text-dim bg-slate-100 px-3 py-1.5 rounded-full">
              {announcements.length} total
            </span>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-16 bg-sky-50 rounded-2xl border border-sky-100">
              <span className="text-5xl mb-4 block">📢</span>
              <p className="font-bold text-ink mb-1">No announcements yet</p>
              <p className="text-sub text-sm">Create your first announcement using the form.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(ann => {
                const status = getStatus(ann);
                const { label, cls } = STATUS_STYLES[status];
                const isEditing = editId === ann.id;
                return (
                  <div key={ann.id}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                      isEditing ? 'border-primary ring-2 ring-primary/15 shadow-sm' : 'border-slate-100 shadow-sm hover:border-slate-200'
                    }`}>
                    <div className="flex gap-4 p-5">
                      {/* Image thumb */}
                      {ann.image ? (
                        <img src={ann.image} alt=""
                          className="w-20 h-20 object-cover rounded-xl shrink-0 border border-slate-100" />
                      ) : (
                        <div className="w-20 h-20 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100 shrink-0">
                          <span className="text-2xl font-extrabold text-primary/30 select-none">
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
                        <p className="text-dim text-xs mb-2.5 line-clamp-2 leading-relaxed">
                          {ann.description ?? ann.body}
                        </p>
                        <p className="text-[11px] text-dim">
                          📅 {ann.startDate} → {ann.endDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-5 pb-4">
                      <button onClick={() => handleEdit(ann)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark
                          border border-sky-200 hover:border-primary/40 bg-sky-50 hover:bg-sky-100
                          px-4 py-2 rounded-xl transition-all">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(ann.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-err
                          border border-red-100 hover:border-err/30 bg-red-50 hover:bg-red-100
                          px-4 py-2 rounded-xl transition-all">
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
