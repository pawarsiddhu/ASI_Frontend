import { FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useDashboardData } from '../useDashboardData';
import { ROLES } from '@utils/constants';
import { STATUS } from '@features/antiquities/schema';

/**
 * Regional Director dashboard.
 *
 * Read-only oversight role. Quick actions all deep-link to the list page
 * with a status filter — RD reviews, they don't act on records.
 */
const QUICK_ACTIONS = [
  {
    label: 'All Records',
    description: 'Read-only browse across every circle',
    icon: FileText,
    iconColor: 'brand',
    to: '/records/antiquities',
  },
  {
    label: 'Published',
    description: 'Anchored on ledger — verify integrity anytime',
    icon: CheckCircle2,
    iconColor: 'success',
    to: `/records/antiquities?status=${STATUS.PUBLISHED}`,
  },
  {
    label: 'In Workflow',
    description: 'Records currently under review',
    icon: Clock,
    iconColor: 'warning',
    to: `/records/antiquities?status=${STATUS.SUPERVISOR_REVIEW}`,
  },
  {
    label: 'Rejected',
    description: 'Terminal records with reason on file',
    icon: XCircle,
    iconColor: 'danger',
    to: `/records/antiquities?status=${STATUS.REJECTED}`,
  },
];

export default function RDDashboard() {
  const dash = useDashboardData(ROLES.RD);
  return <DashboardLayout {...dash} quickActions={QUICK_ACTIONS} eyebrow="Regional Director" title="Circle Oversight" subtitle="Read-only view of activity across the circles under your oversight." />;
}
