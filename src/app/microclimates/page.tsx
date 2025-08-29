import { Metadata } from 'next';
import MicroclimateDashboard from '@/components/microclimate/MicroclimateDashboard';

export const metadata: Metadata = {
  title: 'Microclimates | Organizational Climate Platform',
  description: 'Manage real-time feedback sessions and microclimates',
};

export default function MicroclimatePage() {
  return <MicroclimateDashboard />;
}
