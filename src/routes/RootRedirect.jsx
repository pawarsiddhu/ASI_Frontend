import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { ROLE_HOME_ROUTE } from '@utils/constants';

import LandingPage from '@features/landing/LandingPage';

/**
 * "/" behavior:
 *   - Public / unauthenticated → the public LandingPage
 *   - Authenticated             → redirect to that role's home
 *
 * One URL, two audiences. The landing page has its own Login link that
 * navigates to /login when someone chooses to sign in.
 */
export default function RootRedirect() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    const target = ROLE_HOME_ROUTE[role] || '/login';
    return <Navigate to={target} replace />;
  }
  return <LandingPage />;
}
