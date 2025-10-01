// Survey template transformation utilities
import { TemplateCategory } from '@/models/SurveyTemplate';
import { QuestionType, IQuestion } from '@/models/Survey';

/**
 * Maps template categories to valid survey types
 */
export function mapTemplateCategoryToSurveyType(
  category: TemplateCategory
): string {
  const categoryMapping: Record<TemplateCategory, string> = {
    climate: 'general_climate',
    culture: 'organizational_culture',
    engagement: 'general_climate',
    leadership: 'organizational_culture',
    wellbeing: 'general_climate',
    custom: 'custom',
  };

  return categoryMapping[category] || 'general_climate';
}

/**
 * Maps template question types to valid survey question types
 */
export function mapQuestionType(templateQuestionType: string): QuestionType {
  // Map template question types to valid survey question types
  const typeMapping: Record<string, QuestionType> = {
    likert: 'likert',
    multiple_choice: 'multiple_choice',
    ranking: 'ranking',
    open_ended: 'open_ended',
    yes_no: 'yes_no',
    yes_no_comment: 'yes_no_comment',
    rating: 'rating',
    emoji_rating: 'rating', // Map emoji_rating to rating (for backward compatibility)
    emoji_scale: 'emoji_scale',
  };

  return typeMapping[templateQuestionType] || 'likert';
}

/**
 * Transforms template questions to ensure they have required fields
 */
export function transformTemplateQuestions(
  templateQuestions: any[]
): IQuestion[] {
  return templateQuestions.map((question, index) => ({
    id: question.id,
    text: question.text,
    type: mapQuestionType(question.type),
    options: question.options,
    scale_min: question.scale_min,
    scale_max: question.scale_max,
    scale_labels: question.scale_labels,
    comment_required: question.comment_required,
    comment_prompt: question.comment_prompt,
    emoji_options: question.emoji_options,
    required: question.required !== undefined ? question.required : true,
    conditional_logic: question.conditional_logic,
    order: question.order !== undefined ? question.order : index,
    category: question.category,
  }));
}
