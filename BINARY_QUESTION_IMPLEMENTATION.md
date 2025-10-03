# Binary Question with Conditional Comment - Implementation Guide

## Overview

This implementation adds a sophisticated binary (Yes/No) question type with a **conditional comment field** that appears only when the user selects "Yes". The feature includes full configuration options, validation, export support, and accessibility compliance.

## Features

### 1. Question Configuration

- **Enable/disable conditional comment** - Toggle whether comment field should appear
- **Custom label** - Configure the label shown above the comment field (e.g., "Please explain your answer")
- **Placeholder text** - Set hint text displayed in the empty field
- **Character limits** - Set minimum (0-5000) and maximum (10-5000) character constraints
- **Required flag** - Make comment mandatory when user selects "Yes"

### 2. User Experience

- **Large Yes/No buttons** - Clear, accessible button selection with visual feedback
- **Conditional display** - Comment field slides in smoothly when "Yes" is selected
- **Real-time validation** - Shows character counter and validation errors as user types
- **Character counter** - Displays current count with color warning at 90% capacity
- **Validation messages** - Clear error messages for missing/too short/too long comments
- **Progress indicators** - Shows remaining characters needed to meet minimum

### 3. Data Handling

- **Response model integration** - Comments stored in `response_text` field
- **Server-side validation** - Validates required comments, min/max length constraints
- **Export with dedicated column** - CSV exports include separate columns for answer and comment
- **Backward compatibility** - Legacy `yes_no_comment` type still supported

## File Structure

### Models & Schemas

```
src/models/Survey.ts              - BinaryCommentConfig interface, question schema
src/models/Response.ts            - IQuestionResponse with response_text for comments
```

### Validation & Business Logic

```
src/lib/binary-question-validator.ts  - Validation functions for binary questions
src/lib/validation.ts                 - Updated to use binary validator
src/lib/binary-question-export.ts     - Export utilities for CSV/Excel
```

### UI Components

```
src/components/surveys/BinaryQuestionConfig.tsx    - Question builder config panel
src/components/surveys/BinaryQuestionResponse.tsx  - Runtime survey component
```

### API Routes

```
src/app/api/surveys/[id]/responses/route.ts  - Response submission (uses validation)
src/app/api/surveys/[id]/export/route.ts     - Export with binary question support
```

### Tests

```
src/__tests__/binary-question-integration.test.ts  - Comprehensive integration tests
```

## Data Model

### BinaryCommentConfig Interface

```typescript
export interface BinaryCommentConfig {
  enabled: boolean; // Enable/disable conditional comment
  label?: string; // Custom label (default: "Please explain your answer")
  placeholder?: string; // Placeholder text (default: "Enter your comment here...")
  max_length?: number; // Maximum characters (default: 500, max: 5000)
  required?: boolean; // Make comment required (default: false)
  min_length?: number; // Minimum characters (default: 0)
}
```

### Question Schema (Survey Model)

```typescript
{
  id: string;
  text: string;
  type: 'yes_no';
  binary_comment_config?: BinaryCommentConfig;
  required: boolean;
  order: number;
}
```

### Response Schema

```typescript
{
  question_id: string;
  response_value: boolean;     // true = Yes, false = No
  response_text?: string;      // Comment text (only when Yes + comment enabled)
  time_spent_seconds?: number;
}
```

## Usage Examples

### 1. Creating a Binary Question in Survey Builder

```typescript
const question: IQuestion = {
  id: 'q1',
  text: 'Have you experienced any challenges with team collaboration?',
  type: 'yes_no',
  binary_comment_config: {
    enabled: true,
    label: 'Please describe the challenges you experienced',
    placeholder: 'Tell us about your experience...',
    max_length: 500,
    required: true,
    min_length: 20,
  },
  required: true,
  order: 1,
};

const survey = await Survey.create({
  title: 'Team Collaboration Survey',
  company_id: companyId,
  created_by: userId,
  type: 'custom',
  questions: [question],
  // ... other fields
});
```

### 2. User Responding to Binary Question

**Scenario A: User selects "Yes" (comment required)**

```typescript
const response: IQuestionResponse = {
  question_id: 'q1',
  response_value: true, // Yes
  response_text:
    'We struggle with communication across time zones and lack clear project documentation.',
};
```

**Scenario B: User selects "No" (comment not needed)**

```typescript
const response: IQuestionResponse = {
  question_id: 'q1',
  response_value: false, // No
  // response_text not required
};
```

### 3. Validation in API

```typescript
import { validateBinaryQuestionResponses } from '@/lib/binary-question-validator';

// In response submission API
const validationResult = validateBinaryQuestionResponses(
  survey.questions,
  requestBody.responses
);

if (!validationResult.valid) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: validationResult.errors,
    },
    { status: 400 }
  );
}
```

### 4. Exporting Results to CSV

The export automatically includes separate columns for binary questions:

**CSV Output:**

```
User,Question,Comment
john@example.com,"Have you experienced challenges?",Yes,"We struggle with communication..."
jane@example.com,"Have you experienced challenges?",No,""
```

**Code:**

```typescript
import { exportBinaryQuestionsToCsv } from '@/lib/binary-question-export';

const csvContent = exportBinaryQuestionsToCsv(
  survey.questions,
  responsesWithUser
);
```

## Validation Rules

### Client-Side (Real-time)

1. **Response value** - Must be boolean (true/false)
2. **Comment visibility** - Only shown when `response_value === true` and `binary_comment_config.enabled === true`
3. **Character counter** - Updates in real-time, warns at 90% capacity
4. **Minimum length** - Shows progress indicator until minimum reached
5. **Maximum length** - Prevents typing beyond max_length

### Server-Side

1. **Required validation** - If `binary_comment_config.required === true` and `response_value === true`, comment must not be empty
2. **Minimum length** - If `min_length` is set and comment provided, must meet minimum
3. **Maximum length** - Comment must not exceed `max_length` (default 500, max 5000)
4. **Type validation** - `response_value` must be boolean, not string

### Validation Error Codes

- `MISSING_COMMENT` - Required comment not provided
- `COMMENT_TOO_SHORT` - Comment below minimum length
- `COMMENT_TOO_LONG` - Comment exceeds maximum length
- `INVALID_RESPONSE` - Response value is not boolean

## UI Components

### BinaryQuestionConfig (Question Builder)

**Purpose:** Configuration panel for survey creators

**Features:**

- Enable/disable toggle
- Text inputs for label and placeholder
- Number inputs for min/max character limits
- Required toggle
- Live preview of configured comment field

**Location:** `src/components/surveys/BinaryQuestionConfig.tsx`

**Usage:**

```tsx
<BinaryQuestionConfig
  question={currentQuestion}
  onUpdate={(config) => handleQuestionUpdate('binary_comment_config', config)}
/>
```

### BinaryQuestionResponse (Survey Runtime)

**Purpose:** User-facing component for responding to binary questions

**Features:**

- Large Yes/No buttons with visual feedback (green/red)
- Smooth animation when comment field appears
- Character counter with color warnings
- Real-time validation messages
- Accessibility support (ARIA labels, error announcements)

**Location:** `src/components/surveys/BinaryQuestionResponse.tsx`

**Usage:**

```tsx
<BinaryQuestionResponse
  question={question}
  value={responses[question.id]}
  onChange={(response) => handleResponseChange(response)}
  disabled={surveyCompleted}
/>
```

## Export Format

### CSV Structure

**Binary question WITHOUT conditional comment:**

```csv
User,Question
john@example.com,Yes
jane@example.com,No
```

**Binary question WITH conditional comment enabled:**

```csv
User,Question,Question - Comment
john@example.com,Yes,"Great workplace culture"
jane@example.com,No,""
anonymous,Yes,"Could improve benefits"
```

### Header Generation

Headers are dynamically generated based on `binary_comment_config.enabled`:

```typescript
// Question without comment
headers = ['Would you recommend our company?'];

// Question with comment
headers = [
  'Would you recommend our company?',
  'Would you recommend our company? - Why or why not?',
];
```

## Testing

### Integration Tests

Location: `src/__tests__/binary-question-integration.test.ts`

**Test Coverage:**

1. **Binary Question Configuration**
   - Create survey with `yes_no` question type
   - Create question with conditional comment enabled
   - Verify configuration persists correctly

2. **Binary Response Submission**
   - Accept Yes response with required comment
   - Accept No response without comment
   - Validate comment length (min/max)

3. **Export Functionality**
   - Export responses with dedicated comment column
   - Handle Yes responses with comments
   - Handle No responses (empty comment column)
   - Properly escape CSV special characters

4. **Backward Compatibility**
   - Support legacy `yes_no_comment` type
   - Preserve existing `comment_required` and `comment_prompt` fields

### Running Tests

```bash
npm test -- binary-question-integration
```

## Migration Guide

### For Existing yes_no Questions

Existing `yes_no` questions continue to work without changes. To add conditional comment:

```typescript
// Before (simple binary question)
{
  type: 'yes_no',
  text: 'Do you agree?',
}

// After (with conditional comment)
{
  type: 'yes_no',
  text: 'Do you agree?',
  binary_comment_config: {
    enabled: true,
    label: 'Please explain why',
    required: false,
  }
}
```

### For Legacy yes_no_comment Questions

Legacy type remains supported:

```typescript
// Legacy (still works)
{
  type: 'yes_no_comment',
  text: 'Question text',
  comment_required: true,
  comment_prompt: 'Please explain',
}

// Recommended (new approach)
{
  type: 'yes_no',
  text: 'Question text',
  binary_comment_config: {
    enabled: true,
    label: 'Please explain',
    required: true,
  }
}
```

## Best Practices

### 1. Configuration

- **Use clear labels** - "Please explain why" is better than "Comment"
- **Set reasonable limits** - 10-500 chars for most use cases
- **Consider making optional** - Required comments can reduce completion rates
- **Provide helpful placeholders** - Guide users on what to write

### 2. Question Design

- **Be specific** - "Have you experienced communication challenges?" vs "Is everything okay?"
- **Context matters** - If asking "Yes", user should understand what they're confirming
- **Comment relevance** - Only ask for comments when "Yes" provides valuable context

### 3. Export & Analysis

- **Filter empty comments** - When analyzing, filter out blank comment cells
- **Thematic analysis** - Group similar comments for insights
- **Quote attribution** - Respect anonymity settings in exports

### 4. Validation Settings

- **Balance rigor and UX** - Too strict validation frustrates users
- **Minimum length** - Only use when quality matters (e.g., 20+ chars for meaningful feedback)
- **Maximum length** - Allow enough space (500+ chars) for detailed responses

## Accessibility

### Keyboard Navigation

- Tab between Yes/No buttons
- Space/Enter to select
- Tab to comment field when visible

### Screen Readers

- ARIA labels on all interactive elements
- Error messages announced via `aria-describedby`
- Invalid state indicated with `aria-invalid`
- Required fields marked with `aria-required`

### Visual Indicators

- High contrast Yes (green) / No (red) buttons
- Character counter changes color at 90% capacity
- Clear error messages with icon indicators
- Required field asterisks (\*) in labels

## Performance Considerations

### Client-Side

- **Debouncing** - Comment changes trigger validation on blur, not every keystroke
- **Conditional rendering** - Comment field only rendered when needed
- **Memoization** - Use React.memo for config component if rendering many questions

### Server-Side

- **Bulk validation** - Validate all binary questions in single pass
- **Early returns** - Skip validation if comment not enabled
- **Index queries** - Ensure `survey_id` indexed for export queries

## Future Enhancements

Potential improvements for future iterations:

1. **Rich text comments** - Support formatting (bold, italic, lists)
2. **Template responses** - Provide common response templates
3. **Word count** - Show word count in addition to character count
4. **Conditional logic** - Show different questions based on Yes/No answer
5. **Analytics dashboard** - Visualize Yes/No distribution with comment summaries
6. **AI summarization** - Auto-summarize comments for quick insights
7. **Multi-language** - Support RTL languages and translations
8. **Voice input** - Enable voice-to-text for comment field

## Troubleshooting

### Issue: Comment field not appearing

- Check `binary_comment_config.enabled === true`
- Verify user selected "Yes" (`response_value === true`)
- Inspect component props in React DevTools

### Issue: Validation errors on submission

- Check min_length vs comment length
- Verify required flag vs empty comment
- Look for non-boolean response_value (should be true/false, not "yes"/"no")

### Issue: Export missing comment column

- Confirm `binary_comment_config.enabled === true` in question
- Check export function uses `getBinaryQuestionHeaders`
- Verify question type is exactly `'yes_no'`

## Summary

The Binary Question with Conditional Comment feature provides:

✅ **Flexible configuration** - Full control over comment field behavior  
✅ **Great UX** - Smooth animations, real-time validation, clear feedback  
✅ **Data integrity** - Server-side validation, proper escaping in exports  
✅ **Backward compatible** - Existing questions continue to work  
✅ **Well tested** - Comprehensive integration test suite  
✅ **Accessible** - WCAG compliant, keyboard navigable, screen reader friendly  
✅ **Export ready** - Dedicated columns in CSV for easy analysis

The implementation follows Next.js best practices, TypeScript strict mode, and maintains consistency with the existing codebase architecture.
