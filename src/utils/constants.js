/**
 * Roles — the 5 personas defined in the SoW.
 * Any code that checks role/permissions should import from here.
 *
 * String values match the backend enum verbatim (UPPERCASE).
 * The JS key `RD` is kept short for ergonomics; its value is
 * `'REGIONAL_DIRECTOR'` to match the API.
 */
export const ROLES = {
  OPERATOR: 'OPERATOR',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
  RD: 'REGIONAL_DIRECTOR',
};

/**
 * Human-friendly role labels — for UI display.
 */
export const ROLE_LABELS = {
  [ROLES.OPERATOR]: 'Operator',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SUPERADMIN]: 'Super Admin',
  [ROLES.RD]: 'Regional Director',
};

/**
 * Where each role lands after login. Also used by the "/" root redirect.
 */
export const ROLE_HOME_ROUTE = {
  [ROLES.OPERATOR]: '/operator',
  [ROLES.SUPERVISOR]: '/supervisor',
  [ROLES.ADMIN]: '/admin',
  [ROLES.SUPERADMIN]: '/superadmin',
  [ROLES.RD]: '/rd',
};

/**
 * Badge variants per role — for visual differentiation in headers, tables, etc.
 * Matches the Badge component's variant prop.
 */
export const ROLE_BADGE_VARIANT = {
  [ROLES.OPERATOR]: 'info',
  [ROLES.SUPERVISOR]: 'accent',
  [ROLES.ADMIN]: 'primary',
  [ROLES.SUPERADMIN]: 'danger',
  [ROLES.RD]: 'default',
};

/**
 * localStorage key for the persisted auth blob.
 *
 * The value stored at this key is a JSON string of shape:
 *   { token: string, user: { id, username, role, ... } }
 *
 * Both are stored together (rather than token-only) because the real backend
 * has no `/auth/me` endpoint — on page refresh we rehydrate the user from
 * localStorage synchronously instead of re-fetching from the server.
 * See `src/features/auth/authStorage.js` for the read/write helpers.
 */
export const AUTH_STORAGE_KEY = 'asi_auth';

/**
 * API base URL. Sourced from `VITE_API_BASE_URL` in .env.development
 * (or the environment the app is built in). Fallback keeps the app from
 * exploding if the var is missing — the requests will just fail loudly.
 *
 * When `VITE_USE_MOCKS=true` (see main.jsx), MSW intercepts these requests
 * in the browser before they reach the network, so the URL doesn't matter.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Whether MSW should be started on boot. String comparison because Vite
 * env vars come through as strings.
 */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
