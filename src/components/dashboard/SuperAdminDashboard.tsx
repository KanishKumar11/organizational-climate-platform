'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface SearchResult {
  surveys: any[];
  users: any[];
  companies: any[];
  departments: any[];
  total: number;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
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

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults(null);
    }
  }, [searchQuery]);

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

  const performSearch = async () => {
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
  };

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
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Global system overview and management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search surveys, users, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create New Survey
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border p-4 shadow-sm"
        >
          <h3 className="font-semibold mb-3">
            Search Results ({searchResults.total})
          </h3>
          <div className="space-y-3">
            {searchResults.surveys?.map((survey) => (
              <div
                key={survey._id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-medium">{survey.title}</p>
                    <p className="text-sm text-gray-500">
                      {survey.company_id?.name} • {survey.type}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={survey.status === 'active' ? 'default' : 'secondary'}
                >
                  {survey.status}
                </Badge>
              </div>
            ))}
            {searchResults.companies?.map((company) => (
              <div
                key={company._id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="font-medium">{company.name}</p>
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
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">{user.name}</p>
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

      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIDisplay
          title="Total Companies"
          value={dashboardData.globalKPIs.totalCompanies}
          icon={Building2}
          trend={`+${dashboardData.globalKPIs.userGrowthRate.toFixed(1)}%`}
          color="blue"
        />
        <KPIDisplay
          title="Total Users"
          value={dashboardData.globalKPIs.totalUsers}
          icon={Users}
          trend={`${dashboardData.globalKPIs.activeUsers} active`}
          color="green"
        />
        <KPIDisplay
          title="Total Surveys"
          value={dashboardData.globalKPIs.totalSurveys}
          icon={FileText}
          trend={`${dashboardData.globalKPIs.activeSurveys} active`}
          color="purple"
        />
        <KPIDisplay
          title="Completion Rate"
          value={dashboardData.globalKPIs.surveyCompletionRate}
          suffix="%"
          icon={TrendingUp}
          trend="Across all surveys"
          color="orange"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="surveys">Ongoing Surveys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-gray-500">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                          {activity.company && (
                            <Badge variant="outline" className="text-xs">
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Company
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Global Survey
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate System Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage System Users
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
            <CardContent>
              <div className="space-y-4">
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

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status</span>
                    <Badge variant="default" className="bg-green-500">
                      {dashboardData.systemHealth.database_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Connections</span>
                    <span className="font-semibold">
                      {dashboardData.systemHealth.active_connections}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time</span>
                    <span
                      className={`font-semibold ${getHealthColor(dashboardData.systemHealth.api_response_time, 'response_time')}`}
                    >
                      {dashboardData.systemHealth.api_response_time.toFixed(0)}
                      ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CPU Usage</span>
                    <span
                      className={`font-semibold ${getHealthColor(dashboardData.systemHealth.cpu_usage, 'cpu')}`}
                    >
                      {dashboardData.systemHealth.cpu_usage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory Usage</span>
                    <span
                      className={`font-semibold ${getHealthColor(dashboardData.systemHealth.memory_usage, 'memory')}`}
                    >
                      {dashboardData.systemHealth.memory_usage.toFixed(1)}%
                    </span>
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
            <CardContent>
              <div className="space-y-4">
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
