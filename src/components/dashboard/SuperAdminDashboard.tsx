/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  EnhancedTabs as Tabs,
  EnhancedTabsContent as TabsContent,
  EnhancedTabsList as TabsList,
  EnhancedTabsTrigger as TabsTrigger,
} from '@/components/ui/enhanced-tabs';
import AnimatedCounter from '@/components/charts/AnimatedCounter';

import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  Search,
  Plus,
  Activity,
  Database,
  Cpu,
  HardDrive,
  Zap,
  Eye,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { KPIDisplay } from '@/components/charts/KPIDisplay';

interface GlobalKPIs {
  totalCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  userGrowthRate: number;
  surveyCompletionRate: number;
}

interface CompanyMetric {
  _id: string;
  name: string;
  user_count: number;
  survey_count: number;
  active_surveys: number;
  created_at: string;
}

interface SystemHealth {
  database_status: string;
  api_response_time: number;
  active_connections: number;
  memory_usage: number;
  cpu_usage: number;
}

interface OngoingSurvey {
  _id: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string;
  response_count: number;
  target_responses: number;
  company_id: { name: string };
  created_by: { name: string };
}

interface RecentActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  company: string;
}

interface Company {
  _id: string;
  name: string;
  industry: string;
  employee_count: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  company_id?: { name: string };
}

interface Survey {
  _id: string;
  title: string;
  status: string;
  company_id?: { name: string };
  type?: string;
}

interface Department {
  _id: string;
  name: string;
}

interface SearchResult {
  surveys: Survey[];
  users: User[];
  companies: Company[];
  departments: Department[];
  total: number;
}

export default function SuperAdminDashboard() {
  useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<{
    globalKPIs: GlobalKPIs;
    companyMetrics: CompanyMetric[];
    systemHealth: SystemHealth;
    ongoingSurveys: OngoingSurvey[];
    recentActivity: RecentActivity[];
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/super-admin');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/dashboard/search?q=${encodeURIComponent(searchQuery)}&type=all`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'survey_created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'user_registered':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'company_created':
        return <Building2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (value: number, type: string) => {
    if (type === 'response_time') {
      return value < 100
        ? 'text-green-500'
        : value < 200
          ? 'text-yellow-500'
          : 'text-red-500';
    }
    return value < 70
      ? 'text-green-500'
      : value < 85
        ? 'text-yellow-500'
        : 'text-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load dashboard
        </h3>
        <p className="text-gray-600 mb-4">Unable to fetch dashboard data</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Database className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Super Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Global system overview and management
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>
                  {dashboardData?.globalKPIs.totalCompanies || 0} Companies
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{dashboardData?.globalKPIs.totalUsers || 0} Users</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>
                  {dashboardData?.globalKPIs.activeSurveys || 0} Active Surveys
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search surveys, users, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 w-full sm:w-80 text-base border-gray-200 focus:border-purple-500 focus:ring-purple-500 bg-white"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700 h-12 px-4 sm:px-6 w-full md:w-auto"
              onClick={() => router.push('/surveys/create')}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Survey
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Search Results */}
      {searchResults && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-0 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results ({searchResults.total})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchResults(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto dashboard-scroll">
            {searchResults.surveys?.map((survey) => (
              <div
                key={survey._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{survey.title}</p>
                    <p className="text-sm text-gray-500">
                      {survey.company_id?.name} • {survey.type}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={survey.status === 'active' ? 'default' : 'secondary'}
                  className={
                    survey.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : ''
                  }
                >
                  {survey.status}
                </Badge>
              </div>
            ))}
            {searchResults.companies?.map((company) => (
              <div
                key={company._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{company.name}</p>
                    <p className="text-sm text-gray-500">
                      {company.industry} • {company.employee_count} employees
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {searchResults.users?.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">
                      {user.company_id?.name} • {user.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Enhanced Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total Companies
                </p>
                <p className="text-4xl font-bold text-blue-900">
                  <AnimatedCounter
                    value={dashboardData.globalKPIs.totalCompanies}
                  />
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  +{dashboardData.globalKPIs.userGrowthRate.toFixed(1)}% growth
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Building2 className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Total Users
                </p>
                <p className="text-4xl font-bold text-green-900">
                  <AnimatedCounter
                    value={dashboardData.globalKPIs.totalUsers}
                  />
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {dashboardData.globalKPIs.activeUsers} active users
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Users className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Total Surveys
                </p>
                <p className="text-4xl font-bold text-purple-900">
                  <AnimatedCounter
                    value={dashboardData.globalKPIs.totalSurveys}
                  />
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {dashboardData.globalKPIs.activeSurveys} currently active
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <FileText className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">
                  Completion Rate
                </p>
                <p className="text-4xl font-bold text-orange-900">
                  <AnimatedCounter
                    value={dashboardData.globalKPIs.surveyCompletionRate}
                  />
                  %
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Across all surveys
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList>
          <TabsTrigger
            value="overview"
            icon={<Activity className="h-5 w-5" />}
            description="System status"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="companies"
            icon={<Building2 className="h-5 w-5" />}
            description={`${dashboardData?.companyMetrics?.length || 0} organizations`}
          >
            Companies
          </TabsTrigger>
          <TabsTrigger
            value="system"
            icon={<Cpu className="h-5 w-5" />}
            description="Performance metrics"
          >
            System Health
          </TabsTrigger>
          <TabsTrigger
            value="surveys"
            icon={<FileText className="h-5 w-5" />}
            description={`${dashboardData?.ongoingSurveys?.length || 0} running`}
          >
            Active Surveys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Recent Activity */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
                <div className="space-y-4 pr-2">
                  {dashboardData.recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs sm:text-sm text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                          {activity.company && (
                            <Badge
                              variant="outline"
                              className="text-xs sm:text-sm bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {activity.company}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Plus className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Add New Company</div>
                      <div className="text-sm text-gray-500">
                        Onboard organization
                      </div>
                    </div>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Create Global Survey</div>
                      <div className="text-sm text-gray-500">
                        System-wide survey
                      </div>
                    </div>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Generate System Report</div>
                      <div className="text-sm text-gray-500">
                        Analytics export
                      </div>
                    </div>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Manage System Users</div>
                      <div className="text-sm text-gray-500">
                        User administration
                      </div>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Performance</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.companyMetrics.map((company, index) => (
                  <motion.div
                    key={company._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{company.name}</h4>
                        <p className="text-sm text-gray-500">
                          Added{' '}
                          {new Date(company.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{company.user_count}</p>
                        <p className="text-gray-500">Users</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{company.survey_count}</p>
                        <p className="text-gray-500">Surveys</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">
                          {company.active_surveys}
                        </p>
                        <p className="text-gray-500">Active</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-200 rounded-lg">
                    <Database className="h-5 w-5 text-green-700" />
                  </div>
                  Database Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">
                    Status
                  </span>
                  <Badge className="bg-green-600 text-white">
                    {dashboardData.systemHealth.database_status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">
                    Active Connections
                  </span>
                  <span className="text-lg font-bold text-green-900">
                    {dashboardData.systemHealth.active_connections}
                  </span>
                </div>
                <div className="pt-2 border-t border-green-200">
                  <div className="text-xs text-green-600">
                    All systems operational
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-700" />
                  </div>
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">
                    API Response
                  </span>
                  <span
                    className={`text-lg font-bold ${getHealthColor(dashboardData.systemHealth.api_response_time, 'response_time')}`}
                  >
                    {dashboardData.systemHealth.api_response_time.toFixed(0)}ms
                  </span>
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <div className="text-xs text-blue-600">
                    {dashboardData.systemHealth.api_response_time < 100
                      ? 'Excellent'
                      : dashboardData.systemHealth.api_response_time < 200
                        ? 'Good'
                        : 'Needs attention'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-purple-200 rounded-lg">
                    <Cpu className="h-5 w-5 text-purple-700" />
                  </div>
                  System Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-700">
                      CPU Usage
                    </span>
                    <span
                      className={`text-lg font-bold ${getHealthColor(dashboardData.systemHealth.cpu_usage, 'cpu')}`}
                    >
                      {dashboardData.systemHealth.cpu_usage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-700">
                      Memory Usage
                    </span>
                    <span
                      className={`text-lg font-bold ${getHealthColor(dashboardData.systemHealth.memory_usage, 'memory')}`}
                    >
                      {dashboardData.systemHealth.memory_usage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-purple-200">
                  <div className="text-xs text-purple-600">
                    System running smoothly
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Ongoing Surveys</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.ongoingSurveys.map((survey, index) => (
                  <motion.div
                    key={survey._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{survey.title}</h4>
                        <p className="text-sm text-gray-500">
                          {survey.company_id.name} • {survey.type}
                        </p>
                        <p className="text-xs text-gray-400">
                          Created by {survey.created_by.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">
                          {survey.response_count || 0}
                        </p>
                        <p className="text-gray-500">Responses</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">
                          {new Date(survey.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500">Ends</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
