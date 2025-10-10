'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ActionPlanDashboard } from '@/components/action-plans/ActionPlanDashboard';
import { ActionPlanKanban } from '@/components/action-plans/ActionPlanKanban';
import { ActionPlanTimeline } from '@/components/action-plans/ActionPlanTimeline';
import { BulkActionPlanCreator } from '@/components/action-plans/BulkActionPlanCreator';
import { AlertsPanel } from '@/components/action-plans/AlertsPanel';
import { CommitmentTracker } from '@/components/action-plans/CommitmentTracker';
import { ActionPlanNavbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/contexts/TranslationContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  AlertTriangle,
  Users,
  TrendingUp,
  Zap,
  Bell,
  CheckCircle,
  LayoutGrid,
  Calendar as CalendarIcon,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ActionPlansPage() {
  const router = useRouter();
  const { user, canCreateActionPlans } = useAuth();
  const t = useTranslations('actionPlans');
  const common = useTranslations('common');
  const [activeTab, setActiveTab] = useState('my-plans');
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');

  // Load surveys for bulk creation
  useEffect(() => {
    if (canCreateActionPlans) {
      fetchSurveys();
    }
  }, [canCreateActionPlans]);

  // Load AI insights when survey is selected
  useEffect(() => {
    if (selectedSurvey) {
      fetchInsights(selectedSurvey);
    }
  }, [selectedSurvey]);

  const fetchSurveys = async () => {
    try {
      const response = await fetch('/api/surveys?status=completed');
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);
        if (data.surveys?.length > 0) {
          setSelectedSurvey(data.surveys[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  };

  const fetchInsights = async (surveyId: string) => {
    setIsLoadingInsights(true);
    try {
      const response = await fetch(
        `/api/ai/analyze-responses?surveyId=${surveyId}`
      );
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      } else {
        setInsights([]);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights([]);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleBulkActionPlansCreated = (actionPlans: unknown[]) => {
    toast.success(
      t('actionPlansCreatedSuccess', { count: actionPlans.length })
    );
    setActiveTab('my-plans'); // Switch back to main dashboard
  };

  // Redirect if user doesn't have permission
  if (!canCreateActionPlans) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('accessRestricted')}
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            {t('noPermissionMessage')}
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">{t('returnToDashboard')}</Link>
            </Button>
            {user?.role === 'employee' && (
              <Button asChild>
                <Link href="/surveys/my">{t('viewMySurveys')}</Link>
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
            title={t('actionPlans')}
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
                  {t('activePlans')}
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
                {t('thisWeek', { count: 2 })}
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t('overdue')}
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
                {t('needsAttention')}
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t('teamMembers')}
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
                {t('acrossDepartments', { count: 5 })}
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t('completionRate')}
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
                {t('vsLastMonth', { percentage: 5 })}
              </Badge>
            </div>
          </Card>
        </div>

        {/* Tabbed Interface */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="flex-shrink-0 w-full justify-start border-b bg-transparent h-auto p-0 space-x-6">
            <TabsTrigger
              value="my-plans"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <Target className="w-4 h-4 mr-2" />
              {t('myPlans')}
            </TabsTrigger>
            <TabsTrigger
              value="kanban"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              {t('kanbanBoard')}
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {t('timeline')} View
            </TabsTrigger>
            <TabsTrigger
              value="bulk-create"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <Zap className="w-4 h-4 mr-2" />
              {t('bulkCreate')}
              <Badge variant="secondary" className="ml-2 text-xs">
                {t('ai')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <Bell className="w-4 h-4 mr-2" />
              {t('alertsMonitoring')}
            </TabsTrigger>
            <TabsTrigger
              value="commitments"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('commitments')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-plans" className="flex-1 overflow-auto mt-6">
            <ActionPlanDashboard
              companyId={user?.companyId}
              departmentId={user?.departmentId}
              canCreate={canCreateActionPlans}
            />
          </TabsContent>

          <TabsContent value="kanban" className="flex-1 overflow-auto mt-6">
            <ActionPlanKanban
              companyId={user?.companyId}
              departmentId={user?.departmentId}
              onActionPlanClick={(plan) =>
                router.push(`/action-plans/${plan._id}`)
              }
            />
          </TabsContent>

          <TabsContent value="timeline" className="flex-1 overflow-auto mt-6">
            <ActionPlanTimeline
              companyId={user?.companyId}
              departmentId={user?.departmentId}
              onActionPlanClick={(plan) =>
                router.push(`/action-plans/${plan._id}`)
              }
            />
          </TabsContent>

          <TabsContent
            value="bulk-create"
            className="flex-1 overflow-auto mt-6"
          >
            {insights.length > 0 ? (
              <BulkActionPlanCreator
                insights={insights}
                surveyId={selectedSurvey}
                onSuccess={handleBulkActionPlansCreated}
                onCancel={() => setActiveTab('my-plans')}
              />
            ) : (
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {t('aiPoweredBulkCreation')}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {isLoadingInsights
                      ? t('loadingAiInsights')
                      : t('noAiInsightsYet')}
                  </p>
                  {!isLoadingInsights && (
                    <div className="flex gap-3 justify-center">
                      <Button asChild variant="outline">
                        <Link href="/ai-insights">{t('viewAiInsights')}</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/surveys/create">{t('createSurvey')}</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="flex-1 overflow-auto mt-6">
            <AlertsPanel
              companyId={user?.companyId}
              departmentId={user?.departmentId}
            />
          </TabsContent>

          <TabsContent
            value="commitments"
            className="flex-1 overflow-auto mt-6"
          >
            <CommitmentTracker
              companyId={user?.companyId}
              departmentId={user?.departmentId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
