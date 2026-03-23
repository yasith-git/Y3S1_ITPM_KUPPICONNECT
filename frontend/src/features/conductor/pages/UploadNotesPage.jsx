import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useClasses } from '../../../contexts/ClassesContext';
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export default function UploadNotesPage() {
  const { user } = useAuth();
  const { classes } = useClasses();

  const userId    = user?.id?.toString() ?? user?._id?.toString();
  const myClasses = classes.filter(c => String(c.conductorId) === userId);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [notes, setNotes]               = useState([]);
  const [loadingNotes, setLoadingNotes]  = useState(false);
  const [dragging, setDragging]          = useState(false);
  const [uploading, setUploading]        = useState(false);
  const [successMsg, setSuccessMsg]      = useState('');
  const [errorMsg, setErrorMsg]          = useState('');
  const [deletingId, setDeletingId]      = useState(null);

  /* Confirm-before-upload modal state */
  const [pendingFile, setPendingFile]    = useState(null);   // File object awaiting confirm
  const [pendingTitle, setPendingTitle]  = useState('');     // Editable title in modal
  const [modalError, setModalError]      = useState('');     // Error shown inside the modal

  const fileRef = useRef();

  /* Fetch notes from backend when selected class changes */
  useEffect(() => {
    if (!selectedClassId) { setNotes([]); return; }
    setLoadingNotes(true);
    setErrorMsg('');
    api.get(`/content/notes/${selectedClassId}`)
      .then(res => setNotes(res.data ?? []))
      .catch(err => setErrorMsg(err.message || 'Failed to load notes'))
      .finally(() => setLoadingNotes(false));
  }, [selectedClassId]);

  /* Stage the file → open confirm modal (no upload yet) */
  function stageFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf') { setErrorMsg('Only PDF files are accepted.'); return; }
    if (file.size > 20 * 1024 * 1024)   { setErrorMsg('File must be under 20 MB.'); return; }
    setErrorMsg('');
    setPendingFile(file);
    setPendingTitle(file.name.replace(/\.pdf$/i, ''));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    stageFile(e.dataTransfer.files?.[0]);
  }

  function handleInput(e) {
    stageFile(e.target.files?.[0]);
    if (e.target) e.target.value = '';
  }

  function cancelUpload() {
    setPendingFile(null);
    setPendingTitle('');
    setModalError('');
  }

  /* Confirmed → actually POST to backend */
  async function confirmUpload() {
    if (!pendingFile) return;
    setModalError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', pendingFile);
      form.append('title', pendingTitle.trim() || pendingFile.name.replace(/\.pdf$/i, ''));
      const res = await api.postForm(`/content/notes/${selectedClassId}`, form);
      setNotes(prev => [res.data, ...prev]);
      setPendingFile(null);
      setPendingTitle('');
      setModalError('');
      setSuccessMsg(`"${pendingFile.name}" uploaded successfully! Students can now download it.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setModalError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleDownload(note) {
    const url = `${SERVER_URL}${note.fileUrl}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = note.fileName;
    a.target = '_blank';
    a.click();
  }

  async function handleDelete(note) {
    if (!window.confirm(`Delete "${note.title || note.fileName}"? Students will no longer be able to download it.`)) return;
    setDeletingId(note._id);
    try {
      await api.delete(`/content/notes/${note._id}`);
      setNotes(prev => prev.filter(n => n._id !== note._id));
    } catch (err) {
      setErrorMsg(err.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  const selectedClass = myClasses.find(c => String(c.id) === String(selectedClassId));

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Resources</p>
        <h1 className="text-3xl font-bold text-ink">Upload Class Notes</h1>
        <p className="text-sub text-sm mt-1">
          Upload PDF notes for your classes. Students can download them directly from the class page.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: '📚', label: 'My Classes',    value: myClasses.length },
          { icon: '📄', label: 'Files (class)',  value: selectedClassId ? notes.length : '—' },
          { icon: '🎓', label: 'Students Access', value: 'Live' },
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

      {/* Class selector */}
      <div className="bg-white border border-rim rounded-2xl p-6 shadow-sm mb-6">
        <label className="block text-sm font-bold text-ink mb-3">
          Select Class <span className="text-err">*</span>
        </label>
        {myClasses.length === 0 ? (
          <div className="p-5 bg-sky-50 border border-sky-100 rounded-xl text-sm text-sub text-center">
            You haven't created any classes yet.{' '}
            <a href="/conductor/create" className="text-primary font-semibold hover:underline">Create one →</a>
          </div>
        ) : (
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-white transition-all"
          >
            <option value="">— Choose a class to manage notes —</option>
            {myClasses.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.title} · {cls.subject} · {cls.date}
              </option>
            ))}
          </select>
        )}
        {selectedClass && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-dim">
            <span className="inline-flex items-center gap-1">📅 {selectedClass.date} at {selectedClass.time}</span>
            <span className="inline-flex items-center gap-1">👥 {selectedClass.enrolled}/{selectedClass.seats} enrolled</span>
            <span className="inline-flex items-center gap-1">📍 {selectedClass.location || selectedClass.meetingLink}</span>
          </div>
        )}
      </div>

      {/* Upload + file list — shown only after selecting a class */}
      {selectedClassId && (
        <>
          {/* Success banner */}
          {successMsg && (
            <div className="mb-4 flex items-center gap-3 px-5 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-ok font-semibold shadow-sm">
              <span>✓</span> {successMsg}
            </div>
          )}

          {/* Error banner */}
          {errorMsg && (
            <div className="mb-4 flex items-center gap-3 px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-err font-semibold shadow-sm">
              <span>⚠</span> {errorMsg}
              <button onClick={() => setErrorMsg('')} className="ml-auto text-err/60 hover:text-err text-lg leading-none">×</button>
            </div>
          )}

          {/* Upload dropzone */}
          <div className="bg-white border border-rim rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="font-bold text-ink text-base mb-4">Upload PDF Notes</h2>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer select-none transition-all duration-200 ${
                dragging
                  ? 'border-primary bg-sky-50 scale-[1.01]'
                  : uploading
                  ? 'border-primary/40 bg-sky-50/40 cursor-not-allowed'
                  : 'border-slate-200 hover:border-primary/50 hover:bg-sky-50/40'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleInput}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-[3px] border-primary/25 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm text-primary font-semibold">Uploading "{pendingFile?.name}"…</p>
                  <p className="text-xs text-dim">Sending to server, please wait</p>
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4">📑</div>
                  <p className="text-base font-semibold text-ink mb-1.5">
                    {dragging ? 'Drop your PDF here!' : 'Drag & drop a PDF or click to browse'}
                  </p>
                  <p className="text-xs text-dim">PDF files only · Max 20 MB per file</p>
                  <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm pointer-events-none">
                    📂 Browse Files
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Uploaded files list */}
          <div className="bg-white border border-rim rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-ink text-base">Uploaded Files</h2>
              <span className="text-xs text-dim bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
                {notes.length} file{notes.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loadingNotes ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-[3px] border-primary/25 border-t-primary rounded-full animate-spin" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 text-dim">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm font-medium">No files uploaded for this class yet.</p>
                <p className="text-xs mt-1">Upload a PDF above and it will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <div
                    key={note._id}
                    className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-primary/20 hover:bg-sky-50/40 transition-all"
                  >
                    <div className="w-11 h-11 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                      <PdfIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{note.title || note.fileName}</p>
                      <p className="text-xs text-dim mt-0.5">
                        {formatSize(note.fileSize)} · {note.fileName} · {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDownload(note)}
                        className="flex items-center gap-1.5 text-xs text-primary font-bold px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all"
                      >
                        ⬇&#xFE0E; Download
                      </button>
                      <button
                        onClick={() => handleDelete(note)}
                        disabled={deletingId === note._id}
                        className="text-xs text-err font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-40"
                      >
                        {deletingId === note._id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Upload Confirmation Modal ───────────────────────────────── */}
      {pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                <PdfIcon />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-ink text-base">Confirm Upload</p>
                <p className="text-xs text-dim truncate">{pendingFile.name}</p>
              </div>
            </div>

            {/* File info */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-5 text-xs text-dim space-y-1">
              <p>📄 <span className="font-medium text-ink">{pendingFile.name}</span></p>
              <p>📦 Size: {formatSize(pendingFile.size)}</p>
              <p>📚 Class: <span className="font-medium text-ink">{myClasses.find(c => String(c.id) === String(selectedClassId))?.title}</span></p>
            </div>

            {/* Editable title */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-ink mb-1.5">
                Display Title <span className="text-dim font-normal">(students will see this)</span>
              </label>
              <input
                type="text"
                value={pendingTitle}
                onChange={e => setPendingTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                placeholder="e.g. Week 3 – Algebra Notes"
              />
            </div>

            {/* Inline error inside modal */}
            {modalError && (
              <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-err font-semibold">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span className="flex-1">{modalError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={cancelUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-sub text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-[0_4px_14px_rgba(14,165,233,0.35)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading…
                  </>
                ) : (
                  '⬆ Upload Now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
