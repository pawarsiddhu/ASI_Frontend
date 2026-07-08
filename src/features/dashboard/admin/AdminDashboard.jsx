import { FileText, BarChart3, Settings, Layers } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const QUICK_ACTIONS = [
  {
    label: 'All Records',
    description: 'Antiquities, BHS, and Sites across all circles',
    icon: FileText,
    iconColor: 'brand',
    to: '/records/antiquities',
  },
  {
    label: 'Generate Reports',
    description: 'State/District/Tehsil breakdowns, export PDF',
    icon: BarChart3,
    iconColor: 'accent',
    phase: 'Day 3',
  },
  {
    label: 'C-Panel',
    description: 'Manage users, dropdowns, master tables',
    icon: Settings,
    iconColor: 'info',
    phase: 'Later',
  },
  {
    label: 'CMS',
    description: 'Notices, events, gallery, outreach content',
    icon: Layers,
    iconColor: 'success',
    phase: 'Later',
  },
];

export default function AdminDashboard() {
  return <DashboardLayout quickActions={QUICK_ACTIONS} />;
}
