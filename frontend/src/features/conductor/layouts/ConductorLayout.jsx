import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useClassRequests } from '../../../contexts/ClassRequestContext';

const NAV = [
  { to: '/conductor/dashboard',     icon: '🏠', label: 'Dashboard'     },
  { to: '/conductor/classes',       icon: '📚', label: 'My Classes'    },
  { to: '/conductor/create',        icon: '➕', label: 'Create Class'  },
  { to: '/conductor/requests',      icon: '💡', label: 'Requests',      requestBadge: true },
  { to: '/conductor/announcements', icon: '📢', label: 'Announcements' },
  { to: '/conductor/notes',         icon: '📄', label: 'Upload Notes'  },
  { to: '/conductor/students',      icon: '👥', label: 'Students'      },
  { to: '/conductor/profile',       icon: '👤', label: 'Profile'       },
];

/** Read unread notification count for this conductor from localStorage */
function useNotifCount(userId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      try {
        const raw = localStorage.getItem(`kuppi_notifications_${userId}`);
        const list = raw ? JSON.parse(raw) : [];
        setCount(list.filter(n => !n.read).length);
      } catch { setCount(0); }
    }
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [userId]);

  return count;
}

function SidebarContent({ user, onLogout, onClose, pendingRequestCount }) {
  return (
    <aside className="w-60 bg-white border-r border-sky-100 flex flex-col h-full">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-sky-100 shrink-0">
        <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
          <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">K</span>
          <span className="font-bold text-ink text-sm tracking-tight">KuppiConnect</span>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-sky-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-primary rounded-full flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
            {user?.name?.charAt(0) ?? 'C'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink truncate leading-tight">{user?.name}</p>
            <span className="inline-block bg-sky-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200 mt-0.5">
              Conductor
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sky-50 text-primary border-r-[3px] border-primary'
                  : 'text-sub hover:bg-slate-50 hover:text-ink'
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.requestBadge && pendingRequestCount > 0 && (
              <span className="min-w-[20px] h-5 px-1 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {pendingRequestCount > 9 ? '9+' : pendingRequestCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="py-2 border-t border-sky-100 shrink-0">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-sub hover:bg-slate-50 hover:text-ink transition-all"
        >
          <span className="text-base leading-none">🌐</span>
          View Home Page
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-err hover:bg-red-50 transition-all"
        >
          <span className="text-base leading-none">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default function ConductorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pendingCount } = useClassRequests();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-sky-50 flex">

      {/* ── Desktop: fixed sidebar ── */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 z-30 shadow-sm">
        <SidebarContent user={user} onLogout={handleLogout} onClose={undefined} pendingRequestCount={pendingCount} />
      </div>

      {/* ── Mobile: slide-over sidebar ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-60 z-50 shadow-xl">
            <SidebarContent
              user={user}
              onLogout={handleLogout}
              onClose={() => setSidebarOpen(false)}
              pendingRequestCount={pendingCount}
            />
          </div>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 lg:ml-60 min-h-screen flex flex-col">

        {/* Mobile topbar */}
        <div className="lg:hidden h-14 bg-white border-b border-sky-100 flex items-center gap-4 px-4 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <div className="w-5 h-0.5 bg-ink rounded mb-1.5" />
            <div className="w-5 h-0.5 bg-ink rounded mb-1.5" />
            <div className="w-4 h-0.5 bg-ink rounded" />
          </button>
          <span className="font-bold text-ink text-sm">Conductor Portal</span>
        </div>

        {/* Page */}
        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
