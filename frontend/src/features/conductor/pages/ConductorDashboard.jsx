import { useAuth } from '../../auth/AuthContext';
import { dummyClasses } from '../../../data/dummyData';
import { Link } from 'react-router-dom';

function ConductorDashboard() {
  const { user } = useAuth();
  const myClasses = dummyClasses.slice(0, 4);
  const totalEnrolled = myClasses.reduce((s, c) => s + c.enrolled, 0);
  const totalSeats    = myClasses.reduce((s, c) => s + c.seats, 0);

  const stats = [
    { label: 'My Classes',      value: myClasses.length,  icon: '🗓️' },
    { label: 'Total Enrolled',  value: totalEnrolled,     icon: '🎓' },
    { label: 'Total Capacity',  value: totalSeats,        icon: '💺' },
    { label: 'Fill Rate',       value: `${Math.round((totalEnrolled / totalSeats) * 100)}%`, icon: '📊' },
  ];

  const actions = [
    { icon: '➕', label: 'Create New Class',       desc: 'Schedule a new kuppi session',                to: '/conductor/classes' },
    { icon: '📢', label: 'Manage Announcements',   desc: 'Post & update home page announcements',       to: '/conductor/announcements' },
    { icon: '📁', label: 'Upload Content',         desc: 'Share notes and resources',                   to: '/conductor/content' },
    { icon: '⭐', label: 'View Reviews',           desc: 'See what students are saying',                to: '/conductor/reviews' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Conductor Portal</p>
        <h1 className="text-3xl font-bold text-ink">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sub text-sm mt-1">Here's an overview of your classes and activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-rim rounded-2xl p-5 hover:shadow-[0_8px_25px_rgba(13,148,136,0.13)] hover:border-primary/30 hover:-translate-y-0.5 transition-all">
            <span className="text-2xl mb-2 block">{s.icon}</span>
            <p className="text-2xl font-extrabold text-ink">{s.value}</p>
            <p className="text-xs text-sub mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {actions.map(a => (
          <Link to={a.to} key={a.label}
            className="bg-card border border-rim hover:border-primary/40 rounded-2xl p-5 flex items-start gap-4 hover:shadow-[0_8px_25px_rgba(13,148,136,0.16)] hover:-translate-y-1 transition-all group"
          >
            <span className="w-10 h-10 bg-gradient-to-br from-section to-card rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:from-primary/10 group-hover:to-secondary/10 transition-all border border-rim">
              {a.icon}
            </span>
            <div>
              <p className="font-semibold text-ink text-sm group-hover:text-primary transition-colors">{a.label}</p>
              <p className="text-dim text-xs mt-0.5">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* My Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">My Classes</h2>
          <Link to="/conductor/classes" className="text-secondary text-sm font-semibold hover:text-secondary-dark transition">Manage all →</Link>
        </div>
        <div className="space-y-3">
          {myClasses.map(cls => (
            <div key={cls.id} className="bg-card border border-rim rounded-2xl p-5 flex items-center justify-between hover:shadow-[0_4px_20px_rgba(13,148,136,0.12)] hover:border-primary/30 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-section rounded-xl flex items-center justify-center text-primary font-bold text-sm border border-rim">
                  {cls.subject.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm">{cls.title}</p>
                  <p className="text-dim text-xs">{cls.date} · {cls.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-ink">{cls.enrolled}/{cls.seats} enrolled</p>
                <div className="w-24 h-1.5 bg-section rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                    style={{ width: `${(cls.enrolled / cls.seats) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ConductorDashboard;
