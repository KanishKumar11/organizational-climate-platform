'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportsDashboard from '@/components/reports/ReportsDashboard';
import ReportBuilder from '@/components/reports/ReportBuilder';
import CustomTemplateCreator from '@/components/reports/CustomTemplateCreator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { user, canViewCompanyAnalytics } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showBuilder, setShowBuilder] = useState(false);

  // Redirect if user doesn't have permission
  if (!user || !canViewCompanyAnalytics) {
    redirect('/dashboard');
  }

  const handleGenerateReport = async (reportData: unknown) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Report generated successfully!');
        setShowBuilder(false);
        setActiveTab('dashboard');
        // Optionally navigate to the generated report
        if (data.report_id) {
          router.push(`/reports/${data.report_id}`);
        }
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error generating report');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20 min-h-screen">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-4 sm:p-6 lg:p-8 xl:p-12">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 lg:gap-8">
              <div className="space-y-4 sm:space-y-6 w-full lg:w-auto">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl ring-2 ring-white/20">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 font-montserrat">
                      Reports & Analytics
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 font-montserrat">
                      Generate, manage, and share comprehensive reports
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col lg:flex-col gap-5 lg:max-w-md w-full">
                <Button
                  onClick={() => {
                    setShowBuilder(true);
                    setActiveTab('builder');
                  }}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 font-montserrat"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto gap-0">
              <TabsTrigger
                value="dashboard"
                className="group relative flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50/50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400" />
                <div className="text-center">
                  <div className="font-semibold text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-300 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400">
                    My Reports
                  </div>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="builder"
                className="group relative flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-50/50 dark:data-[state=active]:bg-indigo-900/20 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all duration-200 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 dark:text-indigo-400 group-data-[state=active]:text-indigo-600 dark:group-data-[state=active]:text-indigo-400" />
                <div className="text-center">
                  <div className="font-semibold text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-300 group-data-[state=active]:text-indigo-600 dark:group-data-[state=active]:text-indigo-400">
                    Report Builder
                  </div>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="templates"
                className="group relative flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-purple-50/50 dark:data-[state=active]:bg-purple-900/20 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 transition-all duration-200 hover:bg-purple-50/30 dark:hover:bg-purple-900/10"
              >
                <LayoutTemplate className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 dark:text-purple-400 group-data-[state=active]:text-purple-600 dark:group-data-[state=active]:text-purple-400" />
                <div className="text-center">
                  <div className="font-semibold text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-300 group-data-[state=active]:text-purple-600 dark:group-data-[state=active]:text-purple-400">
                    Templates
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3 lg:pt-4">
            <TabsContent
              value="dashboard"
              className="space-y-4 sm:space-y-6 mt-0"
            >
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl">
                <ReportsDashboard />
              </div>
            </TabsContent>

            <TabsContent
              value="builder"
              className="space-y-4 sm:space-y-6 mt-0"
            >
              {showBuilder ? (
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl">
                  <ReportBuilder
                    onGenerate={handleGenerateReport}
                    onCancel={() => {
                      setShowBuilder(false);
                      setActiveTab('dashboard');
                    }}
                  />
                </div>
              ) : (
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-8 lg:p-12 text-center">
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl sm:rounded-3xl w-fit mx-auto mb-6">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 font-montserrat">
                    Build Your Custom Report
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto font-montserrat text-base sm:text-lg">
                    Use our advanced report builder to create customized reports
                    with filters, charts, and AI-powered insights.
                  </p>
                  <Button
                    onClick={() => setShowBuilder(true)}
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 py-3 rounded-xl transition-all duration-200 font-montserrat"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Start Building
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="templates"
              className="space-y-4 sm:space-y-6 mt-0"
            >
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl">
                <CustomTemplateCreator
                  onSave={(template) => {
                    toast.success(
                      `Template "${template.name}" saved successfully`
                    );
                    setActiveTab('dashboard');
                  }}
                  onCancel={() => {
                    setActiveTab('dashboard');
                  }}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
