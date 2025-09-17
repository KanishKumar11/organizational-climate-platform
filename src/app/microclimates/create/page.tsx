'use client';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MicroclimateBuilder from '@/components/microclimate/MicroclimateBuilder';
import { Loading } from '@/components/ui/Loading';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function CreateMicroclimatePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              Please log in to create microclimates.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Check if user has permission to create microclimates
  const canCreateMicroclimates = [
    'super_admin',
    'company_admin',
    'leader',
  ].includes(user.role);

  if (!canCreateMicroclimates) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Insufficient Permissions
            </h3>
            <p className="text-gray-600">
              You don't have permission to create microclimates. Contact your
              administrator for access.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<Loading size="lg" />}>
        <MicroclimateBuilder />
      </Suspense>
    </DashboardLayout>
  );
}
