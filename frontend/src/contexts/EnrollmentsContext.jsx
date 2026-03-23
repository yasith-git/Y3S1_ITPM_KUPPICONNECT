import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const EnrollmentsContext = createContext(null);

/*
 * localStorage key for persisting enrollment records.
 * Each record mirrors the fields needed by the student dashboard
 * and reminder screens — note: meeting links are NEVER stored here
 * (they are sent via email only).
 */
const LS_KEY = 'kuppi_student_enrollments';

function load() {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return [];
}

function save(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}

/**
 * Returns a display-safe location string for an enrollment record.
 *  - Online classes  → "Online (link sent via email)"
 *  - Physical classes → the venue text (e.g. "Room 302, Faculty of Science")
 * We NEVER store raw meeting-link URLs in localStorage.
 */
function safeLocation(cls) {
  if (cls.classType === 'physical') return cls.location || '';
  return 'Online (link sent via email)';
}

export function EnrollmentsProvider({ children }) {
  const [enrollments, setEnrollments] = useState(load);

  // Split classes fetched from the dedicated /my-classes endpoint
  const [registeredClasses, setRegisteredClasses] = useState([]);
  const [completedClasses,  setCompletedClasses]  = useState([]);

  // Sync across browser tabs: when localStorage is updated in another tab,
  // immediately reflect the new enrollments here (conductor sees student's registration live)
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === LS_KEY && e.newValue) {
        try { setEnrollments(JSON.parse(e.newValue)); } catch {}
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  function enroll(cls, studentData) {
    /*
     * Build the enrollment record stored locally.
     * Fields used by StudentHome (dashboard) and StudentsList (conductor side).
     * classLocation stores a safe display string — never the raw meeting URL.
     */
    const newEnrollment = {
      id:            Date.now(),
      classId:       String(cls.id),
      studentId:     String(studentData.id),
      studentName:   studentData.name,
      email:         studentData.email,
      phone:         studentData.phone || '',
      registeredAt:  new Date().toISOString().split('T')[0],
      classTitle:    cls.title,
      classSubject:  cls.subject,
      classDate:     cls.date,
      classTime:     cls.time,
      classFee:      cls.fee,
      classLocation: safeLocation(cls),   // safe for display — no raw URLs
      conductor:     cls.conductor,
      conductorId:   cls.conductorId,
    };
    const next = [...enrollments, newEnrollment];
    setEnrollments(next);
    save(next);
    return newEnrollment;
  }

  function unenroll(enrollmentId) {
    const next = enrollments.filter(e => e.id !== enrollmentId);
    setEnrollments(next);
    save(next);
  }

  /**
   * Check if a student (by ID) is already enrolled in a class.
   * Uses String normalisation to handle mixed number/string IDs
   * (dummy users use numbers; MongoDB users use strings).
   */
  function isEnrolled(classId, studentId) {
    if (!studentId) return false;
    const cid = String(classId);
    const sid = String(studentId);
    return enrollments.some(e => String(e.classId) === cid && String(e.studentId) === sid);
  }

  /**
   * Secondary duplicate guard: check by email address.
   * Prevents the same person from registering twice even if they
   * use a different account (e.g. logged in again with a new profile).
   */
  function isEnrolledByEmail(classId, email) {
    if (!email) return false;
    const cid = String(classId);
    const em  = email.trim().toLowerCase();
    return enrollments.some(
      e => String(e.classId) === cid && (e.email || '').trim().toLowerCase() === em
    );
  }

  /** Return all enrollments belonging to a specific student. */
  function getStudentEnrollments(studentId) {
    if (!studentId) return [];
    const sid = String(studentId);
    return enrollments.filter(e => String(e.studentId) === sid);
  }

  /** Return all enrollments for a conductor's classes (used in StudentsList). */
  function getConductorEnrollments(conductorId) {
    if (!conductorId) return [];
    return enrollments.filter(e => e.conductorId === conductorId);
  }

  /**
   * Sync enrollments from the backend API.
   * Call after a successful registration to ensure the student dashboard
   * reflects the real DB state immediately (enrollment id, status, etc.).
   */
  const fetchMyEnrollments = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await api.get('/registration/my-enrollments');
      const apiEnrollments = (res.data ?? []).map(e => {
        const cls = e.class || {};
        const dt = cls.dateTime ? new Date(cls.dateTime) : null;
        return {
          id:            e._id,
          classId:       String(cls._id ?? ''),
          studentId:     String(userId),
          studentName:   e.student?.name ?? '',
          email:         e.student?.email ?? '',
          phone:         e.studentDetails?.phone ?? '',
          registeredAt:  e.enrolledAt ? new Date(e.enrolledAt).toISOString().split('T')[0] : '',
          classTitle:    cls.title ?? '',
          classSubject:  cls.subject ?? '',
          classDate:     dt ? dt.toISOString().split('T')[0] : '',
          classTime:     dt ? dt.toTimeString().slice(0, 5) : '',
          classFee:      cls.monthlyFee ?? cls.fee ?? 0,
          classLocation: cls.classType === 'physical'
            ? (cls.location || '')
            : 'Online (link sent via email)',
          conductor:     cls.conductor?.name ?? '',
          conductorId:   String(cls.conductor?._id ?? ''),
          status:        e.status,
        };
      });
      setEnrollments(prev => {
        // API records are authoritative; keep any purely-local (numeric id) records
        const apiIds = new Set(apiEnrollments.map(e => String(e.id)));
        const localOnly = prev.filter(e => !apiIds.has(String(e.id)) && typeof e.id === 'number');
        const merged = [...apiEnrollments, ...localOnly];
        save(merged);
        return merged;
      });
    } catch { /* silent – localStorage remains valid */ }
  }, []);

  /**
   * Fetch split class lists from GET /api/registration/my-classes.
   * Populates registeredClasses (upcoming) and completedClasses (past).
   * Call on mount and after any enrollment change.
   */
  const fetchMyClasses = useCallback(async () => {
    try {
      const res = await api.get('/registration/my-classes');
      const { registeredClasses: reg = [], completedClasses: comp = [] } = res.data ?? {};

      function normalise(e) {
        const cls = e.class || {};
        const dt  = cls.dateTime ? new Date(cls.dateTime) : null;
        return {
          id:            e._id,
          classId:       String(cls._id ?? ''),
          studentId:     String(e.student?._id ?? ''),
          studentName:   e.student?.name ?? '',
          email:         e.student?.email ?? '',
          phone:         e.studentDetails?.phone ?? '',
          registeredAt:  e.enrolledAt ? new Date(e.enrolledAt).toISOString().split('T')[0] : '',
          classTitle:    cls.title ?? '',
          classSubject:  cls.subject ?? '',
          classDate:     dt ? dt.toISOString().split('T')[0] : '',
          classTime:     dt ? dt.toTimeString().slice(0, 5) : '',
          classFee:      cls.monthlyFee ?? cls.fee ?? 0,
          classLocation: cls.classType === 'physical'
            ? (cls.location || '')
            : 'Online (link sent via email)',
          classMeetingLink: cls.classType === 'online' ? (cls.meetingLink || '') : '',
          conductor:     cls.conductor?.name ?? '',
          conductorId:   String(cls.conductor?._id ?? ''),
          status:        e.status,
        };
      }

      setRegisteredClasses(reg.map(normalise));
      setCompletedClasses(comp.map(normalise));
    } catch { /* silent – stale state is acceptable */ }
  }, []);

  /**
   * Cancel an enrollment via the real API, then remove it from local state.
   * Falls back to a local-only removal when the ID is not a MongoDB ObjectId
   * (i.e. a temporary numeric ID created before fetchMyEnrollments synced the DB state).
   */
  const cancelEnrollmentApi = useCallback(async (enrollmentId) => {
    try {
      await api.delete(`/registration/my-enrollments/${enrollmentId}`);
    } catch (err) {
      // 404 means the record wasn't in DB (local-only). Any other error is real — rethrow.
      if (err.statusCode !== 404) throw err;
    }
    setEnrollments(prev => {
      const next = prev.filter(e => String(e.id) !== String(enrollmentId));
      save(next);
      return next;
    });
  }, []);

  return (
    <EnrollmentsContext.Provider value={{ enrollments, enroll, unenroll, cancelEnrollmentApi, isEnrolled, isEnrolledByEmail, getStudentEnrollments, getConductorEnrollments, fetchMyEnrollments, fetchMyClasses, registeredClasses, completedClasses }}>
      {children}
    </EnrollmentsContext.Provider>
  );
}

export function useEnrollments() {
  const ctx = useContext(EnrollmentsContext);
  if (!ctx) throw new Error('useEnrollments must be used inside EnrollmentsProvider');
  return ctx;
}
