import React from 'react';
import { IQuestion, BinaryCommentConfig } from '@/models/Survey';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface BinaryQuestionConfigProps {
  question: IQuestion;
  onUpdate: (config: BinaryCommentConfig) => void;
}

/**
 * Configuration panel for Binary (Yes/No) questions with conditional comment field
 *
 * Allows survey creators to configure:
 * - Enable/disable conditional comment field
 * - Custom label for the comment field
 * - Placeholder text
 * - Character limits (min/max)
 * - Whether the comment is required when user selects "Yes"
 */
export default function BinaryQuestionConfig({
  question,
  onUpdate,
}: BinaryQuestionConfigProps) {
  // Get current config or use defaults
  const config: BinaryCommentConfig = question.binary_comment_config || {
    enabled: false,
    label: 'Please explain your answer',
    placeholder: 'Enter your comment here...',
    max_length: 500,
    required: false,
    min_length: 0,
  };

  const handleUpdate = (updates: Partial<BinaryCommentConfig>) => {
    onUpdate({ ...config, ...updates });
  };

  if (question.type !== 'yes_no') {
    return null;
  }

  return (
    <Card className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="enable-comment" className="text-sm font-medium">
            Conditional Comment Field
          </Label>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Show a text field when user selects "Yes"
          </p>
        </div>
        <Switch
          id="enable-comment"
          checked={config.enabled}
          onCheckedChange={(enabled) => handleUpdate({ enabled })}
        />
      </div>

      {config.enabled && (
        <div className="space-y-4 pl-4 border-l-2 border-blue-500">
          {/* Comment Label */}
          <div className="space-y-2">
            <Label htmlFor="comment-label" className="text-sm">
              Comment Field Label
            </Label>
            <Input
              id="comment-label"
              type="text"
              value={config.label || ''}
              onChange={(e) => handleUpdate({ label: e.target.value })}
              placeholder="Please explain your answer"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Label shown above the comment field
            </p>
          </div>

          {/* Placeholder Text */}
          <div className="space-y-2">
            <Label htmlFor="comment-placeholder" className="text-sm">
              Placeholder Text
            </Label>
            <Input
              id="comment-placeholder"
              type="text"
              value={config.placeholder || ''}
              onChange={(e) => handleUpdate({ placeholder: e.target.value })}
              placeholder="Enter your comment here..."
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Hint text shown in the empty field
            </p>
          </div>

          {/* Required Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="comment-required" className="text-sm">
                Make Comment Required
              </Label>
              <p className="text-xs text-gray-500">
                User must provide a comment when selecting "Yes"
              </p>
            </div>
            <Switch
              id="comment-required"
              checked={config.required || false}
              onCheckedChange={(required) => handleUpdate({ required })}
            />
          </div>

          {/* Character Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-length" className="text-sm">
                Minimum Characters
              </Label>
              <Input
                id="min-length"
                type="number"
                min="0"
                max={config.max_length || 5000}
                value={config.min_length || 0}
                onChange={(e) =>
                  handleUpdate({
                    min_length: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500">Optional minimum length</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-length" className="text-sm">
                Maximum Characters
              </Label>
              <Input
                id="max-length"
                type="number"
                min={config.min_length || 10}
                max="5000"
                value={config.max_length || 500}
                onChange={(e) =>
                  handleUpdate({
                    max_length: parseInt(e.target.value, 10) || 500,
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500">Max: 5000 characters</p>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 mb-2">Preview:</p>
            <div className="space-y-2">
              <Label className="text-sm">
                {config.label || 'Please explain your answer'}
              </Label>
              <Textarea
                placeholder={config.placeholder || 'Enter your comment here...'}
                disabled
                className="resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500">
                {config.required && (
                  <span className="text-red-500">
                    * Required when "Yes" is selected •{' '}
                  </span>
                )}
                {config.min_length! > 0 && `Min: ${config.min_length} chars • `}
                Max: {config.max_length || 500} chars
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
