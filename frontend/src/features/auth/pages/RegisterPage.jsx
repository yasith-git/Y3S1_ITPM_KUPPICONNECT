import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

/* ── Eye icon SVG ── */
function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* ── Password strength ── */
function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6)        s++;
  if (pw.length >= 10)       s++;
  if (/[A-Z]/.test(pw))     s++;
  if (/[0-9!@#$%]/.test(pw)) s++;
  return s; // 0–4
}
const STRENGTH_COLOR = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-ok'];
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];

/* ── Left panel content per role ── */
const PANEL = {
  student: {
    badge: 'Join as Student',
    headline: 'Start learning\nsmarter today.',
    desc: 'Free forever. No credit card required.',
    perks: ['Browse 120+ active classes', 'Register instantly for sessions', 'Access study materials & notes', 'Write & read class reviews'],
  },
  conductor: {
    badge: 'Join as Conductor',
    headline: 'Share your\nknowledge.',
    desc: 'Start teaching and growing your student base.',
    perks: ['Publish kuppi sessions easily', 'Manage student enrollments', 'Upload study content & resources', 'Track your class performance'],
  },
};

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm]         = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'student' });
  const [errors, setErrors]     = useState({});
  const [touched, setTouched]   = useState({});
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]   = useState(false);

  function validateForm(f) {
    const e = {};
    if (!f.name.trim())                                            e.name    = 'Full name is required.';
    if (!f.email.trim())                                           e.email   = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))        e.email   = 'Invalid email format.';
    if (f.phone && !/^\+?[\d\s\-]{7,15}$/.test(f.phone))         e.phone   = 'Invalid phone number.';
    if (!f.password)                                               e.password = 'Password is required.';
    else if (f.password.length < 6)                               e.password = 'At least 6 characters required.';
    if (!f.confirm)                                                e.confirm = 'Please confirm your password.';
    else if (f.confirm !== f.password)                            e.confirm = 'Passwords do not match.';
    return e;
  }

  function handleChange(e) {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (touched[e.target.name]) {
      const errs = validateForm(updated);
      setErrors(prev => ({ ...prev, [e.target.name]: errs[e.target.name] || '' }));
    }
  }

  function handleBlur(e) {
    const name = e.target.name;
    setTouched(prev => ({ ...prev, [name]: true }));
    const errs = validateForm(form);
    setErrors(prev => ({ ...prev, [name]: errs[name] || '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true });
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
      });
      navigate(user.role === 'conductor' ? '/conductor' : '/student');
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const panel    = PANEL[form.role];
  const strength = pwStrength(form.password);

  const inputCls = (name) =>
    `w-full px-4 py-3 text-sm text-ink border rounded-xl focus:outline-none transition-all duration-200 ${
      errors[name]
        ? 'border-err bg-red-50 focus:ring-2 focus:ring-err/20'
        : 'border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 hover:border-slate-300'
    }`;

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── LEFT: 30% sky-50 branding panel ── */}
      <aside className="hidden lg:flex flex-col w-[44%] bg-sky-50 border-r border-sky-100 p-14 relative overflow-hidden">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle, #BAE6FD 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(14,165,233,0.08)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">K</span>
          <span className="text-ink font-bold text-base tracking-tight">KuppiConnect</span>
        </div>

        {/* Dynamic content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 w-fit border border-primary/20">
            {panel.badge}
          </span>
          <h2 className="text-4xl font-extrabold text-ink leading-tight mb-4 whitespace-pre-line">
            {panel.headline}
          </h2>
          <p className="text-sub text-sm leading-relaxed mb-8 max-w-xs">{panel.desc}</p>
          <ul className="space-y-3">
            {panel.perks.map(p => (
              <li key={p} className="flex items-center gap-3 text-sm text-sub">
                <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-dim text-xs">© 2026 KuppiConnect · Secure &amp; Private</p>
      </aside>

      {/* ── RIGHT: 60% white form panel ── */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold">K</span>
            <span className="text-xl font-bold text-ink">KuppiConnect</span>
          </div>

          <h1 className="text-3xl font-bold text-ink mb-1">Create your account</h1>
          <p className="text-sub text-sm mb-8">Join KuppiConnect — it's free forever</p>

          {/* Role Toggle — animated sliding pill */}
          <div className="relative flex p-1 bg-slate-100 rounded-2xl mb-6">
            <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-300"
              style={{ left: form.role === 'student' ? '4px' : 'calc(50%)' }} />
            {[
              { r: 'student',   icon: '🎓', label: 'Student' },
              { r: 'conductor', icon: '🎤', label: 'Conductor' },
            ].map(({ r, icon, label }) => (
              <button key={r} type="button"
                onClick={() => { setForm({ ...form, role: r }); setErrors({}); setTouched({}); }}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all duration-200 rounded-xl ${
                  form.role === r ? 'text-primary' : 'text-dim hover:text-sub'
                }`}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-err/30 text-err rounded-xl px-4 py-3 text-sm">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{serverError}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Full Name</label>
              <input type="text" name="name" value={form.name}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="John Perera" autoComplete="name"
                className={inputCls('name')} />
              {errors.name && <p className="flex items-center gap-1 text-err text-xs mt-1.5"><span>⚠</span> {errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Email address</label>
              <input type="email" name="email" value={form.email}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="you@example.com" autoComplete="email"
                className={inputCls('email')} />
              {errors.email && <p className="flex items-center gap-1 text-err text-xs mt-1.5"><span>⚠</span> {errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Phone Number <span className="text-dim font-normal">(optional)</span></label>
              <input type="tel" name="phone" value={form.phone}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="e.g. +94 77 123 4567" autoComplete="tel"
                className={inputCls('phone')} />
              {errors.phone && <p className="flex items-center gap-1 text-err text-xs mt-1.5"><span>⚠</span> {errors.phone}</p>}
            </div>

            {/* Password + strength bar */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="Min. 6 characters" autoComplete="new-password"
                  className={`${inputCls('password')} pr-11`} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-primary transition-colors p-1 rounded-lg">
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {/* Strength indicator */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i}
                        className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${strength >= i ? STRENGTH_COLOR[strength] : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-[11px] text-dim">{STRENGTH_LABEL[strength]} · Add uppercase or numbers to strengthen</p>
                </div>
              )}
              {errors.password && <p className="flex items-center gap-1 text-err text-xs mt-1.5"><span>⚠</span> {errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type={showCf ? 'text' : 'password'} name="confirm" value={form.confirm}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="Re-enter your password" autoComplete="new-password"
                  className={`${inputCls('confirm')} pr-11`} />
                <button type="button" onClick={() => setShowCf(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-primary transition-colors p-1 rounded-lg">
                  <EyeIcon open={showCf} />
                </button>
              </div>
              {errors.confirm && <p className="flex items-center gap-1 text-err text-xs mt-1.5"><span>⚠</span> {errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-sm mt-2
                         transition-all shadow-[0_4px_14px_rgba(14,165,233,0.3)]
                         hover:shadow-[0_6px_22px_rgba(14,165,233,0.45)] hover:-translate-y-0.5 active:translate-y-0
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-sm text-sub mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:text-primary-dark transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
