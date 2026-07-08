import { ROLES } from '@utils/constants';

/**
 * Dashboard mock data.
 * Each role gets a distinct set of stats + activity + optional chart.
 * Real backend will replace this file; the shape here becomes the API contract.
 */

// ---------- Stats per role ----------
const STATS = {
  [ROLES.OPERATOR]: {
    stats: [
      { key: 'drafts', label: 'My Drafts', value: 12, trend: { value: 2, direction: 'up' }, iconColor: 'brand', helperText: 'Not yet forwarded' },
      { key: 'pending', label: 'Pending Review', value: 5, iconColor: 'warning', helperText: 'Awaiting Supervisor' },
      { key: 'returned', label: 'Returned for Correction', value: 3, trend: { value: 1, direction: 'down' }, iconColor: 'danger', helperText: 'Need your attention' },
      { key: 'published', label: 'Published This Month', value: 47, trend: { value: 12, direction: 'up' }, iconColor: 'success', helperText: '156 total this year' },
    ],
    chart: null,
  },

  [ROLES.SUPERVISOR]: {
    stats: [
      { key: 'queue', label: 'Awaiting My Review', value: 8, iconColor: 'brand', helperText: 'Forwarded by operators' },
      { key: 'returnedByAdmin', label: 'Returned by Admin', value: 2, iconColor: 'warning', helperText: 'Needs re-review' },
      { key: 'forwardedToAdmin', label: 'Forwarded to Admin', value: 34, trend: { value: 8, direction: 'up' }, iconColor: 'info', helperText: 'This month' },
      { key: 'teamTotal', label: 'Team Records Total', value: 1567, trend: { value: 5, direction: 'up' }, iconColor: 'success', helperText: '6 active operators' },
    ],
    chart: null,
  },

  [ROLES.ADMIN]: {
    stats: [
      { key: 'total', label: 'Total Records', value: 124702, trend: { value: 3, direction: 'up' }, iconColor: 'brand', helperText: 'Across all circles' },
      { key: 'awaitingReview', label: 'Awaiting My Review', value: 89, iconColor: 'warning', helperText: 'Forwarded by supervisors' },
      { key: 'pendingPublish', label: 'Pending Publish', value: 42, iconColor: 'info', helperText: 'At Super Admin queue' },
      { key: 'rejectedMonth', label: 'Rejected This Month', value: 6, trend: { value: 2, direction: 'down' }, iconColor: 'danger', helperText: 'Improvement over last month' },
    ],
    chart: {
      title: 'Records by State — Top 5',
      subtitle: 'Total records documented per state',
      data: [
        { label: 'Uttar Pradesh', value: 18420 },
        { label: 'Tamil Nadu', value: 16785 },
        { label: 'Madhya Pradesh', value: 14320 },
        { label: 'Karnataka', value: 12980 },
        { label: 'Rajasthan', value: 11240 },
      ],
    },
  },

  [ROLES.SUPERADMIN]: {
    stats: [
      { key: 'published', label: 'Total Published', value: 122481, trend: { value: 4, direction: 'up' }, iconColor: 'success', helperText: 'Live on public portal' },
      { key: 'publishQueue', label: 'Publish Queue', value: 42, iconColor: 'warning', helperText: 'Awaiting your approval' },
      { key: 'approvals', label: 'Pending User Approvals', value: 7, iconColor: 'info', helperText: '5 scholars, 2 supervisors' },
      { key: 'users', label: 'Total Portal Users', value: 340, trend: { value: 6, direction: 'up' }, iconColor: 'brand', helperText: 'Across all roles' },
    ],
    chart: {
      title: 'Records Published — Last 6 months',
      subtitle: 'Monthly publish volume trend',
      data: [
        { label: 'Feb 2026', value: 892 },
        { label: 'Mar 2026', value: 1104 },
        { label: 'Apr 2026', value: 1287 },
        { label: 'May 2026', value: 1352 },
        { label: 'Jun 2026', value: 1489 },
        { label: 'Jul 2026', value: 634 },
      ],
    },
  },

  [ROLES.RD]: {
    stats: [
      { key: 'circleRecords', label: 'Circle Records', value: 1567, iconColor: 'brand', helperText: 'Delhi Circle total' },
      { key: 'circlePublished', label: 'Published', value: 1498, trend: { value: 2, direction: 'up' }, iconColor: 'success', helperText: 'Live on public portal' },
      { key: 'circlePending', label: 'Pending Approval', value: 15, iconColor: 'warning', helperText: 'In workflow' },
      { key: 'circleUsers', label: 'Circle Staff', value: 12, iconColor: 'info', helperText: '6 operators, 2 supervisors' },
    ],
    chart: null,
  },
};

// ---------- Activity feed per role ----------
const ACTIVITY = {
  [ROLES.OPERATOR]: [
    { id: 'a1', type: 'forward', title: 'Forwarded R-2026-1247', description: 'Sculpture — Chola bronze (12th c.)', at: '2 hours ago', badge: 'Under review' },
    { id: 'a2', type: 'draft', title: 'Saved draft R-2026-1249', description: 'Coin — Gupta gold dinar', at: '4 hours ago', badge: 'Draft' },
    { id: 'a3', type: 'returned', title: 'R-2026-1235 returned by Supervisor', description: 'Missing acquisition source', at: 'Yesterday', badge: 'Returned' },
    { id: 'a4', type: 'published', title: 'R-2026-1198 published', description: 'Manuscript — Nagari script (18th c.)', at: '2 days ago', badge: 'Published' },
    { id: 'a5', type: 'create', title: 'Created R-2026-1247', description: 'Sculpture — Chola bronze (12th c.)', at: '3 days ago', badge: 'Draft' },
  ],

  [ROLES.SUPERVISOR]: [
    { id: 'a1', type: 'forward', title: 'Forwarded R-2026-1210 to Admin', description: 'By Ravi Kumar · Terracotta figurine', at: '30 minutes ago', badge: 'To Admin' },
    { id: 'a2', type: 'returned', title: 'Returned R-2026-1235 to Operator', description: 'Missing acquisition source', at: '2 hours ago', badge: 'Returned' },
    { id: 'a3', type: 'reject', title: 'Rejected R-2026-1198', description: 'Duplicate of R-2025-0847', at: 'Yesterday', badge: 'Rejected' },
    { id: 'a4', type: 'received', title: '3 new records to review', description: 'From Ravi Kumar and Ananya Rao', at: 'Yesterday', badge: 'Pending' },
  ],

  [ROLES.ADMIN]: [
    { id: 'a1', type: 'forward', title: 'Forwarded 12 records to Super Admin', description: 'From Delhi and Mumbai Circles', at: '1 hour ago', badge: 'To publish' },
    { id: 'a2', type: 'edit', title: 'Edited R-2024-0421', description: 'Corrected chronological affiliation', at: '3 hours ago', badge: 'Edited' },
    { id: 'a3', type: 'received', title: '34 records forwarded by supervisors', description: 'Across 8 circles', at: 'Yesterday', badge: 'Pending' },
    { id: 'a4', type: 'reject', title: 'Rejected 2 records', description: 'Data quality issues', at: '2 days ago', badge: 'Rejected' },
  ],

  [ROLES.SUPERADMIN]: [
    { id: 'a1', type: 'publish', title: 'Published 8 records', description: 'Antiquities · anchored to blockchain', at: '45 minutes ago', badge: 'Published' },
    { id: 'a2', type: 'approve', title: 'Approved Supervisor account', description: 'Sunita Menon · Chennai Circle', at: '2 hours ago', badge: 'Approved' },
    { id: 'a3', type: 'received', title: '12 records queued for publish', description: 'Forwarded by Admin', at: 'Yesterday', badge: 'In queue' },
    { id: 'a4', type: 'reject', title: 'Rejected scholar registration', description: 'Incomplete institutional affiliation', at: '2 days ago', badge: 'Rejected' },
  ],

  [ROLES.RD]: [
    { id: 'a1', type: 'publish', title: '4 Delhi Circle records published', description: 'Now live on public portal', at: '3 hours ago', badge: 'Published' },
    { id: 'a2', type: 'received', title: '7 new records forwarded', description: 'From Delhi Circle operators', at: 'Yesterday', badge: 'In workflow' },
    { id: 'a3', type: 'report', title: 'Monthly circle report ready', description: 'June 2026 · 156 new records', at: '2 days ago', badge: 'Report' },
  ],
};

// ---------- Public API ----------
export function getDashboardData(role) {
  return {
    stats: STATS[role]?.stats || [],
    chart: STATS[role]?.chart || null,
    activity: ACTIVITY[role] || [],
  };
}
