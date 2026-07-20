import { AUTH_STORAGE_KEY } from '@utils/constants';

/**
 * Auth persistence layer — the ONE place that knows the localStorage shape.
 *
 * Both the auth slice (Redux state) and the axios interceptor (attaches the
 * Bearer token) read through these helpers. If we ever need to change the
 * storage shape (e.g. add a refresh token, encrypt, move to sessionStorage),
 * this is the only file that changes.
 *
 * Shape on disk:
 *   { token: string, user: { id, username, role, ... } }
 *
 * All functions are defensive: they never throw on quota errors, missing keys,
 * or malformed JSON. A corrupted blob is treated as if the user were logged out.
 */

/**
 * Read the persisted auth blob from localStorage.
 * @returns {{ token: string, user: object } | null}
 */
export function readAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Defensive: only trust the blob if both pieces are present.
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persist the auth blob. Called on successful login.
 * @param {{ token: string, user: object }} auth
 */
export function writeAuth(auth) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    /* Quota exceeded or storage disabled — session becomes in-memory only. */
  }
}

/**
 * Clear the persisted auth blob. Called on logout or on any 401 response.
 */
export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Quick-read helper for the axios request interceptor, which only needs the
 * token itself. Returns null when there's no session.
 */
export function readAuthToken() {
  return readAuth()?.token ?? null;
}
