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

/* ── Left panel content per role ── */
const PANEL = {
  student: {
    badge: 'Student Portal',
    headline: 'Learn from the best\nconductors.',
    desc: 'Access kuppi classes, study materials, and reviews — all in one place.',
    features: ['Browse 120+ active kuppi classes', 'Register & secure your seat instantly', 'Access shared notes and materials', 'Rate and review your sessions'],
  },
  conductor: {
    badge: 'Conductor Portal',
    headline: 'Manage your classes\nwith ease.',
    desc: 'Create sessions, track enrollments, and share materials effortlessly.',
    features: ['Create and schedule kuppi sessions', 'Track student registrations', 'Upload content & resources', 'View ratings and feedback'],
  },
};

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]             = useState({ email: '', password: '', role: 'student' });
  const [errors, setErrors]         = useState({});
  const [serverError, setServerError] = useState('');
  const [touched, setTouched]       = useState({});
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);

  function validateForm(f) {
    const e = {};
    if (!f.email.trim())                                            e.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))         e.email    = 'Invalid email format.';
    if (!f.password)                                               e.password = 'Password is required.';
    else if (f.password.length < 6)                                e.password = 'At least 6 characters required.';
    return e;
  }

  function handleChange(e) {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (touched[e.target.name]) {
      const errs = validateForm(updated);
      setErrors(prev => ({ ...prev, [e.target.name]: errs[e.target.name] || '' }));
    }
    setServerError('');
  }

  function handleBlur(e) {
    const name = e.target.name;
    setTouched(prev => ({ ...prev, [name]: true }));
    const errs = validateForm(form);
    setErrors(prev => ({ ...prev, [name]: errs[name] || '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      // Send role to backend — backend validates and returns 403 if wrong role
      const user = await login({ email: form.email, password: form.password, role: form.role });
      navigate(user.role === 'conductor' ? '/conductor' : '/student');
    } catch (err) {
      setServerError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  const panel = PANEL[form.role];

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
        {/* Soft accent blob */}
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
            {panel.features.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-sub">
                <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>


      </aside>

      {/* ── RIGHT: 60% white form panel ── */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold">K</span>
            <span className="text-xl font-bold text-ink">KuppiConnect</span>
          </div>

          <h1 className="text-3xl font-bold text-ink mb-1">Welcome back</h1>
          <p className="text-sub text-sm mb-8">Sign in to continue to your workspace</p>

          {/* Role Toggle — animated sliding pill */}
          <div className="relative flex p-1 bg-slate-100 rounded-2xl mb-7">
            <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-300"
              style={{ left: form.role === 'student' ? '4px' : 'calc(50%)' }} />
            {[
              { r: 'student',   icon: '🎓', label: 'Student' },
              { r: 'conductor', icon: '🎤', label: 'Conductor' },
            ].map(({ r, icon, label }) => (
              <button key={r} type="button"
                onClick={() => { setForm({ ...form, role: r }); setErrors({}); setServerError(''); }}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all duration-200 rounded-xl ${
                  form.role === r ? 'text-primary' : 'text-dim hover:text-sub'
                }`}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-err/30 text-err rounded-xl px-4 py-3 mb-5 text-sm">
              <span className="mt-0.5 shrink-0 text-base">⚠</span>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Email address</label>
              <input type="email" name="email" value={form.email}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="you@example.com" autoComplete="email"
                className={inputCls('email')} />
              {errors.email && (
                <p className="flex items-center gap-1 text-err text-xs mt-1.5"><span>⚠</span> {errors.email}</p>
              )}
            </div>

            {/* Password + eye toggle */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="Enter your password" autoComplete="current-password"
                  className={`${inputCls('password')} pr-11`} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-primary transition-colors p-1 rounded-lg">
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 text-err text-xs mt-1.5"><span>⚠</span> {errors.password}</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-sm
                         transition-all shadow-[0_4px_14px_rgba(14,165,233,0.3)]
                         hover:shadow-[0_6px_22px_rgba(14,165,233,0.45)] hover:-translate-y-0.5 active:translate-y-0
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {loading ? 'Signing in…' : `Sign in as ${form.role === 'conductor' ? 'Conductor' : 'Student'} →`}
            </button>
          </form>

          <p className="text-center text-sm text-sub mt-6">
            New to KuppiConnect?{' '}
            <Link to="/register" className="text-primary font-semibold hover:text-primary-dark transition-colors">
              Create a free account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
