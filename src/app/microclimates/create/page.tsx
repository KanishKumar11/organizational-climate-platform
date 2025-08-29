import { Metadata } from 'next';
import MicroclimateCreator from '@/components/microclimate/MicroclimateCreator';

export const metadata: Metadata = {
  title: 'Create Microclimate | Organizational Climate Platform',
  description: 'Create a new real-time feedback microclimate session',
};

export default function CreateMicroclimatePage() {
  return <MicroclimateCreator />;
}
