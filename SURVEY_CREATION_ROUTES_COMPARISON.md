# Survey Creation Routes Comparison

## Quick Answer

| Feature          | `/surveys/create`                         | `/surveys/create-wizard`                |
| ---------------- | ----------------------------------------- | --------------------------------------- |
| **UI Style**     | Tab-based interface                       | Step-by-step wizard (numbered steps)    |
| **Navigation**   | Click tabs in any order (with validation) | Linear progression (Step 1 → 2 → 3)     |
| **Best For**     | Power users, experienced admins           | First-time users, guided experience     |
| **Component**    | Custom tabs + forms                       | `SurveyCreationWizard` component        |
| **Bundle Size**  | 20.1 kB                                   | 313 kB (larger due to wizard framework) |
| **Visual Style** | Modern tabs with progress bar             | Traditional wizard stepper              |
| **Flexibility**  | Can jump between unlocked tabs            | Must complete each step sequentially    |

---

## Detailed Comparison

### `/surveys/create` - Tab-Based Interface

**What it looks like:**

```
┌─────────────────────────────────────────────────────────┐
│ Progress: ████████░░░░ 60% (3 of 5 required)            │
├─────────────────────────────────────────────────────────┤
│ [✓ Builder*] [Library] [○ Targeting*] [🔒 Invitations]  │
│                                                          │
│  [Form Content Here]                                    │
│                                                          │
│  [← Previous]        [Save Draft]  [Next: Targeting →] │
└─────────────────────────────────────────────────────────┘
```

**Features:**

- ✅ **Progressive tab unlocking** - Tabs unlock as you complete prerequisites
- ✅ **Visual progress bar** - See completion percentage at top
- ✅ **Flexible navigation** - Jump to any unlocked tab
- ✅ **Context-aware buttons** - Next/Previous buttons guide you
- ✅ **7 tabs total:**
  1. **Builder** (required) - Add title, description, questions manually
  2. **Library** (optional) - Browse and add from question library
  3. **Targeting** (required) - Select departments
  4. **Invitations** (optional) - Customize email invitations
  5. **Schedule** (required) - Set start/end dates
  6. **Preview** (required) - Review everything
  7. **QR Code** (unlocks after publish) - Generate QR codes

**Best for:**

- Admins who know what they're doing
- Quick survey creation
- Users who want to skip optional steps
- Power users who want control

---

### `/surveys/create-wizard` - Step-by-Step Wizard

**What it looks like:**

```
┌─────────────────────────────────────────────────────────┐
│  Step 1 of 6: Basic Information                         │
├─────────────────────────────────────────────────────────┤
│  ● ─── ○ ─── ○ ─── ○ ─── ○ ─── ○                      │
│  1    2    3    4    5    6                             │
│                                                          │
│  [Wizard Form Content]                                  │
│                                                          │
│              [Cancel]  [Next: Questions →]              │
└─────────────────────────────────────────────────────────┘
```

**Features:**

- ✅ **Linear progression** - Must complete steps in order
- ✅ **Step indicator** - Shows current step and total steps
- ✅ **Validation per step** - Can't proceed until current step valid
- ✅ **Built-in wizard component** - Uses `SurveyCreationWizard`
- ✅ **6 wizard steps:**
  1. **Basic Info** - Title, description, type, settings
  2. **Questions** - Add questions with builder
  3. **Demographics** - Configure demographic fields
  4. **Audience** - Select departments and target responses
  5. **Invitation** - Email customization and credentials
  6. **Review** - Preview and publish

**Best for:**

- First-time users
- Users who prefer guided flows
- Step-by-step handholding
- Learning the survey creation process

---

## Component Architecture

### `/surveys/create` Stack

```
page.tsx (832 lines)
├─ DashboardLayout
├─ SurveyProgressBar (custom)
├─ Tabs (Radix UI)
│  ├─ TabsList
│  │  ├─ TabsTrigger (with validation logic)
│  │  └─ Tooltips for locked tabs
│  └─ TabsContent
│     ├─ SurveyBuilder
│     ├─ QuestionLibraryBrowser
│     ├─ DepartmentSelector
│     ├─ InvitationSettings
│     ├─ SurveyScheduler
│     ├─ Preview sections
│     └─ TabNavigationFooter (custom)
└─ useSurveyProgress hook (custom validation)
```

### `/surveys/create-wizard` Stack

```
page.tsx (174 lines - simpler!)
├─ DashboardLayout
└─ SurveyCreationWizard (all-in-one component)
   ├─ Wizard stepper UI
   ├─ Step 1: BasicInfoStep
   ├─ Step 2: QuestionsStep
   ├─ Step 3: DemographicsStep
   ├─ Step 4: AudienceStep
   ├─ Step 5: InvitationStep
   ├─ Step 6: ReviewStep
   └─ Internal wizard state management
```

---

## When to Use Which?

### Use `/surveys/create` (Tab-Based) when:

- ✅ User is experienced admin
- ✅ Quick survey creation needed
- ✅ Want to skip optional steps
- ✅ Prefer seeing all options at once
- ✅ Need to jump back and edit previous sections
- ✅ Creating survey from template (copy/paste)
- ✅ Smaller bundle size matters

### Use `/surveys/create-wizard` (Wizard) when:

- ✅ User is first-time creator
- ✅ Prefer step-by-step guidance
- ✅ Want validation at each step
- ✅ Like linear workflows
- ✅ Need help understanding all options
- ✅ Learning survey creation
- ✅ Bundle size not a concern

---

## Code Differences

### `/surveys/create` - Custom Implementation

```typescript
// Uses custom hooks and components
const surveyProgress = useSurveyProgress({
  title,
  questions,
  targetDepartments,
  // ... state
});

// Progressive tab validation
const handleTabChange = (newTab: SurveyTab) => {
  if (!surveyProgress.isTabAccessible(newTab)) {
    toast.warning(surveyProgress.getTabWarning(newTab));
    return;
  }
  setActiveTab(newTab);
};

// Context-aware navigation
<TabNavigationFooter
  currentTab={activeTab}
  nextTab={surveyProgress.getNextTab(activeTab)}
  previousTab={surveyProgress.getPreviousTab(activeTab)}
  canPublish={surveyProgress.canPublish}
  // ...
/>
```

### `/surveys/create-wizard` - Wizard Component

```typescript
// Uses pre-built wizard component
<SurveyCreationWizard
  onComplete={handleSurveyCreation}
  onCancel={() => router.push('/surveys')}
  initialData={undefined}
/>

// Wizard handles:
// - Step progression
// - Validation
// - State management
// - Navigation
// All internally!
```

---

## Migration Path

### From Wizard to Tabs (Power User)

```
User starts with /surveys/create-wizard (learning)
  ↓
After creating 3-5 surveys, suggest:
  "Try our faster tab-based creator!"
  ↓
User switches to /surveys/create (efficiency)
```

### Recommended Onboarding

```typescript
// Show banner on first visit to /surveys/create
{isFirstTime && (
  <Alert>
    <Lightbulb className="h-4 w-4" />
    <AlertTitle>First time creating a survey?</AlertTitle>
    <AlertDescription>
      Try our <Link href="/surveys/create-wizard">
      step-by-step wizard</Link> for guided experience.
    </AlertDescription>
  </Alert>
)}
```

---

## Performance Comparison

| Metric           | `/surveys/create`      | `/surveys/create-wizard`     |
| ---------------- | ---------------------- | ---------------------------- |
| **Bundle Size**  | 20.1 kB                | 313 kB                       |
| **Initial Load** | Faster (smaller)       | Slower (larger)              |
| **Components**   | Custom, optimized      | Pre-built wizard             |
| **Re-renders**   | Optimized with useMemo | More frequent (wizard state) |
| **Best for**     | Production speed       | Development speed            |

---

## User Experience Comparison

### Tab-Based Flow (`/surveys/create`)

```
Time: 2-3 minutes for experienced user

1. Click Builder → Add title + 5 questions (30 sec)
2. Click Targeting → Select 2 departments (15 sec)
3. Skip Invitations (optional)
4. Click Schedule → Set dates (20 sec)
5. Click Preview → Quick review (10 sec)
6. Click Publish → Done! (5 sec)

Total clicks: ~8-10
Can skip steps easily ✅
```

### Wizard Flow (`/surveys/create-wizard`)

```
Time: 3-5 minutes for first-time user

Step 1: Basic Info → Fill form → Click Next (45 sec)
Step 2: Questions → Add 5 questions → Click Next (60 sec)
Step 3: Demographics → Configure → Click Next (30 sec)
Step 4: Audience → Select departments → Click Next (30 sec)
Step 5: Invitations → Customize → Click Next (30 sec)
Step 6: Review → Check everything → Click Publish (20 sec)

Total clicks: ~12-15
Must complete all steps 📝
Clear guidance at each step ✅
```

---

## Recommendation

### For Your Application

I recommend keeping **both** routes:

1. **Default for new users:** `/surveys/create-wizard`
   - First-time onboarding
   - In-app tour points here
   - Help documentation links here

2. **Power user shortcut:** `/surveys/create`
   - For experienced admins
   - Faster workflow
   - Link from dashboard: "Quick Create"

### Navigation Example

```typescript
// In your main navigation
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button>Create Survey</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => router.push('/surveys/create-wizard')}>
      <Wand2 className="mr-2 h-4 w-4" />
      Guided Wizard
      <Badge variant="outline" className="ml-2">Recommended</Badge>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push('/surveys/create')}>
      <Zap className="mr-2 h-4 w-4" />
      Quick Create
      <Badge variant="secondary" className="ml-2">Advanced</Badge>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Summary

- **`/surveys/create`** = Fast, flexible, tab-based (for pros)
- **`/surveys/create-wizard`** = Guided, linear, wizard-based (for beginners)

Both create the same surveys, just different UX approaches! 🚀
