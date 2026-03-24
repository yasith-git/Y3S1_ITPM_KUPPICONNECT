import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

const navCls = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
    isActive
      ? 'bg-white/20 text-white shadow-sm'
      : 'text-white/75 hover:text-white hover:bg-white/15'
  }`;

function MainLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isStudent = user?.role === 'student';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const studentLinks = [
    { to: '/student',          label: 'Home',    end: true },
    { to: '/student/register', label: 'Classes'           },
    { to: '/student/content',  label: 'Content'           },
    { to: '/student/reviews',  label: 'Reviews'           },
  ];

  const conductorLinks = [
    { to: '/conductor',         label: 'Dashboard', end: true },
    { to: '/conductor/classes', label: 'Classes'             },
    { to: '/conductor/content', label: 'Content'             },
    { to: '/conductor/reviews', label: 'Reviews'             },
  ];

  const links = isStudent ? studentLinks : conductorLinks;

  return (
    <div className="min-h-screen flex flex-col bg-page">

      {/* Navbar */}
      <header className="bg-gradient-to-r from-primary-dark to-secondary shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-sm">K</span>
            <span className="text-white font-bold text-base tracking-tight hidden sm:block">KuppiConnect</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navCls}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-white text-sm font-semibold leading-tight">{user?.name}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-0.5 ${
                isStudent ? 'bg-secondary/30 text-accent' : 'bg-white/20 text-white/90'
              }`}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="border border-white/30 text-white/80 hover:text-white hover:border-white hover:bg-white/10 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-primary/10 bg-gradient-to-r from-section to-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-dim">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-gradient-to-br from-primary to-secondary rounded flex items-center justify-center text-white font-bold text-[9px]">K</span>
            <span>© 2026 KuppiConnect</span>
          </div>
          <span>{user?.name} · <span className="capitalize text-primary font-medium">{user?.role}</span></span>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;

