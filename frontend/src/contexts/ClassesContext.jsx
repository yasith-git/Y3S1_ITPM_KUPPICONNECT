import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const ClassesContext = createContext(null);

/** Normalize API class shape → frontend shape */
function normalizeClass(cls) {
  const conductorObj = cls.conductor && typeof cls.conductor === 'object' ? cls.conductor : null;
  const conductorId  = (conductorObj?._id ?? cls.conductor)?.toString() ?? '';
  const conductorName = conductorObj?.name ?? '';

  let date = '';
  let time = '';
  if (cls.dateTime) {
    const dt = new Date(cls.dateTime);
    date = dt.toISOString().split('T')[0];
    time = dt.toTimeString().slice(0, 5);
  }

  return {
    ...cls,
    id:            (cls._id ?? cls.id)?.toString(),
    _id:           (cls._id ?? cls.id)?.toString(),
    conductorId,
    conductor:     conductorName,
    conductorData: conductorObj,
    seats:         cls.capacity     ?? cls.seats    ?? 0,
    enrolled:      cls.enrolledCount ?? cls.enrolled ?? 0,
    fee:           cls.monthlyFee   ?? cls.fee      ?? 0,
    date,
    time,
    classType:     cls.classType    ?? 'online',
    meetingLink:   cls.meetingLink  ?? '',
    location:      cls.location     ?? '',
    subject:       cls.subject      ?? '',
    duration:      cls.duration     ?? '',
  };
}

export function ClassesProvider({ children }) {
  /**
   * classes         – ALL classes from backend (used by conductor dashboard).
   * upcomingClasses – classes whose dateTime > now (public home page).
   * pastClasses     – classes whose dateTime <= now (Past Classes page).
   *                   Paginated: { items, total, page, limit, pages }
   */
  const [classes,         setClasses]         = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses,     setPastClasses]     = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  /** Fetch ALL classes (used by conductor dashboard & ClassesContext consumers) */
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/conductor/classes', false);
      setClasses((res.data ?? []).map(normalizeClass));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Public: upcoming classes for the home page (newest first) */
  const fetchUpcoming = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.subject && filters.subject !== 'All Modules') params.set('subject', filters.subject);
      if (filters.search) params.set('search', filters.search);
      const qs = params.toString();
      const res = await api.get(`/announcements/classes/upcoming${qs ? `?${qs}` : ''}`, false);
      setUpcomingClasses((res.data ?? []).map(normalizeClass));
    } catch {
      setUpcomingClasses([]);
    }
  }, []);

  /** Public: past classes for the Past Classes page */
  const fetchPast = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.subject && filters.subject !== 'All') params.set('subject', filters.subject);
      if (filters.search)      params.set('search',      filters.search);
      if (filters.conductorId) params.set('conductorId', filters.conductorId);
      if (filters.page)        params.set('page',        filters.page);
      if (filters.limit)       params.set('limit',       filters.limit);
      const qs = params.toString();
      const res = await api.get(`/announcements/classes/past${qs ? `?${qs}` : ''}`, false);
      const d = res.data ?? {};
      setPastClasses({
        items: (d.items ?? []).map(normalizeClass),
        total: d.total  ?? 0,
        page:  d.page   ?? 1,
        pages: d.pages  ?? 1,
        limit: d.limit  ?? 20,
      });
    } catch {
      setPastClasses({ items: [], total: 0, page: 1, pages: 1 });
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchUpcoming();
    fetchPast();
  }, [fetchClasses, fetchUpcoming, fetchPast]);

  async function addClass(data) {
    const res = await api.post('/conductor/classes', {
      title:       data.title,
      subject:     data.subject,
      description: data.description,
      date:        data.date,
      time:        data.time,
      classType:   data.classType,
      meetingLink: data.meetingLink,
      location:    data.location,
      seats:       data.seats,
      fee:         data.fee,
      duration:    data.duration,
    });
    const newCls = normalizeClass(res.data);
    setClasses(prev => [newCls, ...prev]);
    // New class is always upcoming — prepend to upcoming list
    setUpcomingClasses(prev => [newCls, ...prev]);
    return newCls;
  }

  async function updateClass(id, data) {
    const res = await api.put(`/conductor/classes/${id}`, {
      title:       data.title,
      subject:     data.subject,
      description: data.description,
      date:        data.date,
      time:        data.time,
      classType:   data.classType,
      meetingLink: data.meetingLink,
      location:    data.location,
      seats:       data.seats,
      fee:         data.fee,
      duration:    data.duration,
    });
    const updated = normalizeClass(res.data);
    setClasses(prev => prev.map(c => c.id === id ? updated : c));
    setUpcomingClasses(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  }

  async function deleteClass(id) {
    await api.delete(`/conductor/classes/${id}`);
    setClasses(prev => prev.filter(c => c.id !== id));
    setUpcomingClasses(prev => prev.filter(c => c.id !== id));
  }

  function incrementEnrolled(classId) {
    const cid = classId?.toString();
    const inc = prev => prev.map(c => c.id === cid ? { ...c, enrolled: (c.enrolled ?? 0) + 1 } : c);
    setClasses(inc);
    setUpcomingClasses(inc);
  }

  function decrementEnrolled(classId) {
    const cid = classId?.toString();
    const dec = prev => prev.map(c => c.id === cid ? { ...c, enrolled: Math.max(0, (c.enrolled ?? 0) - 1) } : c);
    setClasses(dec);
    setUpcomingClasses(dec);
  }

  return (
    <ClassesContext.Provider value={{
      classes, upcomingClasses, pastClasses,
      loading, error,
      fetchClasses, fetchUpcoming, fetchPast,
      addClass, updateClass, deleteClass,
      incrementEnrolled, decrementEnrolled,
    }}>
      {children}
    </ClassesContext.Provider>
  );
}

export function useClasses() {
  return useContext(ClassesContext);
}
