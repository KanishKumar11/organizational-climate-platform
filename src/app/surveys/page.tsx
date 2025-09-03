'use client';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SurveyManagement } from '@/components/dashboard/SurveyManagement';

export default function SurveysPage() {
  const { user } = useAuth();

  // Debug user data
  console.log('=== SURVEYS PAGE DEBUG ===');
  console.log('User object:', user);
  console.log('User role:', user?.role);
  console.log('User companyId:', user?.companyId);
  console.log('User departmentId:', user?.departmentId);
  console.log('==========================');

  return (
    <DashboardLayout>
      <SurveyManagement
        userRole={user?.role || ''}
        companyId={user?.companyId || ''}
        departmentId={user?.departmentId}
      />
    </DashboardLayout>
  );
}
