'use client';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SurveyManagement } from '@/components/dashboard/SurveyManagement';

export default function SurveysPage() {
  const { user } = useAuth();

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
