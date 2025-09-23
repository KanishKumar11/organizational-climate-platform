'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ActionPlanDashboard } from '@/components/action-plans/ActionPlanDashboard';
import { ActionPlanNavbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ActionPlansPage() {
  const router = useRouter();
  const { user, canCreateActionPlans } = useAuth();

  // Redirect if user doesn't have permission
  if (!canCreateActionPlans) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            You don't have permission to access action plans. Contact your
            administrator if you need access to create and manage action plans.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
            {user?.role === 'employee' && (
              <Button asChild>
                <Link href="/surveys/my">View My Surveys</Link>
              </Button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col min-w-0">
        {/* Header with navigation */}
        <div className="mb-6 flex-shrink-0">
          <ActionPlanNavbar
            title="Action Plans"
            onCreateActionPlan={() => {
              router.push('/action-plans/create');
            }}
          />
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Active Plans
                </p>
                <p className="text-3xl font-bold text-gray-900 leading-none">
                  12
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs">
                +2 this week
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Overdue
                </p>
                <p className="text-3xl font-bold text-red-600 leading-none">
                  3
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-3">
              <Badge variant="destructive" className="text-xs">
                Needs attention
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Team Members
                </p>
                <p className="text-3xl font-bold text-gray-900 leading-none">
                  28
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                Across 5 departments
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Completion Rate
                </p>
                <p className="text-3xl font-bold text-green-600 leading-none">
                  78%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs">
                +5% vs last month
              </Badge>
            </div>
          </Card>
        </div>

        {/* Main Dashboard */}
        <div className="flex-1 overflow-hidden min-w-0">
          <ActionPlanDashboard
            companyId={user?.companyId}
            departmentId={user?.departmentId}
            canCreate={canCreateActionPlans}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
