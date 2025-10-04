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
} from 'lucide-react';
import SurveyBuilder from '@/components/survey/SurveyBuilder';
import SurveyScheduler from '@/components/surveys/SurveyScheduler';
import QRCodeGenerator from '@/components/surveys/QRCodeGenerator';
import QuestionLibraryBrowser from '@/components/surveys/QuestionLibraryBrowser';
import { IQuestion } from '@/models/Survey';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState('builder');
  const [createdSurveyId, setCreatedSurveyId] = useState<string | null>(null);

  // Scheduling state
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  const [timezone, setTimezone] = useState<string>('America/New_York');

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

        {/* Survey Configuration */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 space-x-6">
            <TabsTrigger
              value="builder"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <Settings className="w-4 h-4 mr-2" />
              Survey Builder
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Question Library
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
              disabled={questions.length === 0}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            {createdSurveyId && (
              <TabsTrigger
                value="qr-code"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </TabsTrigger>
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
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            {questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Survey Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {title || 'Untitled Survey'}
                      </h3>
                      {description && (
                        <p className="text-muted-foreground mt-1">
                          {description}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      {questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="p-3 bg-white rounded border"
                        >
                          <p className="font-medium">
                            {index + 1}. {question.text || 'Question text...'}
                          </p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {question.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {createdSurveyId && (
            <TabsContent value="qr-code" className="mt-6">
              <QRCodeGenerator
                surveyId={createdSurveyId}
                surveyTitle={title}
                tokenType="anonymous"
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave('active')}
            disabled={saving || !title.trim() || questions.length === 0}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {saving ? 'Publishing...' : 'Publish Survey'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
