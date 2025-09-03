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
import { ArrowLeft, Save, Send, Eye, Settings } from 'lucide-react';
import SurveyBuilder from '@/components/survey/SurveyBuilder';
import { IQuestion } from '@/models/Survey';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const handleSave = async (status: 'draft' | 'active' = 'draft') => {
    if (!title.trim()) {
      alert('Please enter a survey title');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    setSaving(true);
    try {
      const surveyData = {
        title: title.trim(),
        description: description.trim(),
        type: surveyType,
        status: status, // Move status to top level
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
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
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
        router.push(`/surveys/${result.survey.id}`);
      } else {
        const error = await response.json();
        alert(`Failed to save survey: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      alert('Failed to save survey. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const surveyTypes = [
    { value: 'general_climate', label: 'General Climate' },
    { value: 'microclimate', label: 'Microclimate' },
    { value: 'organizational_culture', label: 'Organizational Culture' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Survey</h1>
              <p className="text-muted-foreground">
                Build and configure your organizational survey
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Survey Configuration */}
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
                  onChange={(e) => setTargetResponses(Number(e.target.value))}
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
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
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

        {/* Preview Section */}
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
                    <p className="text-muted-foreground mt-1">{description}</p>
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
