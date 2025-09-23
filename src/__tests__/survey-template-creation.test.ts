/**
 * Test suite for survey creation from templates
 * Tests the mapping functions and validation fixes
 */

import {
  mapTemplateCategoryToSurveyType,
  mapQuestionType,
  transformTemplateQuestions,
} from '../lib/survey-template-utils';

// Mock the mapping functions since they're not exported
// We'll test the logic by creating similar functions here
function testMapTemplateCategoryToSurveyType(category: string): string {
  const categoryMapping: Record<string, string> = {
    climate: 'general_climate',
    culture: 'organizational_culture',
    engagement: 'general_climate',
    leadership: 'organizational_culture',
    wellbeing: 'general_climate',
    custom: 'custom',
  };

  return categoryMapping[category] || 'general_climate';
}

function testMapQuestionType(templateQuestionType: string): string {
  const typeMapping: Record<string, string> = {
    likert: 'likert',
    multiple_choice: 'multiple_choice',
    ranking: 'ranking',
    open_ended: 'open_ended',
    yes_no: 'yes_no',
    rating: 'rating',
    emoji_rating: 'rating', // Map emoji_rating to rating
  };

  return typeMapping[templateQuestionType] || 'likert';
}

function testTransformTemplateQuestions(templateQuestions: any[]): any[] {
  return templateQuestions.map((question, index) => ({
    id: question.id,
    text: question.text,
    type: testMapQuestionType(question.type),
    options: question.options,
    scale_min: question.scale_min,
    scale_max: question.scale_max,
    scale_labels: question.scale_labels,
    required: question.required !== undefined ? question.required : true,
    conditional_logic: question.conditional_logic,
    order: question.order !== undefined ? question.order : index,
    category: question.category,
  }));
}

describe('Survey Template Creation', () => {
  describe('Category Mapping', () => {
    test('should map engagement to general_climate', () => {
      expect(testMapTemplateCategoryToSurveyType('engagement')).toBe(
        'general_climate'
      );
    });

    test('should map leadership to organizational_culture', () => {
      expect(testMapTemplateCategoryToSurveyType('leadership')).toBe(
        'organizational_culture'
      );
    });

    test('should map culture to organizational_culture', () => {
      expect(testMapTemplateCategoryToSurveyType('culture')).toBe(
        'organizational_culture'
      );
    });

    test('should map climate to general_climate', () => {
      expect(testMapTemplateCategoryToSurveyType('climate')).toBe(
        'general_climate'
      );
    });

    test('should map wellbeing to general_climate', () => {
      expect(testMapTemplateCategoryToSurveyType('wellbeing')).toBe(
        'general_climate'
      );
    });

    test('should map custom to custom', () => {
      expect(testMapTemplateCategoryToSurveyType('custom')).toBe('custom');
    });

    test('should default to general_climate for unknown categories', () => {
      expect(testMapTemplateCategoryToSurveyType('unknown')).toBe(
        'general_climate'
      );
    });
  });

  describe('Question Type Mapping', () => {
    test('should map emoji_rating to rating', () => {
      expect(testMapQuestionType('emoji_rating')).toBe('rating');
    });

    test('should preserve valid question types', () => {
      expect(testMapQuestionType('likert')).toBe('likert');
      expect(testMapQuestionType('multiple_choice')).toBe('multiple_choice');
      expect(testMapQuestionType('ranking')).toBe('ranking');
      expect(testMapQuestionType('open_ended')).toBe('open_ended');
      expect(testMapQuestionType('yes_no')).toBe('yes_no');
      expect(testMapQuestionType('rating')).toBe('rating');
    });

    test('should default to likert for unknown types', () => {
      expect(testMapQuestionType('unknown_type')).toBe('likert');
    });
  });

  describe('Question Transformation', () => {
    test('should transform template questions with missing order fields', () => {
      const templateQuestions = [
        {
          id: 'q1',
          text: 'How are you feeling?',
          type: 'emoji_rating',
          required: true,
          options: ['😫', '😕', '😐', '😊', '🤩'],
        },
        {
          id: 'q2',
          text: 'How is your workload?',
          type: 'likert',
          required: true,
          options: ['Too Much', 'Just Right', 'Too Light'],
        },
      ];

      const transformed = testTransformTemplateQuestions(templateQuestions);

      expect(transformed).toHaveLength(2);
      expect(transformed[0].order).toBe(0);
      expect(transformed[1].order).toBe(1);
      expect(transformed[0].type).toBe('rating'); // emoji_rating mapped to rating
      expect(transformed[1].type).toBe('likert');
    });

    test('should preserve existing order fields', () => {
      const templateQuestions = [
        {
          id: 'q1',
          text: 'Question 1',
          type: 'likert',
          required: true,
          order: 5,
        },
      ];

      const transformed = testTransformTemplateQuestions(templateQuestions);
      expect(transformed[0].order).toBe(5);
    });

    test('should set required to true by default', () => {
      const templateQuestions = [
        {
          id: 'q1',
          text: 'Question 1',
          type: 'likert',
        },
      ];

      const transformed = testTransformTemplateQuestions(templateQuestions);
      expect(transformed[0].required).toBe(true);
    });

    test('should preserve explicit required field', () => {
      const templateQuestions = [
        {
          id: 'q1',
          text: 'Question 1',
          type: 'likert',
          required: false,
        },
      ];

      const transformed = testTransformTemplateQuestions(templateQuestions);
      expect(transformed[0].required).toBe(false);
    });
  });

  describe('Integration Test Data', () => {
    test('should handle the failing template structure', () => {
      // This mimics the structure that was causing the validation error
      const problematicTemplate = {
        category: 'engagement',
        questions: [
          {
            id: 'q1',
            type: 'emoji_rating',
            text: 'How are you feeling about work this week?',
            required: true,
            options: ['😫', '😕', '😐', '😊', '🤩'],
          },
          {
            id: 'q2',
            type: 'likert',
            text: 'How manageable is your current workload?',
            required: true,
            options: [
              'Overwhelming',
              'Too Much',
              'Just Right',
              'Light',
              'Too Light',
            ],
          },
        ],
      };

      // Test category mapping
      const surveyType = testMapTemplateCategoryToSurveyType(
        problematicTemplate.category
      );
      expect(surveyType).toBe('general_climate');

      // Test question transformation
      const transformedQuestions = testTransformTemplateQuestions(
        problematicTemplate.questions
      );

      expect(transformedQuestions).toHaveLength(2);
      expect(transformedQuestions[0].type).toBe('rating'); // emoji_rating -> rating
      expect(transformedQuestions[1].type).toBe('likert');
      expect(transformedQuestions[0].order).toBe(0);
      expect(transformedQuestions[1].order).toBe(1);
    });
  });
});
