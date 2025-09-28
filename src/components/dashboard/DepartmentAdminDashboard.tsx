'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
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
  CheckCircle,
  XCircle,
  PlayCircle,
} from 'lucide-react';
import { KPIDisplay } from '@/components/charts/KPIDisplay';

interface Department {
  name: string;
  description: string;
  company_name: string;
}

interface DepartmentKPIs {
  totalTeamMembers: number;
  activeTeamMembers: number;
  departmentSurveys: number;
  activeDepartmentSurveys: number;
  departmentResponses: number;
  engagement_score: number;
  participation_rate: number;
  response_time_avg: number;
  satisfaction_score: number;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  last_login: string;
  created_at: string;
}

interface DepartmentInsight {
  id: string;
  type: 'recommendation' | 'pattern';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
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

interface ActionPlan {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  due_date: string;
  assigned_to: string;
  created_at: string;
}

interface RecentActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  category: string;
}

interface SearchResult {
  surveys: any[];
  users: any[];
  total: number;
}

export default function DepartmentAdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<{
    department: Department;
    departmentKPIs: DepartmentKPIs;
    teamMembers: TeamMember[];
    departmentInsights: DepartmentInsight[];
    ongoingSurveys: OngoingSurvey[];
    pastSurveys: PastSurvey[];
    actionPlans: ActionPlan[];
    recentActivity: RecentActivity[];
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/department-admin');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults(null);
    }
  }, [searchQuery, performSearch]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'survey_assigned':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'team_member_joined':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'not_started':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8 lg:p-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {dashboardData.department.name} Dashboard
                  </h1>
                  <p className="text-lg text-gray-600">
                    {dashboardData.department.company_name} • Department
                    insights and management
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm" />
                  <span className="font-medium">
                    {dashboardData?.departmentKPIs?.totalTeamMembers || 0} Team
                    Members
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full shadow-sm" />
                  <span className="font-medium">
                    {dashboardData?.departmentKPIs?.departmentSurveys || 0}{' '}
                    Surveys
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full shadow-sm" />
                  <span className="font-medium">
                    {dashboardData?.departmentKPIs?.activeDepartmentSurveys ||
                      0}{' '}
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-400 rounded-full shadow-sm" />
                  <span className="font-medium">
                    {dashboardData?.departmentKPIs?.engagement_score || 0}/100
                    Engagement
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search team surveys, members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 w-full sm:w-80 text-base border-0 bg-white/80 backdrop-blur shadow-sm focus:shadow-md transition-shadow"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-6 w-full md:w-auto">
                <Plus className="h-5 w-5 mr-2" />
                Create Survey
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur rounded-2xl border-0 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Search Results ({searchResults.total})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchResults(null)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              ×
            </Button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto dashboard-scroll">
            {searchResults.surveys?.map((survey) => (
              <div
                key={survey._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50/50 rounded-xl border border-gray-100/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{survey.title}</p>
                    <p className="text-sm text-gray-500">{survey.type}</p>
                  </div>
                </div>
                <Badge
                  className={`${
                    survey.status === 'active'
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {survey.status}
                </Badge>
              </div>
            ))}
            {searchResults.users?.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50/50 rounded-xl border border-gray-100/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.role}</p>
                  </div>
                </div>
                <Badge
                  className={`${
                    user.role === 'department_admin'
                      ? 'bg-orange-50 text-orange-600 border-orange-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}
                >
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Department KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-white/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg w-fit">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Team Members
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.departmentKPIs.totalTeamMembers}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-blue-50 text-blue-600 border-blue-200 mb-2">
                  {dashboardData.departmentKPIs.activeTeamMembers} active
                </Badge>
                <p className="text-xs text-gray-500">Active members</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Rate</span>
                <span className="font-medium">
                  {dashboardData.departmentKPIs.totalTeamMembers > 0
                    ? Math.round(
                        (dashboardData.departmentKPIs.activeTeamMembers /
                          dashboardData.departmentKPIs.totalTeamMembers) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                  style={{
                    width: `${
                      dashboardData.departmentKPIs.totalTeamMembers > 0
                        ? Math.min(
                            (dashboardData.departmentKPIs.activeTeamMembers /
                              dashboardData.departmentKPIs.totalTeamMembers) *
                              100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg w-fit">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Department Surveys
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.departmentKPIs.departmentSurveys}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-green-50 text-green-600 border-green-200 mb-2">
                  {dashboardData.departmentKPIs.activeDepartmentSurveys} active
                </Badge>
                <p className="text-xs text-gray-500">Currently running</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Rate</span>
                <span className="font-medium">
                  {dashboardData.departmentKPIs.departmentSurveys > 0
                    ? Math.round(
                        (dashboardData.departmentKPIs.activeDepartmentSurveys /
                          dashboardData.departmentKPIs.departmentSurveys) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                  style={{
                    width: `${
                      dashboardData.departmentKPIs.departmentSurveys > 0
                        ? Math.min(
                            (dashboardData.departmentKPIs
                              .activeDepartmentSurveys /
                              dashboardData.departmentKPIs.departmentSurveys) *
                              100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg w-fit">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Engagement Score
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.departmentKPIs.engagement_score}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-purple-50 text-purple-600 border-purple-200 mb-2">
                  {dashboardData.departmentKPIs.participation_rate.toFixed(1)}%
                  participation
                </Badge>
                <p className="text-xs text-gray-500">Participation rate</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Engagement</span>
                <span className="font-medium">
                  {dashboardData.departmentKPIs.engagement_score}/100
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(dashboardData.departmentKPIs.engagement_score, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg w-fit">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Satisfaction
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.departmentKPIs.satisfaction_score}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-orange-50 text-orange-600 border-orange-200 mb-2">
                  {dashboardData.departmentKPIs.response_time_avg.toFixed(1)}{' '}
                  days avg
                </Badge>
                <p className="text-xs text-gray-500">Response time</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Satisfaction</span>
                <span className="font-medium">
                  {dashboardData.departmentKPIs.satisfaction_score}/100
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(dashboardData.departmentKPIs.satisfaction_score, 100)}%`,
                  }}
                ></div>
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
            description="Department status"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="team"
            icon={<Users className="h-5 w-5" />}
            description={`${dashboardData?.teamMembers?.length || 0} members`}
          >
            Team
          </TabsTrigger>
          <TabsTrigger
            value="surveys"
            icon={<FileText className="h-5 w-5" />}
            description={`${dashboardData?.ongoingSurveys?.length || 0} active`}
          >
            Surveys
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            icon={<Brain className="h-5 w-5" />}
            description="AI analysis"
          >
            Insights
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            icon={<Target className="h-5 w-5" />}
            description={`${dashboardData?.actionPlans?.length || 0} plans`}
          >
            Action Plans
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
                          <Badge
                            variant="outline"
                            className="text-xs sm:text-sm bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {activity.category}
                          </Badge>
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
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                  onClick={() => router.push('/surveys/create')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Plus className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">
                        Create Department Survey
                      </div>
                      <div className="text-sm text-gray-500">
                        Targeted department survey
                      </div>
                    </div>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                  onClick={() => router.push('/action-plans/create')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Create Action Plan</div>
                      <div className="text-sm text-gray-500">
                        Address survey insights
                      </div>
                    </div>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                  onClick={() => router.push('/reports')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">View Team Analytics</div>
                      <div className="text-sm text-gray-500">
                        Department performance
                      </div>
                    </div>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                  onClick={() => router.push('/users')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Manage Team Members</div>
                      <div className="text-sm text-gray-500">
                        Department personnel
                      </div>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.teamMembers.map((member, index) => (
                  <motion.div
                    key={member._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{member.name}</h4>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined{' '}
                          {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary">
                        {member.role.replace('_', ' ')}
                      </Badge>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Last Login</p>
                        <p className="font-medium">
                          {member.last_login
                            ? new Date(member.last_login).toLocaleDateString()
                            : 'Never'}
                        </p>
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

        <TabsContent value="surveys" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ongoing Surveys */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  Current Ongoing Surveys
                </CardTitle>
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
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  </div>
                  Past Survey Details
                </CardTitle>
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

        <TabsContent value="insights" className="space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Brain className="h-5 w-5 text-orange-600" />
                </div>
                Department AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.departmentInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 border rounded-lg ${getPriorityColor(insight.priority)}`}
                  >
                    <div className="flex items-start gap-4">
                      <Brain className="h-5 w-5 text-purple-500 mt-1" />
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

        <TabsContent value="actions" className="space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                Department Action Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.actionPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(plan.status)}
                        <div>
                          <h4 className="font-semibold">{plan.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {plan.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Assigned to: {plan.assigned_to}</span>
                            <span>
                              Due:{' '}
                              {new Date(plan.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{plan.progress}%</span>
                      </div>
                      <Progress value={plan.progress} className="h-2" />
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
