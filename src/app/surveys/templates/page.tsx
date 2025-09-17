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

export default function SurveyTemplatesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [publicFilter, setPublicFilter] = useState('all');

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
      const response = await fetch(`/api/surveys/templates/${templateId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Survey from Template`,
          description: 'Created from template',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/surveys/${data.survey.id}`);
      }
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general_climate', label: 'General Climate' },
    { value: 'organizational_culture', label: 'Organizational Culture' },
    { value: 'employee_engagement', label: 'Employee Engagement' },
    { value: 'team_dynamics', label: 'Team Dynamics' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'custom', label: 'Custom' },
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
              <h1 className="text-2xl font-bold">Survey Templates</h1>
              <p className="text-muted-foreground">
                Reusable survey templates for quick deployment
              </p>
            </div>
          </div>

          <Button
            onClick={() => router.push('/surveys/create')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Survey
          </Button>
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
                No Templates Found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter !== 'all' || publicFilter !== 'all'
                  ? 'No templates match your current filters.'
                  : 'No survey templates available yet.'}
              </p>
              <Button onClick={() => router.push('/surveys/create')}>
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                    {template.is_public && (
                      <Badge variant="secondary" className="ml-2">
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
                        <Badge key={tag} variant="outline" className="text-xs">
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
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/surveys/templates/${template._id}`)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
