'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/Progress';
import {
  Edit,
  Eye,
  BarChart3,
  Users,
  Clock,
  Target,
  AlertCircle,
  Play,
  Pause,
  Archive,
  Share2,
  Download,
  Settings,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  Activity,
  FileText,
  Plus,
} from 'lucide-react';
import SurveyBuilder from '@/components/survey/SurveyBuilder';
import { IQuestion } from '@/models/Survey';

interface Survey {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  questions: IQuestion[];
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  created_by: {
    name: string;
    id: string;
  };
  target_departments: string[];
  target_responses: number;
  response_count: number;
  completion_rate: number;
  estimated_duration: number;
  company_id: string;
  department_id?: string;
}

export default function SurveyDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editQuestions, setEditQuestions] = useState<IQuestion[]>([]);

  const fetchSurvey = async () => {
    if (!surveyId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/surveys/${surveyId}`);
      if (response.ok) {
        const data = await response.json();
        setSurvey(data.survey);
        setEditTitle(data.survey.title);
        setEditDescription(data.survey.description);
        setEditQuestions(data.survey.questions || []);
      } else {
        console.error('Failed to fetch survey');
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (surveyId && user && !authLoading) {
      fetchSurvey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId, user?.id]);

  const handleSave = async () => {
    if (!survey) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          questions: editQuestions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSurvey(data.survey);
        setEditing(false);
      } else {
        alert('Failed to save survey');
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      alert('Failed to save survey');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (action: string) => {
    if (!survey) return;

    try {
      let newStatus: string;
      switch (action) {
        case 'activate':
          newStatus = 'active';
          break;
        case 'pause':
          newStatus = 'paused';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        case 'archive':
          newStatus = 'archived';
          break;
        default:
          newStatus = action;
      }

      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.survey) {
          setSurvey(data.survey);
          setEditTitle(data.survey.title);
          setEditDescription(data.survey.description);
          setEditQuestions(data.survey.questions || []);
        } else {
          fetchSurvey(); // Fallback to refresh
        }
      } else {
        const errorData = await response.json();
        alert(
          `Failed to ${action} survey: ${errorData.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error(`Error ${action} survey:`, error);
      alert(`Failed to ${action} survey`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !survey) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {!user ? 'Access Denied' : 'Survey Not Found'}
            </h3>
            <p className="text-gray-600">
              {!user
                ? 'Please log in to view this survey.'
                : "The survey you're looking for doesn't exist or you don't have access to it."}
            </p>
            <Button onClick={() => router.push('/surveys')} className="mt-4">
              Back to Surveys
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <Badge
                  className={getStatusColor(survey.status)}
                  variant="secondary"
                >
                  {survey.status.charAt(0).toUpperCase() +
                    survey.status.slice(1)}
                </Badge>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {survey.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Created by {survey.created_by.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(survey.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{survey.questions?.length || 0} questions</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!editing && (
                <>
                  {survey.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const surveyUrl = `${window.location.origin}/survey/${survey._id}`;
                        try {
                          await navigator.clipboard.writeText(surveyUrl);
                          alert('Survey link copied to clipboard!');
                        } catch (err) {
                          prompt('Copy this survey link:', surveyUrl);
                        }
                      }}
                      className="h-9 px-3"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="h-9 px-3"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  {survey.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange('activate')}
                      className="h-9 px-3 bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Publish
                    </Button>
                  )}

                  {survey.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('pause')}
                      className="h-9 px-3"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                </>
              )}

              {editing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false);
                      setEditTitle(survey.title);
                      setEditDescription(survey.description);
                      setEditQuestions(survey.questions || []);
                    }}
                    className="h-9 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-9 px-3"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Total Responses
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {survey.response_count || 0}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {survey.target_responses
                      ? `${(((survey.response_count || 0) / survey.target_responses) * 100).toFixed(1)}% of target`
                      : 'No target set'}
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
                    Completion Rate
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {survey.completion_rate
                      ? survey.completion_rate.toFixed(1)
                      : '0.0'}
                    %
                  </p>
                  <div className="mt-2">
                    <Progress
                      value={survey.completion_rate || 0}
                      className="h-2 bg-green-200"
                    />
                  </div>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Target Responses
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {survey.target_responses || 0}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {survey.target_responses
                      ? `${Math.max(0, survey.target_responses - (survey.response_count || 0))} remaining`
                      : 'No target set'}
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Target className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">
                    Est. Duration
                  </p>
                  <p className="text-3xl font-bold text-orange-900">
                    {survey.estimated_duration || 0}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">minutes</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <Clock className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="border-b border-gray-200">
            <TabsList className="bg-transparent h-auto p-0 space-x-8">
              <TabsTrigger
                value="overview"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Overview
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="questions"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Questions ({survey.questions?.length || 0})
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Results
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Survey Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      Survey Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Description
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        {survey.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">
                          Survey Type
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {survey.type
                              .replace('_', ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">
                          Questions
                        </h4>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">
                            {survey.questions?.length || 0} questions
                          </span>
                        </div>
                      </div>
                    </div>

                    {(survey.start_date || survey.end_date) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        {survey.start_date && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">
                              Start Date
                            </h4>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-500" />
                              <span className="text-gray-600">
                                {new Date(
                                  survey.start_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {survey.end_date && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">
                              End Date
                            </h4>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-red-500" />
                              <span className="text-gray-600">
                                {new Date(survey.end_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="h-5 w-5 text-green-600" />
                      </div>
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3"
                        onClick={() =>
                          router.push(`/surveys/${surveyId}/results`)
                        }
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Results
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3"
                        onClick={async () => {
                          const surveyUrl = `${window.location.origin}/survey/${survey._id}`;
                          try {
                            await navigator.clipboard.writeText(surveyUrl);
                            alert('Survey link copied!');
                          } catch (err) {
                            prompt('Copy this survey link:', surveyUrl);
                          }
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3"
                        onClick={() => setEditing(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>

                      <Button variant="outline" size="sm" className="h-10 px-3">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status Card */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Survey Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Current Status
                      </span>
                      <Badge className={getStatusColor(survey.status)}>
                        {survey.status.charAt(0).toUpperCase() +
                          survey.status.slice(1)}
                      </Badge>
                    </div>

                    {survey.status === 'active' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {survey.completion_rate?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <Progress
                          value={survey.completion_rate || 0}
                          className="h-2"
                        />
                      </div>
                    )}

                    <div className="pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Created</span>
                        <span className="font-medium">
                          {new Date(survey.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Updated</span>
                        <span className="font-medium">
                          {new Date(survey.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Target Departments */}
                {survey.target_departments &&
                  survey.target_departments.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                          Target Departments
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {survey.target_departments.map((dept, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="mr-2 mb-2"
                            >
                              {dept}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-8">
            {editing ? (
              <div className="bg-gray-50 rounded-2xl p-8">
                <SurveyBuilder
                  title={editTitle}
                  description={editDescription}
                  questions={editQuestions}
                  onTitleChange={setEditTitle}
                  onDescriptionChange={setEditDescription}
                  onQuestionsChange={setEditQuestions}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Survey Questions
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {survey.questions?.length || 0} questions • Est.{' '}
                      {survey.estimated_duration || 0} minutes
                    </p>
                  </div>
                  <Button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Questions
                  </Button>
                </div>

                {survey.questions && survey.questions.length > 0 ? (
                  <div className="space-y-4">
                    {survey.questions.map((question, index) => (
                      <Card
                        key={question.id}
                        className="border-0 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {index + 1}
                              </span>
                            </div>

                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-gray-900 text-lg leading-relaxed">
                                  {question.text}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className="bg-gray-50 text-gray-700 border-gray-200"
                                >
                                  {question.type
                                    .replace('_', ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </Badge>
                              </div>

                              {question.options && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    Answer Options:
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {question.options.map((option, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-2"
                                      >
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <span className="text-sm text-gray-600">
                                          {option}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {(question.scale_min !== undefined ||
                                question.scale_max !== undefined) && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                  <p className="text-sm font-medium text-blue-700 mb-2">
                                    Rating Scale:
                                  </p>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm text-blue-600">
                                      {question.scale_min || 1} (Minimum)
                                    </span>
                                    <div className="flex-1 h-2 bg-blue-200 rounded-full">
                                      <div className="h-full bg-blue-400 rounded-full w-full"></div>
                                    </div>
                                    <span className="text-sm text-blue-600">
                                      {question.scale_max || 5} (Maximum)
                                    </span>
                                  </div>
                                </div>
                              )}

                              {question.required && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                  <span className="text-sm text-red-600 font-medium">
                                    Required Question
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Questions Yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start building your survey by adding questions.
                      </p>
                      <Button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Questions
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Survey Results
                </h2>
                <p className="text-gray-600 mt-1">
                  {survey.response_count || 0} responses collected
                </p>
              </div>
              {survey.response_count > 0 && (
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                  <Button
                    onClick={() => router.push(`/surveys/${surveyId}/results`)}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Detailed Analysis
                  </Button>
                </div>
              )}
            </div>

            {survey.response_count > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Response Overview */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                      </div>
                      Response Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {survey.response_count}
                        </div>
                        <div className="text-sm text-blue-700">
                          Total Responses
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {survey.completion_rate?.toFixed(1) || 0}%
                        </div>
                        <div className="text-sm text-green-700">
                          Completion Rate
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress to Target</span>
                        <span>
                          {survey.target_responses
                            ? `${Math.min(100, ((survey.response_count || 0) / survey.target_responses) * 100).toFixed(1)}%`
                            : 'No target set'}
                        </span>
                      </div>
                      {survey.target_responses && (
                        <Progress
                          value={Math.min(
                            100,
                            ((survey.response_count || 0) /
                              survey.target_responses) *
                              100
                          )}
                          className="h-3"
                        />
                      )}
                    </div>

                    <Button
                      onClick={() =>
                        router.push(`/surveys/${surveyId}/results`)
                      }
                      className="w-full flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      View Detailed Analytics
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Insights */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      Quick Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            Avg. Response Time
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          ~{survey.estimated_duration || 0} min
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            Response Rate
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {survey.completion_rate?.toFixed(1) || 0}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Questions</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {survey.questions?.length || 0} total
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-3">
                        Survey is performing well with a{' '}
                        {survey.completion_rate?.toFixed(1) || 0}% completion
                        rate.
                      </p>
                      <Button variant="outline" className="w-full">
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No Responses Yet
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Share your survey to start collecting responses. Once people
                    begin responding, you&apos;ll see detailed analytics and
                    insights here.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={async () => {
                        const surveyUrl = `${window.location.origin}/survey/${survey._id}`;
                        try {
                          await navigator.clipboard.writeText(surveyUrl);
                          alert('Survey link copied to clipboard!');
                        } catch (err) {
                          prompt('Copy this survey link:', surveyUrl);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share Survey
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview Survey
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Survey Settings
              </h2>
              <p className="text-gray-600">
                Manage your survey configuration and status
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Status Management */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    Status Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Current Status
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Survey is currently {survey.status}
                      </p>
                    </div>
                    <Badge
                      className={getStatusColor(survey.status)}
                      variant="secondary"
                    >
                      {survey.status.charAt(0).toUpperCase() +
                        survey.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {survey.status === 'draft' && (
                      <Button
                        onClick={() => handleStatusChange('activate')}
                        className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4" />
                        Publish Survey
                      </Button>
                    )}

                    {survey.status === 'active' && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange('pause')}
                        className="w-full flex items-center gap-2"
                      >
                        <Pause className="h-4 w-4" />
                        Pause Survey
                      </Button>
                    )}

                    {survey.status === 'paused' && (
                      <Button
                        onClick={() => handleStatusChange('activate')}
                        className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4" />
                        Resume Survey
                      </Button>
                    )}

                    {survey.status === 'active' && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange('complete')}
                        className="w-full flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark as Complete
                      </Button>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-yellow-800">
                            Status Changes
                          </h5>
                          <p className="text-sm text-yellow-700 mt-1">
                            Changing the survey status will affect how
                            respondents can access it.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Survey Actions */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="h-5 w-5 text-purple-600" />
                    </div>
                    Survey Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => setEditing(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Edit className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Edit Survey</div>
                        <div className="text-sm text-gray-500">
                          Modify questions and settings
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={async () => {
                      const surveyUrl = `${window.location.origin}/survey/${survey._id}`;
                      try {
                        await navigator.clipboard.writeText(surveyUrl);
                        alert('Survey link copied to clipboard!');
                      } catch (err) {
                        prompt('Copy this survey link:', surveyUrl);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Copy className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Copy Survey Link</div>
                        <div className="text-sm text-gray-500">
                          Share with respondents
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Download className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Export Results</div>
                        <div className="text-sm text-gray-500">
                          Download response data
                        </div>
                      </div>
                    </div>
                  </Button>

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('archive')}
                      className="w-full justify-start h-auto p-4 border-red-200 hover:bg-red-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Archive className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-red-700">
                            Archive Survey
                          </div>
                          <div className="text-sm text-red-600">
                            Remove from active lists
                          </div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Survey Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  Survey Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Survey ID</h4>
                    <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                      {survey._id}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Created Date</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(survey.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Last Modified</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(survey.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Survey Type</h4>
                    <p className="text-sm text-gray-600">
                      {survey.type
                        .replace('_', ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Company ID</h4>
                    <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                      {survey.company_id}
                    </p>
                  </div>

                  {survey.department_id && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">
                        Department ID
                      </h4>
                      <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                        {survey.department_id}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
