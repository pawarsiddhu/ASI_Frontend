import { Building2, BarChart3, FileText } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const QUICK_ACTIONS = [
  {
    label: 'Browse Circle Records',
    description: 'Read-only view of your circle activity',
    icon: FileText,
    iconColor: 'brand',
    to: '/records/antiquities',
  },
  {
    label: 'Circle Progress Report',
    description: 'Per-circle status and totals',
    icon: BarChart3,
    iconColor: 'accent',
    phase: 'Day 3',
  },
  {
    label: 'Circle Staff',
    description: 'Operators and Supervisors in your circle',
    icon: Building2,
    iconColor: 'info',
    phase: 'Day 3',
  },
];

export default function RDDashboard() {
  return <DashboardLayout quickActions={QUICK_ACTIONS} />;
}
