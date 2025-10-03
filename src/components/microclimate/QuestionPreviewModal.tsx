'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { QuestionRenderer } from '@/components/survey/QuestionRenderer';
import {
  Eye,
  Plus,
  Tag,
  Globe,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Star,
} from 'lucide-react';

/**
 * QuestionPreviewModal Component
 *
 * Displays a modal preview of a question before adding it to the survey.
 * Shows the question in both languages, category, type, and a sample
 * rendering of how it will appear to respondents.
 *
 * Features:
 * - Bilingual preview (ES/EN)
 * - Question metadata (category, type)
 * - Sample rendering with QuestionRenderer
 * - Add to survey action
 * - Close modal action
 *
 * @component
 * @example
 * ```tsx
 * <QuestionPreviewModal
 *   question={questionData}
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onAdd={handleAddQuestion}
 *   language="es"
 * />
 * ```
 */

export interface PreviewQuestion {
  _id: string;
  question_text_es: string;
  question_text_en: string;
  question_type:
    | 'yes_no'
    | 'yes_no_comment'
    | 'scale_1_5'
    | 'scale_1_10'
    | 'multiple_choice'
    | 'open_text'
    | 'rating'
    | 'nps';
  category:
    | 'leadership'
    | 'communication'
    | 'teamwork'
    | 'worklife'
    | 'development'
    | 'recognition'
    | 'resources'
    | 'culture'
    | 'satisfaction'
    | 'engagement';
  subcategory?: string;
  options_es?: string[];
  options_en?: string[];
  is_required?: boolean;
  allow_comments?: boolean;
  reverse_scale?: boolean;
  custom_scale_labels_es?: { min: string; max: string };
  custom_scale_labels_en?: { min: string; max: string };
}

interface QuestionPreviewModalProps {
  question: PreviewQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (question: PreviewQuestion) => void;
  language?: 'es' | 'en';
  isAlreadyAdded?: boolean;
}

const categoryTranslations = {
  es: {
    leadership: 'Liderazgo',
    communication: 'Comunicación',
    teamwork: 'Trabajo en Equipo',
    worklife: 'Equilibrio Vida-Trabajo',
    development: 'Desarrollo Profesional',
    recognition: 'Reconocimiento',
    resources: 'Recursos',
    culture: 'Cultura',
    satisfaction: 'Satisfacción',
    engagement: 'Compromiso',
  },
  en: {
    leadership: 'Leadership',
    communication: 'Communication',
    teamwork: 'Teamwork',
    worklife: 'Work-Life Balance',
    development: 'Professional Development',
    recognition: 'Recognition',
    resources: 'Resources',
    culture: 'Culture',
    satisfaction: 'Satisfaction',
    engagement: 'Engagement',
  },
};

const typeTranslations = {
  es: {
    yes_no: 'Sí/No',
    yes_no_comment: 'Sí/No con Comentario',
    scale_1_5: 'Escala 1-5',
    scale_1_10: 'Escala 1-10',
    multiple_choice: 'Opción Múltiple',
    open_text: 'Texto Abierto',
    rating: 'Calificación',
    nps: 'NPS',
  },
  en: {
    yes_no: 'Yes/No',
    yes_no_comment: 'Yes/No with Comment',
    scale_1_5: 'Scale 1-5',
    scale_1_10: 'Scale 1-10',
    multiple_choice: 'Multiple Choice',
    open_text: 'Open Text',
    rating: 'Rating',
    nps: 'NPS',
  },
};

const translations = {
  es: {
    title: 'Vista Previa de Pregunta',
    description: 'Revisa cómo se verá esta pregunta en la encuesta',
    category: 'Categoría',
    type: 'Tipo',
    required: 'Obligatoria',
    optional: 'Opcional',
    allowsComments: 'Permite comentarios',
    reverseScale: 'Escala invertida',
    spanishVersion: 'Versión en Español',
    englishVersion: 'Versión en Inglés',
    preview: 'Vista Previa',
    addToSurvey: 'Agregar a la Encuesta',
    alreadyAdded: 'Ya agregada',
    close: 'Cerrar',
    sampleResponse: 'Ejemplo de respuesta',
  },
  en: {
    title: 'Question Preview',
    description: 'Review how this question will appear in the survey',
    category: 'Category',
    type: 'Type',
    required: 'Required',
    optional: 'Optional',
    allowsComments: 'Allows comments',
    reverseScale: 'Reverse scale',
    spanishVersion: 'Spanish Version',
    englishVersion: 'English Version',
    preview: 'Preview',
    addToSurvey: 'Add to Survey',
    alreadyAdded: 'Already added',
    close: 'Close',
    sampleResponse: 'Sample response',
  },
};

export function QuestionPreviewModal({
  question,
  isOpen,
  onClose,
  onAdd,
  language = 'es',
  isAlreadyAdded = false,
}: QuestionPreviewModalProps) {
  const t = translations[language];
  const categoryT = categoryTranslations[language];
  const typeT = typeTranslations[language];

  if (!question) return null;

  const handleAdd = () => {
    if (onAdd && !isAlreadyAdded) {
      onAdd(question);
      onClose();
    }
  };

  // Sample response for preview
  const sampleResponse = {
    _id: 'preview-response',
    survey_id: 'preview',
    question_id: question._id,
    respondent_email: 'preview@example.com',
    response_value:
      question.question_type === 'yes_no' ||
      question.question_type === 'yes_no_comment'
        ? 'yes'
        : question.question_type === 'scale_1_5'
          ? '4'
          : question.question_type === 'scale_1_10'
            ? '8'
            : question.question_type === 'nps'
              ? '9'
              : question.question_type === 'multiple_choice' &&
                  question.options_es
                ? question.options_es[0]
                : language === 'es'
                  ? 'Respuesta de ejemplo'
                  : 'Sample response',
    response_text: question.allow_comments
      ? language === 'es'
        ? 'Este es un comentario de ejemplo'
        : 'This is a sample comment'
      : undefined,
    responded_at: new Date(),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Metadata */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {t.category}: {categoryT[question.category]}
            </Badge>
            <Badge variant="outline">
              {t.type}: {typeT[question.question_type]}
            </Badge>
            {question.is_required ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t.required}
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {t.optional}
              </Badge>
            )}
            {question.allow_comments && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {t.allowsComments}
              </Badge>
            )}
            {question.reverse_scale && (
              <Badge variant="secondary">{t.reverseScale}</Badge>
            )}
          </div>

          {/* Spanish Version */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t.spanishVersion}
                </h3>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-900 dark:text-gray-100 mb-4">
                  {question.question_text_es}
                </p>
                {question.options_es && question.options_es.length > 0 && (
                  <div className="space-y-2">
                    {question.options_es.map((option, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* English Version */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t.englishVersion}
                </h3>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-900 dark:text-gray-100 mb-4">
                  {question.question_text_en}
                </p>
                {question.options_en && question.options_en.length > 0 && (
                  <div className="space-y-2">
                    {question.options_en.map((option, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Interactive Preview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t.preview} ({language === 'es' ? 'Español' : 'English'})
                </h3>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <QuestionRenderer
                  question={
                    {
                      ...question,
                      id: question._id,
                    } as any
                  }
                  response={sampleResponse}
                  onResponse={() => {}}
                  questionNumber={1}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                {t.sampleResponse}
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t.close}
          </Button>
          {onAdd && (
            <Button
              onClick={handleAdd}
              disabled={isAlreadyAdded}
              className={isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isAlreadyAdded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t.alreadyAdded}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t.addToSurvey}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
