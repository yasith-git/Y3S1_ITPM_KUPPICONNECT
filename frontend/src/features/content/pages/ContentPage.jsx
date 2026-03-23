import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEnrollments } from '../../../contexts/EnrollmentsContext';
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ContentPage() {
  const { registeredClasses, completedClasses, fetchMyClasses } = useEnrollments();

  // notesByClass: { classId: { classTitle, classSubject, notes: [] } }
  const [notesByClass, setNotesByClass] = useState({});
  const [loading, setLoading]           = useState(true);
  const [errors, setErrors]             = useState({});

  const allEnrolled = [...registeredClasses, ...completedClasses];

  // Fetch enrolled classes first, then notes for each
  useEffect(() => {
    fetchMyClasses().finally(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (allEnrolled.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const fetches = allEnrolled.map(enr =>
      api.get(`/content/notes/${enr.classId}`)
        .then(res => ({ classId: enr.classId, classTitle: enr.classTitle, classSubject: enr.classSubject, notes: res.data ?? [] }))
        .catch(() => ({ classId: enr.classId, classTitle: enr.classTitle, classSubject: enr.classSubject, notes: [] }))
    );

    Promise.all(fetches).then(results => {
      const map = {};
      results.forEach(r => { map[r.classId] = r; });
      setNotesByClass(map);
      setLoading(false);
    });
  }, [registeredClasses.length, completedClasses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const allNotes = Object.values(notesByClass).flatMap(c => c.notes);
  const classesWithNotes = Object.values(notesByClass).filter(c => c.notes.length > 0);

  function handleDownload(note) {
    const a = document.createElement('a');
    a.href = `${SERVER_URL}${note.fileUrl}`;
    a.download = note.fileName;
    a.target = '_blank';
    a.click();
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Student Portal</p>
        <h1 className="text-3xl font-bold text-ink">Notes &amp; Content</h1>
        <p className="text-sub text-sm mt-1">Download PDF notes shared by your conductors across all your classes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: '📚', label: 'Enrolled Classes', value: allEnrolled.length },
          { icon: '📄', label: 'Total Notes',       value: loading ? '…' : allNotes.length },
          { icon: '📁', label: 'Classes with Notes', value: loading ? '…' : classesWithNotes.length },
        ].map(s => (
          <div key={s.label} className="bg-white border border-rim rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(14,165,233,0.08)] hover:-translate-y-0.5 transition-all">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xl font-extrabold text-ink">{s.value}</p>
              <p className="text-xs text-dim mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-rim rounded-2xl">
          <div className="w-10 h-10 border-[3px] border-primary/25 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-sm text-sub">Loading notes from your classes…</p>
        </div>
      )}

      {/* No enrollments */}
      {!loading && allEnrolled.length === 0 && (
        <div className="text-center py-20 bg-white border border-rim rounded-2xl">
          <p className="text-5xl mb-4">📭</p>
          <h3 className="font-bold text-ink text-lg mb-2">No enrolled classes</h3>
          <p className="text-sub text-sm mb-6">Register for a class to access its notes and materials.</p>
          <Link to="/student/classes"
            className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all shadow-sm">
            Browse Classes
          </Link>
        </div>
      )}

      {/* Has enrollments but no notes anywhere */}
      {!loading && allEnrolled.length > 0 && allNotes.length === 0 && (
        <div className="text-center py-20 bg-white border border-rim rounded-2xl">
          <p className="text-5xl mb-4">📂</p>
          <h3 className="font-bold text-ink text-lg mb-2">No notes uploaded yet</h3>
          <p className="text-sub text-sm">Your conductors haven't uploaded any notes yet. Check back after your sessions.</p>
        </div>
      )}

      {/* Notes grouped by class */}
      {!loading && classesWithNotes.length > 0 && (
        <div className="space-y-6">
          {classesWithNotes.map(cls => (
            <div key={cls.classId} className="bg-white border border-rim rounded-2xl overflow-hidden shadow-sm">
              {/* Class header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/60">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📚</span>
                  <div>
                    <p className="font-bold text-ink text-sm">{cls.classTitle}</p>
                    <p className="text-xs text-dim">{cls.classSubject}</p>
                  </div>
                </div>
                <span className="text-xs text-primary font-bold bg-white border border-sky-200 px-2.5 py-0.5 rounded-full">
                  {cls.notes.length} file{cls.notes.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Notes list */}
              <div className="divide-y divide-slate-50">
                {cls.notes.map(note => (
                  <div key={note._id} className="flex items-center gap-4 px-6 py-4 hover:bg-sky-50/40 transition-colors">
                    <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                      <PdfIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{note.title || note.fileName}</p>
                      <p className="text-xs text-dim mt-0.5">
                        {note.fileName}
                        {note.fileSize ? ` · ${formatSize(note.fileSize)}` : ''}
                        {note.createdAt ? ` · ${new Date(note.createdAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(note)}
                      className="shrink-0 flex items-center gap-1.5 text-xs text-primary font-bold px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      ⬇&#xFE0E; Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContentPage;

