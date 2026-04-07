import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const NAV = [
  { to: '/student',            label: 'Dashboard',       icon: '🏠', end: true },
  { to: '/student/classes',    label: 'Browse Classes',  icon: '🔍' },
  { to: '/student/myclasses',  label: 'My Classes',      icon: '📚' },
  { to: '/student/requests',   label: 'My Requests',     icon: '💡' },
  { to: '/student/content',    label: 'Notes & Content', icon: '📄' },
  { to: '/student/profile',    label: 'My Profile',      icon: '👤' },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const navItemCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-sky-50 text-primary border-r-[3px] border-primary'
        : 'text-sub hover:bg-slate-50 hover:text-ink'
    }`;

  return (
    <div className="min-h-screen flex bg-sky-50/30">
      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-ink/30 z-30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-60 bg-white border-r border-rim z-40 flex flex-col transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-rim gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">K</span>
            <span className="font-bold text-ink text-sm">KuppiConnect</span>
          </Link>
        </div>

        {/* User info — links to profile */}
        <div className="px-5 py-4 border-b border-rim">
          <Link
            to="/student/profile"
            className="flex items-center gap-3 group rounded-xl hover:bg-sky-50 transition-colors -mx-2 px-2 py-1.5"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-primary flex items-center justify-center text-white font-bold text-sm shrink-0 group-hover:ring-2 group-hover:ring-primary/30 transition-all">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink truncate group-hover:text-primary transition-colors">{user?.name}</p>
              <p className="text-[11px] text-dim truncate">{user?.email}</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navItemCls}
              onClick={() => setMenuOpen(false)}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-rim space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-sub hover:bg-slate-50 hover:text-ink transition-all"
          >
            <span className="text-base">🌐</span>
            <span>View Home Page</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-err hover:bg-red-50 transition-all"
          >
            <span className="text-base">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden h-14 bg-white border-b border-rim flex items-center px-4 gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-50 text-ink transition-colors"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="font-bold text-ink text-sm">KuppiConnect</span>
          <span className="ml-auto text-xs font-semibold text-primary bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">Student</span>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
