import { Inbox, Send, CheckCircle2, FileText } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useDashboardData } from '../useDashboardData';
import { ROLES } from '@utils/constants';
import { STATUS } from '@features/antiquities/schema';

const QUICK_ACTIONS = [
  {
    label: 'My Review Queue',
    description: 'Records forwarded to Admin',
    icon: Inbox,
    iconColor: 'brand',
    to: `/records/antiquities?status=${STATUS.ADMIN_REVIEW}`,
  },
  {
    label: 'Publish Queue',
    description: 'Awaiting Super Admin',
    icon: Send,
    iconColor: 'accent',
    to: `/records/antiquities?status=${STATUS.PUBLISH_QUEUE}`,
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
    description: 'Antiquities across all circles',
    icon: FileText,
    iconColor: 'info',
    to: '/records/antiquities',
  },
];

export default function AdminDashboard() {
  const dash = useDashboardData(ROLES.ADMIN);
  return <DashboardLayout {...dash} quickActions={QUICK_ACTIONS} eyebrow="Administrator" title="Administrator Overview" subtitle="Records at your review stage and system-wide activity." />;
}
