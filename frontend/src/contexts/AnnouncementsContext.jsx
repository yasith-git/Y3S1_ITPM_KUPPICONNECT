import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AnnouncementsContext = createContext(null);

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const UPLOADS  = BASE_URL.replace('/api', '');

/** Normalise a backend document to the shape the UI expects */
function mapAnn(a) {
  return {
    ...a,
    id:          a._id   || a.id,
    conductorId: a.conductor?._id || a.conductor || a.conductorId,
    description: a.description,
    body:        a.description,
    // Prepend server origin only when the value is a bare relative path
    image:       a.image
      ? (a.image.startsWith('http') || a.image.startsWith('data:') ? a.image : `${UPLOADS}/${a.image}`)
      : null,
  };
}

function hasToken() {
  try {
    const d = localStorage.getItem('kuppi_auth');
    return d ? !!JSON.parse(d).token : false;
  } catch { return false; }
}

export function AnnouncementsProvider({ children }) {
  /**
   * announcements   – currently ACTIVE ones, for the public landing page.
   *                   Always fetched (no auth needed).
   * myAnnouncements – ALL of the logged-in conductor's announcements
   *                   (active + upcoming + expired). Only fetched when
   *                   a JWT token is present.
   */
  const [announcements,   setAnnouncements]   = useState([]);
  const [myAnnouncements, setMyAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  /** Public – no auth. Feeds the landing-page carousel. */
  const fetchActive = useCallback(async () => {
    try {
      const res = await api.get('/announcements/landing/active', false);
      setAnnouncements((res.data || []).map(mapAnn));
    } catch (err) {
      console.error('Failed to load active announcements:', err.message);
    }
  }, []);

  /** Conductor only – feeds the dashboard list. */
  const fetchMine = useCallback(async () => {
    if (!hasToken()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/announcements/landing/all');
      setMyAnnouncements((res.data || []).map(mapAnn));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
    fetchMine();
  }, [fetchActive, fetchMine]);

  async function addAnnouncement(data) {
    const fd = new FormData();
    fd.append('title',       data.title);
    fd.append('description', data.description);
    fd.append('startDate',   data.startDate);
    fd.append('endDate',     data.endDate);
    if (data.imageFile)        fd.append('image',           data.imageFile);
    if (data.displayDuration)  fd.append('displayDuration', data.displayDuration);

    const res    = await api.postForm('/announcements/landing', fd);
    const newAnn = mapAnn(res.data);

    // Always add to my-list
    setMyAnnouncements(prev => [newAnn, ...prev]);
    // Also push into the active list if it's live right now
    const now = new Date();
    if (new Date(newAnn.startDate) <= now && new Date(newAnn.endDate) >= now) {
      setAnnouncements(prev => [newAnn, ...prev]);
    }
    return newAnn;
  }

  async function updateAnnouncement(id, data) {
    const fd = new FormData();
    if (data.title            !== undefined) fd.append('title',           data.title);
    if (data.description      !== undefined) fd.append('description',     data.description);
    if (data.startDate        !== undefined) fd.append('startDate',       data.startDate);
    if (data.endDate          !== undefined) fd.append('endDate',         data.endDate);
    if (data.displayDuration  !== undefined) fd.append('displayDuration', data.displayDuration);
    if (data.imageFile)                      fd.append('image',           data.imageFile);

    const res     = await api.putForm(`/announcements/landing/${id}`, fd);
    const updated = mapAnn(res.data);

    setMyAnnouncements(prev => prev.map(a => (a.id === id ? updated : a)));
    // Refresh the public active list to reflect date changes
    fetchActive();
    return updated;
  }

  async function deleteAnnouncement(id) {
    await api.delete(`/announcements/landing/${id}`);
    setMyAnnouncements(prev => prev.filter(a => a.id !== id));
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  const refresh = useCallback(() => { fetchActive(); fetchMine(); }, [fetchActive, fetchMine]);

  return (
    <AnnouncementsContext.Provider value={{
      announcements,    // public active list  → used by Home.jsx / AnnouncementsPage
      myAnnouncements,  // conductor's own list → used by CreateAnnouncement dashboard
      loading, error,
      addAnnouncement, updateAnnouncement, deleteAnnouncement,
      refresh,
    }}>
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements() {
  const ctx = useContext(AnnouncementsContext);
  if (!ctx) throw new Error('useAnnouncements must be used inside AnnouncementsProvider');
  return ctx;
}
