# Survey Creation from Template - Validation Fixes

## Problem Summary

The survey creation from templates was failing with multiple validation errors:

1. **Survey type validation error**: Template category `engagement` was not a valid survey type
2. **Invalid question type**: Question type `emoji_rating` was not recognized in the Survey model
3. **Missing question order fields**: Questions were missing required `order` properties

## Root Cause Analysis

The issues stemmed from mismatches between different model schemas:

### Template Categories vs Survey Types
- **SurveyTemplate categories**: `['climate', 'culture', 'engagement', 'leadership', 'wellbeing', 'custom']`
- **Survey types**: `['general_climate', 'microclimate', 'organizational_culture', 'custom']`

### Question Types Mismatch
- **Survey model**: `['likert', 'multiple_choice', 'ranking', 'open_ended', 'yes_no', 'rating']`
- **MicroclimateTemplate model**: `['likert', 'multiple_choice', 'open_ended', 'emoji_rating']`

Templates were using `emoji_rating` which is valid for microclimate surveys but not regular surveys.

## Solution Implemented

### 1. Added Mapping Functions

Created three mapping functions in `/src/app/api/surveys/templates/[id]/use/route.ts`:

#### Category Mapping
```typescript
export function mapTemplateCategoryToSurveyType(category: TemplateCategory): string {
  const categoryMapping: Record<TemplateCategory, string> = {
    'climate': 'general_climate',
    'culture': 'organizational_culture', 
    'engagement': 'general_climate',
    'leadership': 'organizational_culture',
    'wellbeing': 'general_climate',
    'custom': 'custom'
  };
  return categoryMapping[category] || 'general_climate';
}
```

#### Question Type Mapping
```typescript
export function mapQuestionType(templateQuestionType: string): QuestionType {
  const typeMapping: Record<string, QuestionType> = {
    'likert': 'likert',
    'multiple_choice': 'multiple_choice',
    'ranking': 'ranking', 
    'open_ended': 'open_ended',
    'yes_no': 'yes_no',
    'rating': 'rating',
    'emoji_rating': 'rating' // Map emoji_rating to rating
  };
  return typeMapping[templateQuestionType] || 'likert';
}
```

#### Question Transformation
```typescript
export function transformTemplateQuestions(templateQuestions: any[]): IQuestion[] {
  return templateQuestions.map((question, index) => ({
    id: question.id,
    text: question.text,
    type: mapQuestionType(question.type),
    options: question.options,
    scale_min: question.scale_min,
    scale_max: question.scale_max,
    scale_labels: question.scale_labels,
    required: question.required !== undefined ? question.required : true,
    conditional_logic: question.conditional_logic,
    order: question.order !== undefined ? question.order : index, // Auto-assign order
    category: question.category
  }));
}
```

### 2. Updated Survey Creation Logic

Modified the survey creation code to use the transformation functions:

```typescript
// Transform template data to valid survey format
const templateQuestions = customizations.questions || template.questions;
const transformedQuestions = transformTemplateQuestions(templateQuestions);

const surveyData = {
  title,
  description: description || template.description,
  type: mapTemplateCategoryToSurveyType(template.category), // Use mapping
  company_id: session.user.companyId,
  created_by: session.user.id,
  questions: transformedQuestions, // Use transformed questions
  // ... rest of the data
};
```

### 3. Enhanced Error Handling

Added specific validation error handling:

```typescript
catch (error) {
  console.error('Error creating survey from template:', error);
  
  // Handle validation errors specifically
  if (error instanceof Error && error.name === 'ValidationError') {
    return NextResponse.json(
      { 
        error: 'Survey validation failed',
        details: error.message,
        validationErrors: (error as any).errors
      },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Testing

### 1. Unit Tests
Created comprehensive unit tests in `/src/__tests__/survey-template-creation.test.ts`:

```bash
npx jest src/__tests__/survey-template-creation.test.ts --verbose
```

**Results**: ✅ All 15 tests passed

### 2. Integration Test
Created integration test script in `/src/__tests__/survey-creation-integration.js`:

```bash
node src/__tests__/survey-creation-integration.js
```

### 3. Manual API Testing
Created manual test script in `/test-survey-creation.js` for testing the actual API endpoint.

## Validation Results

The fixes address all three original issues:

1. ✅ **Survey type validation**: `engagement` → `general_climate` 
2. ✅ **Question type validation**: `emoji_rating` → `rating`
3. ✅ **Missing order fields**: Auto-assigned based on array index

## Files Modified

1. `/src/app/api/surveys/templates/[id]/use/route.ts` - Main fixes
2. `/src/__tests__/survey-template-creation.test.ts` - Unit tests
3. `/src/__tests__/survey-creation-integration.js` - Integration test
4. `/test-survey-creation.js` - Manual API test script

## How to Test the Fix

### Quick Test
```bash
# Run unit tests
npx jest src/__tests__/survey-template-creation.test.ts --verbose

# Run integration test (requires database connection)
node src/__tests__/survey-creation-integration.js
```

### Full API Test
1. Start the development server: `npm run dev`
2. Log into the application in your browser
3. Get a session cookie from browser dev tools
4. Update the configuration in `test-survey-creation.js`
5. Run: `node test-survey-creation.js`

## Expected Behavior

After the fix, creating a survey from template ID `68d288a72b848331398002bb` (or any template with `engagement` category and `emoji_rating` questions) should:

1. Successfully map the category to a valid survey type
2. Transform `emoji_rating` questions to `rating` type
3. Auto-assign `order` fields to all questions
4. Create the survey without validation errors
5. Return a 201 status with the created survey details

The survey creation should now work seamlessly for all existing templates, regardless of their category or question types.
