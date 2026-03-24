import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../../services/api';

const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

/* ── Helpers ── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function pushNotification(conductorId, classId, authorName, preview) {
  try {
    const key = `kuppi_notifications_${conductorId}`;
    const existing = localStorage.getItem(key);
    const list = existing ? JSON.parse(existing) : [];
    list.unshift({
      id: Date.now(),
      classId,
      type: 'comment',
      message: `${authorName} commented on your class`,
      preview: preview?.slice(0, 70) || 'Attached an image',
      timestamp: Date.now(),
      read: false,
    });
    localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
  } catch { /* silent */ }
}

/* ── Avatar ── */
function Avatar({ name, role, size = 9 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm ${
        role === 'conductor'
          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
          : 'bg-gradient-to-br from-sky-400 to-primary'
      }`}
    >
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

/* ── Comment Input Box ── */
function CommentInput({ onPost, placeholder = 'Share your thoughts about this class...', autoFocus = false, compact = false }) {
  const { user } = useAuth();
  const [text, setText]             = useState('');
  const [imageFile, setImageFile]   = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [posting, setPosting]       = useState(false);
  const [error, setError]           = useState('');
  const fileRef = useRef();

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
    setError('');
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImageFile(file);
    setImgPreview(URL.createObjectURL(file));
  }

  function removeImage() {
    if (imgPreview) URL.revokeObjectURL(imgPreview);
    setImageFile(null);
    setImgPreview('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handlePost() {
    if (!text.trim() && !imageFile) return;
    setPosting(true);
    setError('');
    try {
      await onPost({ text: text.trim(), imageFile });
      setText('');
      removeImage();
    } catch (err) {
      setError(err.message || 'Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex gap-3">
      <Avatar name={user.name} role={user.role} size={compact ? 8 : 9} />
      <div className="flex-1 min-w-0">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={compact ? 2 : 3}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePost(); }}
          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none transition-all placeholder:text-slate-400"
        />
        {imgPreview && (
          <div className="mt-2 relative inline-block">
            <img src={imgPreview} alt="preview" className="h-24 rounded-xl border border-slate-200 object-cover shadow-sm" />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 bg-err text-white rounded-full text-xs flex items-center justify-center hover:bg-red-700 transition-colors shadow"
            >×</button>
          </div>
        )}
        {error && <p className="text-xs text-err mt-1.5">⚠ {error}</p>}
        <div className="flex items-center justify-between mt-2.5 gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-dim hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-sky-50 border border-slate-200 hover:border-sky-200"
          >
            🖼️ {imageFile ? <span className="max-w-[120px] truncate">{imageFile.name}</span> : 'Attach Image'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-dim hidden sm:block">Ctrl+Enter to post</span>
            <button
              onClick={handlePost}
              disabled={(!text.trim() && !imageFile) || posting}
              className="px-5 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Single Comment Card ── */
function CommentCard({ comment, classId, currentUserId, currentUserRole, onReply, onDelete, depth = 0 }) {
  const [showReply, setShowReply] = useState(false);
  const isAuthor  = currentUserId && String(comment.author?._id) === String(currentUserId);
  const canReply  = !!currentUserId && depth < 2;
  /* Only the comment author can delete their own comment */
  const canDelete = depth === 0 && isAuthor;

  async function handleReplyPost(data) {
    await onReply(comment._id, data);
    setShowReply(false);
  }

  return (
    <div className={depth > 0 ? 'ml-10 sm:ml-12 pl-4 border-l-2 border-sky-100' : ''}>
      <div className="flex gap-3">
        <Avatar name={comment.author?.name} role={comment.author?.role} />
        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="text-xs font-bold text-ink">{comment.author?.name}</span>
              {comment.author?.role === 'conductor' && (
                <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 leading-none">
                  Conductor
                </span>
              )}
              {isAuthor && (
                <span className="bg-sky-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200 leading-none">
                  You
                </span>
              )}
              <span className="text-[11px] text-dim ml-auto">{timeAgo(comment.createdAt)}</span>
            </div>
            {comment.text && (
              <p className="text-sm text-sub leading-relaxed whitespace-pre-wrap">{comment.text}</p>
            )}
            {comment.image && (
              <img
                src={comment.image.startsWith('http') ? comment.image : `${SERVER_URL}${comment.image}`}
                alt="attachment"
                className="mt-2.5 max-h-52 max-w-full rounded-xl border border-slate-200 object-cover"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1.5 ml-1">
            {canReply && (
              <button
                onClick={() => setShowReply(v => !v)}
                className="text-[11px] text-dim hover:text-primary font-semibold transition-colors"
              >
                {showReply ? 'Cancel' : '↩ Reply'}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(comment._id)}
                className="text-[11px] text-dim hover:text-err font-semibold transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReply && (
            <div className="mt-3">
              <CommentInput
                placeholder={`Reply to ${comment.author?.name}…`}
                autoFocus
                compact
                onPost={handleReplyPost}
              />
            </div>
          )}

          {/* Nested replies */}
          {comment.replies?.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => (
                <CommentCard
                  key={reply._id}
                  comment={reply}
                  classId={classId}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onReply={onReply}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Comments Component ── */
export default function Comments({ classId, conductorId }) {
  const { user } = useAuth();
  const [comments, setComments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(''); // '' | 'auth' | 'access' | message
  const [actionError, setActionError] = useState('');

  const currentUserId   = user?.id?.toString() ?? user?._id?.toString();
  const currentUserRole = user?.role;

  /* ── Fetch comments from backend ── */
  const loadComments = useCallback(async () => {
    if (!classId) return;
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setFetchError('');
    try {
      const res = await api.get(`/content/comments/${classId}`);
      setComments(res.data ?? []);
    } catch (err) {
      if (err.statusCode === 401) setFetchError('auth');
      else if (err.statusCode === 403) setFetchError('access');
      else setFetchError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [classId, user]);

  useEffect(() => { loadComments(); }, [loadComments]);

  /* ── Post new top-level comment ── */
  async function handlePost({ text, imageFile }) {
    const form = new FormData();
    if (text) form.append('text', text);
    if (imageFile) form.append('image', imageFile);
    const res = await api.postForm(`/content/comments/${classId}`, form);
    setComments(prev => [res.data, ...prev]);
  }

  /* ── Post reply — backend returns the updated parent comment ── */
  async function handleReply(commentId, { text, imageFile }) {
    const form = new FormData();
    if (text) form.append('text', text);
    if (imageFile) form.append('image', imageFile);
    const res = await api.postForm(`/content/comments/${classId}/${commentId}/reply`, form);
    setComments(prev => prev.map(c =>
      String(c._id) === String(commentId) ? res.data : c
    ));
  }

  /* ── Delete top-level comment ── */
  async function handleDelete(commentId) {
    if (!window.confirm('Delete this comment?')) return;
    setActionError('');
    try {
      await api.delete(`/content/comments/${classId}/${commentId}`);
      setComments(prev => prev.filter(c => String(c._id) !== String(commentId)));
    } catch (err) {
      setActionError(err.message || 'Failed to delete comment');
    }
  }

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-7 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-ink text-lg">💬 Discussion</h2>
          {totalCount > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
              {totalCount}
            </span>
          )}
        </div>
        <span className="text-xs text-dim bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
          Students &amp; conductors can comment and reply
        </span>
      </div>

      {/* Not logged in */}
      {!user && (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm text-sub">
            <a href="/login" className="text-primary font-semibold hover:underline">Sign in</a>
            {' '}to view and join the class discussion.
          </p>
        </div>
      )}

      {/* Not enrolled / unauthorized */}
      {user && fetchError === 'access' && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-sm font-semibold text-ink mb-1">Enroll to join the discussion</p>
          <p className="text-xs text-dim">Register for this class to view and post in the discussion board.</p>
        </div>
      )}

      {/* Other fetch error */}
      {user && fetchError && fetchError !== 'access' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-err">
          <span>⚠</span>
          <span>{fetchError === 'auth' ? 'Session expired. Please sign in again.' : fetchError}</span>
        </div>
      )}

      {/* Loading */}
      {user && !fetchError && loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-primary/25 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Main content */}
      {user && !fetchError && !loading && (
        <>
          {actionError && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-err">
              <span>⚠</span> {actionError}
              <button onClick={() => setActionError('')} className="ml-auto text-err/60 hover:text-err text-lg leading-none">×</button>
            </div>
          )}

          {/* Input */}
          <div className="mb-8">
            <CommentInput onPost={handlePost} />
          </div>

          {/* Empty state */}
          {comments.length === 0 && (
            <div className="text-center py-12 text-dim">
              <p className="text-5xl mb-3">💭</p>
              <p className="text-sm font-semibold text-ink">No comments yet.</p>
              <p className="text-xs mt-1">Be the first to share your thoughts about this class!</p>
            </div>
          )}

          {/* Comment list */}
          {comments.length > 0 && (
            <div className="space-y-6">
              {comments.map(c => (
                <CommentCard
                  key={c._id}
                  comment={c}
                  classId={classId}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onReply={handleReply}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
