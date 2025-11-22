'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import { useTranslations } from '@/contexts/TranslationContext';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  MessageSquare,
  Target,
  Activity,
  Download,
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
  is_mock_data?: boolean;
}

export default function MicroclimateAnalyticsPage() {
  const t = useTranslations('microclimates');
  const common = useTranslations('common');
  const [analytics, setAnalytics] = useState<MicroclimateAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30'); // days

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/microclimates/analytics?timeframe=${timeframe}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data:', data); // Debug log
        setAnalytics(data);
      } else {
        console.error(
          'Failed to fetch analytics:',
          response.status,
          response.statusText
        );
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = () => {
    if (!analytics) {
      console.log('No analytics data to export');
      return;
    }

    // Create CSV content
    const csvContent = generateCSV(analytics, timeframe);

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `microclimate-analytics-${timeframe}days-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateCSV = (
    data: MicroclimateAnalytics,
    timeframe: string
  ): string => {
    const lines: string[] = [];

    // Header
    lines.push(t('analyticsReport'));
    lines.push(`${t('generated')}: ${new Date().toLocaleString()}`);
    lines.push(`${t('timeframe')}: ${t('last')} ${timeframe} ${t('days')}`);
    lines.push('');

    // Summary metrics
    lines.push(t('summaryMetrics'));
    lines.push(`${t('metric')},${common('value')}`);
    lines.push(`${t('totalMicroclimates')},${data.total_microclimates}`);
    lines.push(`${t('activeMicroclimates')},${data.active_microclimates}`);
    lines.push(
      `${t('completedMicroclimates')},${data.completed_microclimates}`
    );
    lines.push(`${t('totalResponses')},${data.total_responses}`);
    lines.push(
      `${t('averageParticipationRate')},${data.average_participation_rate.toFixed(2)}%`
    );
    lines.push('');

    // Top performing microclimates
    if (data.top_performing && data.top_performing.length > 0) {
      lines.push(t('topPerformingMicroclimates').toUpperCase());
      lines.push(
        `${t('rank')},${t('title')},${t('participationRate')} (%),${t('responseCount')}`
      );
      data.top_performing.forEach((microclimate, index) => {
        lines.push(
          `${index + 1},"${microclimate.title}",${microclimate.participation_rate.toFixed(2)},${microclimate.response_count}`
        );
      });
      lines.push('');
    }

    // Recent activity
    if (data.recent_activity && data.recent_activity.length > 0) {
      lines.push(t('recentActivity').toUpperCase());
      lines.push(
        `${t('title')},${common('status')},${t('createdDate')},${t('responseCount')}`
      );
      data.recent_activity.forEach((activity) => {
        const createdDate = new Date(activity.created_at).toLocaleDateString();
        lines.push(
          `"${activity.title}",${activity.status},${createdDate},${activity.response_count}`
        );
      });
      lines.push('');
    }

    // Engagement trends
    if (data.engagement_trends && data.engagement_trends.length > 0) {
      lines.push(t('engagementTrends').toUpperCase());
      lines.push(
        `${t('period')},${t('participationRate')} (%),${t('responseCount')}`
      );
      data.engagement_trends.forEach((trend) => {
        lines.push(
          `${trend.period},${trend.participation_rate.toFixed(2)},${trend.response_count}`
        );
      });
    }

    return lines.join('\n');
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
      <div className="space-y-6 min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-emerald-50/30">
        {/* Modern Clean Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {t('analyticsTitle')}
                </h1>
                <p className="text-emerald-100 text-lg">
                  {t('analyticsDescription')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="!border-none bg-white/10 backdrop-blur-sm text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="7" className="text-gray-900">
                    {t('last7Days')}
                  </option>
                  <option value="30" className="text-gray-900">
                    {t('last30Days')}
                  </option>
                  <option value="90" className="text-gray-900">
                    {t('last90Days')}
                  </option>
                  <option value="365" className="text-gray-900">
                    {t('lastYear')}
                  </option>
                </select>
                <Button
                  onClick={handleExport}
                  className="bg-white/10 !border-none text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {common('export')}
                </Button>
              </div>
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Debug Info */}
        {/* <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Debug: Loading = {loading.toString()}, Analytics ={' '}
            {analytics ? 'exists' : 'null'}
          </p>
          {analytics && (
            <p className="text-sm text-gray-700">
              Total microclimates: {analytics.total_microclimates}, Active:{' '}
              {analytics.active_microclimates}, Responses:{' '}
              {analytics.total_responses}
              {analytics.is_mock_data && ' (Mock Data)'}
            </p>
          )}
        </div> */}

        {analytics ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="!shadow-none !border-gray-200 !border bg-gray-50/30 hover:bg-emerald-50/40 transition-all duration-300 rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t('totalMicroclimates')}
                      </p>
                      <p className="!text-3xl !font-bold text-gray-900">
                        {analytics.total_microclimates}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="!shadow-none !border-gray-200 !border bg-gray-50/30 hover:bg-emerald-50/40 transition-all duration-300 rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t('activeNow')}
                      </p>
                      <p className="!text-3xl !font-bold text-emerald-600">
                        {analytics.active_microclimates}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <Activity className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="!shadow-none !border-gray-200 !border bg-gray-50/30 hover:bg-emerald-50/40 transition-all duration-300 rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t('totalResponses')}
                      </p>
                      <p className="!text-3xl !font-bold text-purple-600">
                        {analytics.total_responses}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="!shadow-none !border-gray-200 !border bg-gray-50/30 hover:bg-emerald-50/40 transition-all duration-300 rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t('avgParticipation')}
                      </p>
                      <p className="!text-3xl !font-bold text-orange-600">
                        {Math.round(analytics.average_participation_rate)}%
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Target className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Microclimates */}
              <Card className="!shadow-none !border-gray-200 !border bg-gray-50/30 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-gray-900">
                    {t('topPerformingMicroclimates')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.top_performing &&
                    analytics.top_performing.length > 0 ? (
                      analytics.top_performing.map((microclimate, index) => (
                        <div
                          key={microclimate.id}
                          className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-emerald-50/50 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                              <span className="text-sm font-semibold text-emerald-600">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {microclimate.title}
                              </p>
                              <p className="text-sm text-gray-600">
                                {microclimate.response_count} {t('responses')}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 !shadow-none !border-gray-200 !border">
                            {Math.round(microclimate.participation_rate)}%
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          {t('noPerformanceDataYet')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="!shadow-none !border-gray-200 !border bg-gray-50/30 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-gray-900">
                    {t('recentActivity')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.recent_activity &&
                    analytics.recent_activity.length > 0 ? (
                      analytics.recent_activity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-xl hover:bg-emerald-50/80 transition-all duration-200"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {activity.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(
                                activity.created_at
                              ).toLocaleDateString()}{' '}
                              • {activity.response_count} {t('responses')}
                            </p>
                          </div>
                          <Badge
                            className={`!shadow-none !border-gray-200 !border ${
                              activity.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : activity.status === 'completed'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          {t('noRecentActivityAvailable')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="!shadow-none !border-gray-200 !border bg-gradient-to-br from-gray-50/50 to-white rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-emerald-50 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('noAnalyticsDataAvailable')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('createMicroclimatesToSeeData')}
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
