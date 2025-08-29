'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { IQuestion } from '../../models/Survey';

interface QuestionEditorProps {
  question: IQuestion;
  onChange: (question: IQuestion) => void;
}

export default function QuestionEditor({
  question,
  onChange,
}: QuestionEditorProps) {
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {(question.options || []).map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2"
                >
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'likert':
      case 'rating':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`scale-min-${question.id}`}>Scale Minimum</Label>
              <Input
                id={`scale-min-${question.id}`}
                type="number"
                value={question.scale_min || 1}
                onChange={(e) =>
                  updateQuestion({ scale_min: parseInt(e.target.value) })
                }
                min="1"
                max="10"
              />
            </div>
            <div>
              <Label htmlFor={`scale-max-${question.id}`}>Scale Maximum</Label>
              <Input
                id={`scale-max-${question.id}`}
                type="number"
                value={question.scale_max || 5}
                onChange={(e) =>
                  updateQuestion({ scale_max: parseInt(e.target.value) })
                }
                min="2"
                max="10"
              />
            </div>
            {question.type === 'likert' && (
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`scale-label-min-${question.id}`}>
                    Min Label (Optional)
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
                  />
                </div>
                <div>
                  <Label htmlFor={`scale-label-max-${question.id}`}>
                    Max Label (Optional)
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
                  />
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
    <div className="space-y-4">
      {/* Question Text */}
      <div>
        <Label htmlFor={`question-text-${question.id}`}>Question Text</Label>
        <textarea
          id={`question-text-${question.id}`}
          value={question.text}
          onChange={(e) => updateQuestion({ text: e.target.value })}
          placeholder="Enter your question..."
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
        />
      </div>

      {/* Question Type Badge */}
      <div className="flex items-center space-x-2">
        <Badge variant="secondary">
          {question.type.replace('_', ' ').toUpperCase()}
        </Badge>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) => updateQuestion({ required: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Required</span>
        </label>
      </div>

      {/* Category (Optional) */}
      <div>
        <Label htmlFor={`question-category-${question.id}`}>
          Category (Optional)
        </Label>
        <Input
          id={`question-category-${question.id}`}
          value={question.category || ''}
          onChange={(e) => updateQuestion({ category: e.target.value })}
          placeholder="e.g., Leadership, Communication, Culture"
        />
      </div>

      {/* Type-specific fields */}
      {renderQuestionTypeSpecificFields()}

      {/* Preview */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
        <div className="space-y-2">
          <p className="text-gray-900">
            {question.text || 'Question text will appear here...'}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </p>

          {question.type === 'multiple_choice' && (
            <div className="space-y-1">
              {(question.options || []).map((option, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`preview-${question.id}`}
                    disabled
                  />
                  <span className="text-sm text-gray-600">
                    {option || `Option ${index + 1}`}
                  </span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'likert' && (
            <div className="flex items-center space-x-2">
              {question.scale_labels?.min && (
                <span className="text-xs text-gray-500">
                  {question.scale_labels.min}
                </span>
              )}
              {Array.from(
                {
                  length:
                    (question.scale_max || 5) - (question.scale_min || 1) + 1,
                },
                (_, i) => (
                  <label key={i} className="flex flex-col items-center">
                    <input
                      type="radio"
                      name={`preview-${question.id}`}
                      disabled
                    />
                    <span className="text-xs text-gray-500">
                      {(question.scale_min || 1) + i}
                    </span>
                  </label>
                )
              )}
              {question.scale_labels?.max && (
                <span className="text-xs text-gray-500">
                  {question.scale_labels.max}
                </span>
              )}
            </div>
          )}

          {question.type === 'open_ended' && (
            <textarea
              disabled
              placeholder="Respondent's answer will appear here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              rows={3}
            />
          )}

          {question.type === 'yes_no' && (
            <div className="space-y-1">
              <label className="flex items-center space-x-2">
                <input type="radio" name={`preview-${question.id}`} disabled />
                <span className="text-sm text-gray-600">Yes</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name={`preview-${question.id}`} disabled />
                <span className="text-sm text-gray-600">No</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
