import { Inbox, CheckCircle2, XCircle, FileText } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useDashboardData } from '../useDashboardData';
import { ROLES } from '@utils/constants';
import { STATUS } from '@features/antiquities/schema';

const QUICK_ACTIONS = [
  {
    label: 'My Review Queue',
    description: 'Records ready to anchor on ledger',
    icon: Inbox,
    iconColor: 'brand',
    to: `/records/antiquities?status=${STATUS.PUBLISH_QUEUE}`,
  },
  {
    label: 'Published Records',
    description: 'Anchored on Fabric — verify integrity anytime',
    icon: CheckCircle2,
    iconColor: 'success',
    to: `/records/antiquities?status=${STATUS.PUBLISHED}`,
  },
  {
    label: 'Rejected',
    description: 'Terminal records with rejection reasons',
    icon: XCircle,
    iconColor: 'danger',
    to: `/records/antiquities?status=${STATUS.REJECTED}`,
  },
  {
    label: 'All Records',
    description: 'Every antiquity in the system',
    icon: FileText,
    iconColor: 'info',
    to: '/records/antiquities',
  },
];

export default function SuperAdminDashboard() {
  const dash = useDashboardData(ROLES.SUPERADMIN);
  return <DashboardLayout {...dash} quickActions={QUICK_ACTIONS} eyebrow="Super Administrator" title="My Review Queue" subtitle="Records ready to be anchored on the ledger, plus published totals." />;
}
