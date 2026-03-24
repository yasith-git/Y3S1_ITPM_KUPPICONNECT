import { createContext, useContext, useState } from 'react';
import { authService } from '../../services/authService';

const AuthContext = createContext(null);

const LS_KEY = 'kuppi_auth'; // stores { token, user }

function loadStored() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadStored());

  const user = auth?.user ?? null;

  function persist(token, userData) {
    const payload = { token, user: userData };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    setAuth(payload);
  }

  // Called by LoginPage — returns the logged-in user object
  async function login(credentials) {
    const res = await authService.login(credentials);
    persist(res.data.token, res.data.user);
    return res.data.user;
  }

  // Called by RegisterPage — returns the registered user object
  async function register(formData) {
    const res = await authService.register(formData);
    persist(res.data.token, res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem(LS_KEY);
    setAuth(null);
  }

  // After profile edit, refresh the stored user object
  async function refreshProfile() {
    try {
      const res = await authService.getProfile();
      const updated = res.data;
      persist(auth.token, updated);
      return updated;
    } catch {
      // if token expired, log out
      logout();
    }
  }

  // Update profile and sync state
  async function updateUserProfile(data) {
    const res = await authService.updateProfile(data);
    const updated = res.data;
    persist(auth.token, updated);
    return updated;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshProfile, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
