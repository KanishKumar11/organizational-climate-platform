'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LiveWordCloud from './LiveWordCloud';
import SentimentVisualization from './SentimentVisualization';
import LiveResponseChart from './LiveResponseChart';
import { MicroclimateExportButtons } from '@/components/exports/export-buttons';
import {
  Activity,
  Users,
  MessageSquare,
  BarChart3,
  Clock,
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Eye,
} from 'lucide-react';

interface MicroclimateFinalResultsProps {
  microclimateId: string;
  data: any;
}

interface MicroclimateResultsData {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'cancelled';
  response_count: number;
  target_participant_count: number;
  participation_rate: number;
  created_at: string;
  updated_at: string;
  duration_minutes: number;
  live_results: {
    word_cloud_data: Array<{ text: string; value: number }>;
    sentiment_score: number;
    sentiment_distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    engagement_level: 'low' | 'medium' | 'high';
    response_distribution: Record<string, number>;
    top_themes: string[];
  };
  ai_insights: Array<{
    type: 'pattern' | 'alert' | 'recommendation';
    message: string;
    confidence: number;
    timestamp: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  questions: Array<{
    id: string;
    question: string;
    type: string;
    options?: string[];
    responses: Array<{
      option: string;
      count: number;
      percentage: number;
    }>;
    total_responses: number;
  }>;
  responses: Array<{
    id: string;
    user_name: string;
    submitted_at: string;
    answers: any;
  }>;
  targeting: any;
  created_by: {
    name: string;
    id: string;
  };
}

export default function MicroclimateFinalResults({
  microclimateId,
  data,
}: MicroclimateFinalResultsProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Safely parse and validate the data to prevent circular references and missing properties
  const microclimateData = React.useMemo(() => {
    if (!data) return null;

    try {
      // Create a safe copy of the data with default values
      const safeData: MicroclimateResultsData = {
        id: data.id || microclimateId,
        title: data.title || 'Untitled Microclimate',
        description: data.description || '',
        status: data.status || 'completed',
        response_count: data.response_count || 0,
        target_participant_count: data.target_participant_count || 0,
        participation_rate: data.participation_rate || 0,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        duration_minutes: data.duration_minutes || 30,
        live_results: {
          word_cloud_data: data.live_results?.word_cloud_data || [],
          sentiment_score: data.live_results?.sentiment_score || 0,
          sentiment_distribution: data.live_results?.sentiment_distribution || {
            positive: 0,
            neutral: 0,
            negative: 0,
          },
          engagement_level: data.live_results?.engagement_level || 'low',
          response_distribution: data.live_results?.response_distribution || {},
          top_themes: data.live_results?.top_themes || [],
        },
        ai_insights: data.ai_insights || [],
        questions: data.questions || [],
        responses: data.responses || [],
        targeting: data.targeting || {},
        created_by: {
          name: data.created_by?.name || 'Unknown',
          id: data.created_by?.id || '',
        },
      };

      return safeData;
    } catch (error) {
      console.error('Error parsing microclimate data:', error);
      return null;
    }
  }, [data, microclimateId]);

  // Early return if data is invalid
  if (!microclimateData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Invalid Data
          </h3>
          <p className="text-gray-600">
            Unable to load microclimate results data.
          </p>
        </div>
      </div>
    );
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setIsExporting(true);
      const response = await fetch(
        `/api/microclimates/${microclimateId}/export?format=${format}&includeOpenText=true&includeTimestamps=true`
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${microclimateData.title.replace(/[^a-zA-Z0-9]/g, '_')}_results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Results exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/microclimates/${microclimateId}/results`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Results URL copied to clipboard');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to copy URL');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {microclimateData.title}
            </h1>
            <Badge className={getStatusColor(microclimateData.status)}>
              {microclimateData.status === 'completed' ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {microclimateData.status.charAt(0).toUpperCase() +
                microclimateData.status.slice(1)}
            </Badge>
          </div>
          <p className="text-gray-600 mb-2">{microclimateData.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Created: {formatDate(microclimateData.created_at)}
            </span>
            {microclimateData.status === 'completed' && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Last Updated: {formatDate(microclimateData.updated_at)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Duration: {microclimateData.duration_minutes} minutes
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <MicroclimateExportButtons
            microclimateId={microclimateId}
            microclimateTitle={microclimateData.title}
          />
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Responses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {microclimateData.response_count}
                </p>
                <p className="text-xs text-gray-500">
                  of {microclimateData.target_participant_count} targeted
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Participation Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {microclimateData.participation_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">completion rate</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Sentiment Score
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(
                    microclimateData.live_results.sentiment_score * 100
                  ).toFixed(0)}
                  %
                </p>
                <p className="text-xs text-gray-500">overall sentiment</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <p
                  className={`text-2xl font-bold ${getEngagementColor(microclimateData.live_results.engagement_level)}`}
                >
                  {microclimateData.live_results.engagement_level
                    .charAt(0)
                    .toUpperCase() +
                    microclimateData.live_results.engagement_level.slice(1)}
                </p>
                <p className="text-xs text-gray-500">engagement level</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Word Cloud */}
            {microclimateData.live_results.word_cloud_data.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                    </div>
                    Key Themes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LiveWordCloud
                    data={microclimateData.live_results.word_cloud_data}
                  />
                </CardContent>
              </Card>
            )}

            {/* Sentiment Analysis */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  Sentiment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SentimentVisualization
                  data={{
                    score: microclimateData.live_results.sentiment_score,
                    distribution:
                      microclimateData.live_results.sentiment_distribution,
                    total_responses: microclimateData.response_count,
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Response Charts */}
          {microclimateData.questions &&
            microclimateData.questions.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    Response Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LiveResponseChart data={microclimateData.questions} />
                </CardContent>
              </Card>
            )}
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Individual Responses ({microclimateData.responses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {microclimateData.responses.map((response, index) => (
                  <div key={response.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Response #{index + 1}</h4>
                      <span className="text-sm text-gray-500">
                        {formatDate(response.submitted_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Submitted by: {response.user_name}
                    </p>
                    <div className="text-sm">
                      <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded">
                        {JSON.stringify(response.answers, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                AI Insights ({microclimateData.ai_insights.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {microclimateData.ai_insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.priority === 'critical'
                        ? 'border-red-500 bg-red-50'
                        : insight.priority === 'high'
                          ? 'border-orange-500 bg-orange-50'
                          : insight.priority === 'medium'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant="outline"
                        className={`${
                          insight.type === 'alert'
                            ? 'border-red-200 text-red-700'
                            : insight.type === 'recommendation'
                              ? 'border-green-200 text-green-700'
                              : 'border-blue-200 text-blue-700'
                        }`}
                      >
                        {insight.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(insight.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">
                      {insight.message}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Confidence: {(insight.confidence * 100).toFixed(0)}%
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          insight.priority === 'critical'
                            ? 'border-red-200 text-red-700'
                            : insight.priority === 'high'
                              ? 'border-orange-200 text-orange-700'
                              : insight.priority === 'medium'
                                ? 'border-yellow-200 text-yellow-700'
                                : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        {insight.priority} priority
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Microclimate Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Created By
                  </label>
                  <p className="text-sm text-gray-900">
                    {microclimateData.created_by.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <p className="text-sm text-gray-900">
                    {microclimateData.status}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Duration
                  </label>
                  <p className="text-sm text-gray-900">
                    {microclimateData.duration_minutes} minutes
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Target Participants
                  </label>
                  <p className="text-sm text-gray-900">
                    {microclimateData.target_participant_count}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Targeting Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Department IDs
                  </label>
                  <p className="text-sm text-gray-900">
                    {microclimateData.targeting?.department_ids?.join(', ') ||
                      'All departments'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Role Filters
                  </label>
                  <p className="text-sm text-gray-900">
                    {microclimateData.targeting?.role_filters?.join(', ') ||
                      'All roles'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Include Managers
                  </label>
                  <p className="text-sm text-gray-900">
                    {microclimateData.targeting?.include_managers
                      ? 'Yes'
                      : 'No'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
