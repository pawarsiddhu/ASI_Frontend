import { Inbox, Send, CheckCircle2, FileText } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useDashboardData } from '../useDashboardData';
import { ROLES } from '@utils/constants';
import { STATUS } from '@features/antiquities/schema';

const QUICK_ACTIONS = [
  {
    label: 'My Review Queue',
    description: 'Records forwarded to Supervisor',
    icon: Inbox,
    iconColor: 'brand',
    to: `/records/antiquities?status=${STATUS.SUPERVISOR_REVIEW}`,
  },
  {
    label: 'Moved to Admin',
    description: 'Records currently past your level',
    icon: Send,
    iconColor: 'info',
    to: `/records/antiquities?status=${STATUS.ADMIN_REVIEW}`,
  },
  {
    label: 'Published',
    description: 'Anchored on the ledger',
    icon: CheckCircle2,
    iconColor: 'success',
    to: `/records/antiquities?status=${STATUS.PUBLISHED}`,
  },
  {
    label: 'All Records',
    description: 'Browse everything in the system',
    icon: FileText,
    iconColor: 'accent',
    to: '/records/antiquities',
  },
];

export default function SupervisorDashboard() {
  const dash = useDashboardData(ROLES.SUPERVISOR);
  return <DashboardLayout {...dash} quickActions={QUICK_ACTIONS} eyebrow="Supervisor" title="Review Queue" subtitle="Records waiting for supervisor review, plus team-wide progress." />;
}
