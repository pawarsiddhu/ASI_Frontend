import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  logout as logoutAction,
  selectCurrentUser,
  selectCurrentRole,
  selectIsAuthenticated,
  selectAuthStatus,
} from '@features/auth/authSlice';
import { useLogoutMutation } from '@features/auth/authApi';
import { api } from '@api/api';
import { can, canAny, canAll } from '@utils/permissions';

/**
 * useAuth — the one-stop hook for anything auth-related in components.
 *
 * @returns {{
 *   user: object | null,
 *   role: string | null,
 *   isAuthenticated: boolean,
 *   status: 'idle' | 'loading' | 'authenticated' | 'error',
 *   logout: () => Promise<void>,
 *   can: (permission: string) => boolean,
 *   canAny: (permissions: string[]) => boolean,
 *   canAll: (permissions: string[]) => boolean,
 * }}
 *
 * @example
 *   const { user, can, logout } = useAuth();
 *   if (can('record.forward')) { ... }
 */
export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectCurrentRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const status = useSelector(selectAuthStatus);
  const [triggerLogout] = useLogoutMutation();

  const logout = useCallback(async () => {
    // Fire-and-forget the server-side call; local logout happens regardless.
    try {
      await triggerLogout().unwrap();
    } catch {
      /* swallow — offline or 401 doesn't stop us clearing local state */
    }
    dispatch(logoutAction());
    // Reset RTK Query cache so a fresh login doesn't inherit stale data.
    dispatch(api.util.resetApiState());
  }, [dispatch, triggerLogout]);

  return {
    user,
    role,
    isAuthenticated,
    status,
    logout,
    can: useCallback((permission) => can(role, permission), [role]),
    canAny: useCallback((perms) => canAny(role, perms), [role]),
    canAll: useCallback((perms) => canAll(role, perms), [role]),
  };
}
