'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/Loading';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Briefcase,
  FileText,
  Users,
  Clock,
  Star,
  Copy,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  usage_count?: number;
  tags: string[];
}

// Category color mapping for visual appeal
const getCategoryColors = (category: string) => {
  const colorMap = {
    climate: {
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      accent: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300',
      badge:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    culture: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      accent: 'bg-blue-500',
      text: 'text-blue-700 dark:text-blue-300',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    },
    engagement: {
      bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20',
      border: 'border-purple-200 dark:border-purple-800',
      accent: 'bg-purple-500',
      text: 'text-purple-700 dark:text-purple-300',
      badge:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    },
    leadership: {
      bg: 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20',
      border: 'border-orange-200 dark:border-orange-800',
      accent: 'bg-orange-500',
      text: 'text-orange-700 dark:text-orange-300',
      badge:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    },
    wellbeing: {
      bg: 'bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-950/20 dark:to-lime-950/20',
      border: 'border-green-200 dark:border-green-800',
      accent: 'bg-green-500',
      text: 'text-green-700 dark:text-green-300',
      badge:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    },
    custom: {
      bg: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20',
      border: 'border-gray-200 dark:border-gray-800',
      accent: 'bg-gray-500',
      text: 'text-gray-700 dark:text-gray-300',
      badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    },
  };

  return colorMap[category as keyof typeof colorMap] || colorMap.custom;
};

export default function SurveyTemplatesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [publicFilter, setPublicFilter] = useState('all');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter, publicFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (publicFilter === 'public') params.append('public', 'true');

      const response = await fetch(`/api/surveys/templates?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      // Get the template to use its name in the survey title
      const template = filteredTemplates.find((t) => t._id === templateId);
      const templateName = template?.name || 'Template';

      // Set default dates: start today, end in 30 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      const response = await fetch(`/api/surveys/templates/${templateId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Survey from ${templateName}`,
          description: `Survey created from the "${templateName}" template`,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/surveys/${data.survey.id}`);
      } else {
        const errorData = await response.json();
        console.error('Error using template:', errorData);
        alert(`Failed to create survey: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error using template:', error);
      alert('Failed to create survey. Please try again.');
    }
  };

  const handleSeedTemplates = async () => {
    setSeeding(true);
    try {
      const response = await fetch('/api/surveys/templates/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Successfully created ${data.templates?.length || 0} sample templates!`
        );
        fetchTemplates(); // Refresh the templates list
      } else {
        const error = await response.json();
        alert(`Failed to seed templates: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error seeding templates:', error);
      alert('Failed to create sample templates. Please try again.');
    } finally {
      setSeeding(false);
    }
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'climate', label: 'Organizational Climate' },
    { value: 'culture', label: 'Company Culture' },
    { value: 'engagement', label: 'Employee Engagement' },
    { value: 'leadership', label: 'Leadership Assessment' },
    { value: 'wellbeing', label: 'Employee Wellbeing' },
    { value: 'custom', label: 'Custom Templates' },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Survey Templates</h1>
            <p className="text-muted-foreground">
              Create reusable templates or use existing ones to build surveys
              quickly
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/surveys/create')}
              className="flex items-center gap-2 hover:scale-105 transition-all duration-200 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Create Survey
            </Button>
            <Button
              onClick={() => router.push('/surveys/templates/create')}
              className="flex items-center gap-2 hover:scale-105 transition-all duration-200 hover:shadow-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={publicFilter} onValueChange={setPublicFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  <SelectItem value="public">Public Only</SelectItem>
                  <SelectItem value="private">My Templates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ||
                categoryFilter !== 'all' ||
                publicFilter !== 'all'
                  ? 'No Templates Match Your Filters'
                  : 'No Templates Available Yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ||
                categoryFilter !== 'all' ||
                publicFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters to find templates.'
                  : 'Get started by creating your first template or loading some sample templates.'}
              </p>

              {!(
                searchTerm ||
                categoryFilter !== 'all' ||
                publicFilter !== 'all'
              ) && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={() => router.push('/surveys/templates/create')}
                    className="flex items-center gap-2 hover:scale-105 transition-all duration-200 hover:shadow-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Template
                  </Button>
                  <span className="text-muted-foreground">or</span>
                  <Button
                    variant="outline"
                    onClick={handleSeedTemplates}
                    disabled={seeding}
                    className="flex items-center gap-2 hover:scale-105 transition-all duration-200 hover:shadow-md hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/20 dark:hover:to-teal-950/20"
                  >
                    {seeding ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Load Sample Templates
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const colors = getCategoryColors(template.category);
              return (
                <Card
                  key={template._id}
                  className={cn(
                    'hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative overflow-hidden',
                    colors.bg,
                    colors.border
                  )}
                >
                  {/* Category accent bar */}
                  <div
                    className={cn(
                      'absolute top-0 left-0 w-full h-1',
                      colors.accent
                    )}
                  />

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">
                            {template.name}
                          </CardTitle>
                          <Badge
                            className={cn('text-xs px-2 py-0.5', colors.badge)}
                          >
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      {template.is_public && (
                        <Badge
                          variant="secondary"
                          className="ml-2 flex-shrink-0"
                        >
                          Public
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {template.questions.length} questions
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {template.usage_count || 0} uses
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          By {template.created_by?.name || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUseTemplate(template._id)}
                            className={cn(
                              'hover:scale-105 transition-transform',
                              colors.text,
                              'hover:bg-white/80 dark:hover:bg-gray-800/80'
                            )}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Use
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/surveys/templates/${template._id}`)
                            }
                            className="hover:scale-105 transition-transform"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
