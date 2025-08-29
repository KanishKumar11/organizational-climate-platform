'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import {
  Search,
  Plus,
  Filter,
  BarChart3,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

interface Question {
  _id: string;
  text: string;
  type: string;
  category: string;
  subcategory?: string;
  tags: string[];
  metrics: {
    usage_count: number;
    response_rate: number;
    insight_score: number;
    last_used?: string;
  };
  is_active: boolean;
  is_ai_generated: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  category: string;
  subcategories: string[];
  totalQuestions?: number;
  avgInsightScore?: number;
  totalUsage?: number;
}

interface QuestionBankManagerProps {
  userRole: string;
  companyId?: string;
}

export default function QuestionBankManager({
  userRole,
  companyId,
}: QuestionBankManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const questionTypes = [
    { value: 'likert', label: 'Likert Scale' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'ranking', label: 'Ranking' },
    { value: 'open_ended', label: 'Open Ended' },
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'rating', label: 'Rating' },
  ];

  useEffect(() => {
    fetchCategories();
    fetchQuestions();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [searchTerm, selectedCategory, selectedType, currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        '/api/question-bank/categories?include_stats=true'
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedType) params.append('type', selectedType);

      const response = await fetch(`/api/question-bank?${params}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedType('');
    setCurrentPage(1);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      likert: 'bg-blue-100 text-blue-800',
      multiple_choice: 'bg-green-100 text-green-800',
      ranking: 'bg-purple-100 text-purple-800',
      open_ended: 'bg-orange-100 text-orange-800',
      yes_no: 'bg-gray-100 text-gray-800',
      rating: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const canManageQuestions = ['super_admin', 'company_admin'].includes(
    userRole
  );

  if (loading && questions.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600">
            Manage and organize your survey questions with effectiveness
            tracking
          </p>
        </div>
        {canManageQuestions && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search questions, categories, or tags..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowMetrics(!showMetrics)}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Metrics
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category} ({cat.totalQuestions || 0})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Types</option>
                  {questionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Category Overview */}
      {showMetrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Category Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.category}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleCategoryFilter(category.category)}
              >
                <h4 className="font-medium text-gray-900">
                  {category.category}
                </h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div>Questions: {category.totalQuestions || 0}</div>
                  <div>
                    Avg Effectiveness:{' '}
                    {category.avgInsightScore?.toFixed(1) || 'N/A'}
                  </div>
                  <div>Total Usage: {category.totalUsage || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question._id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getTypeColor(question.type)}>
                    {questionTypes.find((t) => t.value === question.type)
                      ?.label || question.type}
                  </Badge>
                  <Badge variant="outline">{question.category}</Badge>
                  {question.subcategory && (
                    <Badge variant="outline" className="text-xs">
                      {question.subcategory}
                    </Badge>
                  )}
                  {question.is_ai_generated && (
                    <Badge className="bg-purple-100 text-purple-800">
                      AI Generated
                    </Badge>
                  )}
                </div>

                <p className="text-gray-900 font-medium mb-2">
                  {question.text}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {question.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {showMetrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Usage:</span>
                      <span className="ml-1 font-medium">
                        {question.metrics.usage_count}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Response Rate:</span>
                      <span className="ml-1 font-medium">
                        {question.metrics.response_rate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Effectiveness:</span>
                      <span
                        className={`ml-1 font-medium ${getEffectivenessColor(question.metrics.insight_score)}`}
                      >
                        {question.metrics.insight_score.toFixed(1)}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Version:</span>
                      <span className="ml-1 font-medium">
                        v{question.version}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
                {canManageQuestions && (
                  <>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {questions.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            No questions found matching your criteria.
          </p>
          {canManageQuestions && (
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Question
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
