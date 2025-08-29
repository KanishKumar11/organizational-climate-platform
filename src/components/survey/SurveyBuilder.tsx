'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { IQuestion, QuestionType } from '../../models/Survey';
import QuestionEditor from './QuestionEditor';

interface SurveyBuilderProps {
  title: string;
  description: string;
  questions: IQuestion[];
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onQuestionsChange: (questions: IQuestion[]) => void;
}

export default function SurveyBuilder({
  title,
  description,
  questions,
  onTitleChange,
  onDescriptionChange,
  onQuestionsChange,
}: SurveyBuilderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: IQuestion = {
      id: `q_${Date.now()}`,
      text: '',
      type,
      required: true,
      order: questions.length,
      options:
        type === 'multiple_choice' || type === 'ranking' ? [''] : undefined,
      scale_min: type === 'likert' || type === 'rating' ? 1 : undefined,
      scale_max: type === 'likert' || type === 'rating' ? 5 : undefined,
    };

    onQuestionsChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedQuestion: IQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onQuestionsChange(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    // Reorder remaining questions
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i }));
    onQuestionsChange(reorderedQuestions);
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);

    // Reorder all questions
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i }));
    onQuestionsChange(reorderedQuestions);
  };

  const questionTypes: {
    type: QuestionType;
    label: string;
    description: string;
  }[] = [
    {
      type: 'likert',
      label: 'Likert Scale',
      description: '1-5 or 1-7 scale rating',
    },
    {
      type: 'multiple_choice',
      label: 'Multiple Choice',
      description: 'Select one option',
    },
    { type: 'ranking', label: 'Ranking', description: 'Rank options in order' },
    {
      type: 'open_ended',
      label: 'Open Text',
      description: 'Free text response',
    },
    { type: 'yes_no', label: 'Yes/No', description: 'Binary choice' },
    { type: 'rating', label: 'Star Rating', description: '1-10 star rating' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Survey Header */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="survey-title">Survey Title</Label>
            <Input
              id="survey-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter survey title..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="survey-description">Description</Label>
            <textarea
              id="survey-description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Enter survey description..."
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Questions ({questions.length})
          </h3>
        </div>

        <AnimatePresence>
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                      <span className="text-sm font-medium text-gray-600">
                        Question {index + 1}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <QuestionEditor
                    question={question}
                    onChange={(updatedQuestion) =>
                      updateQuestion(index, updatedQuestion)
                    }
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {questions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-500"
          >
            <p>No questions added yet. Add your first question below.</p>
          </motion.div>
        )}
      </div>

      {/* Add Question Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add Question</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {questionTypes.map((type) => (
              <motion.div
                key={type.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={() => addQuestion(type.type)}
                  className="w-full h-auto p-4 flex flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <span className="text-xs text-gray-500 text-left">
                    {type.description}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
