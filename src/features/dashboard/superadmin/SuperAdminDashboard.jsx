import { CheckCircle2, ShieldCheck, Users, BarChart3 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const QUICK_ACTIONS = [
  {
    label: 'Publish Queue',
    description: 'Records ready for public release',
    icon: CheckCircle2,
    iconColor: 'brand',
    to: '/records/antiquities',
  },
  {
    label: 'User Approvals',
    description: 'Pending supervisor and scholar registrations',
    icon: ShieldCheck,
    iconColor: 'accent',
    phase: 'Later',
  },
  {
    label: 'Portal Users',
    description: 'All operators, supervisors, admins',
    icon: Users,
    iconColor: 'info',
    phase: 'Later',
  },
  {
    label: 'Master Reports',
    description: 'By Museum, Circle, Archaeological Site',
    icon: BarChart3,
    iconColor: 'success',
    phase: 'Day 3',
  },
];

export default function SuperAdminDashboard() {
  return <DashboardLayout quickActions={QUICK_ACTIONS} />;
}
