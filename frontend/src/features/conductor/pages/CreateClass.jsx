import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClasses } from '../../../contexts/ClassesContext';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'English', 'Economics', 'Statistics', 'Other',
];

const EMPTY = {
  title: '', subject: '', date: '', time: '',
  seats: '', fee: '', classType: 'online', meetingLink: '', location: '', duration: '', description: '',
};

function isValidUrl(val) {
  try { const u = new URL(val); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

function isFutureDate(val) {
  if (!val) return false;
  return val > new Date().toISOString().split('T')[0];
}

function validate(form) {
  const e = {};
  if (!form.title.trim())         e.title       = 'Class title is required.';
  if (!form.subject)              e.subject     = 'Please select a module.';
  if (!form.date)                 e.date        = 'Date is required.';
  else if (!isFutureDate(form.date)) e.date     = 'Date must be in the future.';
  if (!form.time)                 e.time        = 'Time is required.';
  if (!form.seats)                e.seats       = 'Max participants is required.';
  else if (Number(form.seats) < 1 || Number(form.seats) > 500)
                                  e.seats       = 'Enter a number between 1 and 500.';
  if (!form.fee.toString().trim()) e.fee        = 'Fee is required (enter 0 if free).';
  else if (Number(form.fee) < 0)  e.fee         = 'Fee cannot be negative.';
  if (form.classType === 'online') {
    if (!form.meetingLink.trim())  e.meetingLink = 'Meeting link is required.';
    else if (!isValidUrl(form.meetingLink))
                                   e.meetingLink = 'Enter a valid URL (https://...).';
  } else {
    if (!form.location.trim())     e.location    = 'Venue / location is required.';
  }
  if (!form.description.trim())   e.description = 'Description is required.';
  return e;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-err text-xs mt-1.5 flex items-center gap-1">⚠ {msg}</p>;
}

export default function CreateClass() {
  const { addClass } = useClasses();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  function inputCls(name) {
    return `w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
      errors[name]
        ? 'border-err bg-red-50 focus:ring-2 focus:ring-err/20'
        : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
    }`;
  }

  function patch(name, value) {
    const next = { ...form, [name]: value };
    setForm(next);
    if (touched[name]) {
      const e = validate(next);
      setErrors(prev => ({ ...prev, [name]: e[name] || '' }));
    }
  }

  function handleBlur(name) {
    setTouched(t => ({ ...t, [name]: true }));
    const e = validate(form);
    setErrors(prev => ({ ...prev, [name]: e[name] || '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    try {
      await addClass(form);
      setSuccess(true);
      setTimeout(() => navigate('/conductor/classes'), 1400);
    } catch (err) {
      setApiError(err.message || 'Failed to create class. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
        <h2 className="text-xl font-bold text-ink mb-2">Class Created!</h2>
        <p className="text-sub text-sm">Redirecting to your classes list…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Conductor Portal</p>
        <h1 className="text-3xl font-bold text-ink">Create New Class</h1>
        <p className="text-sub text-sm mt-1">Fill in the details below to schedule a kuppi session.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

          {/* Section: Basic Info */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-ink text-sm uppercase tracking-wide mb-5">Class Information</h2>
            <div className="space-y-5">

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Class Title <span className="text-err">*</span>
                </label>
                <input
                  type="text" value={form.title}
                  onChange={e => patch('title', e.target.value)}
                  onBlur={() => handleBlur('title')}
                  placeholder="e.g. Mathematics — Differential Calculus"
                  className={inputCls('title')}
                />
                <FieldError msg={errors.title} />
              </div>

              {/* Module / Subject */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Module <span className="text-err">*</span>
                </label>
                <select
                  value={form.subject}
                  onChange={e => patch('subject', e.target.value)}
                  onBlur={() => handleBlur('subject')}
                  className={inputCls('subject')}
                >
                  <option value="">Select a module...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <FieldError msg={errors.subject} />
              </div>

              {/* Date + Time row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    Date <span className="text-err">*</span>
                  </label>
                  <input
                    type="date" value={form.date} min={tomorrow}
                    onChange={e => patch('date', e.target.value)}
                    onBlur={() => handleBlur('date')}
                    className={inputCls('date')}
                  />
                  <FieldError msg={errors.date} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    Time <span className="text-err">*</span>
                  </label>
                  <input
                    type="time" value={form.time}
                    onChange={e => patch('time', e.target.value)}
                    onBlur={() => handleBlur('time')}
                    className={inputCls('time')}
                  />
                  <FieldError msg={errors.time} />
                </div>
              </div>

              {/* Duration (optional) */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Duration <span className="text-dim font-normal">(optional)</span>
                </label>
                <input
                  type="text" value={form.duration}
                  onChange={e => patch('duration', e.target.value)}
                  placeholder="e.g. 3 hours"
                  className={inputCls('duration')}
                />
              </div>
            </div>
          </div>

          {/* Section: Capacity & Fee */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-ink text-sm uppercase tracking-wide mb-5">Capacity & Fee</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Max Participants <span className="text-err">*</span>
                </label>
                <input
                  type="number" value={form.seats} min="1" max="500"
                  onChange={e => patch('seats', e.target.value)}
                  onBlur={() => handleBlur('seats')}
                  placeholder="e.g. 30"
                  className={inputCls('seats')}
                />
                <FieldError msg={errors.seats} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Fee (Rs.) <span className="text-err">*</span>
                </label>
                <input
                  type="number" value={form.fee} min="0"
                  onChange={e => patch('fee', e.target.value)}
                  onBlur={() => handleBlur('fee')}
                  placeholder="e.g. 1500"
                  className={inputCls('fee')}
                />
                <FieldError msg={errors.fee} />
              </div>
            </div>
          </div>

          {/* Section: Session Details */}
          <div className="p-6">
            <h2 className="font-bold text-ink text-sm uppercase tracking-wide mb-5">Session Details</h2>
            <div className="space-y-5">

              {/* Class Type toggle */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Class Type <span className="text-err">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'online',   icon: '🌐', label: 'Online',   desc: 'Zoom, Meet, etc.' },
                    { value: 'physical', icon: '🏫', label: 'Physical', desc: 'In-person venue'   },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => patch('classType', opt.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        form.classType === opt.value
                          ? 'border-primary bg-sky-50 text-primary'
                          : 'border-slate-200 text-sub hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <p className="font-bold text-sm leading-none mb-0.5">{opt.label}</p>
                        <p className="text-xs opacity-70">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Online: meeting link */}
              {form.classType === 'online' && (
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    Meeting Link <span className="text-err">*</span>
                  </label>
                  <input
                    type="url" value={form.meetingLink}
                    onChange={e => patch('meetingLink', e.target.value)}
                    onBlur={() => handleBlur('meetingLink')}
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    className={inputCls('meetingLink')}
                  />
                  <FieldError msg={errors.meetingLink} />
                  <p className="text-dim text-xs mt-1.5 flex items-center gap-1">
                    🔒 The link will be shared with registered students via email only.
                  </p>
                </div>
              )}

              {/* Physical: venue */}
              {form.classType === 'physical' && (
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    Venue / Location <span className="text-err">*</span>
                  </label>
                  <input
                    type="text" value={form.location}
                    onChange={e => patch('location', e.target.value)}
                    onBlur={() => handleBlur('location')}
                    placeholder="e.g. Lecture Hall 3, Faculty of Science"
                    className={inputCls('location')}
                  />
                  <FieldError msg={errors.location} />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Description <span className="text-err">*</span>
                </label>
                <textarea
                  value={form.description} rows={5}
                  onChange={e => patch('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  placeholder="Describe what topics you'll cover, who should attend, and what students should bring..."
                  className={`${inputCls('description')} resize-none`}
                />
                <FieldError msg={errors.description} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-err text-sm rounded-xl px-4 py-3">⚠ {apiError}</div>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Publishing…' : 'Publish Class'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/conductor/classes')}
              className="px-8 py-3.5 border border-slate-200 text-sub rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
