import React, { useState, useEffect } from 'react';
import { IQuestion } from '@/models/Survey';
import { IQuestionResponse } from '@/models/Response';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BinaryQuestionResponseProps {
  question: IQuestion;
  value?: IQuestionResponse;
  onChange: (response: IQuestionResponse) => void;
  disabled?: boolean;
}

/**
 * Runtime component for Binary (Yes/No) questions with conditional comment field
 *
 * Features:
 * - Large Yes/No button selection
 * - Conditionally shows comment field when "Yes" is selected
 * - Enforces character limits (min/max)
 * - Shows character counter
 * - Validates required comments
 */
export default function BinaryQuestionResponse({
  question,
  value,
  onChange,
  disabled = false,
}: BinaryQuestionResponseProps) {
  const [selectedValue, setSelectedValue] = useState<boolean | null>(
    value?.response_value !== undefined ? Boolean(value.response_value) : null
  );
  const [comment, setComment] = useState<string>(value?.response_text || '');
  const [showComment, setShowComment] = useState<boolean>(false);

  const config = question.binary_comment_config;
  const commentEnabled = config?.enabled || false;

  useEffect(() => {
    // Show comment field if "Yes" is selected and comment is enabled
    setShowComment(selectedValue === true && commentEnabled);
  }, [selectedValue, commentEnabled]);

  useEffect(() => {
    // Clear comment if "No" is selected or comment field is hidden
    if (!showComment && comment) {
      setComment('');
      updateResponse(selectedValue, '');
    }
  }, [showComment]);

  const updateResponse = (
    boolValue: boolean | null,
    commentText: string = comment
  ) => {
    if (boolValue === null) {
      onChange({
        question_id: question.id,
        response_value: undefined,
        response_text: undefined,
      });
    } else {
      onChange({
        question_id: question.id,
        response_value: boolValue,
        response_text: showComment && commentText ? commentText : undefined,
      });
    }
  };

  const handleSelection = (value: boolean) => {
    setSelectedValue(value);
    updateResponse(value, comment);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newComment = e.target.value;

    // Enforce max length
    const maxLength = config?.max_length || 500;
    if (newComment.length > maxLength) {
      return;
    }

    setComment(newComment);
    updateResponse(selectedValue, newComment);
  };

  const getValidationError = (): string | null => {
    if (!showComment || !config) return null;

    const trimmedComment = comment.trim();

    if (config.required && !trimmedComment) {
      return 'A comment is required when you select "Yes"';
    }

    if (config.min_length && trimmedComment.length < config.min_length) {
      return `Comment must be at least ${config.min_length} characters (currently ${trimmedComment.length})`;
    }

    return null;
  };

  const validationError = getValidationError();
  const charCount = comment.length;
  const maxChars = config?.max_length || 500;
  const minChars = config?.min_length || 0;

  return (
    <div className="space-y-4">
      {/* Yes/No Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant={selectedValue === true ? 'default' : 'outline'}
          size="lg"
          className={cn(
            'flex-1 h-16 text-lg font-medium transition-all',
            selectedValue === true &&
              'bg-green-600 hover:bg-green-700 text-white border-green-600'
          )}
          onClick={() => handleSelection(true)}
          disabled={disabled}
        >
          <Check className="mr-2 h-5 w-5" />
          Yes
        </Button>

        <Button
          type="button"
          variant={selectedValue === false ? 'default' : 'outline'}
          size="lg"
          className={cn(
            'flex-1 h-16 text-lg font-medium transition-all',
            selectedValue === false &&
              'bg-red-600 hover:bg-red-700 text-white border-red-600'
          )}
          onClick={() => handleSelection(false)}
          disabled={disabled}
        >
          <X className="mr-2 h-5 w-5" />
          No
        </Button>
      </div>

      {/* Conditional Comment Field */}
      {showComment && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <Label
              htmlFor={`comment-${question.id}`}
              className="text-sm font-medium"
            >
              {config?.label || 'Please explain your answer'}
              {config?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <span
              className={cn(
                'text-xs',
                charCount > maxChars * 0.9
                  ? 'text-orange-500 font-medium'
                  : 'text-gray-500'
              )}
            >
              {charCount} / {maxChars}
            </span>
          </div>

          <Textarea
            id={`comment-${question.id}`}
            value={comment}
            onChange={handleCommentChange}
            placeholder={config?.placeholder || 'Enter your comment here...'}
            disabled={disabled}
            className={cn(
              'resize-none min-h-[120px]',
              validationError && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={!!validationError}
            aria-describedby={
              validationError ? `comment-error-${question.id}` : undefined
            }
          />

          {validationError && (
            <p
              id={`comment-error-${question.id}`}
              className="text-sm text-red-500 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              {validationError}
            </p>
          )}

          {!validationError &&
            minChars > 0 &&
            charCount < minChars &&
            charCount > 0 && (
              <p className="text-xs text-gray-500">
                {minChars - charCount} more character
                {minChars - charCount !== 1 ? 's' : ''} needed
              </p>
            )}
        </div>
      )}

      {/* Required Indicator */}
      {question.required && selectedValue === null && (
        <p className="text-xs text-gray-500">* This question is required</p>
      )}
    </div>
  );
}
