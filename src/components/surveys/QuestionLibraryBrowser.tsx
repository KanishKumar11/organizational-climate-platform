import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  FolderTree,
  Plus,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Tag,
  Globe,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuestionLibrary, useQuestionCategories } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * CLIMA-002: Question Library Browser (Updated with React Query)
 *
 * Browse, search, and add questions from the library to surveys
 * with hierarchical category navigation and multilingual support
 * Now uses React Query for caching and automatic refetching
 */

interface Category {
  _id: string;
  name_en: string;
  name_es: string;
  parent?: string;
  children?: Category[];
}

interface LibraryQuestion {
  _id: string;
  category: string;
  question_text_en: string;
  question_text_es: string;
  question_type: string;
  tags: string[];
  usage_count: number;
  version: number;
  is_active: boolean;
  config?: any;
}

interface QuestionLibraryBrowserProps {
  onAddQuestion: (question: LibraryQuestion) => void;
  language?: 'en' | 'es';
  selectedQuestionIds?: string[];
}

export default function QuestionLibraryBrowser({
  onAddQuestion,
  language = 'en',
  selectedQuestionIds = [],
}: QuestionLibraryBrowserProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [previewQuestion, setPreviewQuestion] =
    useState<LibraryQuestion | null>(null);

  // Memoize individual filter values to prevent reference changes
  const categoryFilter = useMemo(() => selectedCategory || undefined, [selectedCategory]);
  const searchFilter = useMemo(() => searchQuery || undefined, [searchQuery]);
  const typeFilter = useMemo(() => selectedType !== 'all' ? selectedType : undefined, [selectedType]);
  const tagsFilter = useMemo(() => selectedTags.length > 0 ? selectedTags : undefined, [selectedTags.join(',')]);

  // Use React Query hooks for data fetching with caching
  const { data: categoriesData } = useQuestionCategories();
  const { data: questionsData, isLoading } = useQuestionLibrary({
    category_id: categoryFilter,
    search_query: searchFilter,
    type: typeFilter,
    tags: tagsFilter,
    limit: 50,
  });

  const categories = categoriesData || [];
  const questions = questionsData?.questions || [];

  // Extract unique tags when questions change
  useEffect(() => {
    const tags = new Set<string>();
    questions.forEach((q: LibraryQuestion) => {
      q.tags?.forEach((tag: string) => tags.add(tag));
    });
    setAvailableTags(Array.from(tags).sort());
  }, [questions]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (cats: Category[], level = 0) => {
    return cats.map((cat) => (
      <div key={cat._id} style={{ marginLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent ${
            selectedCategory === cat._id ? 'bg-accent' : ''
          }`}
          onClick={() => {
            setSelectedCategory(cat._id);
            if (cat.children && cat.children.length > 0) {
              toggleCategory(cat._id);
            }
          }}
        >
          {cat.children && cat.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(cat._id);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {expandedCategories.has(cat._id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          <FolderTree className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {language === 'en' ? cat.name_en : cat.name_es}
          </span>
        </div>
        {expandedCategories.has(cat._id) &&
          cat.children &&
          renderCategoryTree(cat.children, level + 1)}
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

  const questionText = (q: LibraryQuestion) =>
    language === 'en' ? q.question_text_en : q.question_text_es;

  return (
    <div className="grid grid-cols-12 gap-4 h-[600px]">
      {/* Left Sidebar - Category Tree */}
      <div className="col-span-3 border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Categories</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory('')}
          >
            All
          </Button>
        </div>
        <ScrollArea className="h-[520px]">
          {renderCategoryTree(categories)}
        </ScrollArea>
      </div>

      {/* Main Content - Question List */}
      <div className="col-span-6 border rounded-lg flex flex-col">
        {/* Search and Filters */}
        <div className="p-4 space-y-3 border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Question Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="binary">Binary</SelectItem>
                <SelectItem value="matrix">Matrix</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Filters */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableTags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Active Filters */}
          {(selectedCategory ||
            searchQuery ||
            selectedType !== 'all' ||
            selectedTags.length > 0) && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
              <Badge variant="secondary">
                {questions.length} result{questions.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Question List */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin">⏳</div>
              <span className="ml-2">Loading questions...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((question) => {
                const isSelected = selectedQuestionIds.includes(question._id);
                const isPreview = previewQuestion?._id === question._id;

                return (
                  <Card
                    key={question._id}
                    className={`cursor-pointer transition-colors ${
                      isPreview ? 'border-primary' : ''
                    } ${isSelected ? 'opacity-50' : ''}`}
                    onClick={() => setPreviewQuestion(question)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium">
                            {questionText(question)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              {question.question_type}
                            </Badge>
                            {question.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {question.usage_count > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Used {question.usage_count}x
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
        </ScrollArea>
      </div>

      {/* Right Sidebar - Question Preview */}
      <div className="col-span-3 border rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-4">Preview</h3>
        {previewQuestion ? (
          <div className="space-y-4">
            <Tabs defaultValue={language} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="en">
                  <Globe className="h-3 w-3 mr-1" />
                  EN
                </TabsTrigger>
                <TabsTrigger value="es">
                  <Globe className="h-3 w-3 mr-1" />
                  ES
                </TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="space-y-3 mt-4">
                <div>
                  <p className="text-sm font-medium mb-2">Question:</p>
                  <p className="text-sm text-muted-foreground">
                    {previewQuestion.question_text_en}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="es" className="space-y-3 mt-4">
                <div>
                  <p className="text-sm font-medium mb-2">Pregunta:</p>
                  <p className="text-sm text-muted-foreground">
                    {previewQuestion.question_text_es}
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline">{previewQuestion.question_type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>v{previewQuestion.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usage:</span>
                <span>{previewQuestion.usage_count}x</span>
              </div>
            </div>

            {previewQuestion.tags.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {previewQuestion.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button
              className="w-full mt-4"
              onClick={() => handleAddQuestion(previewQuestion)}
              disabled={selectedQuestionIds.includes(previewQuestion._id)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Survey
            </Button>
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-sm py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Select a question to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
