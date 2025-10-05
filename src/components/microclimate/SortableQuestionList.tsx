'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, Trash2, Edit2, Eye, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Sortable Question List Component
 *
 * Provides drag-and-drop reordering for selected questions.
 *
 * Features:
 * - Drag & drop to reorder
 * - Keyboard navigation (Space to grab, Arrow keys to move)
 * - Touch support for mobile
 * - Visual feedback during drag
 * - Question preview
 * - Remove question
 * - Edit question (callback)
 * - Bilingual support
 *
 * Best Practices:
 * - Accessible (keyboard navigation with ARIA)
 * - Performance optimized (uses transform instead of position)
 * - Mobile-friendly (touch sensors)
 * - Visual feedback (drag overlay)
 * - Smooth animations
 *
 * @param questions - Array of questions
 * @param onReorder - Callback when order changes
 * @param onRemove - Callback to remove question
 * @param onEdit - Optional callback to edit question
 * @param language - Display language
 */

export interface Question {
  _id: string;
  text_es: string;
  text_en: string;
  type: string;
  category_name?: string;
  is_required?: boolean;
  options_es?: string[];
  options_en?: string[];
}

interface SortableQuestionListProps {
  questions: Question[];
  onReorder: (questions: Question[]) => void;
  onRemove?: (questionId: string) => void;
  onEdit?: (questionId: string) => void;
  onPreview?: (questionId: string) => void;
  language?: 'es' | 'en';
}

/**
 * Individual Sortable Question Item
 */
function SortableQuestionItem({
  question,
  onRemove,
  onEdit,
  onPreview,
  language = 'es',
}: {
  question: Question;
  onRemove?: (id: string) => void;
  onEdit?: (id: string) => void;
  onPreview?: (id: string) => void;
  language?: 'es' | 'en';
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const t =
    language === 'es'
      ? {
          remove: 'Eliminar',
          edit: 'Editar',
          preview: 'Vista Previa',
          required: 'Requerida',
          optional: 'Opcional',
          types: {
            likert: 'Likert',
            multiple_choice: 'Opción Múltiple',
            open_ended: 'Abierta',
            scale: 'Escala',
            binary: 'Sí/No',
            matrix: 'Matriz',
            emoji_rating: 'Emojis',
          },
        }
      : {
          remove: 'Remove',
          edit: 'Edit',
          preview: 'Preview',
          required: 'Required',
          optional: 'Optional',
          types: {
            likert: 'Likert',
            multiple_choice: 'Multiple Choice',
            open_ended: 'Open-Ended',
            scale: 'Scale',
            binary: 'Yes/No',
            matrix: 'Matrix',
            emoji_rating: 'Emoji Rating',
          },
        };

  const questionText = language === 'es' ? question.text_es : question.text_en;
  const questionType =
    t.types[question.type as keyof typeof t.types] || question.type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group relative', isDragging && 'opacity-50 z-50')}
    >
      <Card className="mb-2 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="touch-none cursor-grab active:cursor-grabbing mt-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              aria-label={
                language === 'es' ? 'Arrastrar pregunta' : 'Drag question'
              }
            >
              <GripVertical className="w-5 h-5 text-gray-400" />
            </button>

            {/* Question Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium line-clamp-2">
                  {questionText}
                </p>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onPreview && (
                      <DropdownMenuItem onClick={() => onPreview(question._id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        {t.preview}
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(question._id)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        {t.edit}
                      </DropdownMenuItem>
                    )}
                    {(onPreview || onEdit) && <DropdownMenuSeparator />}
                    {onRemove && (
                      <DropdownMenuItem
                        onClick={() => onRemove(question._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t.remove}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{questionType}</Badge>
                {question.category_name && (
                  <Badge variant="secondary">{question.category_name}</Badge>
                )}
                <Badge
                  variant={question.is_required ? 'default' : 'outline'}
                  className={
                    question.is_required
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : ''
                  }
                >
                  {question.is_required ? t.required : t.optional}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Main Sortable Question List Component
 */
export function SortableQuestionList({
  questions,
  onReorder,
  onRemove,
  onEdit,
  onPreview,
  language = 'es',
}: SortableQuestionListProps) {
  const [items, setItems] = useState(questions);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const t =
    language === 'es'
      ? {
          title: 'Preguntas Seleccionadas',
          description: 'Arrastra para reordenar',
          noQuestions: 'No hay preguntas seleccionadas',
          reordered: 'Orden actualizado',
        }
      : {
          title: 'Selected Questions',
          description: 'Drag to reorder',
          noQuestions: 'No questions selected',
          reordered: 'Order updated',
        };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Notify parent component
        onReorder(newItems);

        toast.success(t.reordered);

        return newItems;
      });
    }
  };

  const handleRemove = (questionId: string) => {
    if (!onRemove) return;

    // Remove from local state
    setItems((items) => {
      const newItems = items.filter((item) => item._id !== questionId);
      onReorder(newItems);
      return newItems;
    });

    // Notify parent
    onRemove(questionId);
  };

  // Update local state when props change
  useEffect(() => {
    setItems(questions);
  }, [questions]);

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            {t.noQuestions}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {items.length} {language === 'es' ? 'preguntas' : 'questions'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((q) => q._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((question, index) => (
                <motion.div
                  key={question._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-6">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <SortableQuestionItem
                        question={question}
                        onRemove={handleRemove}
                        onEdit={onEdit}
                        onPreview={onPreview}
                        language={language}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
