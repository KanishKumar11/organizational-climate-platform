/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {dashboardData.department.name} Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  {dashboardData.department.company_name} • Department insights
                  and management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>
                  {dashboardData?.departmentKPIs?.totalTeamMembers || 0} Team
                  Members
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>
                  {dashboardData?.departmentKPIs?.departmentSurveys || 0}{' '}
                  Surveys
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>
                  {dashboardData?.departmentKPIs?.activeDepartmentSurveys || 0}{' '}
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search team surveys, members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 w-80 text-base border-gray-200 focus:border-green-500 focus:ring-green-500 bg-white"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <Button className="bg-green-600 hover:bg-green-700 h-12 px-6">
              <Plus className="h-4 w-4 mr-2" />
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
            {searchResults.users?.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Department KPIs */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIDisplay
          title="Team Members"
          value={dashboardData.departmentKPIs.totalTeamMembers}
          icon={Users}
          trend={`${dashboardData.departmentKPIs.activeTeamMembers} active`}
          color="blue"
        />
        <KPIDisplay
          title="Department Surveys"
          value={dashboardData.departmentKPIs.departmentSurveys}
          icon={FileText}
          trend={`${dashboardData.departmentKPIs.activeDepartmentSurveys} active`}
          color="green"
        />
        <KPIDisplay
          title="Engagement Score"
          value={dashboardData.departmentKPIs.engagement_score}
          suffix="/100"
          icon={TrendingUp}
          trend={`${dashboardData.departmentKPIs.participation_rate.toFixed(1)}% participation`}
          color="purple"
        />
        <KPIDisplay
          title="Satisfaction"
          value={dashboardData.departmentKPIs.satisfaction_score}
          suffix="/100"
          icon={Target}
          trend={`${dashboardData.departmentKPIs.response_time_avg.toFixed(1)} days avg response`}
          color="orange"
        />
      </div> */}

      {/* Enhanced Tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <div className="border-b border-gray-200">
          <TabsList className="bg-transparent h-auto p-0 space-x-8">
            <TabsTrigger
              value="overview"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Overview</div>
                  <div className="text-sm text-gray-500">Department status</div>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Team</div>
                  <div className="text-sm text-gray-500">
                    {dashboardData?.teamMembers?.length || 0} members
                  </div>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="surveys"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Surveys</div>
                  <div className="text-sm text-gray-500">
                    {dashboardData?.ongoingSurveys?.length || 0} active
                  </div>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Brain className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Insights</div>
                  <div className="text-sm text-gray-500">AI analysis</div>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Target className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Action Plans</div>
                  <div className="text-sm text-gray-500">
                    {dashboardData?.actionPlans?.length || 0} plans
                  </div>
                </div>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

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
                  Create Department Survey
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Create Action Plan
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Team Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team Members
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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

        <TabsContent value="surveys" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ongoing Surveys */}
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
              <CardContent>
                <div className="space-y-4">
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

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Department AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Department Action Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
