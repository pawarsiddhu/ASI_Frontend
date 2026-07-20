import { LayoutDashboard, FileText, Landmark } from 'lucide-react';
import { ROLES } from '@utils/constants';

/**
 * Role-specific sidebar navigation.
 *
 * Structure of each item:
 *   { label, icon, to?, disabled?, badge?, description? }
 *
 * `to` present + `disabled: false` → clickable route
 * `disabled: true` → shown but grayed out, no navigation; used to preview
 *                    features that will be built in later phases
 * `badge` → small tag next to label ("Soon", counts once wired to APIs, etc.)
 *
 * Rule when adding a new item: only enable it once the target route
 * actually exists in AppRouter.jsx.
 */
const NAV = {
  [ROLES.OPERATOR]: [
    { label: 'Dashboard', to: '/operator', icon: LayoutDashboard },
    { label: 'My Antiquities', to: '/records/antiquities', icon: FileText },
    { label: 'My Built Heritage', to: '/records/bhs', icon: Landmark },
  ],

  [ROLES.SUPERVISOR]: [
    { label: 'Dashboard', to: '/supervisor', icon: LayoutDashboard },
    { label: 'All Antiquities', to: '/records/antiquities', icon: FileText },
    { label: 'All Built Heritage', to: '/records/bhs', icon: Landmark },
  ],

  [ROLES.ADMIN]: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'All Antiquities', to: '/records/antiquities', icon: FileText },
    { label: 'All Built Heritage', to: '/records/bhs', icon: Landmark },
  ],

  [ROLES.SUPERADMIN]: [
    { label: 'Dashboard', to: '/superadmin', icon: LayoutDashboard },
    { label: 'All Antiquities', to: '/records/antiquities', icon: FileText },
    { label: 'All Built Heritage', to: '/records/bhs', icon: Landmark },
  ],

  [ROLES.RD]: [
    { label: 'Dashboard', to: '/rd', icon: LayoutDashboard },
    { label: 'All Antiquities', to: '/records/antiquities', icon: FileText },
    { label: 'All Built Heritage', to: '/records/bhs', icon: Landmark },
  ],
};

/**
 * getNavigationForRole — returns the menu array for a role, or [] if unknown.
 */
export function getNavigationForRole(role) {
  return NAV[role] || [];
}
