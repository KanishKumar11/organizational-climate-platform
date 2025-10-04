import React, { useState, useMemo } from 'react';
import {
  Search,
  FolderTree,
  Plus,
  BookOpen,
  Tag,
  Filter,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuestionLibrary, useQuestionCategories } from '@/hooks/useQueries';

/**
 * CLIMA-002: Question Library Browser (Updated with React Query)
 *
 * Browse, search, and add questions from the library to surveys
 * Now uses React Query for caching and automatic refetching
 */

interface Category {
  _id: string;
  name: string; // QuestionBank uses simple category names
  count?: number;
}

interface LibraryQuestion {
  _id: string;
  text: string; // QuestionBank uses 'text' not 'question_text_en'
  type: string; // 'likert', 'multiple_choice', etc.
  category: string;
  subcategory?: string;
  tags: string[];
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_labels?: { min: string; max: string };
  metrics: {
    usage_count: number;
    response_rate: number;
    insight_score: number;
  };
  is_active: boolean;
  version: number;
}

interface QuestionLibraryBrowserProps {
  onAddQuestion: (question: LibraryQuestion) => void;
  language?: 'en' | 'es'; // Kept for future i18n, but not used in QuestionBank
  selectedQuestionIds?: string[];
}

export default function QuestionLibraryBrowser({
  onAddQuestion,
  language = 'en',
  selectedQuestionIds = [],
}: QuestionLibraryBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [previewQuestion, setPreviewQuestion] =
    useState<LibraryQuestion | null>(null);

  // Memoize individual filter values to prevent reference changes
  const categoryFilter = useMemo(
    () => selectedCategory || undefined,
    [selectedCategory]
  );
  const searchFilter = useMemo(() => searchQuery || undefined, [searchQuery]);
  const typeFilter = useMemo(
    () => (selectedType !== 'all' ? selectedType : undefined),
    [selectedType]
  );

  // Create stable tags array reference - only create new array when tags actually change
  const tagsFilter = useMemo(() => {
    if (selectedTags.length === 0) return undefined;
    return [...selectedTags]; // Create new array only when needed
  }, [selectedTags.length, selectedTags.join(',')]);

  // Memoize filter object to prevent recreating on every render
  const libraryFilters = useMemo(
    () => ({
      category_id: categoryFilter,
      search_query: searchFilter,
      type: typeFilter,
      tags: tagsFilter,
      limit: 50,
    }),
    [categoryFilter, searchFilter, typeFilter, tagsFilter]
  );

  // Use React Query hooks for data fetching with caching
  const { data: categoriesData } = useQuestionCategories();
  const { data: questionsData, isLoading } = useQuestionLibrary(libraryFilters);

  const categories = categoriesData || [];
  const questions = questionsData?.questions || [];

  // Derive available tags directly from questions - no state needed
  const availableTags = useMemo(() => {
    if (!questions || questions.length === 0) return [];

    const tags = new Set<string>();
    questions.forEach((q: LibraryQuestion) => {
      q.tags?.forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [questions.length]);

  const renderCategoryTree = (cats: Category[], level = 0) => {
    return cats.map((cat) => (
      <div key={cat._id} style={{ marginLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent ${
            selectedCategory === cat.name ? 'bg-accent' : ''
          }`}
          onClick={() => {
            setSelectedCategory(cat.name);
          }}
        >
          <FolderTree className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{cat.name}</span>
          {cat.count !== undefined && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {cat.count}
            </Badge>
          )}
        </div>
      </div>
    ));
  };

  const handleAddQuestion = (question: LibraryQuestion) => {
    onAddQuestion(question);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSelectedType('all');
    setSelectedTags([]);
  };

  const getQuestionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      likert: 'Likert Scale',
      multiple_choice: 'Multiple Choice',
      ranking: 'Ranking',
      open_ended: 'Open Ended',
      yes_no: 'Yes/No',
      rating: 'Rating',
    };
    return typeMap[type] || type;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filters Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="Question Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="likert">Likert Scale</SelectItem>
              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
              <SelectItem value="ranking">Ranking</SelectItem>
              <SelectItem value="open_ended">Open Ended</SelectItem>
              <SelectItem value="yes_no">Yes/No</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
            className={
              selectedCategory === '' ? 'bg-blue-600 hover:bg-blue-700' : ''
            }
          >
            All Categories
          </Button>
          {categories.slice(0, 8).map((category) => (
            <Button
              key={category.name}
              variant={
                selectedCategory === category.name ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => setSelectedCategory(category.name)}
              className={
                selectedCategory === category.name
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : ''
              }
            >
              {category.name}
              <Badge variant="secondary" className="ml-2 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
          {categories.length > 8 && (
            <Button variant="ghost" size="sm" className="text-gray-500">
              +{categories.length - 8} more
            </Button>
          )}
        </div>

        {/* Tag Filters */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableTags.slice(0, 10).map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => toggleTag(tag)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {availableTags.length > 10 && (
              <Badge variant="secondary" className="text-gray-500">
                +{availableTags.length - 10} more
              </Badge>
            )}
          </div>
        )}

        {/* Active Filters & Results Count */}
        {(selectedCategory ||
          searchQuery ||
          selectedType !== 'all' ||
          selectedTags.length > 0) && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {questions.length} question{questions.length !== 1 ? 's' : ''}{' '}
                found
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 min-h-[800px]">
        {/* Questions List */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm  flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Questions</h3>
          </div>
          <ScrollArea className="flex-1 h-[800px]">
            <div className="p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-sm">Loading questions...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No questions found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  {(selectedCategory ||
                    searchQuery ||
                    selectedType !== 'all' ||
                    selectedTags.length > 0) && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3">
                  {questions.map((question) => {
                    const isSelected = selectedQuestionIds.includes(
                      question._id
                    );
                    const isPreview = previewQuestion?._id === question._id;

                    return (
                      <Card
                        key={question._id}
                        className={`cursor-pointer transition-all duration-200 border-l-4 hover:shadow-md ${
                          isPreview
                            ? 'border-l-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-200'
                            : 'border-l-gray-200 hover:border-l-blue-300'
                        } ${isSelected ? 'opacity-60' : ''}`}
                        onClick={() => setPreviewQuestion(question)}
                      >
                        <CardContent className="px-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <p className="text-gray-900 font-medium leading-relaxed text-sm">
                                {question.text}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                                >
                                  {getQuestionTypeLabel(question.type)}
                                </Badge>
                                {question.category && (
                                  <Badge
                                    variant="outline"
                                    className="border-gray-300 text-gray-600 text-xs"
                                  >
                                    📁 {question.category}
                                  </Badge>
                                )}
                                {question.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="border-gray-300 text-gray-600 text-xs"
                                  >
                                    🏷️ {tag}
                                  </Badge>
                                ))}
                                {question.metrics?.usage_count > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="border-green-300 text-green-700 text-xs"
                                  >
                                    📊 Used {question.metrics.usage_count}x
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddQuestion(question);
                              }}
                              disabled={isSelected}
                              className={`transition-colors ${
                                isSelected
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {isSelected ? 'Added' : 'Add'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Question Preview Sidebar */}
        {previewQuestion && (
          <div className="w-96 bg-white rounded-xl border border-gray-200 shadow-sm  flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Question Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewQuestion(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 h-[400px]">
              <div className="p-4">
                <div className="space-y-6">
                  {/* Question Text */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Question Text
                    </p>
                    <p className="text-gray-900 font-medium leading-relaxed">
                      {previewQuestion.text}
                    </p>
                  </div>

                  {/* Question Type & Scale */}
                  {previewQuestion.type === 'likert' &&
                    previewQuestion.scale_labels && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                          Scale Range
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {previewQuestion.scale_min}
                            </div>
                            <div className="text-xs text-gray-500">
                              {previewQuestion.scale_labels.min}
                            </div>
                          </div>
                          <div className="flex-1 mx-4">
                            <div className="h-1 bg-gray-200 rounded-full"></div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {previewQuestion.scale_max}
                            </div>
                            <div className="text-xs text-gray-500">
                              {previewQuestion.scale_labels.max}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Options */}
                  {previewQuestion.options &&
                    previewQuestion.options.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                          Answer Options
                        </p>
                        <div className="space-y-2">
                          {previewQuestion.options.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">
                                {option}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Metadata */}
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Type
                      </span>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        {getQuestionTypeLabel(previewQuestion.type)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Category
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {previewQuestion.category}
                      </span>
                    </div>
                    {previewQuestion.subcategory && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Subcategory
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {previewQuestion.subcategory}
                        </span>
                      </div>
                    )}
                    {previewQuestion.tags.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                          Tags
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {previewQuestion.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs border-gray-300 text-gray-600"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add Button */}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleAddQuestion(previewQuestion)}
                    disabled={selectedQuestionIds.includes(previewQuestion._id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {selectedQuestionIds.includes(previewQuestion._id)
                      ? 'Already Added'
                      : 'Add to Survey'}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
