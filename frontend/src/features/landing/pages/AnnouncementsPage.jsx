import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/announcements/landing/active', false)
      .then(res => setAnnouncements(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-page">

      {/* Header */}
      <header className="bg-gradient-to-r from-primary-dark to-secondary shadow-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link to="/" className="text-white/70 hover:text-white text-sm font-medium transition">
            ← Home
          </Link>
          <span className="text-white/30">/</span>
          <h1 className="text-white font-semibold text-sm">Announcements</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Updates</p>
          <h2 className="text-3xl font-bold text-ink">Announcements</h2>
          <p className="text-sub text-sm mt-1">Stay up to date with the latest news from KuppiConnect.</p>
        </div>

        {loading && (
          <div className="text-center py-16 text-sub text-sm">Loading announcements…</div>
        )}

        {error && (
          <div className="text-center py-16 text-err text-sm">Failed to load: {error}</div>
        )}

        {!loading && !error && announcements.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-5xl block mb-3">📢</span>
            <p className="font-bold text-ink mb-1">No active announcements</p>
            <p className="text-sub text-sm">Check back soon for updates.</p>
          </div>
        )}

        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a._id}
              className="bg-card rounded-2xl border border-rim hover:shadow-[0_4px_20px_rgba(13,148,136,0.10)] hover:border-primary/25 hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              {a.image && (
                <img
                  src={a.image.startsWith('data:') || a.image.startsWith('http') ? a.image : `${BASE_URL}/${a.image}`}
                  alt={a.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-dim">
                    📅 {new Date(a.startDate).toLocaleDateString()} — {new Date(a.endDate).toLocaleDateString()}
                  </span>
                  {a.conductor?.name && (
                    <span className="text-xs text-dim">· by {a.conductor.name}</span>
                  )}
                </div>
                <h3 className="text-base font-bold text-ink mb-1">{a.title}</h3>
                <p className="text-sub text-sm leading-relaxed">{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default AnnouncementsPage;
