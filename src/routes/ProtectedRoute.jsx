import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

/**
 * ProtectedRoute — wraps any route that requires a logged-in user.
 *
 * Because the session is rehydrated synchronously from localStorage on boot
 * (see authSlice.js + authStorage.js), we never observe the "authenticated
 * but user not yet loaded" intermediate state. Either both are present or
 * both are absent — no spinner needed here.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children] — optional, otherwise renders <Outlet />
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
