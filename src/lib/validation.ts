import { ISurvey, IQuestion } from '@/models/Survey';
import { IQuestionResponse, IDemographicResponse } from '@/models/Response';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface QuestionValidationResult {
  questionId: string;
  isValid: boolean;
  errors: string[];
}

// Validate individual question response
export function validateQuestionResponse(
  question: IQuestion,
  response: IQuestionResponse
): QuestionValidationResult {
  const errors: string[] = [];

  // Check if required question has a response
  if (
    question.required &&
    (!response.response_value || response.response_value === '')
  ) {
    errors.push(`Question "${question.text}" is required`);
  }

  // Skip further validation if no response provided for optional question
  if (!response.response_value && !question.required) {
    return {
      questionId: question.id,
      isValid: true,
      errors: [],
    };
  }

  // Validate based on question type
  switch (question.type) {
    case 'likert':
    case 'rating':
      const numValue = Number(response.response_value);
      if (isNaN(numValue)) {
        errors.push(`Invalid numeric value for question "${question.text}"`);
      } else {
        const min = question.scale_min || 1;
        const max = question.scale_max || 5;
        if (numValue < min || numValue > max) {
          errors.push(
            `Value must be between ${min} and ${max} for question "${question.text}"`
          );
        }
      }
      break;

    case 'multiple_choice':
      if (
        question.options &&
        !question.options.includes(String(response.response_value))
      ) {
        errors.push(`Invalid option selected for question "${question.text}"`);
      }
      break;

    case 'ranking':
      if (Array.isArray(response.response_value)) {
        const rankings = response.response_value as string[];
        if (question.options) {
          // Check if all options are ranked
          const missingOptions = question.options.filter(
            (opt) => !rankings.includes(opt)
          );
          if (missingOptions.length > 0) {
            errors.push(
              `Missing rankings for options: ${missingOptions.join(', ')}`
            );
          }

          // Check for duplicate rankings
          const uniqueRankings = new Set(rankings);
          if (uniqueRankings.size !== rankings.length) {
            errors.push(
              `Duplicate rankings found for question "${question.text}"`
            );
          }
        }
      } else {
        errors.push(
          `Ranking question "${question.text}" must have array response`
        );
      }
      break;

    case 'open_ended':
      const textValue = String(response.response_value);
      if (textValue.length > 2000) {
        errors.push(
          `Response too long for question "${question.text}" (max 2000 characters)`
        );
      }
      break;

    case 'yes_no':
      const yesNoValue = String(response.response_value).toLowerCase();
      if (!['yes', 'no', 'true', 'false', '1', '0'].includes(yesNoValue)) {
        errors.push(`Invalid yes/no response for question "${question.text}"`);
      }
      break;
  }

  return {
    questionId: question.id,
    isValid: errors.length === 0,
    errors,
  };
}

// Validate demographic response
export function validateDemographicResponse(
  demographic: any,
  response: IDemographicResponse
): ValidationResult {
  const errors: string[] = [];

  if (demographic.required && (!response.value || response.value === '')) {
    errors.push(`Demographic field "${demographic.label}" is required`);
  }

  if (response.value) {
    switch (demographic.type) {
      case 'select':
        if (
          demographic.options &&
          !demographic.options.includes(String(response.value))
        ) {
          errors.push(`Invalid option for demographic "${demographic.label}"`);
        }
        break;

      case 'number':
        if (isNaN(Number(response.value))) {
          errors.push(
            `Invalid numeric value for demographic "${demographic.label}"`
          );
        }
        break;

      case 'text':
        if (String(response.value).length > 100) {
          errors.push(
            `Text too long for demographic "${demographic.label}" (max 100 characters)`
          );
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate conditional logic
export function shouldShowQuestion(
  question: IQuestion,
  responses: IQuestionResponse[]
): boolean {
  if (!question.conditional_logic) {
    return true;
  }

  const { condition_question_id, condition_operator, condition_value, action } =
    question.conditional_logic;

  // Find the condition question response
  const conditionResponse = responses.find(
    (r) => r.question_id === condition_question_id
  );
  if (!conditionResponse) {
    return action === 'hide'; // If no response to condition question, default behavior
  }

  let conditionMet = false;
  const responseValue = conditionResponse.response_value;

  switch (condition_operator) {
    case 'equals':
      conditionMet = responseValue === condition_value;
      break;
    case 'not_equals':
      conditionMet = responseValue !== condition_value;
      break;
    case 'greater_than':
      conditionMet = Number(responseValue) > Number(condition_value);
      break;
    case 'less_than':
      conditionMet = Number(responseValue) < Number(condition_value);
      break;
    case 'contains':
      conditionMet = String(responseValue)
        .toLowerCase()
        .includes(String(condition_value).toLowerCase());
      break;
  }

  // Apply action based on condition
  switch (action) {
    case 'show':
      return conditionMet;
    case 'hide':
      return !conditionMet;
    case 'skip_to':
      // Skip logic handled elsewhere
      return true;
    default:
      return true;
  }
}

// Validate complete survey response
export function validateSurveyResponse(
  survey: ISurvey,
  responses: IQuestionResponse[],
  demographics: IDemographicResponse[]
): ValidationResult {
  const errors: string[] = [];

  // Validate each question response
  for (const question of survey.questions) {
    const response = responses.find((r) => r.question_id === question.id);

    // Check if question should be shown based on conditional logic
    if (!shouldShowQuestion(question, responses)) {
      continue;
    }

    if (!response) {
      if (question.required) {
        errors.push(
          `Missing response for required question: "${question.text}"`
        );
      }
      continue;
    }

    const questionValidation = validateQuestionResponse(question, response);
    if (!questionValidation.isValid) {
      errors.push(...questionValidation.errors);
    }
  }

  // Validate demographics
  for (const demographic of survey.demographics) {
    const response = demographics.find((d) => d.field === demographic.field);

    if (!response) {
      if (demographic.required) {
        errors.push(`Missing required demographic: "${demographic.label}"`);
      }
      continue;
    }

    const demographicValidation = validateDemographicResponse(
      demographic,
      response
    );
    if (!demographicValidation.isValid) {
      errors.push(...demographicValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate partial survey response (for auto-save)
export function validatePartialSurveyResponse(
  survey: ISurvey,
  responses: IQuestionResponse[],
  demographics: IDemographicResponse[]
): ValidationResult {
  const errors: string[] = [];

  // For partial responses, only validate provided responses (not required fields)
  for (const response of responses) {
    const question = survey.questions.find(
      (q) => q.id === response.question_id
    );
    if (!question) {
      errors.push(`Invalid question ID: ${response.question_id}`);
      continue;
    }

    const questionValidation = validateQuestionResponse(question, response);
    if (!questionValidation.isValid) {
      // Filter out "required" errors for partial validation
      const nonRequiredErrors = questionValidation.errors.filter(
        (error) => !error.includes('is required')
      );
      errors.push(...nonRequiredErrors);
    }
  }

  // Validate provided demographics
  for (const response of demographics) {
    const demographic = survey.demographics.find(
      (d) => d.field === response.field
    );
    if (!demographic) {
      errors.push(`Invalid demographic field: ${response.field}`);
      continue;
    }

    const demographicValidation = validateDemographicResponse(
      demographic,
      response
    );
    if (!demographicValidation.isValid) {
      // Filter out "required" errors for partial validation
      const nonRequiredErrors = demographicValidation.errors.filter(
        (error) => !error.includes('is required')
      );
      errors.push(...nonRequiredErrors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}


