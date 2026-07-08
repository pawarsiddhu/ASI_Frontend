import { ROLES } from './constants';

/**
 * Permission matrix. Every action a role can perform lives here.
 *
 * Naming convention: `resource.action[.scope]`
 *   - resource: record | reports | cpanel | cms | users | gis | audit
 *   - action: view, create, edit, forward, return, reject, publish, delete, manage
 *   - scope: own | team | circle | all | published  (optional)
 *
 * To add a new role: add a key here + update ROLES + ROLE_LABELS + ROLE_HOME_ROUTE.
 * To add a new capability: add the string to whichever roles get it.
 *
 * Fine-grained "own vs any" checks (e.g. "can Ravi edit *this specific* record")
 * happen at the call site — this file only encodes what each role CAN do at all.
 */
const PERMISSIONS = {
  [ROLES.OPERATOR]: [
    'record.view.own',
    'record.create',
    'record.edit.own.draft',
    'record.forward',
    'record.print.own',
    'record.export.own',
    'reports.view.own',
  ],

  [ROLES.SUPERVISOR]: [
    'record.view.team',
    'record.forward',
    'record.return',
    'record.reject',
    'record.print.team',
    'record.export.team',
    'reports.view.team',
  ],

  [ROLES.ADMIN]: [
    'record.view.all',
    'record.edit.all',
    'record.return',
    'record.reject',
    'record.forward',
    'record.hide',
    'record.print.all',
    'record.export.all',
    'reports.view.all',
    'cpanel.access',
    'cms.access',
    'users.manage.subordinate',
    'audit.view',
  ],

  [ROLES.SUPERADMIN]: [
    'record.view.all',
    'record.edit.all',
    'record.edit.published',
    'record.publish',
    'record.reject',
    'record.return',
    'record.delete',
    'reports.view.all',
    'reports.view.byMuseum',
    'reports.view.byCircle',
    'reports.view.byArchSite',
    'cpanel.access',
    'cms.access',
    'users.manage.all',
    'users.approve.supervisor',
    'users.approve.scholar',
    'audit.view',
  ],

  [ROLES.RD]: [
    'record.view.circle',
    'reports.view.circle',
    'audit.view.circle',
  ],
};

/**
 * can — check whether a role has a specific permission.
 *
 * @param {string|null|undefined} role — the user's role (nullable-safe)
 * @param {string} permission — e.g. 'record.forward', 'reports.view.all'
 * @returns {boolean}
 *
 * @example
 *   can(user.role, 'record.forward')  // true for operator/supervisor/admin
 *   can('rd', 'record.publish')        // false
 */
export function can(role, permission) {
  if (!role || !permission) return false;
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * canAny — true if the role has at least one of the given permissions.
 * Handy for UI where several capabilities gate the same button.
 */
export function canAny(role, permissions) {
  return permissions.some((p) => can(role, p));
}

/**
 * canAll — true only if the role has every listed permission.
 */
export function canAll(role, permissions) {
  return permissions.every((p) => can(role, p));
}

/**
 * getPermissions — the full list for a role. Mainly for debugging / dev tools.
 */
export function getPermissions(role) {
  return PERMISSIONS[role] ?? [];
}
