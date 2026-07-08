import { Inbox, Users, BarChart3, FileText } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const QUICK_ACTIONS = [
  {
    label: 'Open Review Queue',
    description: 'Records forwarded by your operators',
    icon: Inbox,
    iconColor: 'brand',
    to: '/records/antiquities',
  },
  {
    label: 'Records Returned by Admin',
    description: 'Second-round review with Admin notes',
    icon: FileText,
    iconColor: 'accent',
    phase: 'Day 2',
  },
  {
    label: 'Team Members',
    description: 'Your operators and their record counts',
    icon: Users,
    iconColor: 'info',
    phase: 'Day 3',
  },
  {
    label: 'Team Reports',
    description: 'Per-operator status breakdown',
    icon: BarChart3,
    iconColor: 'success',
    phase: 'Day 3',
  },
];

export default function SupervisorDashboard() {
  return <DashboardLayout quickActions={QUICK_ACTIONS} />;
}
