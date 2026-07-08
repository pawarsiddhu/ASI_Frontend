import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ToastProvider } from '@components/Toast';
import AppRouter from '@routes/AppRouter';
import { useGetMeQuery } from '@features/auth/authApi';
import { setUser, logout } from '@features/auth/authSlice';
import { useSelector } from 'react-redux';
import { selectAuthToken, selectCurrentUser } from '@features/auth/authSlice';

/**
 * SessionHydrator — on boot, if we have a persisted token but no user in
 * memory, hit /auth/me to fetch the user. On failure (expired token),
 * log out cleanly.
 *
 * Runs invisibly; ProtectedRoute shows a spinner while user is null.
 */
function SessionHydrator() {
  const dispatch = useDispatch();
  const token = useSelector(selectAuthToken);
  const user = useSelector(selectCurrentUser);

  // Skip the query entirely when there's no token or user already loaded.
  const { data, error, isSuccess, isError } = useGetMeQuery(undefined, {
    skip: !token || !!user,
  });

  useEffect(() => {
    if (isSuccess && data?.user) {
      dispatch(setUser(data.user));
    }
  }, [isSuccess, data, dispatch]);

  useEffect(() => {
    if (isError && error?.status === 401) {
      dispatch(logout());
    }
  }, [isError, error, dispatch]);

  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <SessionHydrator />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AppRouter />
    </ToastProvider>
  );
}
