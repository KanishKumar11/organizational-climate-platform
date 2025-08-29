'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, TrendingUp, Activity } from 'lucide-react';

interface RealTimeTrackerProps {
  surveyId: string;
  refreshInterval?: number; // in milliseconds
}

interface RealTimeStats {
  total_responses: number;
  completed_responses: number;
  in_progress_responses: number;
  completion_rate: number;
  response_rate: number | null;
  target_audience: number | null;
  recent_responses: RecentResponse[];
  hourly_stats: HourlyStats[];
  last_updated: string;
}

interface RecentResponse {
  id: string;
  completed_at: string;
  department?: string;
  is_anonymous: boolean;
}

interface HourlyStats {
  hour: string;
  responses: number;
}

export default function RealTimeTracker({
  surveyId,
  refreshInterval = 30000, // 30 seconds default
}: RealTimeTrackerProps) {
  const [stats, setStats] = useState<RealTimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [surveyId, refreshInterval]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/real-time-stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch real-time stats');
      }

      const data = await response.json();
      setStats(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading && !stats) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error && !stats) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading real-time stats: {error}</p>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header with last update */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          Real-Time Response Tracking
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Responses</p>
              <motion.p
                key={stats.total_responses}
                initial={{ scale: 1.2, color: '#3B82F6' }}
                animate={{ scale: 1, color: '#111827' }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-bold"
              >
                {stats.total_responses}
              </motion.p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <motion.p
                key={stats.completed_responses}
                initial={{ scale: 1.2, color: '#10B981' }}
                animate={{ scale: 1, color: '#111827' }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-bold"
              >
                {stats.completed_responses}
              </motion.p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <motion.p
                key={stats.in_progress_responses}
                initial={{ scale: 1.2, color: '#F59E0B' }}
                animate={{ scale: 1, color: '#111827' }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-bold"
              >
                {stats.in_progress_responses}
              </motion.p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <motion.p
                key={stats.completion_rate}
                initial={{ scale: 1.2, color: '#8B5CF6' }}
                animate={{ scale: 1, color: '#111827' }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-bold"
              >
                {stats.completion_rate.toFixed(1)}%
              </motion.p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Progress Bar */}
      {stats.target_audience && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Response Progress</h3>
              <Badge variant="outline">
                {stats.total_responses} / {stats.target_audience} responses
              </Badge>
            </div>
            <Progress
              value={(stats.total_responses / stats.target_audience) * 100}
              className="h-3"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>0%</span>
              <span>
                {(
                  (stats.total_responses / stats.target_audience) *
                  100
                ).toFixed(1)}
                %
              </span>
              <span>100%</span>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recent Responses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Responses</h3>
          {stats.recent_responses.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_responses.map((response, index) => (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      {response.is_anonymous ? 'Anonymous User' : 'User'}
                    </span>
                    {response.department && (
                      <Badge variant="outline" className="text-xs">
                        {response.department}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatTimeAgo(response.completed_at)}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No recent responses</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Hourly Response Chart */}
      {stats.hourly_stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Response Activity (Last 24 Hours)
            </h3>
            <div className="flex items-end justify-between h-32 gap-1">
              {stats.hourly_stats.map((stat, index) => (
                <motion.div
                  key={stat.hour}
                  initial={{ height: 0 }}
                  animate={{
                    height: `${(stat.responses / Math.max(...stats.hourly_stats.map((s) => s.responses))) * 100}%`,
                  }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="bg-blue-500 rounded-t flex-1 min-h-[4px] relative group"
                  title={`${stat.hour}: ${stat.responses} responses`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {stat.responses}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              {stats.hourly_stats.map(
                (stat, index) =>
                  index % 4 === 0 && <span key={stat.hour}>{stat.hour}</span>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
