'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, FileText, Settings } from 'lucide-react';
import SurveyBuilder from '@/components/survey/SurveyBuilder';
import { IQuestion } from '@/models/Survey';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CreateTemplatePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('climate');
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = [
    { value: 'climate', label: 'Organizational Climate' },
    { value: 'culture', label: 'Company Culture' },
    { value: 'engagement', label: 'Employee Engagement' },
    { value: 'leadership', label: 'Leadership Assessment' },
    { value: 'wellbeing', label: 'Employee Wellbeing' },
    { value: 'custom', label: 'Custom Template' },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: name.trim(),
        description: description.trim(),
        category,
        questions,
        tags,
        is_public: isPublic,
        settings: {
          anonymous: false,
          allow_partial_responses: true,
          randomize_questions: false,
          show_progress: true,
          auto_save: true,
        },
      };

      const response = await fetch('/api/surveys/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/surveys/templates/${data.template.id}`);
      } else {
        const error = await response.json();
        alert(`Failed to create template: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/surveys/templates')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create Survey Template</h1>
              <p className="text-muted-foreground">
                Create a reusable template for future surveys
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Creating...' : 'Create Template'}
          </Button>
        </div>

        {/* Template Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Template Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Employee Satisfaction Survey"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this template is for and when to use it..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isPublic">Make this template public</Label>
              </div>
              <Badge variant="outline" className="text-xs">
                Public templates can be used by other companies
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Survey Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SurveyBuilder
              questions={questions}
              onQuestionsChange={setQuestions}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
