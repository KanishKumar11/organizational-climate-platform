'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BenchmarkManager from '@/components/benchmarks/BenchmarkManager';
import BenchmarkComparison from '@/components/benchmarks/BenchmarkComparison';
import BenchmarkCreator from '@/components/benchmarks/BenchmarkCreator';
import GapAnalysisReport from '@/components/benchmarks/GapAnalysisReport';
import TrendAnalysis from '@/components/benchmarks/TrendAnalysis';
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Plus,
  ArrowRight,
  LineChart,
  PieChart,
} from 'lucide-react';

type ActiveView = 'dashboard' | 'manager' | 'comparison' | 'trends';

export default function BenchmarksPage() {
  const { user, canViewCompanyAnalytics } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if user doesn't have permission
  if (!user || !canViewCompanyAnalytics) {
    redirect('/dashboard');
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'manager':
        return <BenchmarkManager userRole={user.role} />;
      case 'comparison':
        return (
          <BenchmarkComparison onClose={() => setActiveView('dashboard')} />
        );
      case 'trends':
        return <TrendAnalysis onClose={() => setActiveView('dashboard')} />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Benchmarks & Analytics
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Compare your performance against industry standards and track
            progress over time
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={() => setActiveView('manager')}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manage Benchmarks
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Active Benchmarks
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  12
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Above Benchmark
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  8
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Improvement Areas
                </p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  4
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Overall Score
                </p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  78%
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => setActiveView('manager')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              Benchmark Management
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Create, manage, and validate benchmarks for your organization
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">12 Active</Badge>
              <Badge variant="outline">3 Pending</Badge>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => setActiveView('comparison')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              Performance Comparison
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Compare your survey results against industry benchmarks
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">8 Above</Badge>
              <Badge variant="destructive">4 Below</Badge>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => setActiveView('trends')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              Trend Analysis
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Analyze performance trends and forecast future outcomes
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Improving</Badge>
              <Badge variant="outline">6 Metrics</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Benchmark Activity</CardTitle>
        </CardHeader>
        <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
          <div className="space-y-4 pr-2">
            {[
              {
                action: 'Benchmark Created',
                description:
                  'Technology Industry Engagement 2024 benchmark added',
                time: '2 hours ago',
                type: 'create',
              },
              {
                action: 'Comparison Completed',
                description:
                  'Q4 Employee Survey compared against industry standards',
                time: '1 day ago',
                type: 'compare',
              },
              {
                action: 'Trend Analysis',
                description: 'Manager Effectiveness trend analysis generated',
                time: '2 days ago',
                type: 'analyze',
              },
              {
                action: 'Benchmark Validated',
                description:
                  'Internal Leadership benchmark validated and activated',
                time: '3 days ago',
                type: 'validate',
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
              >
                <div
                  className={`h-2 w-2 rounded-full mt-2 ${
                    activity.type === 'create'
                      ? 'bg-green-500'
                      : activity.type === 'compare'
                        ? 'bg-blue-500'
                        : activity.type === 'analyze'
                          ? 'bg-purple-500'
                          : 'bg-orange-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Benchmarks & Analytics
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Compare your performance against industry standards and track
                progress over time
              </p>
            </div>
          </div>

          {/* Tabbed Interface */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 space-x-6 flex-wrap">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="manager"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
              >
                <Target className="w-4 h-4 mr-2" />
                Manage
              </TabsTrigger>
              <TabsTrigger
                value="creator"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
              >
                <PieChart className="w-4 h-4 mr-2" />
                Comparison
              </TabsTrigger>
              <TabsTrigger
                value="gap-analysis"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Gap Analysis
              </TabsTrigger>
              <TabsTrigger
                value="trends"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
              >
                <LineChart className="w-4 h-4 mr-2" />
                Trends
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">{renderDashboard()}</TabsContent>

            <TabsContent value="manager">
              <BenchmarkManager userRole={user.role} />
            </TabsContent>

            <TabsContent value="creator">
              <BenchmarkCreator
                onBenchmarkCreated={() => {
                  setActiveTab('manager');
                }}
                onCancel={() => setActiveTab('overview')}
              />
            </TabsContent>

            <TabsContent value="comparison">
              <BenchmarkComparison onClose={() => setActiveTab('overview')} />
            </TabsContent>

            <TabsContent value="gap-analysis">
              <Card className="p-6">
                <p className="text-gray-600 mb-4">
                  Gap Analysis requires selecting a specific survey and
                  benchmark. Please go to a survey's detail page to view gap
                  analysis.
                </p>
                <Button onClick={() => setActiveTab('manager')}>
                  View Benchmarks
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <TrendAnalysis onClose={() => setActiveTab('overview')} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
