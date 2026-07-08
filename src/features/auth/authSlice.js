import { createSlice } from '@reduxjs/toolkit';
import { AUTH_TOKEN_KEY } from '@utils/constants';

/**
 * Auth slice — the only place UI state around the current user lives.
 *
 * Token is persisted to localStorage. On boot, initial state reads it back
 * so refreshes don't kick the user out. `main.jsx` then fires GET /auth/me
 * to hydrate the actual user object.
 *
 * States: idle → loading → authenticated | error
 */

const readInitialToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
};

const initialState = {
  token: readInitialToken(),
  user: null,
  status: 'idle', // 'idle' | 'loading' | 'authenticated' | 'error'
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Called after successful login. Persists the token, stores the user.
     */
    setCredentials(state, action) {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.status = 'authenticated';
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } catch {
        /* localStorage disabled — token stays in-memory only */
      }
    },

    /**
     * Called by /auth/me on boot when a persisted token turned out to be valid.
     */
    setUser(state, action) {
      state.user = action.payload;
      state.status = 'authenticated';
    },

    setAuthStatus(state, action) {
      state.status = action.payload;
    },

    /**
     * Full logout — clears state and localStorage.
     */
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = 'idle';
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      } catch {
        /* ignore */
      }
    },
  },
});

// --- Actions ---
export const { setCredentials, setUser, setAuthStatus, logout } =
  authSlice.actions;

// --- Selectors ---
export const selectAuthToken = (state) => state.auth.token;
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentRole = (state) => state.auth.user?.role ?? null;
export const selectAuthStatus = (state) => state.auth.status;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);

export default authSlice.reducer;
