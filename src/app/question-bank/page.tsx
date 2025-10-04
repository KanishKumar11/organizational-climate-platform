'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import QuestionBankManager from '@/components/question-bank/QuestionBankManager';
import QuestionRecommendations from '@/components/question-bank/QuestionRecommendations';
import QuestionAnalytics from '@/components/question-bank/QuestionAnalytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import {
  Database,
  Sparkles,
  BarChart3,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

type ActiveTab = 'manager' | 'recommendations' | 'analytics';

/**
 * Question Bank Production Page
 *
 * Centralized repository for survey questions with:
 * - Question management (CRUD operations)
 * - AI-powered recommendations
 * - Question effectiveness analytics
 * - Usage tracking and optimization
 *
 * Access: Super Admin, Company Admin only
 */
export default function QuestionBankPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('manager');

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Authentication check
  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  // Authorization check - Only Super Admin and Company Admin
  const canManageQuestions = ['super_admin', 'company_admin'].includes(
    user.role || ''
  );

  if (!canManageQuestions) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto mt-20">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Restricted
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the Question Bank.
              <br />
              Only Super Admins and Company Admins can manage questions.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              Question Bank
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Centralized repository for survey questions with AI-powered
              recommendations and analytics
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {user.role === 'super_admin' ? 'Super Admin' : 'Company Admin'}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Questions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    AI Recommendations
                  </p>
                  <p className="text-2xl font-bold text-purple-600">32</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Ready to review</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Avg Effectiveness
                  </p>
                  <p className="text-2xl font-bold text-green-600">87%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">+5% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Card>
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 p-1" aria-label="Tabs">
              <Button
                variant={activeTab === 'manager' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('manager')}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Question Manager</span>
                <span className="sm:hidden">Manager</span>
              </Button>

              <Button
                variant={activeTab === 'recommendations' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('recommendations')}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI Recommendations</span>
                <span className="sm:hidden">AI</span>
                {activeTab !== 'recommendations' && (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    32
                  </Badge>
                )}
              </Button>

              <Button
                variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('analytics')}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </Button>
            </nav>
          </div>

          {/* Tab Content */}
          <CardContent className="p-6">
            {activeTab === 'manager' && (
              <div>
                <QuestionBankManager
                  userRole={user?.role || 'employee'}
                  companyId={user?.companyId}
                />
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div>
                <QuestionRecommendations />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <QuestionAnalytics />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  AI-Powered Question Optimization
                </h3>
                <p className="text-sm text-blue-800">
                  The Question Bank uses AI to recommend questions based on your
                  survey context, track question effectiveness, and suggest
                  improvements. Review the{' '}
                  <span className="font-medium">Recommendations</span> tab to
                  see AI-generated suggestions, and check{' '}
                  <span className="font-medium">Analytics</span> to measure
                  question performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
