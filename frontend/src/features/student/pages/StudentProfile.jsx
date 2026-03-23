import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useEnrollments } from '../../../contexts/EnrollmentsContext';
import { authService } from '../../../services/authService';

function validate(form) {
  const e = {};
  if (!form.name.trim())       e.name       = 'Full name is required.';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                               e.email      = 'Invalid email format.';
  if (form.phone && !/^\+?[\d\s\-]{7,15}$/.test(form.phone))
                               e.phone      = 'Invalid phone number.';
  return e;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-err text-xs mt-1.5">⚠ {msg}</p>;
}

export default function StudentProfile() {
  const { user, updateUserProfile } = useAuth();
  const { getStudentEnrollments } = useEnrollments();
  const today = new Date().toISOString().split('T')[0];

  const myEnrollments   = getStudentEnrollments(user?._id || user?.id);
  const upcoming        = myEnrollments.filter(e => e.classDate >= today).length;
  const completed       = myEnrollments.filter(e => e.classDate < today).length;

  const [form, setForm]     = useState({
    name:        user?.name ?? '',
    email:       user?.email ?? '',
    phone:       user?.phone ?? '',
    university:  user?.university ?? '',
    faculty:     user?.faculty ?? '',
    yearOfStudy: user?.yearOfStudy ?? '',
    bio:         user?.bio ?? '',
    photo:       user?.profilePicture ?? null,
  });
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [serverError, setServerError] = useState('');

  function inputCls(name) {
    return `w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
      errors[name]
        ? 'border-err bg-red-50 focus:ring-2 focus:ring-err/20'
        : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
    }`;
  }

  function patch(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = evt => patch('photo', evt.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setServerError('');
    try {
      await updateUserProfile({
        name: form.name,
        phone: form.phone,
        university: form.university,
        faculty: form.faculty,
        yearOfStudy: form.yearOfStudy,
        bio: form.bio,
        profilePicture: form.photo || '',
      });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setServerError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate', 'Other'];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-3xl font-bold text-ink">My Profile</h1>
          <p className="text-sub text-sm mt-1">Manage your personal details and view your class history.</p>
        </div>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setSaved(false); }}
            className="shrink-0 bg-primary hover:bg-primary-dark text-white text-sm font-bold px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)] hover:-translate-y-0.5"
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 text-ok rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          ✓ Profile saved successfully!
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left: Preview card ── */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm lg:sticky lg:top-8">
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-4">Preview</p>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-20 h-20 rounded-full shadow-sm mb-3 overflow-hidden flex items-center justify-center bg-gradient-to-br from-sky-400 to-primary">
                {form.photo
                  ? <img src={form.photo} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-white font-extrabold text-3xl">{form.name?.charAt(0)?.toUpperCase() || 'S'}</span>
                }
              </div>
              <h2 className="font-bold text-ink text-base leading-tight">{form.name || '—'}</h2>
              {form.yearOfStudy && <p className="text-dim text-xs mt-0.5">{form.yearOfStudy}</p>}
              {form.university && <p className="text-dim text-xs">{form.university}</p>}
              {form.faculty && <p className="text-dim text-xs">{form.faculty}</p>}
            </div>

            {form.bio && (
              <p className="text-xs text-sub leading-relaxed text-center mb-4 border-t border-slate-100 pt-4">
                {form.bio}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
              {[
                { label: 'Enrolled', value: myEnrollments.length, color: 'text-primary', bg: 'bg-sky-50 border-sky-100' },
                { label: 'Upcoming', value: upcoming, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                { label: 'Done', value: completed, color: 'text-ok', bg: 'bg-green-50 border-green-100' },
              ].map(s => (
                <div key={s.label} className={`text-center p-2.5 ${s.bg} rounded-xl border`}>
                  <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-dim">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Details / Edit form ── */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

            {!editing ? (
              /* View mode */
              <div>
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-ink text-sm uppercase tracking-wide mb-5">Personal Information</h3>
                  <dl className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name',    value: form.name },
                      { label: 'Email',        value: form.email },
                      { label: 'Phone',        value: form.phone },
                      { label: 'University',   value: form.university },
                      { label: 'Faculty',      value: form.faculty },
                      { label: 'Year of Study', value: form.yearOfStudy },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                        <dt className="text-xs text-dim font-medium mb-0.5">{label}</dt>
                        <dd className="text-sm font-semibold text-ink">{value || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {form.bio && (
                  <div className="p-6">
                    <h3 className="font-bold text-ink text-sm uppercase tracking-wide mb-3">About Me</h3>
                    <p className="text-sub text-sm leading-relaxed">{form.bio}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Edit mode */
              <form onSubmit={handleSubmit} noValidate>
                {/* Profile Picture */}
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-ink text-sm uppercase tracking-wide mb-5">Profile Picture</h3>
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-sky-400 to-primary shrink-0 shadow-sm">
                      {form.photo
                        ? <img src={form.photo} alt="Profile preview" className="w-full h-full object-cover" />
                        : <span className="text-white font-extrabold text-2xl">{form.name?.charAt(0)?.toUpperCase() || 'S'}</span>
                      }
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-sky-50 hover:bg-sky-100 text-primary border border-sky-200 text-sm font-bold px-4 py-2.5 rounded-xl transition-all">
                        📷 Upload Photo
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                      {form.photo && (
                        <button type="button"
                          onClick={() => patch('photo', null)}
                          className="ml-3 text-xs text-err hover:underline">
                          Remove
                        </button>
                      )}
                      <p className="text-xs text-dim mt-1.5">JPG, PNG or GIF · Max 5 MB</p>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-ink text-sm uppercase tracking-wide mb-5">Personal Information</h3>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-ink mb-1.5">Full Name <span className="text-err">*</span></label>
                        <input type="text" value={form.name}
                          onChange={e => patch('name', e.target.value)}
                          className={inputCls('name')} />
                        <FieldError msg={errors.name} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-ink mb-1.5">Email</label>
                        <input type="email" value={form.email}
                          onChange={e => patch('email', e.target.value)}
                          className={inputCls('email')} />
                        <FieldError msg={errors.email} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-ink mb-1.5">Phone Number</label>
                        <input type="tel" value={form.phone}
                          onChange={e => patch('phone', e.target.value)}
                          placeholder="e.g. +94 77 123 4567"
                          className={inputCls('phone')} />
                        <FieldError msg={errors.phone} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-ink mb-1.5">Year of Study</label>
                        <select value={form.yearOfStudy}
                          onChange={e => patch('yearOfStudy', e.target.value)}
                          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all bg-white">
                          <option value="">Select year...</option>
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-ink mb-1.5">University</label>
                        <input type="text" value={form.university}
                          onChange={e => patch('university', e.target.value)}
                          placeholder="e.g. University of Colombo"
                          className={inputCls('university')} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-ink mb-1.5">Faculty / Department</label>
                        <input type="text" value={form.faculty}
                          onChange={e => patch('faculty', e.target.value)}
                          placeholder="e.g. Faculty of Science"
                          className={inputCls('faculty')} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* About */}
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-ink text-sm uppercase tracking-wide mb-4">About Me</h3>
                  <textarea value={form.bio} rows={4}
                    onChange={e => patch('bio', e.target.value)}
                    placeholder="Tell conductors a bit about yourself, your goals, and what you're studying..."
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none" />
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                  {serverError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-err/30 text-err rounded-xl px-4 py-3 text-sm">
                      <span>⚠</span> {serverError}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)] disabled:opacity-60 disabled:cursor-not-allowed">
                      {saving ? 'Saving…' : 'Save Profile'}
                    </button>
                    <button type="button"
                      onClick={() => { setEditing(false); setErrors({}); setServerError(''); }}
                      className="px-8 py-3.5 border border-slate-200 text-sub rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
