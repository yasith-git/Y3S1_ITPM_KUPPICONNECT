import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

/**
 * Restricts access based on authentication and role.
 * - Not logged in → /login
 * - Wrong role → redirected to their own home
 */
function ProtectedRoute({ role, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'conductor' ? '/conductor' : '/student'} replace />;
  }

  return children;
}

export default ProtectedRoute;
