'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save,
  Send,
  Eye,
  Settings,
  Calendar,
  QrCode,
  BookOpen,
  Users,
  Mail,
  CheckCircle2,
  Circle,
  Lock,
  AlertCircle,
} from 'lucide-react';
import SurveyBuilder from '@/components/survey/SurveyBuilder';
import SurveyScheduler from '@/components/surveys/SurveyScheduler';
import QRCodeGenerator from '@/components/surveys/QRCodeGenerator';
import QuestionLibraryBrowser from '@/components/surveys/QuestionLibraryBrowser';
import DepartmentSelector from '@/components/surveys/DepartmentSelector';
import InvitationSettings from '@/components/surveys/InvitationSettings';
import { SurveyProgressBar } from '@/components/surveys/SurveyProgressBar';
import { TabNavigationFooter } from '@/components/surveys/TabNavigationFooter';
import { IQuestion } from '@/models/Survey';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useSurveyProgress, SurveyTab } from '@/hooks/useSurveyProgress';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function CreateSurveyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [surveyType, setSurveyType] = useState<string>('general_climate');
  const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
  const [targetResponses, setTargetResponses] = useState<number>(50);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(10);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SurveyTab>('builder');
  const [createdSurveyId, setCreatedSurveyId] = useState<string | null>(null);

  // Invitation settings state
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [includeCredentials, setIncludeCredentials] = useState(false);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [brandingEnabled, setBrandingEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState(3);

  // Scheduling state
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  const [timezone, setTimezone] = useState<string>('America/New_York');

  // Get survey progress and validation state
  const surveyProgress = useSurveyProgress({
    title,
    description,
    questions,
    targetDepartments,
    startDate,
    endDate,
    customMessage,
    customSubject,
    createdSurveyId,
  });

  // Handle tab change with validation
  const handleTabChange = (newTab: SurveyTab) => {
    // Check if tab is accessible
    if (!surveyProgress.isTabAccessible(newTab)) {
      const warning = surveyProgress.getTabWarning(newTab);
      if (warning) {
        toast.warning(warning);
      }
      return;
    }

    setActiveTab(newTab);
  };

  const handleSave = async (status: 'draft' | 'active' = 'draft') => {
    if (!title.trim()) {
      toast.error('Please enter a survey title');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setSaving(true);
    try {
      const surveyData = {
        title: title.trim(),
        description: description.trim(),
        type: surveyType,
        status: status,
        questions,
        settings: {
          target_responses: targetResponses,
          estimated_duration: estimatedDuration,
          anonymous: false,
          allow_partial_responses: true,
          randomize_questions: false,
          show_progress: true,
          auto_save: true,
          notification_settings: {
            send_invitations: sendImmediately,
            send_reminders: reminderEnabled,
            reminder_frequency_days: reminderFrequency,
          },
          invitation_settings: {
            custom_message: customMessage,
            custom_subject: customSubject,
            include_credentials: includeCredentials,
            send_immediately: sendImmediately,
            branding_enabled: brandingEnabled,
          },
        },
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        timezone: timezone,
        department_ids: targetDepartments,
      };

      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData),
      });

      if (response.ok) {
        const result = await response.json();
        setCreatedSurveyId(result.survey.id);
        toast.success(
          status === 'draft'
            ? 'Survey saved as draft'
            : 'Survey published successfully!'
        );

        if (status === 'active') {
          // Show QR code tab after publishing
          setActiveTab('qr-code');
        }
      } else {
        const error = await response.json();
        toast.error(
          `Failed to save survey: ${error.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      toast.error('Failed to save survey. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFromLibrary = (question: any) => {
    const newQuestion: IQuestion = {
      id: `q-${Date.now()}`,
      text: question.question_text_en,
      type: question.question_type,
      required: true,
      order: questions.length,
      config: question.config || {},
    };
    setQuestions([...questions, newQuestion]);
    toast.success('Question added from library');
  };

  const surveyTypes = [
    { value: 'general_climate', label: 'General Climate' },
    { value: 'microclimate', label: 'Microclimate' },
    { value: 'organizational_culture', label: 'Organizational Culture' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Gradient Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-lg">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Create New Survey</h1>
                <p className="text-blue-100 text-lg">
                  Build and configure your organizational survey
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSave('active')}
                  disabled={saving || !title.trim() || questions.length === 0}
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {saving ? 'Publishing...' : 'Publish Survey'}
                </Button>
              </div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Progress Bar */}
        <SurveyProgressBar
          percentage={surveyProgress.progress.percentage}
          completedRequired={surveyProgress.progress.completedRequired}
          totalRequired={surveyProgress.progress.totalRequired}
          completedOptional={surveyProgress.progress.completedOptional}
          totalOptional={surveyProgress.progress.totalOptional}
        />

        {/* Survey Configuration */}
        <TooltipProvider>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 space-x-6">
              {/* Builder Tab */}
              <TabsTrigger
                value="builder"
                disabled={!surveyProgress.tabs.builder.unlocked}
                className={cn(
                  'data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 relative',
                  !surveyProgress.tabs.builder.unlocked &&
                    'opacity-50 cursor-not-allowed'
                )}
              >
                <Settings className="w-4 h-4 mr-2" />
                Survey Builder
                {surveyProgress.tabs.builder.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
                {surveyProgress.tabs.builder.completed && (
                  <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                )}
              </TabsTrigger>

              {/* Library Tab */}
              <TabsTrigger
                value="library"
                disabled={!surveyProgress.tabs.library.unlocked}
                className={cn(
                  'data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 relative',
                  !surveyProgress.tabs.library.unlocked &&
                    'opacity-50 cursor-not-allowed'
                )}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Question Library
              </TabsTrigger>

              {/* Targeting Tab */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="targeting"
                    disabled={!surveyProgress.tabs.targeting.unlocked}
                    className={cn(
                      'data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 relative',
                      !surveyProgress.tabs.targeting.unlocked &&
                        'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {!surveyProgress.tabs.targeting.unlocked && (
                      <Lock className="w-3 h-3 mr-1 text-gray-400" />
                    )}
                    <Users className="w-4 h-4 mr-2" />
                    Targeting
                    {surveyProgress.tabs.targeting.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {surveyProgress.tabs.targeting.completed && (
                      <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                {!surveyProgress.tabs.targeting.unlocked && (
                  <TooltipContent>
                    <p>{surveyProgress.tabs.targeting.warning}</p>
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Invitations Tab */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="invitations"
                    disabled={!surveyProgress.tabs.invitations.unlocked}
                    className={cn(
                      'data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 relative',
                      !surveyProgress.tabs.invitations.unlocked &&
                        'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {!surveyProgress.tabs.invitations.unlocked && (
                      <Lock className="w-3 h-3 mr-1 text-gray-400" />
                    )}
                    <Mail className="w-4 h-4 mr-2" />
                    Invitations
                    {surveyProgress.tabs.invitations.completed && (
                      <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                {!surveyProgress.tabs.invitations.unlocked && (
                  <TooltipContent>
                    <p>{surveyProgress.tabs.invitations.warning}</p>
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Schedule Tab */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="schedule"
                    disabled={!surveyProgress.tabs.schedule.unlocked}
                    className={cn(
                      'data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 relative',
                      !surveyProgress.tabs.schedule.unlocked &&
                        'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {!surveyProgress.tabs.schedule.unlocked && (
                      <Lock className="w-3 h-3 mr-1 text-gray-400" />
                    )}
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                    {surveyProgress.tabs.schedule.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {surveyProgress.tabs.schedule.completed && (
                      <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                {!surveyProgress.tabs.schedule.unlocked && (
                  <TooltipContent>
                    <p>{surveyProgress.tabs.schedule.warning}</p>
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Preview Tab */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="preview"
                    disabled={!surveyProgress.tabs.preview.unlocked}
                    className={cn(
                      'data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 relative',
                      !surveyProgress.tabs.preview.unlocked &&
                        'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {!surveyProgress.tabs.preview.unlocked && (
                      <Lock className="w-3 h-3 mr-1 text-gray-400" />
                    )}
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                    {surveyProgress.tabs.preview.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                {!surveyProgress.tabs.preview.unlocked && (
                  <TooltipContent>
                    <p>{surveyProgress.tabs.preview.warning}</p>
                  </TooltipContent>
                )}
              </Tooltip>

              {/* QR Code Tab */}
              {createdSurveyId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="qr-code"
                      disabled={!surveyProgress.tabs['qr-code'].unlocked}
                      className={cn(
                        'data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 relative',
                        !surveyProgress.tabs['qr-code'].unlocked &&
                          'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {!surveyProgress.tabs['qr-code'].unlocked && (
                        <Lock className="w-3 h-3 mr-1 text-gray-400" />
                      )}
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Code
                    </TabsTrigger>
                  </TooltipTrigger>
                  {!surveyProgress.tabs['qr-code'].unlocked && (
                    <TooltipContent>
                      <p>{surveyProgress.tabs['qr-code'].warning}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </TabsList>

            <TabsContent value="builder" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Survey Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="survey-type">Survey Type</Label>
                      <Select value={surveyType} onValueChange={setSurveyType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select survey type" />
                        </SelectTrigger>
                        <SelectContent>
                          {surveyTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="target-responses">Target Responses</Label>
                      <Input
                        id="target-responses"
                        type="number"
                        value={targetResponses}
                        onChange={(e) =>
                          setTargetResponses(Number(e.target.value))
                        }
                        min="1"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="estimated-duration">
                        Estimated Duration (minutes)
                      </Label>
                      <Input
                        id="estimated-duration"
                        type="number"
                        value={estimatedDuration}
                        onChange={(e) =>
                          setEstimatedDuration(Number(e.target.value))
                        }
                        min="1"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Survey Status</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">Draft</Badge>
                        <span className="text-sm text-muted-foreground">
                          Will be saved as draft until published
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Survey Builder */}
              <SurveyBuilder
                title={title}
                description={description}
                questions={questions}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onQuestionsChange={setQuestions}
              />

              <TabNavigationFooter
                currentTab="builder"
                nextTab={surveyProgress.getNextTab('builder')}
                previousTab={surveyProgress.getPreviousTab('builder')}
                canPublish={surveyProgress.canPublish}
                canSaveDraft={surveyProgress.canSaveDraft}
                onTabChange={handleTabChange}
                onSaveDraft={() => handleSave('draft')}
                onPublish={() => handleSave('active')}
                saving={saving}
                nextDisabled={!surveyProgress.tabs.builder.completed}
              />
            </TabsContent>

            <TabsContent value="library" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Question Library</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse and add pre-built questions from the library
                  </p>
                </CardHeader>
                <CardContent>
                  <QuestionLibraryBrowser
                    onAddQuestion={handleAddFromLibrary}
                    language="en"
                    selectedQuestionIds={questions.map((q) => q.id)}
                  />
                </CardContent>
              </Card>

              <TabNavigationFooter
                currentTab="library"
                nextTab={surveyProgress.getNextTab('library')}
                previousTab={surveyProgress.getPreviousTab('library')}
                canPublish={surveyProgress.canPublish}
                canSaveDraft={surveyProgress.canSaveDraft}
                onTabChange={handleTabChange}
                onSaveDraft={() => handleSave('draft')}
                onPublish={() => handleSave('active')}
                saving={saving}
              />
            </TabsContent>

            <TabsContent value="targeting" className="mt-6">
              <DepartmentSelector
                selectedDepartments={targetDepartments}
                onChange={setTargetDepartments}
                showEmployeeCount={true}
                allowSelectAll={true}
              />

              <TabNavigationFooter
                currentTab="targeting"
                nextTab={surveyProgress.getNextTab('targeting')}
                previousTab={surveyProgress.getPreviousTab('targeting')}
                canPublish={surveyProgress.canPublish}
                canSaveDraft={surveyProgress.canSaveDraft}
                onTabChange={handleTabChange}
                onSaveDraft={() => handleSave('draft')}
                onPublish={() => handleSave('active')}
                saving={saving}
                nextDisabled={!surveyProgress.tabs.targeting.completed}
              />
            </TabsContent>

            <TabsContent value="invitations" className="mt-6">
              <InvitationSettings
                customMessage={customMessage}
                onCustomMessageChange={setCustomMessage}
                customSubject={customSubject}
                onCustomSubjectChange={setCustomSubject}
                includeCredentials={includeCredentials}
                onIncludeCredentialsChange={setIncludeCredentials}
                sendImmediately={sendImmediately}
                onSendImmediatelyChange={setSendImmediately}
                brandingEnabled={brandingEnabled}
                onBrandingEnabledChange={setBrandingEnabled}
                reminderEnabled={reminderEnabled}
                onReminderEnabledChange={setReminderEnabled}
                reminderFrequency={reminderFrequency}
                onReminderFrequencyChange={setReminderFrequency}
              />

              <TabNavigationFooter
                currentTab="invitations"
                nextTab={surveyProgress.getNextTab('invitations')}
                previousTab={surveyProgress.getPreviousTab('invitations')}
                canPublish={surveyProgress.canPublish}
                canSaveDraft={surveyProgress.canSaveDraft}
                onTabChange={handleTabChange}
                onSaveDraft={() => handleSave('draft')}
                onPublish={() => handleSave('active')}
                saving={saving}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Survey Schedule</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set start and end dates with timezone support
                  </p>
                </CardHeader>
                <CardContent>
                  <SurveyScheduler
                    startDate={startDate}
                    endDate={endDate}
                    timezone={timezone}
                    onChange={(data) => {
                      setStartDate(data.startDate);
                      setEndDate(data.endDate);
                      setTimezone(data.timezone);
                    }}
                  />
                </CardContent>
              </Card>

              <TabNavigationFooter
                currentTab="schedule"
                nextTab={surveyProgress.getNextTab('schedule')}
                previousTab={surveyProgress.getPreviousTab('schedule')}
                canPublish={surveyProgress.canPublish}
                canSaveDraft={surveyProgress.canSaveDraft}
                onTabChange={handleTabChange}
                onSaveDraft={() => handleSave('draft')}
                onPublish={() => handleSave('active')}
                saving={saving}
                nextDisabled={!surveyProgress.tabs.schedule.completed}
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              <div className="space-y-6">
                {/* Survey Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Survey Preview & Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Title</p>
                          <p className="font-medium">{title || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <Badge variant="outline">
                            {surveyType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Duration
                          </p>
                          <p className="font-medium">
                            {estimatedDuration} minutes
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Target Responses
                          </p>
                          <p className="font-medium">{targetResponses}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Questions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Questions ({questions.length})
                      </h3>
                      {questions.length > 0 ? (
                        <div className="space-y-3">
                          {questions.map((question, index) => (
                            <div
                              key={question.id}
                              className="p-3 bg-white dark:bg-gray-800 rounded border"
                            >
                              <p className="font-medium">
                                {index + 1}.{' '}
                                {question.text || 'Question text...'}
                              </p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {question.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No questions added yet
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Targeting */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Targeting</h3>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">
                          Selected Departments
                        </p>
                        {targetDepartments.length > 0 ? (
                          <Badge variant="default">
                            {targetDepartments.length} department
                            {targetDepartments.length !== 1 ? 's' : ''} selected
                          </Badge>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No departments selected
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Schedule */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Schedule</h3>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Start Date
                          </p>
                          <p className="font-medium">
                            {startDate.toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            End Date
                          </p>
                          <p className="font-medium">
                            {endDate.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">
                            Timezone
                          </p>
                          <p className="font-medium">{timezone}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Invitation Settings */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Invitation Settings
                      </h3>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Send Immediately
                          </p>
                          <Badge
                            variant={sendImmediately ? 'default' : 'secondary'}
                          >
                            {sendImmediately ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Include Credentials
                          </p>
                          <Badge
                            variant={
                              includeCredentials ? 'default' : 'secondary'
                            }
                          >
                            {includeCredentials ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Reminders
                          </p>
                          <Badge
                            variant={reminderEnabled ? 'default' : 'secondary'}
                          >
                            {reminderEnabled
                              ? `Every ${reminderFrequency} day${reminderFrequency !== 1 ? 's' : ''}`
                              : 'Disabled'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Branding
                          </p>
                          <Badge
                            variant={brandingEnabled ? 'default' : 'secondary'}
                          >
                            {brandingEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <TabNavigationFooter
                currentTab="preview"
                nextTab={surveyProgress.getNextTab('preview')}
                previousTab={surveyProgress.getPreviousTab('preview')}
                canPublish={surveyProgress.canPublish}
                canSaveDraft={surveyProgress.canSaveDraft}
                onTabChange={handleTabChange}
                onSaveDraft={() => handleSave('draft')}
                onPublish={() => handleSave('active')}
                saving={saving}
              />
            </TabsContent>

            {createdSurveyId && (
              <TabsContent value="qr-code" className="mt-6">
                <QRCodeGenerator
                  surveyId={createdSurveyId}
                  surveyTitle={title}
                  tokenType="anonymous"
                />

                <TabNavigationFooter
                  currentTab="qr-code"
                  nextTab={surveyProgress.getNextTab('qr-code')}
                  previousTab={surveyProgress.getPreviousTab('qr-code')}
                  canPublish={surveyProgress.canPublish}
                  canSaveDraft={surveyProgress.canSaveDraft}
                  onTabChange={handleTabChange}
                  onSaveDraft={() => handleSave('draft')}
                  onPublish={() => handleSave('active')}
                  saving={saving}
                />
              </TabsContent>
            )}
          </Tabs>
        </TooltipProvider>
      </div>
    </DashboardLayout>
  );
}
