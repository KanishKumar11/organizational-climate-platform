import { IQuestion, BinaryCommentConfig } from '@/models/Survey';
import { IQuestionResponse } from '@/models/Response';

export interface BinaryQuestionValidationError {
  question_id: string;
  field: 'response_value' | 'response_text';
  message: string;
  code:
    | 'MISSING_COMMENT'
    | 'COMMENT_TOO_SHORT'
    | 'COMMENT_TOO_LONG'
    | 'INVALID_RESPONSE';
}

export interface BinaryQuestionValidationResult {
  valid: boolean;
  errors: BinaryQuestionValidationError[];
}

/**
 * Validates binary (yes/no) question responses with conditional comments
 *
 * Validation rules:
 * - If answer is "Yes" (true) and binary_comment_config.enabled is true:
 *   - If binary_comment_config.required is true, comment (response_text) must be provided
 *   - Comment must meet min_length requirement (if set)
 *   - Comment must not exceed max_length (if set)
 * - If answer is "No" (false), comment is always optional
 *
 * @param question - The survey question configuration
 * @param response - The user's response to the question
 * @returns Validation result with any errors
 */
export function validateBinaryQuestionResponse(
  question: IQuestion,
  response: IQuestionResponse
): BinaryQuestionValidationResult {
  const errors: BinaryQuestionValidationError[] = [];

  // Only validate yes_no question types
  if (question.type !== 'yes_no') {
    return { valid: true, errors: [] };
  }

  // Check if response value is valid boolean
  if (typeof response.response_value !== 'boolean') {
    errors.push({
      question_id: question.id,
      field: 'response_value',
      message: 'Binary question response must be true (Yes) or false (No)',
      code: 'INVALID_RESPONSE',
    });
    return { valid: false, errors };
  }

  // If no binary comment config, no further validation needed
  const config = question.binary_comment_config;
  if (!config || !config.enabled) {
    return { valid: true, errors: [] };
  }

  // Only validate comment when answer is "Yes" (true)
  if (response.response_value === true) {
    const comment = response.response_text?.trim();

    // Check if comment is required
    if (config.required && (!comment || comment.length === 0)) {
      errors.push({
        question_id: question.id,
        field: 'response_text',
        message: config.label
          ? `"${config.label}" is required when you answer Yes`
          : 'A comment is required when you answer Yes',
        code: 'MISSING_COMMENT',
      });
    }

    // Validate minimum length
    if (comment && config.min_length && comment.length < config.min_length) {
      errors.push({
        question_id: question.id,
        field: 'response_text',
        message: `Comment must be at least ${config.min_length} characters (current: ${comment.length})`,
        code: 'COMMENT_TOO_SHORT',
      });
    }

    // Validate maximum length
    if (comment && config.max_length && comment.length > config.max_length) {
      errors.push({
        question_id: question.id,
        field: 'response_text',
        message: `Comment must not exceed ${config.max_length} characters (current: ${comment.length})`,
        code: 'COMMENT_TOO_LONG',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates all binary question responses in a survey submission
 *
 * @param questions - Array of survey questions
 * @param responses - Array of user responses
 * @returns Combined validation result
 */
export function validateBinaryQuestionResponses(
  questions: IQuestion[],
  responses: IQuestionResponse[]
): BinaryQuestionValidationResult {
  const allErrors: BinaryQuestionValidationError[] = [];

  questions.forEach((question) => {
    if (question.type === 'yes_no') {
      const response = responses.find((r) => r.question_id === question.id);

      if (response) {
        const result = validateBinaryQuestionResponse(question, response);
        allErrors.push(...result.errors);
      }
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Get default binary comment configuration
 */
export function getDefaultBinaryCommentConfig(): BinaryCommentConfig {
  return {
    enabled: false,
    label: 'Please explain your answer',
    placeholder: 'Enter your comment here...',
    max_length: 500,
    required: false,
    min_length: 0,
  };
}
