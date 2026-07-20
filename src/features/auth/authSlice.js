import { createSlice } from '@reduxjs/toolkit';
import { readAuth, writeAuth, clearAuth } from './authStorage';

/**
 * Auth slice — the only place UI state around the current user lives.
 *
 * Rehydration model: on boot, initial state reads BOTH the token and the user
 * back from localStorage in one synchronous shot. There is no `/auth/me` call
 * because the real backend does not expose that endpoint — the user object
 * received at login time is the source of truth for the session's lifetime.
 *
 * Safety: the token is still the only thing that authorises API calls. A
 * tampered `user` blob in localStorage can trick the UI briefly, but the
 * backend enforces the actual role from the JWT on every request.
 */

const persisted = readAuth();

const initialState = {
  token: persisted?.token ?? null,
  user: persisted?.user ?? null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Called after a successful login. Persists both pieces together.
     * Accepts the flat backend response shape: { token, user }.
     */
    setCredentials(state, action) {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      writeAuth({ token, user });
    },

    /**
     * Full logout — clears in-memory state and localStorage together.
     * Also fired by the axios 401 interceptor.
     */
    logout(state) {
      state.token = null;
      state.user = null;
      clearAuth();
    },
  },
});

// --- Actions ---
export const { setCredentials, logout } = authSlice.actions;

// --- Selectors ---
export const selectAuthToken = (state) => state.auth.token;
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentRole = (state) => state.auth.user?.role ?? null;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);

export default authSlice.reducer;
