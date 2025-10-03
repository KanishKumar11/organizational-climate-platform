# Binary Question Quick Reference

## 🚀 Quick Start

### 1. Create Binary Question

```typescript
const question: IQuestion = {
  id: 'q1',
  text: 'Do you have suggestions for improvement?',
  type: 'yes_no',
  binary_comment_config: {
    enabled: true,
    label: 'Please explain',
    placeholder: 'Your suggestions here...',
    max_length: 500,
    required: true,
    min_length: 20,
  },
  required: true,
  order: 1,
};
```

### 2. User Responds

```typescript
// Yes with comment
{
  question_id: 'q1',
  response_value: true,
  response_text: 'We could improve communication tools...',
}

// No (comment not needed)
{
  question_id: 'q1',
  response_value: false,
}
```

### 3. Validate Response

```typescript
import { validateBinaryQuestionResponse } from '@/lib/binary-question-validator';

const result = validateBinaryQuestionResponse(question, response);
if (!result.valid) {
  console.error(result.errors); // Array of validation errors
}
```

### 4. Export to CSV

```typescript
import { exportBinaryQuestionsToCsv } from '@/lib/binary-question-export';

const csv = exportBinaryQuestionsToCsv(survey.questions, responsesData);
// Returns: "User,Question,Question - Comment\njohn@example.com,Yes,\"Great!\"..."
```

---

## 📦 Key Imports

```typescript
// Models
import { IQuestion, BinaryCommentConfig } from '@/models/Survey';
import { IQuestionResponse } from '@/models/Response';

// Validation
import { validateBinaryQuestionResponse } from '@/lib/binary-question-validator';

// Export
import {
  getBinaryQuestionHeaders,
  getBinaryQuestionRowValues,
} from '@/lib/binary-question-export';

// Components
import BinaryQuestionConfig from '@/components/surveys/BinaryQuestionConfig';
import BinaryQuestionResponse from '@/components/surveys/BinaryQuestionResponse';
```

---

## 🎨 UI Components

### Question Builder

```tsx
<BinaryQuestionConfig
  question={question}
  onUpdate={(config) => updateQuestion({ binary_comment_config: config })}
/>
```

### Survey Runtime

```tsx
<BinaryQuestionResponse
  question={question}
  value={currentResponse}
  onChange={(response) => handleChange(response)}
  disabled={false}
/>
```

---

## ✅ Validation Errors

| Code                | When                                    | Message                                       |
| ------------------- | --------------------------------------- | --------------------------------------------- |
| `MISSING_COMMENT`   | required=true, Yes selected, no comment | "A comment is required when you answer Yes"   |
| `COMMENT_TOO_SHORT` | Comment < min_length                    | "Comment must be at least X characters"       |
| `COMMENT_TOO_LONG`  | Comment > max_length                    | "Comment must not exceed X characters"        |
| `INVALID_RESPONSE`  | response_value not boolean              | "Binary question response must be true/false" |

---

## 📊 CSV Export Format

### Without Comment Config

```csv
User,Question
john@example.com,Yes
jane@example.com,No
```

### With Comment Config

```csv
User,Question,Question - Label
john@example.com,Yes,"Good explanation"
jane@example.com,No,""
```

---

## ⚙️ Configuration Defaults

```typescript
{
  enabled: false,
  label: 'Please explain your answer',
  placeholder: 'Enter your comment here...',
  max_length: 500,
  required: false,
  min_length: 0,
}
```

---

## 🔧 Common Use Cases

### Required Explanation for "Yes"

```typescript
binary_comment_config: {
  enabled: true,
  label: 'Please explain why',
  required: true,
  min_length: 20,
  max_length: 500,
}
```

### Optional Feedback

```typescript
binary_comment_config: {
  enabled: true,
  label: 'Any additional comments? (optional)',
  required: false,
  max_length: 300,
}
```

### Detailed Response

```typescript
binary_comment_config: {
  enabled: true,
  label: 'Please provide details',
  placeholder: 'Include specific examples...',
  required: true,
  min_length: 50,
  max_length: 1000,
}
```

---

## 🐛 Troubleshooting

| Issue                 | Check                                       |
| --------------------- | ------------------------------------------- |
| Comment not appearing | `enabled: true` AND user selected Yes       |
| Validation failing    | Min/max length, required flag, boolean type |
| Export missing column | `enabled: true` in question config          |
| TypeScript error      | Restart TS server, clear `.next` cache      |

---

## 📚 Documentation

- **Full Guide:** `BINARY_QUESTION_IMPLEMENTATION.md`
- **Summary:** `BINARY_QUESTION_SUMMARY.md`
- **Verification:** `BINARY_QUESTION_VERIFICATION.md`

---

## 🧪 Testing

```bash
# Run integration tests
npm test -- binary-question-integration

# Watch mode
npm test -- --watch binary-question-integration
```

---

**Questions?** See full documentation in `BINARY_QUESTION_IMPLEMENTATION.md`
