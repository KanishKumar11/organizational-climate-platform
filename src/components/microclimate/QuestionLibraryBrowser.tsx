'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Folder,
  FileQuestion,
  Loader2,
} from 'lucide-react';
import {
  useQuestionLibrary,
  useQuestionCategories,
  useCategoryTree,
  Question,
} from '@/hooks/useQuestionLibrary';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

/**
 * Question Library Browser Component
 *
 * Hierarchical tree view for browsing and selecting questions from the library.
 *
 * Features:
 * - Category tree navigation with expand/collapse
 * - Question selection with checkboxes
 * - Real-time search
 * - Usage statistics
 * - Drag-to-add support (future)
 *
 * @param selectedQuestions - Array of currently selected question IDs
 * @param onSelectionChange - Callback when selection changes
 * @param language - Display language ('es' | 'en')
 * @param maxSelections - Maximum allowed selections (optional)
 */

interface QuestionLibraryBrowserProps {
  selectedQuestions: string[];
  onSelectionChange: (questionIds: string[]) => void;
  language?: 'es' | 'en';
  maxSelections?: number;
}

export function QuestionLibraryBrowser({
  selectedQuestions,
  onSelectionChange,
  language = 'es',
  maxSelections,
}: QuestionLibraryBrowserProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );

  const { tree: categoryTree, isLoading: categoriesLoading } =
    useCategoryTree();
  const { questions, isLoading: questionsLoading } = useQuestionLibrary({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    language,
  });

  const t =
    language === 'es'
      ? {
          title: 'Biblioteca de Preguntas',
          search: 'Buscar preguntas...',
          noQuestions: 'No se encontraron preguntas',
          selected: 'Seleccionadas',
          maxReached: 'Máximo alcanzado',
          usage: 'veces usada',
          expand: 'Expandir',
          collapse: 'Colapsar',
          addAllFromCategory: 'Agregar Todas',
          categoriesSelected: 'categorías seleccionadas',
          questionsAdded: 'preguntas agregadas',
          noCategoryQuestions: 'No hay preguntas en esta categoría',
        }
      : {
          title: 'Question Library',
          search: 'Search questions...',
          noQuestions: 'No questions found',
          selected: 'Selected',
          maxReached: 'Max reached',
          usage: 'times used',
          expand: 'Expand',
          collapse: 'Collapse',
          addAllFromCategory: 'Add All',
          categoriesSelected: 'categories selected',
          questionsAdded: 'questions added',
          noCategoryQuestions: 'No questions in this category',
        };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleQuestion = (questionId: string) => {
    const newSelection = selectedQuestions.includes(questionId)
      ? selectedQuestions.filter((id) => id !== questionId)
      : [...selectedQuestions, questionId];

    // Check max selections
    if (maxSelections && newSelection.length > maxSelections) {
      return;
    }

    onSelectionChange(newSelection);
  };

  // Bulk add all questions from a category
  const addAllQuestionsFromCategory = async (categoryId: string) => {
    try {
      // Fetch all questions from this category
      const response = await fetch(
        `/api/question-library?category=${categoryId}&language=${language}`
      );
      const data = await response.json();

      if (data.success && data.questions) {
        const categoryQuestionIds = data.questions.map((q: Question) => q._id);

        // Filter out already selected questions
        const newQuestions = categoryQuestionIds.filter(
          (id: string) => !selectedQuestions.includes(id)
        );

        if (newQuestions.length === 0) {
          toast.info(
            language === 'es'
              ? 'Todas las preguntas ya están seleccionadas'
              : 'All questions already selected'
          );
          return;
        }

        // Check max selections
        const totalAfterAdd = selectedQuestions.length + newQuestions.length;
        if (maxSelections && totalAfterAdd > maxSelections) {
          const availableSlots = maxSelections - selectedQuestions.length;
          if (availableSlots > 0) {
            // Add only what fits
            const questionsToAdd = newQuestions.slice(0, availableSlots);
            onSelectionChange([...selectedQuestions, ...questionsToAdd]);
            toast.warning(
              language === 'es'
                ? `Agregadas ${questionsToAdd.length} preguntas (límite alcanzado)`
                : `Added ${questionsToAdd.length} questions (limit reached)`
            );
          } else {
            toast.error(
              language === 'es'
                ? 'Límite máximo alcanzado'
                : 'Maximum limit reached'
            );
          }
          return;
        }

        // Add all new questions
        onSelectionChange([...selectedQuestions, ...newQuestions]);
        toast.success(
          language === 'es'
            ? `${newQuestions.length} ${t.questionsAdded}`
            : `${newQuestions.length} ${t.questionsAdded}`
        );
      }
    } catch (error) {
      console.error('Error adding questions from category:', error);
      toast.error(
        language === 'es'
          ? 'Error al agregar preguntas'
          : 'Error adding questions'
      );
    }
  };

  // Toggle category checkbox
  const toggleCategorySelection = (categoryId: string) => {
    const newSelectedCategories = new Set(selectedCategories);
    if (newSelectedCategories.has(categoryId)) {
      newSelectedCategories.delete(categoryId);
    } else {
      newSelectedCategories.add(categoryId);
    }
    setSelectedCategories(newSelectedCategories);
  };

  // Get all category IDs in a tree (including children)
  const getAllCategoryIds = (category: any): string[] => {
    const ids = [category._id];
    if (category.children) {
      category.children.forEach((child: any) => {
        ids.push(...getAllCategoryIds(child));
      });
    }
    return ids;
  };

  const isMaxReached = maxSelections
    ? selectedQuestions.length >= maxSelections
    : false;

  const renderCategory = (category: any, level: number = 0) => {
    const isExpanded = expandedCategories.has(category._id);
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = selectedCategory === category._id;
    const isCategoryChecked = selectedCategories.has(category._id);

    return (
      <div key={category._id} style={{ marginLeft: `${level * 16}px` }}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'flex items-center gap-2 py-2 px-3 rounded-lg transition-colors',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            isSelected && 'bg-blue-50 dark:bg-blue-900/20'
          )}
        >
          {/* Category Checkbox for bulk selection */}
          <Checkbox
            checked={isCategoryChecked}
            onCheckedChange={() => toggleCategorySelection(category._id)}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          />

          {/* Expand/Collapse Icon */}
          <div
            className="cursor-pointer"
            onClick={() => {
              if (hasChildren) {
                toggleCategory(category._id);
              }
            }}
          >
            {hasChildren && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </motion.div>
            )}
            {!hasChildren && <div className="w-4" />}
          </div>

          {/* Folder Icon */}
          <Folder
            className={cn(
              'w-5 h-5 cursor-pointer',
              isSelected ? 'text-blue-600' : 'text-gray-400'
            )}
            onClick={() =>
              setSelectedCategory(isSelected ? null : category._id)
            }
          />

          {/* Category Name */}
          <span
            className={cn(
              'flex-1 text-sm font-medium cursor-pointer',
              isSelected
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300'
            )}
            onClick={() =>
              setSelectedCategory(isSelected ? null : category._id)
            }
          >
            {language === 'en' ? category.name_en : category.name_es}
          </span>

          {/* Question Count Badge */}
          {category.question_count !== undefined && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {category.question_count}
            </Badge>
          )}

          {/* Add All Button */}
          {category.question_count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                addAllQuestionsFromCategory(category._id);
              }}
              disabled={isMaxReached}
              className="h-6 px-2 text-xs shrink-0"
            >
              <Plus className="w-3 h-3 mr-1" />
              {t.addAllFromCategory}
            </Button>
          )}
        </motion.div>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {category.children.map((child: any) =>
                renderCategory(child, level + 1)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderQuestion = (question: Question) => {
    const isSelected = selectedQuestions.includes(question._id);
    const isDisabled = !isSelected && isMaxReached;

    return (
      <motion.div
        key={question._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-4 border rounded-lg transition-all',
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          isDisabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => !isDisabled && toggleQuestion(question._id)}
            disabled={isDisabled}
            className="mt-1"
          />

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {language === 'en'
                  ? question.question_text_en
                  : question.question_text_es}
              </p>
              <FileQuestion className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {question.question_type}
              </Badge>

              {question.category_name && (
                <Badge variant="secondary" className="text-xs">
                  {question.category_name}
                </Badge>
              )}

              {question.usage_count > 0 && (
                <span className="text-xs text-gray-500">
                  {question.usage_count} {t.usage}
                </span>
              )}

              {question.is_required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>

            {/* Show options preview for multiple choice */}
            {(question.question_type === 'multiple_choice' ||
              question.question_type === 'likert') && (
              <div className="flex gap-1 flex-wrap">
                {(language === 'en' ? question.options_en : question.options_es)
                  ?.slice(0, 3)
                  .map((option, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                    >
                      {option}
                    </span>
                  ))}
                {(language === 'en' ? question.options_en : question.options_es)
                  ?.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +
                    {(language === 'en'
                      ? question.options_en
                      : question.options_es
                    ).length - 3}{' '}
                    more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t.title}
          </h3>
          <p className="text-sm text-gray-500">
            {selectedQuestions.length} {t.selected}
            {maxSelections && ` / ${maxSelections}`}
            {selectedCategories.size > 0 && (
              <>
                {' • '}
                {selectedCategories.size} {t.categoriesSelected}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCategories.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const initialCount = selectedQuestions.length;

                // Bulk add all questions from selected categories
                const promises = Array.from(selectedCategories).map(
                  (categoryId) => addAllQuestionsFromCategory(categoryId)
                );
                await Promise.all(promises);

                const addedCount = selectedQuestions.length - initialCount;
                if (addedCount > 0) {
                  toast.success(
                    language === 'es'
                      ? `${addedCount} preguntas agregadas de ${selectedCategories.size} categorías`
                      : `${addedCount} questions added from ${selectedCategories.size} categories`
                  );
                }

                setSelectedCategories(new Set()); // Clear selection after adding
              }}
              disabled={isMaxReached}
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === 'es'
                ? `Agregar de ${selectedCategories.size} Categorías`
                : `Add from ${selectedCategories.size} Categories`}
            </Button>
          )}
          {isMaxReached && <Badge variant="destructive">{t.maxReached}</Badge>}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category Tree */}
        <div className="md:col-span-1 border rounded-lg p-4 max-h-[600px] overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Categories
          </h4>
          {categoryTree.map((category) => renderCategory(category))}
        </div>

        {/* Questions List */}
        <div className="md:col-span-2 space-y-3 max-h-[600px] overflow-y-auto">
          {questionsLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
              <FileQuestion className="w-12 h-12 mb-2" />
              <p className="text-sm">{t.noQuestions}</p>
            </div>
          ) : (
            questions.map(renderQuestion)
          )}
        </div>
      </div>
    </div>
  );
}
