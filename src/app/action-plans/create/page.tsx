'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ActionPlanCreator } from '@/components/action-plans/ActionPlanCreator';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function CreateActionPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, canCreateActionPlans } = useAuth();

  // Get optional parameters from URL
  const surveyId = searchParams.get('survey_id');
  const insightId = searchParams.get('insight_id');

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
            You don't have permission to create action plans. Contact your
            administrator if you need access to create and manage action plans.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/action-plans">View Action Plans</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSuccess = (actionPlan: any) => {
    // Redirect to the created action plan
    router.push(`/action-plans/${actionPlan._id}`);
  };

  const handleCancel = () => {
    // Go back to action plans list
    router.push('/action-plans');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/action-plans">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Action Plans
              </Link>
            </Button>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create New Action Plan
            </h1>
            <p className="text-gray-600">
              Create a structured action plan to address organizational
              improvements and track progress towards your goals.
            </p>
          </div>
        </div>

        {/* Context Information */}
        {(surveyId || insightId) && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Creating from Survey Insight
                </h3>
                <p className="text-sm text-blue-800">
                  This action plan will be linked to survey insights and can
                  leverage AI recommendations based on the survey data.
                </p>
                {surveyId && (
                  <p className="text-xs text-blue-700 mt-1">
                    Survey ID: {surveyId}
                  </p>
                )}
                {insightId && (
                  <p className="text-xs text-blue-700 mt-1">
                    Insight ID: {insightId}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Action Plan Creator */}
        <ActionPlanCreator
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          sourceSurvey={surveyId ? { id: surveyId } : undefined}
          sourceInsight={insightId ? { id: insightId } : undefined}
        />
      </div>
    </DashboardLayout>
  );
}

export default function CreateActionPlanPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
          </div>
        </DashboardLayout>
      }
    >
      <CreateActionPlanContent />
    </Suspense>
  );
}
