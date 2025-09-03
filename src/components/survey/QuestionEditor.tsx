'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { IQuestion } from '../../models/Survey';
import { cn } from '@/lib/utils';

interface QuestionEditorProps {
  question: IQuestion;
  onChange: (question: IQuestion) => void;
}

export default function QuestionEditor({
  question,
  onChange,
}: QuestionEditorProps) {
  const [showPreview, setShowPreview] = useState(true);

  const updateQuestion = (updates: Partial<IQuestion>) => {
    onChange({ ...question, ...updates });
  };

  const addOption = () => {
    const newOptions = [...(question.options || []), ''];
    updateQuestion({ options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = value;
    updateQuestion({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== index);
    updateQuestion({ options: newOptions });
  };

  const renderQuestionTypeSpecificFields = () => {
    switch (question.type) {
      case 'multiple_choice':
      case 'ranking':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Answer Options</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {(question.options || []).map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );

      case 'likert':
      case 'rating':
        return (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Scale Configuration</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor={`scale-min-${question.id}`}
                  className="text-xs text-gray-600"
                >
                  Minimum Value
                </Label>
                <Input
                  id={`scale-min-${question.id}`}
                  type="number"
                  value={question.scale_min || 1}
                  onChange={(e) =>
                    updateQuestion({ scale_min: parseInt(e.target.value) })
                  }
                  min="1"
                  max="10"
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor={`scale-max-${question.id}`}
                  className="text-xs text-gray-600"
                >
                  Maximum Value
                </Label>
                <Input
                  id={`scale-max-${question.id}`}
                  type="number"
                  value={question.scale_max || 5}
                  onChange={(e) =>
                    updateQuestion({ scale_max: parseInt(e.target.value) })
                  }
                  min="2"
                  max="10"
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {question.type === 'likert' && (
              <div className="space-y-4 pt-2">
                <Label className="text-sm font-medium">
                  Scale Labels (Optional)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor={`scale-label-min-${question.id}`}
                      className="text-xs text-gray-600"
                    >
                      Low End Label
                    </Label>
                    <Input
                      id={`scale-label-min-${question.id}`}
                      value={question.scale_labels?.min || ''}
                      onChange={(e) =>
                        updateQuestion({
                          scale_labels: {
                            ...question.scale_labels,
                            min: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., Strongly Disagree"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`scale-label-max-${question.id}`}
                      className="text-xs text-gray-600"
                    >
                      High End Label
                    </Label>
                    <Input
                      id={`scale-label-max-${question.id}`}
                      value={question.scale_labels?.max || ''}
                      onChange={(e) =>
                        updateQuestion({
                          scale_labels: {
                            ...question.scale_labels,
                            max: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., Strongly Agree"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div className="space-y-3">
        <Label
          htmlFor={`question-text-${question.id}`}
          className="text-sm font-medium"
        >
          Question Text
        </Label>
        <textarea
          id={`question-text-${question.id}`}
          value={question.text}
          onChange={(e) => updateQuestion({ text: e.target.value })}
          placeholder="Enter your question here..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
          rows={3}
        />
      </div>

      {/* Question Settings */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {question.type.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-3">
          <Switch
            id={`required-${question.id}`}
            checked={question.required}
            onCheckedChange={(checked) => updateQuestion({ required: checked })}
          />
          <Label
            htmlFor={`required-${question.id}`}
            className="text-sm font-medium cursor-pointer"
          >
            Required
          </Label>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-3">
          <Switch
            id={`preview-${question.id}`}
            checked={showPreview}
            onCheckedChange={setShowPreview}
          />
          <Label
            htmlFor={`preview-${question.id}`}
            className="text-sm font-medium cursor-pointer flex items-center gap-1"
          >
            {showPreview ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            Preview
          </Label>
        </div>
      </div>

      {/* Category (Optional) */}
      <div className="space-y-2">
        <Label
          htmlFor={`question-category-${question.id}`}
          className="text-sm font-medium"
        >
          Category <span className="text-gray-400 font-normal">(Optional)</span>
        </Label>
        <Input
          id={`question-category-${question.id}`}
          value={question.category || ''}
          onChange={(e) => updateQuestion({ category: e.target.value })}
          placeholder="e.g., Leadership, Communication, Culture"
          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
        />
      </div>

      {/* Type-specific fields */}
      {renderQuestionTypeSpecificFields()}

      {/* Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-900">
                  Live Preview
                </h4>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-white/50">
                  <p className="font-medium text-gray-900 mb-3">
                    {question.text || 'Question text will appear here...'}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </p>

                  {question.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {(question.options || ['Option 1', 'Option 2']).map(
                        (option, index) => (
                          <label
                            key={index}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="radio"
                              name={`preview-${question.id}`}
                              disabled
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">
                              {option || `Option ${index + 1}`}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  )}

                  {question.type === 'likert' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        {question.scale_labels?.min && (
                          <span>{question.scale_labels.min}</span>
                        )}
                        {question.scale_labels?.max && (
                          <span>{question.scale_labels.max}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        {Array.from(
                          {
                            length:
                              (question.scale_max || 5) -
                              (question.scale_min || 1) +
                              1,
                          },
                          (_, i) => (
                            <label
                              key={i}
                              className="flex flex-col items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`preview-${question.id}`}
                                disabled
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-xs font-medium text-gray-600">
                                {(question.scale_min || 1) + i}
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {question.type === 'open_ended' && (
                    <textarea
                      disabled
                      placeholder="Respondent's answer will appear here..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 resize-none"
                      rows={3}
                    />
                  )}

                  {question.type === 'yes_no' && (
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`preview-${question.id}`}
                          disabled
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`preview-${question.id}`}
                          disabled
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  )}

                  {question.type === 'rating' && (
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: question.scale_max || 5 },
                        (_, i) => (
                          <button
                            key={i}
                            disabled
                            className="w-8 h-8 text-yellow-400 hover:text-yellow-500 disabled:opacity-50"
                          >
                            ★
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {question.type === 'ranking' && (
                    <div className="space-y-2">
                      {(question.options || ['Option 1', 'Option 2']).map(
                        (option, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                          >
                            <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <span className="text-sm text-gray-700">
                              {option || `Option ${index + 1}`}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
