import {
  LayoutDashboard,
  FileText,
  Landmark,
  MapPinned,
  Inbox,
  Users,
  Settings,
  BarChart3,
  Layers,
  ShieldCheck,
  Building2,
  Search,
} from 'lucide-react';
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
    { label: 'My Built Heritage', icon: Landmark, disabled: true, badge: 'Soon' },
    { label: 'My Sites', icon: MapPinned, disabled: true, badge: 'Soon' },
    { label: 'My Reports', icon: BarChart3, disabled: true, badge: 'Soon' },
  ],

  [ROLES.SUPERVISOR]: [
    { label: 'Dashboard', to: '/supervisor', icon: LayoutDashboard },
    { label: 'Antiquities · Team', to: '/records/antiquities', icon: FileText },
    { label: 'Built Heritage · Team', icon: Landmark, disabled: true, badge: 'Soon' },
    { label: 'Team Reports', icon: BarChart3, disabled: true, badge: 'Soon' },
  ],

  [ROLES.ADMIN]: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'All Antiquities', to: '/records/antiquities', icon: FileText },
    { label: 'All Built Heritage', icon: Landmark, disabled: true, badge: 'Soon' },
    { label: 'All Sites', icon: MapPinned, disabled: true, badge: 'Soon' },
    { label: 'Reports', icon: BarChart3, disabled: true, badge: 'Soon' },
    { label: 'C-Panel', icon: Settings, disabled: true, badge: 'Soon' },
    { label: 'CMS', icon: Layers, disabled: true, badge: 'Soon' },
  ],

  [ROLES.SUPERADMIN]: [
    { label: 'Dashboard', to: '/superadmin', icon: LayoutDashboard },
    { label: 'All Antiquities', to: '/records/antiquities', icon: FileText },
    { label: 'Publish Queue', icon: Inbox, disabled: true, badge: 'Soon' },
    { label: 'Advanced Search', icon: Search, disabled: true, badge: 'Soon' },
    { label: 'User Approvals', icon: ShieldCheck, disabled: true, badge: 'Soon' },
    { label: 'Reports', icon: BarChart3, disabled: true, badge: 'Soon' },
    { label: 'Users', icon: Users, disabled: true, badge: 'Soon' },
    { label: 'C-Panel', icon: Settings, disabled: true, badge: 'Soon' },
  ],

  [ROLES.RD]: [
    { label: 'Dashboard', to: '/rd', icon: LayoutDashboard },
    { label: 'Circle Antiquities', to: '/records/antiquities', icon: FileText },
    { label: 'Circle Reports', icon: BarChart3, disabled: true, badge: 'Soon' },
  ],
};

/**
 * getNavigationForRole — returns the menu array for a role, or [] if unknown.
 */
export function getNavigationForRole(role) {
  return NAV[role] || [];
}
