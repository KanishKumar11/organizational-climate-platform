'use client';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MicroclimateDashboard from '@/components/microclimate/MicroclimateDashboard';

export default function MicroclimatePage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <MicroclimateDashboard />
    </DashboardLayout>
  );
}
