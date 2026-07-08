import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

/**
 * RoleGuard — only permits users whose role is in `allowedRoles`.
 * Assumes ProtectedRoute is a parent (i.e. we already know user is logged in).
 *
 * @param {object} props
 * @param {string[]} props.allowedRoles — roles that may proceed
 * @param {React.ReactNode} [props.children]
 *
 * @example
 *   <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPERADMIN]} />}>
 *     <Route path="/cpanel" element={<CPanel />} />
 *   </Route>
 */
export default function RoleGuard({ allowedRoles = [], children }) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ?? <Outlet />;
}
