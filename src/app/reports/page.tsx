'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportsDashboard from '@/components/reports/ReportsDashboard';

export default function ReportsPage() {
  const { user, canViewCompanyAnalytics } = useAuth();

  // Redirect if user doesn't have permission
  if (!user || !canViewCompanyAnalytics) {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <ReportsDashboard />
    </DashboardLayout>
  );
}
