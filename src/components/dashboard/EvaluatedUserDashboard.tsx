'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import {
  EnhancedTabs as Tabs,
  EnhancedTabsContent as TabsContent,
  EnhancedTabsList as TabsList,
  EnhancedTabsTrigger as TabsTrigger,
} from '@/components/ui/enhanced-tabs';

import {
  FileText,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  Brain,
  Target,
  Calendar,
  Zap,
  User,
  Award,
  Activity,
  PlayCircle,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { KPIDisplay } from '@/components/charts/KPIDisplay';

interface UserInfo {
  name: string;
  email: string;
  department: string;
  company: string;
  role: string;
}

interface EngagementMetrics {
  surveys_completed: number;
  completion_rate: number;
  avg_response_time: number;
  participation_streak: number;
  last_activity: string;
}

interface AssignedSurvey {
  _id: string;
  title: string;
  description: string;
  type: string;
  start_date: string;
  end_date: string;
  questions: any[];
  created_by: { name: string };
}

interface ParticipationHistory {
  _id: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string;
  completion_date: string;
  created_by: { name: string };
}

interface AdaptiveQuestionnaire {
  id: string;
  title: string;
  description: string;
  type: string;
  estimated_time: number;
  questions_count: number;
  ai_adapted: boolean;
  adaptation_reason: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
}

interface MicroclimateHistory {
  id: string;
  title: string;
  type: string;
  date: string;
  participation_status: string;
  responses_given: number;
  insights_generated: boolean;
}

interface PersonalInsight {
  id: string;
  type: 'strength' | 'development_area' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  created_at: string;
}

interface PersonalInsights {
  insights_enabled: boolean;
  insights: PersonalInsight[];
}

interface UpcomingDeadline {
  survey_id: string;
  title: string;
  type: string;
  end_date: string;
  days_remaining: number;
}

export default function EvaluatedUserDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<{
    user: UserInfo;
    engagementMetrics: EngagementMetrics;
    assignedSurveys: AssignedSurvey[];
    participationHistory: ParticipationHistory[];
    adaptiveQuestionnaires: AdaptiveQuestionnaire[];
    microclimateHistory: MicroclimateHistory[];
    personalInsights: PersonalInsights;
    upcomingDeadlines: UpcomingDeadline[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/evaluated-user');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <Award className="h-4 w-4 text-green-500" />;
      case 'development_area':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'recommendation':
        return <Brain className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'stable':
        return <Activity className="h-3 w-3 text-blue-500" />;
      case 'declining':
        return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining <= 1) return 'text-red-600 bg-red-50';
    if (daysRemaining <= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
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
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Welcome back, {dashboardData.user.name}!
                  </h1>
                  <p className="text-lg text-gray-600">
                    Your engagement matters • {dashboardData.user.department}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm" />
                  <span className="font-medium">
                    {dashboardData.engagementMetrics.surveys_completed} Surveys
                    Completed
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full shadow-sm" />
                  <span className="font-medium">
                    {dashboardData.engagementMetrics.participation_streak} Day
                    Streak
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full shadow-sm" />
                  <span className="font-medium">
                    {dashboardData.engagementMetrics.completion_rate.toFixed(1)}
                    % Completion Rate
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-400 rounded-full shadow-sm" />
                  <span className="font-medium">
                    {dashboardData.assignedSurveys.length} Pending Surveys
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full lg:w-auto">
              <div className="text-right">
                <Badge className="bg-green-50 text-green-600 border-green-200 mb-2 text-sm px-3 py-1">
                  {dashboardData.user.role.replace('_', ' ').toUpperCase()}
                </Badge>
                <p className="text-sm text-gray-500">
                  Last active:{' '}
                  {new Date(
                    dashboardData.engagementMetrics.last_activity
                  ).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p className="font-medium">{dashboardData.user.company}</p>
                <p>{dashboardData.user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIDisplay
          title="Surveys Completed"
          value={dashboardData.engagementMetrics.surveys_completed}
          icon={CheckCircle}
          trend={`${dashboardData.engagementMetrics.completion_rate.toFixed(1)}% completion rate`}
          color="green"
        />
        <KPIDisplay
          title="Response Time"
          value={dashboardData.engagementMetrics.avg_response_time}
          suffix=" days"
          icon={Clock}
          trend="Average response time"
          color="blue"
        />
        <KPIDisplay
          title="Participation Streak"
          value={dashboardData.engagementMetrics.participation_streak}
          icon={Award}
          trend="Consecutive participations"
          color="purple"
        />
        <KPIDisplay
          title="Pending Surveys"
          value={dashboardData.assignedSurveys.length}
          icon={FileText}
          trend="Awaiting your input"
          color="orange"
        />
      </div>

      {/* Upcoming Deadlines Alert */}
      {dashboardData.upcomingDeadlines.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.upcomingDeadlines
                .slice(0, 3)
                .map((deadline, index) => (
                  <div
                    key={deadline.survey_id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {deadline.title}
                      </h4>
                      <p className="text-sm text-gray-600">{deadline.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={getUrgencyColor(deadline.days_remaining)}
                      >
                        {deadline.days_remaining === 0
                          ? 'Due today'
                          : deadline.days_remaining === 1
                            ? 'Due tomorrow'
                            : `${deadline.days_remaining} days left`}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() =>
                          window.open(
                            `/surveys/${deadline.survey_id}`,
                            '_blank'
                          )
                        }
                      >
                        Start Survey
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="surveys" className="space-y-8">
        <TabsList>
          <TabsTrigger
            value="surveys"
            icon={<FileText className="h-5 w-5" />}
            description={`${dashboardData.assignedSurveys.length} pending`}
          >
            My Surveys
          </TabsTrigger>
          <TabsTrigger
            value="adaptive"
            icon={<Brain className="h-5 w-5" />}
            description={`${dashboardData.adaptiveQuestionnaires.length} available`}
          >
            AI Questionnaires
          </TabsTrigger>
          <TabsTrigger
            value="microclimates"
            icon={<Zap className="h-5 w-5" />}
            description={`${dashboardData.microclimateHistory.length} completed`}
          >
            Microclimates
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            icon={<Award className="h-5 w-5" />}
            description={`${dashboardData.personalInsights.insights.length} insights`}
          >
            Personal Insights
          </TabsTrigger>
          <TabsTrigger
            value="history"
            icon={<Calendar className="h-5 w-5" />}
            description={`${dashboardData.participationHistory.length} completed`}
          >
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="surveys" className="space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                Assigned Surveys
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.assignedSurveys.map((survey, index) => (
                  <motion.div
                    key={survey._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{survey.title}</h4>
                        <p className="text-sm text-gray-600">
                          {survey.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>Type: {survey.type}</span>
                          <span>
                            Questions: {survey.questions?.length || 0}
                          </span>
                          <span>Created by: {survey.created_by.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center text-sm">
                        <p className="font-medium">
                          {new Date(survey.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500">Due date</p>
                      </div>
                      <Button
                        onClick={() =>
                          window.open(`/surveys/${survey._id}`, '_blank')
                        }
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Survey
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {dashboardData.assignedSurveys.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No surveys assigned at the moment</p>
                    <p className="text-sm">Check back later for new surveys</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adaptive" className="space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                AI-Tailored Questionnaires
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.adaptiveQuestionnaires.map(
                  (questionnaire, index) => (
                    <motion.div
                      key={questionnaire.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 border rounded-lg ${getPriorityColor(questionnaire.priority)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <Brain className="h-5 w-5 text-purple-500 mt-1" />
                          <div>
                            <h4 className="font-semibold">
                              {questionnaire.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {questionnaire.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>⏱️ {questionnaire.estimated_time} min</span>
                              <span>
                                📝 {questionnaire.questions_count} questions
                              </span>
                              <span>🤖 AI Adapted</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {questionnaire.priority}
                        </Badge>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg mb-3">
                        <p className="text-sm text-blue-800">
                          <strong>AI Adaptation:</strong>{' '}
                          {questionnaire.adaptation_reason}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Due:{' '}
                          {new Date(
                            questionnaire.due_date
                          ).toLocaleDateString()}
                        </span>
                        <Button
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/surveys/${questionnaire.id}`,
                              '_blank'
                            )
                          }
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Questionnaire
                        </Button>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="microclimates" className="space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                Microclimate Participation
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.microclimateHistory.map(
                  (microclimate, index) => (
                    <motion.div
                      key={microclimate.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Zap className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {microclimate.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {microclimate.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(microclimate.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">
                            {microclimate.responses_given}
                          </p>
                          <p className="text-gray-500">Responses</p>
                        </div>
                        <Badge
                          variant={
                            microclimate.participation_status === 'completed'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {microclimate.participation_status}
                        </Badge>
                        {microclimate.insights_generated && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/microclimates/${microclimate.id}/results`
                              )
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Results
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {dashboardData.personalInsights.insights_enabled ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
                <div className="space-y-4 pr-2">
                  {dashboardData.personalInsights.insights.map(
                    (insight, index) => (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-4">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{insight.title}</h4>
                              <div className="flex items-center gap-2">
                                {getTrendIcon(insight.trend)}
                                <span className="text-xs text-gray-500">
                                  {(insight.confidence * 100).toFixed(0)}%
                                  confidence
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {insight.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              Generated{' '}
                              {new Date(
                                insight.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Personal Insights Disabled
                </h3>
                <p className="text-gray-600">
                  Personal insights are not enabled for your account. Contact
                  your administrator for more information.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Participation History</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 md:max-h-80 overflow-y-auto scroll-smooth dashboard-scroll">
              <div className="space-y-4 pr-2">
                {dashboardData.participationHistory.map(
                  (participation, index) => (
                    <motion.div
                      key={participation._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {participation.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {participation.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            Completed{' '}
                            {new Date(
                              participation.completion_date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center text-sm">
                          <p className="font-medium">
                            {new Date(
                              participation.end_date
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-gray-500">Survey ended</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/surveys/${participation._id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </motion.div>
                  )
                )}
                {dashboardData.participationHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No participation history yet</p>
                    <p className="text-sm">
                      Complete your first survey to see your history here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
