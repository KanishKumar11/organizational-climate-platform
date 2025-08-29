'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import WordCloud from '@/components/charts/WordCloud';
import SentimentVisualization from '@/components/charts/SentimentVisualization';
import ParticipationTracker from '@/components/charts/ParticipationTracker';
import RealTimeChartContainer from '@/components/charts/RealTimeChartContainer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, MessageCircle, TrendingUp } from 'lucide-react';

interface MicroclimateData {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'scheduled';
  response_count: number;
  target_participant_count: number;
  participation_rate: number;
  live_results: {
    sentiment_score: number;
    engagement_level: 'low' | 'medium' | 'high';
    top_themes: string[];
    word_cloud_data: Array<{ text: string; value: number }>;
    response_distribution: Record<string, number>;
  };
  ai_insights: Array<{
    type: 'pattern' | 'alert' | 'recommendation';
    message: string;
    confidence: number;
    timestamp: Date;
  }>;
  time_remaining?: number; // minutes
}

interface RealTimeMicroclimateVisualizationProps {
  microclimateId: string;
  initialData?: MicroclimateData;
  onDataUpdate?: (data: MicroclimateData) => void;
}

export default function RealTimeMicroclimateVisualization({
  microclimateId,
  initialData,
  onDataUpdate,
}: RealTimeMicroclimateVisualizationProps) {
  const [microclimateData, setMicroclimateData] =
    useState<MicroclimateData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const { connected, lastUpdate, lastInsight, participationData, error } =
    useWebSocket({
      microclimateId,
      autoConnect: true,
    });

  // Fetch initial data if not provided
  useEffect(() => {
    if (!initialData && microclimateId) {
      fetchMicroclimateData();
    }
  }, [microclimateId, initialData]);

  const fetchMicroclimateData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/microclimates/${microclimateId}`);
      if (response.ok) {
        const data = await response.json();
        setMicroclimateData(data);
        onDataUpdate?.(data);
      }
    } catch (error) {
      console.error('Failed to fetch microclimate data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle WebSocket updates
  useEffect(() => {
    if (lastUpdate && microclimateData) {
      const updatedData = {
        ...microclimateData,
        response_count: lastUpdate.response_count,
        participation_rate: lastUpdate.participation_rate,
        live_results: lastUpdate.live_results,
        ai_insights: lastUpdate.ai_insights,
      };
      setMicroclimateData(updatedData);
      setLastUpdateTime(new Date());
      onDataUpdate?.(updatedData);
    }
  }, [lastUpdate, microclimateData, onDataUpdate]);

  // Handle participation updates
  useEffect(() => {
    if (participationData && microclimateData) {
      const updatedData = {
        ...microclimateData,
        response_count: participationData.response_count,
        participation_rate: participationData.participation_rate,
        target_participant_count: participationData.target_participant_count,
      };
      setMicroclimateData(updatedData);
      setLastUpdateTime(new Date());
      onDataUpdate?.(updatedData);
    }
  }, [participationData, microclimateData, onDataUpdate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!microclimateData) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Unable to load microclimate data</p>
          <button
            onClick={fetchMicroclimateData}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  const sentimentData = {
    positive: Math.round(
      (microclimateData.live_results.sentiment_score + 1) * 50
    ), // Convert -1 to 1 scale to positive count
    neutral: Math.round(microclimateData.response_count * 0.3), // Approximate neutral responses
    negative: Math.round(microclimateData.response_count * 0.2), // Approximate negative responses
    total: microclimateData.response_count,
  };

  const participationTrackerData = {
    current: microclimateData.response_count,
    target: microclimateData.target_participant_count,
    rate: microclimateData.participation_rate,
    timeRemaining: microclimateData.time_remaining,
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEngagementIcon = (level: string) => {
    switch (level) {
      case 'high':
        return '🔥';
      case 'medium':
        return '⚡';
      case 'low':
        return '💤';
      default:
        return '📊';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {microclimateData.title}
          </h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdateTime.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Badge
            variant={
              microclimateData.status === 'active' ? 'default' : 'secondary'
            }
            className={
              microclimateData.status === 'active'
                ? 'bg-green-100 text-green-800'
                : ''
            }
          >
            {microclimateData.status === 'active' && (
              <Zap className="w-3 h-3 mr-1" />
            )}
            {microclimateData.status.toUpperCase()}
          </Badge>

          <Badge
            className={getEngagementColor(
              microclimateData.live_results.engagement_level
            )}
          >
            <span className="mr-1">
              {getEngagementIcon(
                microclimateData.live_results.engagement_level
              )}
            </span>
            {microclimateData.live_results.engagement_level.toUpperCase()}{' '}
            ENGAGEMENT
          </Badge>

          {connected ? (
            <Badge className="bg-green-100 text-green-800">
              <motion.div
                className="w-2 h-2 bg-green-500 rounded-full mr-2"
                animate={{
                  opacity: [1, 0.3, 1],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              CONNECTED
            </Badge>
          ) : (
            <Badge variant="secondary">OFFLINE</Badge>
          )}
        </div>
      </motion.div>

      {/* Connection Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-sm text-red-800">Connection Error: {error}</p>
        </motion.div>
      )}

      {/* Main Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participation Tracker */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RealTimeChartContainer
            title="Participation Rate"
            isRealTime={connected && microclimateData.status === 'active'}
            hasUpdate={!!participationData}
            updateType="participation"
            lastUpdateTime={lastUpdateTime}
          >
            <ParticipationTracker
              data={participationTrackerData}
              realTime={connected && microclimateData.status === 'active'}
              showTimeRemaining={!!microclimateData.time_remaining}
              showTrend={true}
            />
          </RealTimeChartContainer>
        </motion.div>

        {/* Sentiment Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RealTimeChartContainer
            title="Live Sentiment"
            isRealTime={connected && microclimateData.status === 'active'}
            hasUpdate={!!lastUpdate}
            updateType="data"
            lastUpdateTime={lastUpdateTime}
          >
            <SentimentVisualization
              data={sentimentData}
              realTime={connected && microclimateData.status === 'active'}
              showTrend={true}
            />
          </RealTimeChartContainer>
        </motion.div>
      </div>

      {/* Word Cloud */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <RealTimeChartContainer
          title="Response Themes"
          isRealTime={connected && microclimateData.status === 'active'}
          hasUpdate={!!lastUpdate?.live_results?.word_cloud_data}
          updateType="data"
          lastUpdateTime={lastUpdateTime}
        >
          <WordCloud
            data={microclimateData.live_results.word_cloud_data}
            height={400}
            realTime={connected && microclimateData.status === 'active'}
            animated={true}
            interactive={true}
            colorScheme="sentiment"
          />
        </RealTimeChartContainer>
      </motion.div>

      {/* AI Insights */}
      {microclimateData.ai_insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RealTimeChartContainer
            title="AI Insights"
            isRealTime={connected && microclimateData.status === 'active'}
            hasUpdate={!!lastInsight}
            updateType="insight"
            lastUpdateTime={lastUpdateTime}
          >
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              {lastInsight && (
                <Badge className="bg-purple-100 text-purple-800">NEW</Badge>
              )}
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {microclimateData.ai_insights
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .slice(0, 5)
                  .map((insight, index) => (
                    <motion.div
                      key={`${insight.message}-${insight.timestamp}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border-l-4 ${
                        insight.type === 'alert'
                          ? 'bg-red-50 border-red-400'
                          : insight.type === 'recommendation'
                            ? 'bg-blue-50 border-blue-400'
                            : 'bg-green-50 border-green-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge
                              variant="secondary"
                              className={
                                insight.type === 'alert'
                                  ? 'bg-red-100 text-red-800'
                                  : insight.type === 'recommendation'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                              }
                            >
                              {insight.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {Math.round(insight.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-800">
                            {insight.message}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 ml-4">
                          {new Date(insight.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </RealTimeChartContainer>
        </motion.div>
      )}

      {/* Top Themes */}
      {microclimateData.live_results.top_themes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Trending Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {microclimateData.live_results.top_themes.map(
                  (theme, index) => (
                    <motion.div
                      key={theme}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 hover:from-blue-200 hover:to-purple-200 cursor-pointer"
                      >
                        #{theme}
                      </Badge>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
