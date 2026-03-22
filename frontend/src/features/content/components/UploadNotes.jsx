import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../../services/api';

const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PdfIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export default function UploadNotes({ classId }) {
  const { user } = useAuth();
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  /* Fetch notes from backend whenever the class changes */
  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    setError('');
    api.get(`/content/notes/${classId}`)
      .then(res => setNotes(res.data ?? []))
      .catch(err => {
        // 401/403 = not enrolled → show friendly message, not a crash
        if (err.statusCode === 401 || err.statusCode === 403) {
          setError('enroll');
        } else {
          setError(err.message || 'Failed to load notes.');
        }
      })
      .finally(() => setLoading(false));
  }, [classId]);

  function handleDownload(note) {
    const a = document.createElement('a');
    a.href = `${SERVER_URL}${note.fileUrl}`;
    a.download = note.fileName;
    a.target = '_blank';
    a.click();
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-7 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <h2 className="font-bold text-ink text-lg">📄 Class Notes</h2>
        {!loading && notes.length > 0 && (
          <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
            {notes.length} file{notes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p className="text-dim text-xs mb-6">Download PDF notes shared by your conductor.</p>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-primary/25 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Not enrolled / not logged in */}
      {!loading && error === 'enroll' && (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-sm font-semibold text-ink mb-1">
            {user ? 'You must be enrolled to view class notes.' : 'Sign in and enroll to access class notes.'}
          </p>
          <p className="text-xs text-dim">Register for this class to unlock downloadable PDF notes.</p>
        </div>
      )}

      {/* API error */}
      {!loading && error && error !== 'enroll' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-err font-semibold">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && notes.length === 0 && (
        <div className="text-center py-12 text-dim">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-medium">No notes available for this class yet.</p>
          <p className="text-xs mt-1">Check back later — your conductor may upload notes after the session.</p>
        </div>
      )}

      {/* Notes list */}
      {!loading && !error && notes.length > 0 && (
        <div className="space-y-3">
          {notes.map(note => (
            <div
              key={note._id}
              className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-primary/20 hover:bg-sky-50/40 transition-all"
            >
              {/* PDF icon */}
              <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                <PdfIcon />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{note.title || note.fileName}</p>
                <p className="text-xs text-dim mt-0.5">
                  {note.fileName}
                  {note.fileSize ? ` · ${formatSize(note.fileSize)}` : ''}
                  {note.createdAt ? ` · ${new Date(note.createdAt).toLocaleDateString()}` : ''}
                </p>
              </div>

              {/* Download */}
              <button
                onClick={() => handleDownload(note)}
                className="shrink-0 flex items-center gap-1.5 text-xs text-primary font-bold px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all"
              >
                ⬇&#xFE0E; Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
