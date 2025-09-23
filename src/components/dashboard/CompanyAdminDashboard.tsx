'use client';

import { useState, useEffect } from 'react';
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

import {
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  Search,
  Plus,
  Activity,
  Building2,
  Eye,
  Calendar,
  BarChart3,
  Brain,
  Target,
  Clock,
  UserCheck,
  GitBranch,
} from 'lucide-react';
import { KPIDisplay } from '@/components/charts/KPIDisplay';

interface CompanyKPIs {
  totalEmployees: number;
  activeEmployees: number;
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  completionRate: number;
  departmentCount: number;
  engagementTrend: number;
}

interface DepartmentAnalytic {
  _id: string;
  name: string;
  employee_count: number;
  active_employees: number;
  survey_count: number;
  active_surveys: number;
  engagement_score: number;
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'risk' | 'pattern';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  affected_departments: string[];
  created_at: string;
  recommendations: string[];
}

interface OngoingSurvey {
  _id: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string;
  response_count: number;
  target_responses: number;
  target_departments: string[];
  created_by: { name: string };
}

interface PastSurvey {
  _id: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string;
  response_count: number;
  target_responses: number;
  completion_rate: number;
  created_by: { name: string };
}

interface RecentActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  category: string;
}

interface DemographicVersion {
  id: string;
  version: number;
  created_at: string;
  created_by: string;
  changes: string[];
  surveys_affected: number;
}

interface Department {
  _id: string;
  name: string;
  employee_count: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department_id?: { name: string };
}

interface Survey {
  _id: string;
  title: string;
  status: string;
  type?: string;
}

interface SearchResult {
  surveys: Survey[];
  users: User[];
  departments: Department[];
  total: number;
}

export default function CompanyAdminDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<{
    companyKPIs: CompanyKPIs;
    departmentAnalytics: DepartmentAnalytic[];
    aiInsights: AIInsight[];
    ongoingSurveys: OngoingSurvey[];
    pastSurveys: PastSurvey[];
    recentActivity: RecentActivity[];
    demographicVersions: DemographicVersion[];
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
      const response = await fetch('/api/dashboard/company-admin');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Handle HTTP error responses
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        console.error('Dashboard API error:', response.status, errorData);

        // For debugging - show more specific error information
        if (response.status === 403) {
          console.error('Access denied - user may not have company_admin role');
        } else if (response.status === 404) {
          console.error('User not found in database');
        } else if (response.status === 500) {
          console.error('Server error - check database connection and models');
        }

        // Set dashboardData to null so the error UI shows
        setDashboardData(null);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setDashboardData(null);
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
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <Target className="h-5 w-5 text-blue-500" />;
      case 'risk':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pattern':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      default:
        return <Brain className="h-5 w-5 text-purple-500" />;
    }
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Company Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Organization-wide insights and management
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>
                  {dashboardData?.companyKPIs?.totalEmployees || 0} Employees
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>
                  {dashboardData?.companyKPIs?.activeSurveys || 0} Active
                  Surveys
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>
                  {dashboardData?.companyKPIs?.departmentCount || 0} Departments
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search surveys, employees, departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 w-full sm:w-80 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-4 sm:px-6 w-full md:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              Create Survey
            </Button>
          </div>
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
                    <p className="text-sm text-gray-500">{survey.type}</p>
                  </div>
                </div>
                <Badge
                  variant={survey.status === 'active' ? 'default' : 'secondary'}
                >
                  {survey.status}
                </Badge>
              </div>
            ))}
            {searchResults.departments?.map((department) => (
              <div
                key={department._id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="font-medium">{department.name}</p>
                    <p className="text-sm text-gray-500">
                      {department.employee_count} employees
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
                      {user.department_id?.name} • {user.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Enhanced Company KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total Employees
                </p>
                <p className="text-4xl font-bold text-blue-900">
                  {dashboardData.companyKPIs.totalEmployees}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {dashboardData.companyKPIs.activeEmployees} active
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Total Surveys
                </p>
                <p className="text-4xl font-bold text-green-900">
                  {dashboardData.companyKPIs.totalSurveys}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {dashboardData.companyKPIs.activeSurveys} active
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <FileText className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Completion Rate
                </p>
                <p className="text-4xl font-bold text-purple-900">
                  {dashboardData.companyKPIs.completionRate}%
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {dashboardData.companyKPIs.totalResponses} responses
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">
                  Departments
                </p>
                <p className="text-4xl font-bold text-orange-900">
                  {dashboardData.companyKPIs.departmentCount}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {dashboardData.companyKPIs.engagementTrend > 0 ? '+' : ''}
                  {dashboardData.companyKPIs.engagementTrend.toFixed(1)}%
                  engagement
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Building2 className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger
            value="overview"
            icon={<BarChart3 className="h-5 w-5" />}
            description="Company overview"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="surveys"
            icon={<FileText className="h-5 w-5" />}
            description={`${(dashboardData?.ongoingSurveys?.length || 0) + (dashboardData?.pastSurveys?.length || 0)} total`}
          >
            Surveys
          </TabsTrigger>
          <TabsTrigger
            value="departments"
            icon={<Building2 className="h-5 w-5" />}
            description={`${dashboardData?.departmentAnalytics?.length || 0} departments`}
          >
            Departments
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            icon={<Brain className="h-5 w-5" />}
            description="AI recommendations"
          >
            AI Insights
          </TabsTrigger>
          <TabsTrigger
            value="demographics"
            icon={<GitBranch className="h-5 w-5" />}
            description={`${dashboardData?.demographicVersions?.length || 0} versions`}
          >
            Demographics
          </TabsTrigger>
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
              <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
                <div className="space-y-4 pr-2">
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
                          <Badge variant="outline" className="text-xs">
                            {activity.category}
                          </Badge>
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
                  Create New Survey
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Manage Invitations
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Update Demographics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ongoing Surveys */}
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
                          <p className="text-sm text-gray-500">{survey.type}</p>
                          <p className="text-xs text-gray-400">
                            Created by {survey.created_by.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
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
                          View
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Past Surveys */}
            <Card>
              <CardHeader>
                <CardTitle>Past Survey Details</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
                <div className="space-y-4 pr-2">
                  {dashboardData.pastSurveys.map((survey, index) => (
                    <motion.div
                      key={survey._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{survey.title}</h4>
                          <p className="text-sm text-gray-500">{survey.type}</p>
                          <p className="text-xs text-gray-400">
                            Ended{' '}
                            {new Date(survey.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">
                            {survey.response_count || 0}
                          </p>
                          <p className="text-gray-500">Responses</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">
                            {survey.completion_rate?.toFixed(1) || 0}%
                          </p>
                          <p className="text-gray-500">Complete</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Results
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Analytics</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.departmentAnalytics.map((dept, index) => (
                  <motion.div
                    key={dept._id}
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
                        <h4 className="font-semibold">{dept.name}</h4>
                        <p className="text-sm text-gray-500">
                          {dept.active_employees} of {dept.employee_count}{' '}
                          active
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{dept.survey_count}</p>
                        <p className="text-gray-500">Surveys</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{dept.active_surveys}</p>
                        <p className="text-gray-500">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">
                          {dept.engagement_score.toFixed(1)}
                        </p>
                        <p className="text-gray-500">Engagement</p>
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

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.aiInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 border rounded-lg ${getPriorityColor(insight.priority)}`}
                  >
                    <div className="flex items-start gap-4">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {insight.priority}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {(insight.confidence * 100).toFixed(0)}%
                              confidence
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {insight.description}
                        </p>
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Affected Departments:
                          </p>
                          <div className="flex gap-1">
                            {insight.affected_departments.map((dept, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs"
                              >
                                {dept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Recommendations:
                          </p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {insight.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-gray-400">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Demographic Versioning
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.demographicVersions.map((version, index) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <GitBranch className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          Version {version.version}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Created by {version.created_by} on{' '}
                          {new Date(version.created_at).toLocaleDateString()}
                        </p>
                        <div className="mt-1">
                          {version.changes.map((change, i) => (
                            <p key={i} className="text-xs text-gray-600">
                              • {change}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">
                          {version.surveys_affected}
                        </p>
                        <p className="text-gray-500">Surveys Affected</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Changes
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
