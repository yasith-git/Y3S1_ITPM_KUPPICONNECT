import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';

const ClassRequestContext = createContext(null);

export function ClassRequestProvider({ children }) {
  const { user } = useAuth();
  const [myRequests, setMyRequests]             = useState([]);
  const [conductorRequests, setConductorRequests] = useState([]);
  const [pendingCount, setPendingCount]         = useState(0);
  const [loading, setLoading]                   = useState(false);

  const fetchStudentRequests = useCallback(async () => {
    if (!user || user.role !== 'student') return;
    try {
      const res = await api.get('/registration/requests');
      setMyRequests(res.data ?? []);
    } catch {}
  }, [user]);

  const fetchConductorRequests = useCallback(async (filters = {}) => {
    if (!user || user.role !== 'conductor') return;
    try {
      setLoading(true);
      const qs = new URLSearchParams(filters).toString();
      const res = await api.get(`/conductor/class-requests${qs ? '?' + qs : ''}`);
      setConductorRequests(res.data ?? []);
    } catch {} finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPendingCount = useCallback(async () => {
    if (!user || user.role !== 'conductor') return;
    try {
      const res = await api.get('/conductor/class-requests/pending-count');
      setPendingCount(res.data?.count ?? 0);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'student') {
      fetchStudentRequests();
    } else if (user.role === 'conductor') {
      fetchConductorRequests();
      fetchPendingCount();
      const id = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(id);
    }
  }, [user, fetchStudentRequests, fetchConductorRequests, fetchPendingCount]);

  async function submitRequest(data) {
    const res = await api.post('/registration/requests', data);
    if (user?.role === 'student') setMyRequests(prev => [res.data, ...prev]);
    return res.data;
  }

  async function deleteRequest(requestId) {
    await api.delete(`/registration/requests/${requestId}`);

    setMyRequests(prev => prev.filter(r => r._id !== requestId));
  }

  async function updateStatus(requestId, status) {
    const res = await api.put(`/conductor/class-requests/${requestId}/status`, { status });
    setConductorRequests(prev =>
      prev.map(r => r._id === requestId ? res.data : r)
    );
    if (status !== 'pending') setPendingCount(prev => Math.max(0, prev - 1));
    return res.data;
  }

  return (
    <ClassRequestContext.Provider value={{
      myRequests, conductorRequests, pendingCount, loading,
      fetchStudentRequests, fetchConductorRequests, fetchPendingCount,
      submitRequest, deleteRequest, updateStatus,
    }}>
      {children}
    </ClassRequestContext.Provider>
  );
}

export function useClassRequests() {
  return useContext(ClassRequestContext);
}
