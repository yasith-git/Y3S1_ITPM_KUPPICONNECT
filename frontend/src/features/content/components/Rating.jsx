import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../../services/api';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

/* ── Interactive star button ── */
function Star({ index, filled, highlighted, onHover, onClick, interactive }) {
  return (
    <button
      type="button"
      onClick={interactive ? () => onClick(index) : undefined}
      onMouseEnter={interactive ? () => onHover(index) : undefined}
      disabled={!interactive}
      className={`transition-all duration-100 ${
        interactive ? 'hover:scale-125 cursor-pointer' : 'cursor-default'
      } ${filled || highlighted ? 'text-amber-400' : 'text-slate-200'}`}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}

/* ── Mini readonly stars ── */
function MiniStars({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= Math.round(value) ? '#F59E0B' : 'none'}
          stroke="#F59E0B" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function Rating({ classId, conductorId }) {
  const { user } = useAuth();
  /* Aggregate stats from backend */
  const [stats, setStats]               = useState({ average: 0, totalCount: 0, distribution: [] });
  const [myRating, setMyRating]         = useState(0);   // confirmed, persisted rating
  const [selected, setSelected]         = useState(0);   // interactive pick before submit
  const [hover, setHover]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [ratingError, setRatingError]   = useState('');

  /* Fetch ratings from backend on mount */
  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    api.get(`/content/ratings/${classId}`)
      .then(res => {
        const d = res.data;
        setStats({
          average:      d.average      ?? 0,
          totalCount:   d.totalCount   ?? 0,
          distribution: d.distribution ?? [],
        });
        if ((d.myRating ?? 0) > 0) {
          setMyRating(d.myRating);
          setSelected(d.myRating);
          setSubmitted(true);
        }
      })
      .catch(() => { /* non-fatal — UI still renders empty state */ })
      .finally(() => setLoading(false));
  }, [classId]);

  const displayAvg = stats.totalCount > 0 ? Number(stats.average).toFixed(1) : '—';
  /* Backend returns distribution ascending [star 1…5]; reverse to show 5…1 in UI */
  const distribution = [...stats.distribution].reverse();

  async function submitRating(val) {
    if (!user || user.role !== 'student' || submitted || submitting || !val) return;
    setSubmitting(true);
    setRatingError('');
    try {
      await api.post(`/content/ratings/${classId}`, { rating: val });
      /* Refetch for accurate aggregate stats with distribution */
      const res = await api.get(`/content/ratings/${classId}`);
      const d = res.data;
      setStats({
        average:      d.average      ?? 0,
        totalCount:   d.totalCount   ?? 0,
        distribution: d.distribution ?? [],
      });
      setMyRating(val);
      setJustSubmitted(true);
      setTimeout(() => { setJustSubmitted(false); setSubmitted(true); }, 800);
    } catch (err) {
      setRatingError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-7 shadow-sm">
      {/* Header */}
      <h2 className="font-bold text-ink text-lg mb-1">⭐ Rate This Class</h2>
      <p className="text-dim text-xs mb-6">Your rating helps other students discover the best conductors.</p>

      <div className="grid sm:grid-cols-2 gap-8 items-start">
        {/* Left: Average + distribution */}
        <div className="flex flex-col items-center bg-sky-50 border border-sky-100 rounded-2xl p-6 gap-3">
          {loading ? (
            <div className="w-8 h-8 border-[3px] border-primary/25 border-t-primary rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-6xl font-extrabold text-primary leading-none">{displayAvg}</span>
              <MiniStars value={stats.average} />
              <p className="text-xs text-dim font-medium">{stats.totalCount} rating{stats.totalCount !== 1 ? 's' : ''}</p>

              {stats.totalCount > 0 && (
                <div className="w-full mt-2 space-y-1.5">
                  {distribution.map(({ star, pct, count }) => (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-dim text-right">{star}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-5 text-dim text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Rating input */}
        <div className="flex flex-col justify-center">
          {!user ? (
            <div className="text-sm text-sub">
              <a href="/login" className="text-primary font-semibold hover:underline">Sign in</a>
              {' '}to rate this class.
            </div>
          ) : user.role === 'conductor' ? (
            <p className="text-sm text-sub italic text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
              Conductors cannot rate their own classes.
            </p>
          ) : submitted ? (
            <div className={`transition-all duration-500 ${justSubmitted ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="30" height="30" viewBox="0 0 24 24"
                    fill={i <= myRating ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <p className="text-sm font-bold text-ok flex items-center gap-1.5">
                <span>✓</span> You rated this class: <span className="text-amber-600">{LABELS[myRating]}</span>
              </p>
              <p className="text-xs text-dim mt-1">Your rating helps the community find great conductors.</p>
            </div>
          ) : (
            <>
              {ratingError && (
                <div className="mb-3 text-xs text-err bg-red-50 border border-red-200 px-3 py-2 rounded-lg">⚠ {ratingError}</div>
              )}
              <p className="text-sm font-semibold text-ink mb-4">How would you rate this class?</p>
              <div
                className="flex gap-1 mb-2"
                onMouseLeave={() => setHover(0)}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    index={n}
                    filled={n <= selected}
                    highlighted={n <= hover}
                    onHover={setHover}
                    onClick={val => setSelected(val)}
                    interactive
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-amber-600 h-4 mb-4">
                {LABELS[hover || selected] || 'Hover over a star'}
              </p>
              <button
                onClick={() => submitRating(selected)}
                disabled={!selected || submitting}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)] hover:-translate-y-0.5 flex items-center gap-2"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {submitting ? 'Submitting…' : 'Submit Rating'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
