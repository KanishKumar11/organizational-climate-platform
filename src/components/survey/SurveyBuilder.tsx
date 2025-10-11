'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  CheckSquare,
  Star,
  ToggleLeft,
  List,
  BarChart3,
  FileText,
  Copy,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Smile,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { IQuestion, QuestionType } from '../../models/Survey';
import QuestionEditor from './QuestionEditor';
import { cn } from '@/lib/utils';

interface SurveyBuilderProps {
  questions: IQuestion[];
  onQuestionsChange: (questions: IQuestion[]) => void;
}

export default function SurveyBuilder({
  questions,
  onQuestionsChange,
}: SurveyBuilderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: IQuestion = {
      id: `q_${Date.now()}`,
      text: '',
      type,
      required: true,
      order: questions.length,
      options:
        type === 'multiple_choice' || type === 'ranking' ? [''] : undefined,
      scale_min: type === 'likert' ? 1 : undefined,
      scale_max: type === 'likert' ? 5 : undefined,
      comment_required: type === 'yes_no_comment' ? true : undefined,
      comment_prompt:
        type === 'yes_no_comment' ? 'Please explain your answer:' : undefined,
      emoji_options:
        type === 'emoji_scale'
          ? [
              { emoji: '😞', label: 'Very Dissatisfied', value: 1 },
              { emoji: '😕', label: 'Dissatisfied', value: 2 },
              { emoji: '😐', label: 'Neutral', value: 3 },
              { emoji: '🙂', label: 'Satisfied', value: 4 },
              { emoji: '😊', label: 'Very Satisfied', value: 5 },
            ]
          : undefined,
    };

    onQuestionsChange([...questions, newQuestion]);
    setExpandedQuestion(newQuestion.id);
  };

  const updateQuestion = (index: number, updatedQuestion: IQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onQuestionsChange(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i }));
    onQuestionsChange(reorderedQuestions);
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const duplicatedQuestion: IQuestion = {
      ...questionToDuplicate,
      id: `q_${Date.now()}`,
      text: `${questionToDuplicate.text} (Copy)`,
      order: questions.length,
    };
    onQuestionsChange([...questions, duplicatedQuestion]);
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i }));
    onQuestionsChange(reorderedQuestions);
  };

  const questionTypes: {
    type: QuestionType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }[] = [
    {
      type: 'likert',
      label: 'Likert Scale',
      description: 'Agreement scale (1-5 or 1-7)',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
    },
    {
      type: 'multiple_choice',
      label: 'Multiple Choice',
      description: 'Select one from options',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
    },
    {
      type: 'ranking',
      label: 'Ranking',
      description: 'Rank options in order',
      icon: List,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
    },
    {
      type: 'open_ended',
      label: 'Open Text',
      description: 'Free text response',
      icon: Type,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
    },
    {
      type: 'yes_no',
      label: 'Yes/No',
      description: 'Binary choice question',
      icon: ToggleLeft,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
    },
    {
      type: 'yes_no_comment',
      label: 'Yes/No with Comment',
      description: 'Binary choice with follow-up comment',
      icon: MessageSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
    },
    {
      type: 'rating',
      label: 'Star Rating',
      description: '1-10 star rating scale',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
    },
    {
      type: 'emoji_scale',
      label: 'Emoji Scale',
      description: 'Emoji-based rating scale',
      icon: Smile,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 border-pink-200',
    },
  ];

  const getQuestionTypeConfig = (type: QuestionType) => {
    return questionTypes.find((qt) => qt.type === type) || questionTypes[0];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Survey Header */}
      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-gray-900">Questions</h3>
            <Badge variant="secondary" className="px-2 py-1 text-xs">
              {questions.length}
            </Badge>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {questions.map((question, index) => {
            const config = getQuestionTypeConfig(question.type);
            const isExpanded = expandedQuestion === question.id;

            return (
              <motion.div
                key={question.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="relative group"
              >
                <Card
                  className={cn(
                    'border border-gray-200 bg-white hover:border-gray-300 transition-colors',
                    isExpanded && 'border-blue-300 ring-1 ring-blue-100',
                    draggedIndex === index && 'opacity-50',
                    draggedIndex !== null &&
                      draggedIndex !== index &&
                      'border-dashed border-blue-300'
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIndex !== null && draggedIndex !== index) {
                      moveQuestion(draggedIndex, index);
                    }
                    setDraggedIndex(null);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100"
                            draggable
                            onDragStart={(e) => {
                              setDraggedIndex(index);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => setDraggedIndex(null)}
                          >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </Button>

                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg border flex items-center justify-center',
                              config.bgColor
                            )}
                          >
                            <config.icon
                              className={cn('h-4 w-4', config.color)}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                Question {index + 1}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              {config.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedQuestion(isExpanded ? null : question.id)
                          }
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateQuestion(index)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteQuestion(index)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {(isExpanded || !question.text) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0">
                          <Separator className="mb-6" />
                          <QuestionEditor
                            question={question}
                            onChange={(updatedQuestion) =>
                              updateQuestion(index, updatedQuestion)
                            }
                          />
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Question Preview when collapsed */}
                  {!isExpanded && question.text && (
                    <CardContent className="pt-0 pb-4">
                      <div
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setExpandedQuestion(question.id)}
                      >
                        <p className="font-medium text-gray-900 mb-2 text-sm">
                          {question.text}
                          {question.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>

                        {question.options && question.options.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {question.options.slice(0, 3).map((option, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs"
                              >
                                {option || `Option ${i + 1}`}
                              </Badge>
                            ))}
                            {question.options.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{question.options.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {(question.scale_min || question.scale_max) && (
                          <Badge variant="secondary" className="text-xs">
                            Scale: {question.scale_min} - {question.scale_max}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {questions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-100 flex items-center justify-center">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No questions yet
            </h3>
            <p className="text-gray-500 mb-6">
              Add your first question to get started building your survey
            </p>
          </motion.div>
        )}
      </div>

      {/* Add Question Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">
                  Add Question
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Choose a question type to add to your survey
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {questionTypes.map((type) => (
                <motion.div
                  key={type.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => addQuestion(type.type)}
                    className="w-full h-auto p-4 flex flex-col items-center space-y-3 border-gray-200 bg-white hover:bg-gray-50 transition-colors group"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg border flex items-center justify-center transition-colors',
                        type.bgColor,
                        'group-hover:scale-105'
                      )}
                    >
                      <type.icon className={cn('h-5 w-5', type.color)} />
                    </div>
                    <div className="text-center">
                      <span className="font-medium text-gray-900 block text-sm">
                        {type.label}
                      </span>
                      <span className="text-xs text-gray-500 mt-1 block leading-relaxed">
                        {type.description}
                      </span>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
