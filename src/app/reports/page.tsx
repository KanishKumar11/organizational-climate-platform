'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportsDashboard from '@/components/reports/ReportsDashboard';
import ReportBuilder from '@/components/reports/ReportBuilder';
import CustomTemplateCreator from '@/components/reports/CustomTemplateCreator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Settings, LayoutTemplate } from 'lucide-react';
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

  const handleGenerateReport = async (reportData: any) => {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate, manage, and share comprehensive reports
            </p>
          </div>
          <Button
            onClick={() => {
              setShowBuilder(true);
              setActiveTab('builder');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Report
          </Button>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 space-x-6">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <FileText className="w-4 h-4 mr-2" />
              My Reports
            </TabsTrigger>
            <TabsTrigger
              value="builder"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Report Builder
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <ReportsDashboard />
          </TabsContent>

          <TabsContent value="builder" className="mt-6">
            {showBuilder ? (
              <ReportBuilder
                onGenerate={handleGenerateReport}
                onCancel={() => {
                  setShowBuilder(false);
                  setActiveTab('dashboard');
                }}
              />
            ) : (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Build Your Custom Report
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Use our advanced report builder to create customized reports
                  with filters, charts, and AI-powered insights.
                </p>
                <Button onClick={() => setShowBuilder(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Start Building
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <CustomTemplateCreator
              onSave={(template) => {
                toast.success(`Template "${template.name}" saved successfully`);
                setActiveTab('dashboard');
              }}
              onCancel={() => {
                setActiveTab('dashboard');
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
