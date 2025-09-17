'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/Loading';
import {
  ArrowLeft,
  Copy,
  Edit,
  FileText,
  Users,
  Clock,
  Star,
  Share2,
  Download,
  AlertCircle,
} from 'lucide-react';

interface SurveyTemplate {
  _id: string;
  name: string;
  description: string;
  category: string;
  questions: any[];
  is_public: boolean;
  created_by: {
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  usage_count?: number;
  tags: string[];
  settings: {
    anonymous: boolean;
    allow_partial_responses: boolean;
    randomize_questions: boolean;
    show_progress: boolean;
    auto_save: boolean;
  };
}

export default function SurveyTemplateDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<SurveyTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/surveys/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
      } else if (response.status === 404) {
        setError('Template not found');
      } else {
        setError('Failed to load template');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async () => {
    if (!template) return;

    try {
      setCreating(true);
      const response = await fetch(`/api/surveys/templates/${templateId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Survey from ${template.name}`,
          description: template.description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/surveys/${data.survey.id}`);
      } else {
        const error = await response.json();
        alert(`Failed to create survey: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error using template:', error);
      alert('Failed to create survey from template');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !template) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error || 'Template Not Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              The survey template you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => router.push('/surveys/templates')}>
              Back to Templates
            </Button>
          </CardContent>
        </Card>
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
              <h1 className="text-2xl font-bold">{template.name}</h1>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // TODO: Implement sharing functionality
                alert('Sharing functionality coming soon!');
              }}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              onClick={handleUseTemplate}
              disabled={creating}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {creating ? 'Creating...' : 'Use Template'}
            </Button>
          </div>
        </div>

        {/* Template Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Questions ({template.questions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {template.questions.map((question, index) => (
                    <div
                      key={question.id || index}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-2">
                            {question.text}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {question.type?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                            {question.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          {question.options && question.options.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Options:</p>
                              <div className="flex flex-wrap gap-1">
                                {question.options.map((option: string, optIndex: number) => (
                                  <Badge key={optIndex} variant="secondary" className="text-xs">
                                    {option}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Template Details */}
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={template.is_public ? 'default' : 'secondary'}>
                    {template.is_public ? 'Public' : 'Private'}
                  </Badge>
                  <Badge variant="outline">{template.category}</Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span>{template.questions.length} questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{template.usage_count || 0} times used</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      Created {new Date(template.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Created by:</p>
                  <p className="text-sm text-gray-600">{template.created_by?.name || 'Unknown'}</p>
                </div>

                {template.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Anonymous responses:</span>
                    <Badge variant={template.settings.anonymous ? 'default' : 'secondary'}>
                      {template.settings.anonymous ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Partial responses:</span>
                    <Badge variant={template.settings.allow_partial_responses ? 'default' : 'secondary'}>
                      {template.settings.allow_partial_responses ? 'Allowed' : 'Not allowed'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Show progress:</span>
                    <Badge variant={template.settings.show_progress ? 'default' : 'secondary'}>
                      {template.settings.show_progress ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-save:</span>
                    <Badge variant={template.settings.auto_save ? 'default' : 'secondary'}>
                      {template.settings.auto_save ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
