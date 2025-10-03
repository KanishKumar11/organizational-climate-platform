'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Languages, Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Multilingual Question Editor Component
 *
 * Side-by-side Spanish/English editor for creating questions.
 *
 * Features:
 * - Split view (ES left, EN right)
 * - Synchronized fields
 * - Live preview
 * - Validation (both languages required)
 * - Support for all question types
 *
 * @param onSave - Callback when question is saved
 * @param initialData - Initial question data (for editing)
 * @param language - Primary language for UI
 */

interface MultilingualQuestionEditorProps {
  onSave: (question: any) => void;
  onCancel?: () => void;
  initialData?: any;
  language?: 'es' | 'en';
}

export function MultilingualQuestionEditor({
  onSave,
  onCancel,
  initialData,
  language = 'es',
}: MultilingualQuestionEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    question_text_es: initialData?.question_text_es || '',
    question_text_en: initialData?.question_text_en || '',
    question_type: initialData?.question_type || 'likert',
    options_es: initialData?.options_es || [''],
    options_en: initialData?.options_en || [''],
    is_required: initialData?.is_required || false,
  });

  const t =
    language === 'es'
      ? {
          title: 'Editor de Preguntas Multilingüe',
          spanish: 'Español',
          english: 'English',
          questionText: 'Texto de la pregunta',
          questionType: 'Tipo de pregunta',
          options: 'Opciones',
          addOption: 'Agregar opción',
          removeOption: 'Eliminar',
          required: 'Requerida',
          preview: 'Vista previa',
          hidePreview: 'Ocultar vista previa',
          save: 'Guardar Pregunta',
          cancel: 'Cancelar',
          validation: {
            bothLanguages: 'Ambos idiomas son requeridos',
            minOptions: 'Se requieren al menos 2 opciones',
          },
          types: {
            likert: 'Escala Likert',
            multiple_choice: 'Opción múltiple',
            open_ended: 'Respuesta abierta',
            yes_no: 'Sí/No',
            rating: 'Calificación',
          },
        }
      : {
          title: 'Multilingual Question Editor',
          spanish: 'Español',
          english: 'English',
          questionText: 'Question text',
          questionType: 'Question type',
          options: 'Options',
          addOption: 'Add option',
          removeOption: 'Remove',
          required: 'Required',
          preview: 'Preview',
          hidePreview: 'Hide preview',
          save: 'Save Question',
          cancel: 'Cancel',
          validation: {
            bothLanguages: 'Both languages are required',
            minOptions: 'At least 2 options required',
          },
          types: {
            likert: 'Likert Scale',
            multiple_choice: 'Multiple Choice',
            open_ended: 'Open Ended',
            yes_no: 'Yes/No',
            rating: 'Rating',
          },
        };

  const requiresOptions = ['likert', 'multiple_choice', 'rating'].includes(
    formData.question_type
  );

  const addOption = () => {
    setFormData({
      ...formData,
      options_es: [...formData.options_es, ''],
      options_en: [...formData.options_en, ''],
    });
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options_es: formData.options_es.filter((_, i) => i !== index),
      options_en: formData.options_en.filter((_, i) => i !== index),
    });
  };

  const updateOption = (index: number, value: string, lang: 'es' | 'en') => {
    const key = `options_${lang}` as const;
    const newOptions = [...formData[key]];
    newOptions[index] = value;
    setFormData({
      ...formData,
      [key]: newOptions,
    });
  };

  const handleSave = () => {
    // Validation
    if (
      !formData.question_text_es.trim() ||
      !formData.question_text_en.trim()
    ) {
      alert(t.validation.bothLanguages);
      return;
    }

    if (
      requiresOptions &&
      formData.options_es.filter((o) => o.trim()).length < 2
    ) {
      alert(t.validation.minOptions);
      return;
    }

    onSave({
      ...formData,
      options_es: requiresOptions
        ? formData.options_es.filter((o) => o.trim())
        : [],
      options_en: requiresOptions
        ? formData.options_en.filter((o) => o.trim())
        : [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Languages className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t.title}
          </h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              {t.hidePreview}
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              {t.preview}
            </>
          )}
        </Button>
      </div>

      {/* Question Type */}
      <div>
        <Label>{t.questionType}</Label>
        <Select
          value={formData.question_type}
          onValueChange={(value) =>
            setFormData({ ...formData, question_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="likert">{t.types.likert}</SelectItem>
            <SelectItem value="multiple_choice">
              {t.types.multiple_choice}
            </SelectItem>
            <SelectItem value="open_ended">{t.types.open_ended}</SelectItem>
            <SelectItem value="yes_no">{t.types.yes_no}</SelectItem>
            <SelectItem value="rating">{t.types.rating}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Split View Editor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spanish Column */}
        <div className="space-y-4 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
              {t.spanish}
            </Badge>
          </div>

          {/* Question Text ES */}
          <div>
            <Label>{t.questionText}</Label>
            <Textarea
              value={formData.question_text_es}
              onChange={(e) =>
                setFormData({ ...formData, question_text_es: e.target.value })
              }
              placeholder="¿Cuál es tu nivel de satisfacción?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Options ES */}
          {requiresOptions && (
            <div className="space-y-2">
              <Label>{t.options}</Label>
              {formData.options_es.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value, 'es')}
                    placeholder={`Opción ${index + 1}`}
                  />
                  {formData.options_es.length > 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                + {t.addOption}
              </Button>
            </div>
          )}
        </div>

        {/* English Column */}
        <div className="space-y-4 p-4 border-2 border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-green-50 dark:bg-green-900/20"
            >
              {t.english}
            </Badge>
          </div>

          {/* Question Text EN */}
          <div>
            <Label>{t.questionText}</Label>
            <Textarea
              value={formData.question_text_en}
              onChange={(e) =>
                setFormData({ ...formData, question_text_en: e.target.value })
              }
              placeholder="What is your satisfaction level?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Options EN */}
          {requiresOptions && (
            <div className="space-y-2">
              <Label>{t.options}</Label>
              {formData.options_en.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value, 'en')}
                    placeholder={`Option ${index + 1}`}
                  />
                  {formData.options_en.length > 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-4"
        >
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            {t.preview}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">
                {formData.question_text_es || '...'}
              </p>
              {requiresOptions &&
                formData.options_es
                  .filter((o) => o.trim())
                  .map((opt, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-600 dark:text-gray-400"
                    >
                      • {opt}
                    </div>
                  ))}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">
                {formData.question_text_en || '...'}
              </p>
              {requiresOptions &&
                formData.options_en
                  .filter((o) => o.trim())
                  .map((opt, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-600 dark:text-gray-400"
                    >
                      • {opt}
                    </div>
                  ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            {t.cancel}
          </Button>
        )}
        <Button onClick={handleSave}>{t.save}</Button>
      </div>
    </div>
  );
}
