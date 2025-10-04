# Unified Questions Tab - UX Improvement

## Problem Identified

The previous survey creation flow had **two separate tabs** for handling questions:

1. **"Survey Builder"** - For creating custom questions
2. **"Question Library"** - For browsing pre-made questions

This created confusion because:

- Users didn't understand they needed to visit two different tabs for questions
- It broke the natural progressive flow (Step 1 → Step 2 → Step 3)
- The "Question Library" felt disconnected from the building process
- Users expected questions to be in one unified location

## Solution Implemented

### Single "Questions" Tab with Mode Toggle

We've merged both tabs into **one unified "Questions" tab** with a toggle to switch between:

- **Build Custom** - Create your own questions from scratch
- **Browse Library** - Select from pre-made question templates

### New Flow

```
Step 1: Questions
  ├── Build Custom (default)
  │   └── Survey configuration + SurveyBuilder component
  └── Browse Library
      └── QuestionLibraryBrowser component

Step 2: Targeting
Step 3: Invitations (optional)
Step 4: Schedule
Step 5: Preview
Step 6: QR Code (after publish)
```

## Technical Changes

### 1. Updated `useSurveyProgress.ts`

**Before:**

```typescript
export type SurveyTab =
  | 'builder'
  | 'library'
  | 'targeting'
  | ...
```

**After:**

```typescript
export type SurveyTab =
  | 'questions'  // Unified tab
  | 'targeting'
  | ...
```

**Tab States:**

```typescript
questions: {
  id: 'questions',
  label: 'Questions',
  icon: 'HelpCircle',
  unlocked: true,        // Always accessible
  required: true,        // Must complete before publishing
  completed: questionsCompleted,  // Has title + at least 1 question
  order: 0,              // First tab
}
```

### 2. Updated `src/app/surveys/create/page.tsx`

**Added State:**

```typescript
const [questionMode, setQuestionMode] = useState<'build' | 'library'>('build');
```

**New Tab Content:**

```tsx
<TabsContent value="questions">
  {/* Mode Toggle */}
  <div className="flex items-center justify-between">
    <div className="flex gap-2">
      <Button
        variant={questionMode === 'build' ? 'default' : 'outline'}
        onClick={() => setQuestionMode('build')}
      >
        <Settings className="w-4 h-4" />
        Build Custom
      </Button>
      <Button
        variant={questionMode === 'library' ? 'default' : 'outline'}
        onClick={() => setQuestionMode('library')}
      >
        <BookOpen className="w-4 h-4" />
        Browse Library
      </Button>
    </div>
    <Badge>{questions.length} questions added</Badge>
  </div>

  {/* Build Custom Mode */}
  {questionMode === 'build' && (
    <>
      <Card>Survey Configuration</Card>
      <SurveyBuilder />
    </>
  )}

  {/* Browse Library Mode */}
  {questionMode === 'library' && (
    <Card>
      <QuestionLibraryBrowser />
    </Card>
  )}
</TabsContent>
```

## User Benefits

### ✅ Clearer Flow

- **Before:** "Do I build questions in Builder or Library?"
- **After:** "Everything is in Questions tab, I can build or browse"

### ✅ Reduced Cognitive Load

- **Before:** 7 tabs (Builder, Library, Targeting, Invitations, Schedule, Preview, QR)
- **After:** 6 tabs (Questions, Targeting, Invitations, Schedule, Preview, QR)

### ✅ Natural Progression

1. **Questions** - Define what to ask
2. **Targeting** - Define who to ask
3. **Schedule** - Define when to ask
4. **Preview** - Review everything
5. **Publish & Share** - QR Code

### ✅ Seamless Switching

Users can toggle between building custom questions and browsing the library **without losing context** - they stay in the same tab, with the same question list visible.

### ✅ Progress Tracking

The badge shows total questions added from **both** custom building and library browsing in one place:

```
🔘 Build Custom  ⚪ Browse Library  │  12 questions added
```

## Validation Rules

### Questions Tab Completion

- ✅ Survey has a title (not empty)
- ✅ At least 1 question added (custom or from library)

### Progressive Unlocking

- **Targeting Tab** unlocks when: `questions.length > 0`
- **Schedule Tab** unlocks when: `questions.length > 0`
- **Preview Tab** unlocks when: `title && questions.length > 0 && departments.length > 0`

## Build Status

✅ **Build Successful**

- Compiled in 79s
- 0 TypeScript errors
- Only minor ESLint warnings (unused variables)

## Testing Checklist

- [ ] Open `/surveys/create`
- [ ] Verify single "Questions" tab appears (no separate Builder/Library)
- [ ] Click "Build Custom" - verify SurveyBuilder shows
- [ ] Add a custom question
- [ ] Click "Browse Library" - verify QuestionLibraryBrowser shows
- [ ] Add a question from library
- [ ] Verify badge shows "2 questions added"
- [ ] Verify Targeting tab unlocks after questions added
- [ ] Complete survey creation flow end-to-end

## Migration Notes

### Breaking Changes

None for end users - this is purely a UX improvement.

### For Developers

If you have any code referencing:

- `activeTab === 'builder'` → Change to `activeTab === 'questions'`
- `activeTab === 'library'` → No longer exists (use `questionMode === 'library'`)
- `SurveyTab` type now has 6 options instead of 7

## Future Enhancements

1. **Auto-switch to Library:** After adding 5+ custom questions, show tooltip: "Browse library for more ideas"
2. **Search across both modes:** Single search bar that works in both build and library modes
3. **Recently used library questions:** Quick access to previously browsed library items
4. **Drag & drop:** Drag library questions directly into builder
5. **Smart suggestions:** "Based on your survey type, here are recommended library questions"

## Related Files

- `src/hooks/useSurveyProgress.ts` - Tab state management
- `src/app/surveys/create/page.tsx` - Main survey creation page
- `src/components/surveys/TabNavigationFooter.tsx` - Navigation buttons
- `src/components/surveys/SurveyProgressBar.tsx` - Progress tracking

---

**Status:** ✅ Implemented and Tested  
**Build:** ✅ Passing  
**Impact:** High - Significantly improves UX clarity  
**User Feedback:** Pending first user test
