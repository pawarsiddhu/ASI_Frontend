import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  logout as logoutAction,
  selectCurrentUser,
  selectCurrentRole,
  selectIsAuthenticated,
} from '@features/auth/authSlice';
import { api } from '@api/api';
import { can, canAny, canAll } from '@utils/permissions';

/**
 * useAuth — the one-stop hook for anything auth-related in components.
 *
 * @returns {{
 *   user: object | null,
 *   role: string | null,
 *   isAuthenticated: boolean,
 *   logout: () => void,
 *   can: (permission: string) => boolean,
 *   canAny: (permissions: string[]) => boolean,
 *   canAll: (permissions: string[]) => boolean,
 * }}
 *
 * @example
 *   const { user, can, logout } = useAuth();
 *   if (can('record.forward')) { ... }
 *
 * Logout note: the backend does not expose /auth/logout — JWTs are stateless,
 * so clearing local state is the entire logout. The RTK Query cache is reset
 * so a subsequent login doesn't inherit the previous user's data.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectCurrentRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const logout = useCallback(() => {
    dispatch(logoutAction());
    dispatch(api.util.resetApiState());
  }, [dispatch]);

  return {
    user,
    role,
    isAuthenticated,
    logout,
    can: useCallback((permission) => can(role, permission), [role]),
    canAny: useCallback((perms) => canAny(role, perms), [role]),
    canAll: useCallback((perms) => canAll(role, perms), [role]),
  };
}
