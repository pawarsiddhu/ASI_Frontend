/**
 * Roles — the 5 personas defined in the SoW.
 * Any code that checks role/permissions should import from here.
 */
export const ROLES = {
  OPERATOR: 'operator',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  RD: 'rd',
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
 * localStorage key for the JWT. Kept as a constant so nothing else has to
 * remember the string.
 */
export const AUTH_TOKEN_KEY = 'asi_auth_token';

/**
 * API base URL. In production this changes; MSW intercepts either way.
 */
export const API_BASE_URL = '/api';
