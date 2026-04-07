import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../../services/api';

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`text-base ${n <= rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
      ))}
    </div>
  );
}

/* ── Student view ── */
function StudentReviews() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/content/ratings/mine')
      .then(res => setRatings(res.data ?? []))
      .catch(err => setError(err.message || 'Failed to load your ratings.'))
      .finally(() => setLoading(false));
  }, []);

  const totalRated  = ratings.length;
  const avgMyRating = totalRated
    ? (ratings.reduce((s, r) => s + r.rating, 0) / totalRated).toFixed(1)
    : '—';
  const subjects = new Set(ratings.map(r => r.class?.subject).filter(Boolean)).size;

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-[3px] border-primary/25 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="text-center py-10 text-err text-sm">⚠ {error}</div>;

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Classes Rated', value: totalRated, icon: '⭐' },
          { label: 'Average Given', value: `${avgMyRating} ★`, icon: '📊' },
          { label: 'Subjects',      value: subjects,   icon: '🎓' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-rim rounded-2xl p-5 flex items-center gap-4 hover:shadow-[0_4px_20px_rgba(13,148,136,0.12)] hover:border-primary/30 hover:-translate-y-0.5 transition-all">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-extrabold text-ink">{s.value}</p>
              <p className="text-dim text-xs mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {totalRated === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-5xl mb-3">⭐</p>
          <p className="text-sm font-semibold text-ink mb-1">No ratings yet</p>
          <p className="text-xs text-dim mb-4">Once you rate a class, it will appear here.</p>
          <Link to="/student/classes" className="inline-block bg-primary hover:bg-primary-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">
            Browse Classes
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map(r => (
            <div key={r._id} className="bg-card border border-rim rounded-2xl p-6 hover:shadow-[0_6px_25px_rgba(13,148,136,0.12)] hover:border-primary/25 hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <Link to={`/class/${r.class?._id}`} className="font-bold text-ink text-base hover:text-primary transition-colors">
                    {r.class?.title || 'Unknown Class'}
                  </Link>
                  {r.class?.subject && <p className="text-xs text-primary font-semibold mt-0.5">{r.class.subject}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StarRow rating={r.rating} />
                  <span className="text-xs text-dim">
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Conductor view ── */
function ConductorReviews() {
  const [classRatings, setClassRatings] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    api.get('/content/ratings/my-classes')
      .then(res => setClassRatings(res.data ?? []))
      .catch(err => setError(err.message || 'Failed to load class ratings.'))
      .finally(() => setLoading(false));
  }, []);

  const totalRatings = classRatings.reduce((s, c) => s + c.totalCount, 0);
  const ratedClasses = classRatings.filter(c => c.totalCount > 0).length;
  const overallAvg   = totalRatings
    ? (classRatings.reduce((s, c) => s + c.average * c.totalCount, 0) / totalRatings).toFixed(1)
    : '—';

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-[3px] border-primary/25 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="text-center py-10 text-err text-sm">⚠ {error}</div>;

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Ratings',   value: totalRatings, icon: '⭐' },
          { label: 'Overall Average', value: `${overallAvg} ★`, icon: '📊' },
          { label: 'Classes Rated',   value: ratedClasses, icon: '🎓' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-rim rounded-2xl p-5 flex items-center gap-4 hover:shadow-[0_4px_20px_rgba(13,148,136,0.12)] hover:border-primary/30 hover:-translate-y-0.5 transition-all">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-extrabold text-ink">{s.value}</p>
              <p className="text-dim text-xs mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {classRatings.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-5xl mb-3">⭐</p>
          <p className="text-sm font-semibold text-ink mb-1">No classes yet</p>
          <Link to="/conductor/create" className="inline-block bg-primary hover:bg-primary-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm mt-4">
            Create a Class
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {classRatings.map(c => (
            <div key={String(c.classId)} className="bg-card border border-rim rounded-2xl p-6 hover:shadow-[0_6px_25px_rgba(13,148,136,0.12)] hover:border-primary/25 hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <Link to={`/class/${c.classId}`} className="font-bold text-ink text-base hover:text-primary transition-colors">
                    {c.title}
                  </Link>
                  {c.subject && <p className="text-xs text-primary font-semibold mt-0.5">{c.subject}</p>}
                </div>
                {c.totalCount > 0 ? (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <StarRow rating={Math.round(c.average)} />
                      <span className="text-sm font-bold text-amber-500">{c.average.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-dim">{c.totalCount} rating{c.totalCount !== 1 ? 's' : ''}</span>
                  </div>
                ) : (
                  <span className="text-xs text-dim bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">No ratings yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function ReviewsPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">
            {user?.role === 'conductor' ? 'My Classes' : 'My Activity'}
          </p>
          <h1 className="text-3xl font-bold text-ink">
            {user?.role === 'conductor' ? 'Student Ratings' : 'My Ratings'}
          </h1>
          <p className="text-sub text-sm mt-1">
            {user?.role === 'conductor'
              ? 'See how students have rated your classes.'
              : 'Classes you have rated on KuppiConnect.'}
          </p>
        </div>
      </div>

      {user?.role === 'conductor' ? <ConductorReviews /> : <StudentReviews />}
    </div>
  );
}
