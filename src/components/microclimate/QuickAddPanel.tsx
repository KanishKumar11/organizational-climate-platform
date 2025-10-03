'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { useQuickAddQuestions, Question } from '@/hooks/useQuestionLibrary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Quick-Add Panel Component
 *
 * Displays most frequently used questions for one-click adding.
 *
 * Features:
 * - Top 10 most used questions
 * - One-click add
 * - Compact card layout
 * - Usage statistics
 *
 * @param onAddQuestion - Callback when question is added
 * @param addedQuestions - Array of already added question IDs
 * @param language - Display language
 * @param limit - Number of questions to show (default: 10)
 */

interface QuickAddPanelProps {
  onAddQuestion: (question: Question) => void;
  addedQuestions: string[];
  language?: 'es' | 'en';
  limit?: number;
}

export function QuickAddPanel({
  onAddQuestion,
  addedQuestions,
  language = 'es',
  limit = 10,
}: QuickAddPanelProps) {
  const { data, isLoading } = useQuickAddQuestions(limit);

  const t =
    language === 'es'
      ? {
          title: 'Preguntas Más Usadas',
          subtitle: 'Agrega rápidamente las preguntas más populares',
          add: 'Agregar',
          added: 'Agregada',
          usage: 'veces',
        }
      : {
          title: 'Most Used Questions',
          subtitle: 'Quickly add the most popular questions',
          add: 'Add',
          added: 'Added',
          usage: 'times',
        };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const questions = data?.questions || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t.title}
          </h3>
          <p className="text-sm text-gray-500">{t.subtitle}</p>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {questions.map((question, index) => {
          const isAdded = addedQuestions.includes(question._id);

          return (
            <motion.div
              key={question._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'relative p-4 border rounded-lg transition-all',
                isAdded
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {/* Rank Badge */}
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {index + 1}
              </div>

              <div className="space-y-3">
                {/* Question Text */}
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                  {language === 'en'
                    ? question.question_text_en
                    : question.question_text_es}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {question.question_type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {question.usage_count} {t.usage}
                    </span>
                  </div>

                  {/* Add Button */}
                  <Button
                    size="sm"
                    onClick={() => onAddQuestion(question)}
                    disabled={isAdded}
                    className={cn(
                      'transition-all',
                      isAdded ? 'bg-green-600 hover:bg-green-700' : ''
                    )}
                  >
                    {isAdded ? (
                      <>
                        <span className="mr-2">✓</span>
                        {t.added}
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 mr-1" />
                        {t.add}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {questions.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Sparkles className="w-12 h-12 mb-2" />
          <p className="text-sm">No quick-add questions available</p>
        </div>
      )}
    </div>
  );
}
