import { Plus, FileText, Landmark, MapPinned } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

/**
 * OperatorDashboard — the Operator's home. Real dashboard as of Phase 5.
 */
const QUICK_ACTIONS = [
  {
    label: 'New Antiquity Record',
    description: 'Movable objects — sculpture, coin, manuscript',
    icon: Plus,
    iconColor: 'brand',
    to: '/records/antiquities/new',
  },
  {
    label: 'New Built Heritage Record',
    description: 'Immovable structures — temple, fort, stepwell',
    icon: Landmark,
    iconColor: 'accent',
    phase: 'Day 4',
  },
  {
    label: 'New Archaeological Site',
    description: 'Excavation sites and heritage landscapes',
    icon: MapPinned,
    iconColor: 'info',
    phase: 'Day 4',
  },
  {
    label: 'My Recent Records',
    description: 'View, edit, and forward your drafts',
    icon: FileText,
    iconColor: 'success',
    to: '/records/antiquities',
  },
];

export default function OperatorDashboard() {
  return <DashboardLayout quickActions={QUICK_ACTIONS} />;
}
