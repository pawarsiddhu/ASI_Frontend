import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { ROLE_HOME_ROUTE } from '@utils/constants';

/**
 * "/" — send the user wherever their role calls home.
 * If unauth, ProtectedRoute would have already bounced them to /login,
 * so we can safely assume `role` here.
 */
export default function RootRedirect() {
  const { role } = useAuth();
  const target = ROLE_HOME_ROUTE[role] || '/login';
  return <Navigate to={target} replace />;
}
