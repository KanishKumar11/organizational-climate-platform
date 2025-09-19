'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import LiveWordCloud from './LiveWordCloud';
import SentimentVisualization from './SentimentVisualization';
import LiveParticipationTracker from './LiveParticipationTracker';
import LiveResponseChart from './LiveResponseChart';
import {
  Activity,
  Users,
  MessageSquare,
  BarChart3,
  Pause,
  Play,
  Clock,
  Square,
  RefreshCw,
  Download,
  Share2,
  AlertCircle,
} from 'lucide-react';

interface LiveMicroclimateDashboardProps {
  microclimateId: string;
  initialData?: any;
}

interface MicroclimateData {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'completed';
  response_count: number;
  target_participant_count: number;
  participation_rate: number;
  time_remaining?: number;
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
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  questions?: Array<{
    question: string;
    responses: Array<{
      option: string;
      count: number;
      percentage: number;
    }>;
    total_responses: number;
  }>;
}

export default function LiveMicroclimateDashboard({
  microclimateId,
  initialData,
}: LiveMicroclimateDashboardProps) {
  const [microclimateData, setMicroclimateData] =
    useState<MicroclimateData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const {
    connected,
    lastUpdate,
    lastInsight,
    participationData,
    error: wsError,
  } = useWebSocket({
    microclimateId,
    autoConnect: true,
  });

  // Fetch initial data
  useEffect(() => {
    if (!initialData) {
      fetchMicroclimateData();
    }
  }, [microclimateId, initialData]);

  // Handle WebSocket updates
  useEffect(() => {
    if (lastUpdate && lastUpdate.microclimate_id === microclimateId) {
      setMicroclimateData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          response_count: lastUpdate.response_count,
          participation_rate: lastUpdate.participation_rate,
          live_results: {
            ...prev.live_results,
            ...lastUpdate.live_results,
            sentiment_distribution: lastUpdate.live_results
              .sentiment_distribution ||
              prev.live_results.sentiment_distribution || {
                positive: 33,
                neutral: 34,
                negative: 33,
              },
          },
          ai_insights: lastUpdate.ai_insights,
        };
      });
      setLastUpdateTime(new Date());
    }
  }, [lastUpdate, microclimateId]);

  // Handle participation updates
  useEffect(() => {
    if (participationData) {
      setMicroclimateData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          response_count: participationData.response_count,
          participation_rate: participationData.participation_rate,
          target_participant_count: participationData.target_participant_count,
        };
      });
      setLastUpdateTime(new Date());
    }
  }, [participationData]);

  // Handle new insights
  useEffect(() => {
    if (lastInsight) {
      setMicroclimateData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ai_insights: [lastInsight, ...prev.ai_insights.slice(0, 4)], // Keep latest 5 insights
        };
      });
    }
  }, [lastInsight]);

  const fetchMicroclimateData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/microclimates/${microclimateId}/live-updates`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch microclimate data');
      }

      const data = await response.json();
      setMicroclimateData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseMicroclimate = async () => {
    try {
      const response = await fetch(`/api/microclimates/${microclimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paused' }),
      });

      if (response.ok) {
        setMicroclimateData((prev) =>
          prev ? { ...prev, status: 'paused' } : null
        );
      }
    } catch (error) {
      console.error('Error pausing microclimate:', error);
    }
  };

  const handleResumeMicroclimate = async () => {
    try {
      const response = await fetch(`/api/microclimates/${microclimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });

      if (response.ok) {
        setMicroclimateData((prev) =>
          prev ? { ...prev, status: 'active' } : null
        );
      }
    } catch (error) {
      console.error('Error resuming microclimate:', error);
    }
  };

  const handleEndMicroclimate = async () => {
    if (
      !confirm(
        'Are you sure you want to end this microclimate? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/microclimates/${microclimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (response.ok) {
        setMicroclimateData((prev) =>
          prev ? { ...prev, status: 'completed' } : null
        );
      }
    } catch (error) {
      console.error('Error ending microclimate:', error);
    }
  };

  const handleExportData = async () => {
    if (!microclimateData) return;

    try {
      const response = await fetch(
        `/api/microclimates/${microclimateId}/export`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `microclimate-${microclimateData.title}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export data. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleShareMicroclimate = async () => {
    if (!microclimateData) return;

    try {
      // Generate shareable link
      const shareUrl = `${window.location.origin}/microclimates/${microclimateId}/results`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Shareable link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing microclimate:', error);
      // Fallback for browsers that don't support clipboard API
      const shareUrl = `${window.location.origin}/microclimates/${microclimateId}/results`;
      prompt('Copy this link to share:', shareUrl);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !microclimateData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error Loading Microclimate
        </h3>
        <p className="text-gray-600 mb-4">
          {error || 'Microclimate not found'}
        </p>
        <Button onClick={fetchMicroclimateData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-8 border border-green-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {microclimateData.title}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <Badge
                    className={`${getStatusColor(microclimateData.status)} px-3 py-1`}
                  >
                    {microclimateData.status.charAt(0).toUpperCase() +
                      microclimateData.status.slice(1)}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    <span className="font-medium">
                      {connected ? 'Live Updates Active' : 'Connection Lost'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {microclimateData.status === 'active' && (
              <Button
                onClick={handlePauseMicroclimate}
                variant="outline"
                className="bg-white border-gray-200 hover:bg-gray-50 h-10 px-4"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}

            {microclimateData.status === 'paused' && (
              <Button
                onClick={handleResumeMicroclimate}
                variant="outline"
                className="bg-white border-gray-200 hover:bg-gray-50 h-10 px-4"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}

            {(microclimateData.status === 'active' ||
              microclimateData.status === 'paused') && (
              <Button
                onClick={handleEndMicroclimate}
                variant="outline"
                className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-10 px-4"
              >
                <Square className="w-4 h-4 mr-2" />
                End
              </Button>
            )}

            <Button
              variant="outline"
              className="bg-white border-gray-200 hover:bg-gray-50 h-10 px-4"
              onClick={handleExportData}
              title="Export microclimate data"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button
              variant="outline"
              className="bg-white border-gray-200 hover:bg-gray-50 h-10 px-4"
              onClick={handleShareMicroclimate}
              title="Share microclimate results"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Status Warning */}
      {(wsError || !connected) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              {wsError || 'Connection lost. Data may not be real-time.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Participation & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Participation Tracker */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                Live Participation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LiveParticipationTracker
                data={{
                  response_count: microclimateData.response_count,
                  target_participant_count:
                    microclimateData.target_participant_count,
                  participation_rate: microclimateData.participation_rate,
                  time_remaining: microclimateData.time_remaining,
                  engagement_level:
                    microclimateData.live_results.engagement_level,
                }}
              />
            </CardContent>
          </Card>

          {/* Response Charts */}
          {microclimateData.questions &&
            microclimateData.questions.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    Live Response Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LiveResponseChart data={microclimateData.questions} />
                </CardContent>
              </Card>
            )}
        </div>

        {/* Right Column - Word Cloud & Sentiment */}
        <div className="space-y-6">
          {/* Word Cloud */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                Live Word Cloud
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LiveWordCloud
                data={microclimateData.live_results.word_cloud_data}
              />
            </CardContent>
          </Card>

          {/* Sentiment Analysis */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="w-5 h-5 text-orange-600" />
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

          {/* AI Insights */}
          {microclimateData.ai_insights.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-violet-600" />
                  </div>
                  Live AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {microclimateData.ai_insights
                    .slice(0, 3)
                    .map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-lg border-l-4 ${getInsightPriorityColor(
                          insight.priority
                        )}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {insight.confidence * 100}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">
                          {insight.message}
                        </p>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
