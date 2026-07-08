import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import Spinner from '@components/Spinner';

/**
 * ProtectedRoute — wraps any route that requires a logged-in user.
 *
 * Behavior:
 *   - Not authenticated → redirect to /login, remembering where we tried to go
 *   - Authenticated but user not yet hydrated → show spinner (blocks flash)
 *   - Authenticated + hydrated → render <Outlet /> (or children)
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children] — optional, otherwise renders <Outlet />
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, status } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Token present but /auth/me hasn't returned yet.
  // Shows briefly on hard-refresh before the user object arrives.
  if (!user && status !== 'error') {
    return <Spinner centered label="Loading your session" />;
  }

  return children ?? <Outlet />;
}
