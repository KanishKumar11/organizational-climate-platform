'use client';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  Target,
  Activity,
  ArrowLeft,
  Download,
  Calendar,
} from 'lucide-react';

interface MicroclimateAnalytics {
  total_microclimates: number;
  active_microclimates: number;
  completed_microclimates: number;
  total_responses: number;
  average_participation_rate: number;
  engagement_trends: {
    period: string;
    participation_rate: number;
    response_count: number;
  }[];
  top_performing: {
    id: string;
    title: string;
    participation_rate: number;
    response_count: number;
  }[];
  recent_activity: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    response_count: number;
  }[];
}

export default function MicroclimateAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<MicroclimateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/microclimates/analytics?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export analytics data');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Microclimate Analytics
              </h1>
              <p className="text-gray-600">
                Comprehensive insights into your microclimate performance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {analytics ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Microclimates
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {analytics.total_microclimates}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Now
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {analytics.active_microclimates}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Responses
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {analytics.total_responses}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Avg Participation
                      </p>
                      <p className="text-3xl font-bold text-orange-600">
                        {Math.round(analytics.average_participation_rate)}%
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Target className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Microclimates */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Microclimates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.top_performing.map((microclimate, index) => (
                      <div
                        key={microclimate.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-teal-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {microclimate.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {microclimate.response_count} responses
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(microclimate.participation_rate)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.recent_activity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 border-l-4 border-teal-500 bg-teal-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(activity.created_at).toLocaleDateString()} •{' '}
                            {activity.response_count} responses
                          </p>
                        </div>
                        <Badge
                          variant={
                            activity.status === 'active'
                              ? 'default'
                              : activity.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Analytics Data Available
            </h3>
            <p className="text-gray-600">
              Create some microclimates to see analytics data here.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
