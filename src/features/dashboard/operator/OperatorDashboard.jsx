import { Plus, Inbox, RotateCcw, Landmark } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useDashboardData } from '../useDashboardData';
import { ROLES } from '@utils/constants';
import { STATUS } from '@features/antiquities/schema';

/**
 * OperatorDashboard.
 *
 * Backend scopes /records to the operator's own records, so every count
 * here is "mine, not the team's". Quick actions link to the list page
 * with pre-applied status filters so a click lands the user in exactly
 * the queue they were counting on the card.
 */
const QUICK_ACTIONS = [
  {
    label: 'New Antiquity Record',
    description: 'Movable object — sculpture, coin, manuscript',
    icon: Plus,
    iconColor: 'brand',
    to: '/records/antiquities/new',
  },
  {
    label: 'New Built Heritage Record',
    description: 'Immovable site — temple, fort, stepwell, cave',
    icon: Landmark,
    iconColor: 'accent',
    to: '/records/bhs/new',
  },
  {
    label: 'Returned to Me (Antiquities)',
    description: 'Records that need correction and resubmission',
    icon: RotateCcw,
    iconColor: 'warning',
    to: `/records/antiquities?status=${STATUS.RETURNED}`,
  },
  {
    label: 'All My Records',
    description: 'Browse all antiquities you have created',
    icon: Inbox,
    iconColor: 'info',
    to: '/records/antiquities',
  },
];

export default function OperatorDashboard() {
  const dash = useDashboardData(ROLES.OPERATOR);
  return <DashboardLayout {...dash} quickActions={QUICK_ACTIONS} eyebrow="Operator" title="Overview" subtitle="Records you have created and their current status in the workflow." />;
}
