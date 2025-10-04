'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';
import ManualReanalysis from '@/components/ai/ManualReanalysis';
import ReanalysisSettings from '@/components/ai/ReanalysisSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  AlertCircle,
  TrendingUp,
  Brain,
  Target,
  RefreshCw,
  Download,
  Share2,
  Settings,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * AI Insights Production Page
 *
 * Provides AI-powered analysis of survey responses:
 * - Sentiment analysis with visual indicators
 * - Theme detection from open-ended responses
 * - Action item recommendations
 * - Department-level breakdowns
 * - Confidence scores for insights
 *
 * Integrates with Action Plans for automated recommendations
 *
 * Access: Super Admin, Company Admin, Leaders
 */
export default function AIInsightsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoadingSurveys, setIsLoadingSurveys] = useState(true);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showManualReanalysis, setShowManualReanalysis] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load available surveys on mount
  useEffect(() => {
    if (user) {
      fetchSurveys();
    }
  }, [user]);

  // Load responses when survey is selected
  useEffect(() => {
    if (selectedSurvey) {
      fetchResponses(selectedSurvey);
    }
  }, [selectedSurvey]);

  const fetchSurveys = async () => {
    setIsLoadingSurveys(true);
    try {
      const response = await fetch('/api/surveys?status=completed');
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);

        // Auto-select first survey if available
        if (data.surveys?.length > 0) {
          setSelectedSurvey(data.surveys[0]._id);
        }
      } else {
        toast.error('Failed to load surveys');
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('Error loading surveys');
    } finally {
      setIsLoadingSurveys(false);
    }
  };

  const fetchResponses = async (surveyId: string) => {
    setIsLoadingResponses(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/responses`);
      if (response.ok) {
        const data = await response.json();
        setResponses(data.responses || []);
      } else {
        toast.error('Failed to load survey responses');
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Error loading responses');
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const handleReanalyze = async () => {
    if (!selectedSurvey) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/ai/analyze-responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: selectedSurvey,
          forceReanalysis: true,
        }),
      });

      if (response.ok) {
        toast.success('AI analysis completed successfully');
        // Reload responses to get updated insights
        await fetchResponses(selectedSurvey);
      } else {
        toast.error('Failed to reanalyze responses');
      }
    } catch (error) {
      console.error('Error reanalyzing:', error);
      toast.error('Error during AI analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportInsights = async () => {
    if (!selectedSurvey) return;

    try {
      const response = await fetch(
        `/api/ai/analyze-responses?surveyId=${selectedSurvey}&export=true`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-insights-${selectedSurvey}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Insights exported successfully');
      } else {
        toast.error('Failed to export insights');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error exporting insights');
    }
  };

  // Loading state
  if (authLoading) {
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

  // Authorization check - Super Admin, Company Admin, Leaders
  const canViewInsights = ['super_admin', 'company_admin', 'leader'].includes(
    user.role || ''
  );

  if (!canViewInsights) {
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
              You don't have permission to access AI Insights.
              <br />
              Only admins and leaders can view AI-generated insights.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const selectedSurveyData = surveys.find((s) => s._id === selectedSurvey);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              AI-Powered Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Automated analysis and recommendations from survey responses
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>AI Reanalysis Settings</DialogTitle>
                  <DialogDescription>
                    Configure automatic reanalysis triggers and notifications
                  </DialogDescription>
                </DialogHeader>
                {selectedSurvey && user?.companyId && (
                  <ReanalysisSettings
                    surveyId={selectedSurvey}
                    companyId={user.companyId}
                    onConfigUpdate={() => {
                      toast.success('Settings updated successfully');
                      setShowSettings(false);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>

            <Dialog
              open={showManualReanalysis}
              onOpenChange={setShowManualReanalysis}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!selectedSurvey}>
                  <Zap className="w-4 h-4 mr-2" />
                  Manual Reanalysis
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manual AI Reanalysis</DialogTitle>
                  <DialogDescription>
                    Trigger a custom AI analysis with specific parameters
                  </DialogDescription>
                </DialogHeader>
                {selectedSurvey && user?.companyId && (
                  <ManualReanalysis
                    surveyId={selectedSurvey}
                    companyId={user.companyId}
                    onReanalysisComplete={(result) => {
                      toast.success(
                        `Analysis complete! Found ${result.new_insights.length} new insights`
                      );
                      setShowManualReanalysis(false);
                      fetchResponses(selectedSurvey);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportInsights}
              disabled={!selectedSurvey || isLoadingResponses}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReanalyze}
              disabled={!selectedSurvey || isAnalyzing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`}
              />
              Reanalyze
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Surveys Analyzed
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {surveys.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Responses
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {responses.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Insights Generated
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {selectedSurveyData?.ai_insights?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Action Items
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {selectedSurveyData?.ai_insights?.reduce(
                      (acc: number, insight: any) =>
                        acc + (insight.recommended_actions?.length || 0),
                      0
                    ) || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Survey Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Select Survey to Analyze
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSurveys ? (
              <div className="flex items-center justify-center py-8">
                <Loading size="md" />
              </div>
            ) : surveys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No completed surveys found
                </p>
                <Button onClick={() => router.push('/surveys')}>
                  View Surveys
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Select
                  value={selectedSurvey}
                  onValueChange={setSelectedSurvey}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a survey..." />
                  </SelectTrigger>
                  <SelectContent>
                    {surveys.map((survey) => (
                      <SelectItem key={survey._id} value={survey._id}>
                        <div className="flex items-center gap-2">
                          <span>{survey.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {survey.response_count || 0} responses
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedSurveyData && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Type</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSurveyData.type || 'General'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Status
                        </p>
                        <Badge
                          variant={
                            selectedSurveyData.status === 'completed'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {selectedSurveyData.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Responses
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSurveyData.response_count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Last Analyzed
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSurveyData.last_analyzed
                            ? new Date(
                                selectedSurveyData.last_analyzed
                              ).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights Panel */}
        {selectedSurvey && (
          <>
            {isLoadingResponses ? (
              <Card>
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loading size="lg" />
                    <p className="text-gray-600 dark:text-gray-400 mt-4">
                      Loading survey responses...
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : responses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No responses found for this survey
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AIInsightsPanel
                responses={responses}
                context={{
                  department: user.departmentId || 'all',
                  role: user.role || 'employee',
                  tenure: 'N/A',
                  teamSize: responses.length,
                }}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
