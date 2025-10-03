# Microclimate Survey Implementation - Gap Analysis

**Generated:** October 4, 2025  
**Status:** 🔴 CRITICAL - Major features missing from requirements

---

## Executive Summary

After reviewing the requirements in `req.md` and `microclimate-req.md` against the actual implementation, **significant gaps exist**. The current wizard has basic scaffolding but is missing **most critical business requirements**.

### Overall Completion Status

| Component               | Required   | Implemented | Status          |
| ----------------------- | ---------- | ----------- | --------------- |
| **Step 1: Basic Info**  | 6 fields   | 2 fields    | 🔴 33% Complete |
| **Step 2: Questions**   | 8 features | 4 features  | 🟡 50% Complete |
| **Step 3: Targeting**   | 9 features | 2 features  | 🔴 22% Complete |
| **Step 4: Schedule**    | 6 features | 3 features  | 🟡 50% Complete |
| **Demographics System** | 7 features | 0 features  | 🔴 0% Complete  |

---

## Step 1: Basic Info - Detailed Gap Analysis

### ✅ IMPLEMENTED (33%)

1. ✅ **Title** - Text input working
2. ✅ **Description** - Textarea working

### 🔴 MISSING (67%)

#### 1. Survey Type Dropdown (CRITICAL)

**Required:** `Micro‑climate | Climate | Culture` dropdown (required field)
**Current:** Not implemented at all
**Impact:** Cannot differentiate survey types, affects question bank filtering
**Code Location:** `MicroclimateWizard.tsx` - Step 1 render

```tsx
// MISSING CODE - Needs to be added:
<div>
  <Label htmlFor="surveyType">Survey Type *</Label>
  <Select
    value={step1Data.surveyType}
    onValueChange={(value) => setStep1Data({ ...step1Data, surveyType: value })}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select survey type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="microclimate">Micro‑climate</SelectItem>
      <SelectItem value="climate">Climate</SelectItem>
      <SelectItem value="culture">Culture</SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### 2. Company Dropdown (CRITICAL)

**Required:** Searchable dropdown populated from Company directory (required field)
**Current:** Hard-coded `companyId` prop - no UI selection
**Impact:** Cannot create surveys for different companies, no company data pre-loading
**Code Location:** `MicroclimateWizard.tsx` - props interface

```tsx
// CURRENT (WRONG):
interface MicroclimateWizardProps {
  companyId: string; // ❌ Hard-coded, no selection UI
}

// REQUIRED:
interface Step1Data {
  title: string;
  description: string;
  companyId: string; // ✅ User-selected from dropdown
  surveyType: 'microclimate' | 'climate' | 'culture';
  companyType?: string;
  language: 'es' | 'en' | 'both';
}

// ADD THIS COMPONENT:
<div>
  <Label htmlFor="company">Company *</Label>
  <CompanySearchableDropdown
    value={step1Data.companyId}
    onChange={(companyId, companyData) => {
      setStep1Data({
        ...step1Data,
        companyId,
        companyType: companyData.type,
      });
      // Pre-load Step 3 data
      preloadCompanyData(companyId);
    }}
  />
</div>;
```

#### 3. Company Type Field

**Required:** Optional field populated from selected company
**Current:** Not implemented
**Impact:** Cannot drive business rules based on company type

#### 4. Language Selector (CRITICAL)

**Required:** `Spanish | English | Both` - multilingual survey setup
**Current:** Only a `language` prop, no UI selector
**Impact:** Cannot create bilingual surveys per requirement

```tsx
// MISSING CODE:
<div>
  <Label htmlFor="language">Survey Language *</Label>
  <RadioGroup
    value={step1Data.language}
    onValueChange={(value) => setStep1Data({ ...step1Data, language: value })}
  >
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="es" id="lang-es" />
      <Label htmlFor="lang-es">🇪🇸 Spanish</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="en" id="lang-en" />
      <Label htmlFor="lang-en">🇬🇧 English</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="both" id="lang-both" />
      <Label htmlFor="lang-both">🌎 Both (Bilingual)</Label>
    </div>
  </RadioGroup>
</div>
```

#### 5. Autosave on Blur

**Required:** Save on field blur (not just every 5-10 seconds)
**Current:** Only time-based autosave (5s debounce)
**Impact:** User changes could be lost if they switch tabs quickly

```tsx
// ADD TO INPUT HANDLERS:
<Input
  onBlur={() =>
    autosave.forceSave({
      current_step: 1,
      step1_data: step1Data,
    })
  }
/>
```

#### 6. Validation Logic

**Required:** Cannot proceed without Company and Title
**Current:** Only checks `title` and `description`, missing `companyId` and `surveyType`

```tsx
// CURRENT (INCOMPLETE):
validate: async () => {
  return !!step1Data.title.trim() && !!step1Data.description.trim();
};

// REQUIRED:
validate: async () => {
  if (!step1Data.title.trim()) {
    throw new Error('Title is required');
  }
  if (!step1Data.companyId) {
    throw new Error('Company is required');
  }
  if (!step1Data.surveyType) {
    throw new Error('Survey Type is required');
  }
  return true;
};
```

---

## Step 2: Questions - Detailed Gap Analysis

### ✅ IMPLEMENTED (50%)

1. ✅ **Quick Add Panel** - Basic implementation exists
2. ✅ **Question Library Browser** - Hierarchical tree view working
3. ✅ **Create New Custom Questions** - `MultilingualQuestionEditor` component exists
4. ✅ **Multilingual ES/EN** - Side-by-side editing in custom questions

### 🔴 MISSING (50%)

#### 1. Bulk Add by Category (HIGH PRIORITY)

**Required:** Select entire category to add all questions at once
**Current:** Must select questions individually
**Impact:** Time-consuming for admins creating surveys with many standard questions

```tsx
// ADD TO QuestionLibraryBrowser.tsx:
const handleBulkAddCategory = (categoryId: string) => {
  const categoryQuestions = questions.filter((q) => q.category === categoryId);
  const newQuestionIds = categoryQuestions.map((q) => q._id);
  const updatedSelection = [...selectedQuestions, ...newQuestionIds];
  onSelectionChange(Array.from(new Set(updatedSelection)));

  toast.success(`Added ${categoryQuestions.length} questions from category`);
};

// UI BUTTON:
<Button
  variant="outline"
  size="sm"
  onClick={() => handleBulkAddCategory(category.id)}
>
  <Plus className="w-4 h-4 mr-2" />
  Add All ({categoryQuestionCount})
</Button>;
```

#### 2. Drag & Drop Reordering (HIGH PRIORITY)

**Required:** Reorder selected questions with drag and drop
**Current:** Questions shown in order added, no reordering
**Impact:** Cannot customize question flow/order

```tsx
// IMPLEMENT WITH react-beautiful-dnd or @dnd-kit/core:
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const handleDragEnd = (result: DropResult) => {
  if (!result.destination) return;

  const items = Array.from(step2Data.questionIds);
  const [reordered] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reordered);

  setStep2Data({ ...step2Data, questionIds: items });
};

<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="questions">
    {(provided) => (
      <div {...provided.droppableProps} ref={provided.innerRef}>
        {step2Data.questionIds.map((id, index) => (
          <Draggable key={id} draggableId={id} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                {/* Question card with drag handle */}
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>;
```

#### 3. Question Versioning (MEDIUM PRIORITY)

**Required:** Track changes, author, timestamp for questions
**Current:** No version tracking
**Impact:** Cannot audit question changes or revert to previous versions

```tsx
// ADD TO CUSTOM QUESTION SAVE:
const handleSaveCustomQuestion = async (question: any) => {
  const versionedQuestion = {
    ...question,
    version: 1,
    created_by: session?.user?.id,
    created_at: new Date().toISOString(),
    modified_by: session?.user?.id,
    modified_at: new Date().toISOString(),
    change_history: [],
  };

  setStep2Data({
    ...step2Data,
    customQuestions: [...step2Data.customQuestions, versionedQuestion],
  });
};
```

#### 4. Duplicate Validation (MEDIUM PRIORITY)

**Required:** Prevent adding the same question twice
**Current:** No duplicate checking
**Impact:** Surveys could have duplicate questions confusing respondents

```tsx
// ADD TO QUESTION SELECTION:
const handleQuestionSelection = (newQuestionIds: string[]) => {
  // Check for duplicates
  const duplicates = newQuestionIds.filter((id) =>
    step2Data.questionIds.includes(id)
  );

  if (duplicates.length > 0) {
    toast.warning(`${duplicates.length} question(s) already selected`, {
      description: 'Duplicate questions were not added',
    });
  }

  // Only add non-duplicates
  const uniqueNew = newQuestionIds.filter(
    (id) => !step2Data.questionIds.includes(id)
  );

  setStep2Data({
    ...step2Data,
    questionIds: [...step2Data.questionIds, ...uniqueNew],
  });
};
```

---

## Step 3: Targeting - Detailed Gap Analysis

### ✅ IMPLEMENTED (22%)

1. ✅ **All Employees Option** - Radio button exists
2. ✅ **CSV Upload Tab** - `CSVImporter` component exists

### 🔴 MISSING (78%)

#### 1. Pre-load from Company (CRITICAL - BLOCKER)

**Required:** When Company selected in Step 1, auto-load:

- Departments / Organizational Units
- People list (Name, Email, Employee ID)
- Demographics (location, role, seniority)

**Current:** No data pre-loading at all
**Impact:** CANNOT target specific departments or employees

```tsx
// ADD EFFECT TO LOAD COMPANY DATA:
useEffect(() => {
  if (!step1Data.companyId) return;

  const loadCompanyTargetData = async () => {
    try {
      const [depts, employees, demographics] = await Promise.all([
        fetch(`/api/companies/${step1Data.companyId}/departments`).then((r) =>
          r.json()
        ),
        fetch(`/api/companies/${step1Data.companyId}/users`).then((r) =>
          r.json()
        ),
        fetch(`/api/companies/${step1Data.companyId}/demographics`).then((r) =>
          r.json()
        ),
      ]);

      setStep3Data((prev) => ({
        ...prev,
        availableDepartments: depts,
        availableEmployees: employees,
        demographics: demographics,
      }));
    } catch (error) {
      toast.error('Failed to load company data');
    }
  };

  loadCompanyTargetData();
}, [step1Data.companyId]);
```

#### 2. CSV Import with Column Mapping (HIGH PRIORITY)

**Required:** Template provided, column mapping UI, validation
**Current:** Basic CSV upload, no mapping UI shown

**Files Exist But Not Connected:**

- ✅ `CSVImporter.tsx` exists
- ✅ `ColumnMapper.tsx` exists
- ✅ `ValidationPanel.tsx` exists
- ❌ **Not integrated into Step 3 flow**

```tsx
// CURRENT STEP 3 CSV TAB (INCOMPLETE):
<TabsContent value="csv">
  <CSVImporter
    onDataParsed={(data) => {
      setStep3Data({ ...step3Data, csvData: data });
      // ❌ MISSING: Show ColumnMapper next
    }}
  />
</TabsContent>

// REQUIRED FLOW:
<TabsContent value="csv">
  {!step3Data.csvData && (
    <CSVImporter onDataParsed={(data) => {
      setStep3Data({ ...step3Data, csvData: data });
    }} />
  )}

  {step3Data.csvData && !step3Data.mapping && (
    <ColumnMapper
      headers={step3Data.csvData.headers}
      sampleRows={step3Data.csvData.rows.slice(0, 5)}
      onMappingComplete={(mapping) => {
        setStep3Data({ ...step3Data, mapping });
      }}
    />
  )}

  {step3Data.mapping && !step3Data.validationResult && (
    <ValidationPanel
      csvData={step3Data.csvData}
      mapping={step3Data.mapping}
      onValidationComplete={(result) => {
        setStep3Data({ ...step3Data, validationResult: result });
      }}
    />
  )}

  {step3Data.validationResult && (
    <AudiencePreviewCard
      employees={step3Data.validationResult.validEmployees}
    />
  )}
</TabsContent>
```

#### 3. Manual Add/Edit Records (HIGH PRIORITY)

**Required:** Add employees manually one by one
**Current:** `ManualEmployeeEntry` component exists but not rendered

```tsx
// ADD TO STEP 3:
<TabsContent value="manual">
  <ManualEmployeeEntry
    onAddEmployee={(employee) => {
      setStep3Data((prev) => ({
        ...prev,
        targetEmployees: [...prev.targetEmployees, employee],
      }));
    }}
    existingEmployees={step3Data.targetEmployees}
  />

  <div className="mt-6">
    <AudiencePreviewCard
      employees={step3Data.targetEmployees}
      onRemove={(index) => {
        setStep3Data((prev) => ({
          ...prev,
          targetEmployees: prev.targetEmployees.filter((_, i) => i !== index),
        }));
      }}
    />
  </div>
</TabsContent>
```

#### 4. Filters for Sub-groups (CRITICAL)

**Required:** Filter by department, location, role, etc.
**Current:** No filtering UI at all

```tsx
// ADD FILTER COMPONENT:
<Card>
  <CardHeader>
    <CardTitle>Target Audience Filters</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label>Departments</Label>
      <MultiSelect
        options={step3Data.availableDepartments}
        value={step3Data.selectedDepartments}
        onChange={(depts) =>
          setStep3Data({ ...step3Data, selectedDepartments: depts })
        }
      />
    </div>

    <div>
      <Label>Locations</Label>
      <MultiSelect
        options={step3Data.demographics.locations}
        value={step3Data.selectedLocations}
        onChange={(locs) =>
          setStep3Data({ ...step3Data, selectedLocations: locs })
        }
      />
    </div>

    <div>
      <Label>Roles</Label>
      <MultiSelect
        options={step3Data.demographics.roles}
        value={step3Data.selectedRoles}
        onChange={(roles) =>
          setStep3Data({ ...step3Data, selectedRoles: roles })
        }
      />
    </div>

    <Button onClick={applyFilters}>Apply Filters</Button>
  </CardContent>
</Card>
```

#### 5. De-duplication (MEDIUM PRIORITY)

**Required:** De-duplicate on Email/Employee ID
**Current:** No de-duplication logic

```tsx
// ADD TO DATA PROCESSING:
const deduplicateEmployees = (employees: TargetEmployee[]) => {
  const seen = new Set<string>();
  const unique: TargetEmployee[] = [];
  const duplicates: TargetEmployee[] = [];

  employees.forEach((emp) => {
    const key = emp.email || emp.employee_id;
    if (!key || seen.has(key)) {
      duplicates.push(emp);
    } else {
      seen.add(key);
      unique.push(emp);
    }
  });

  if (duplicates.length > 0) {
    toast.warning(`Removed ${duplicates.length} duplicate entries`);
  }

  return unique;
};
```

#### 6. Target Audience Preview Summary (MEDIUM PRIORITY)

**Required:** Read-only card showing "8 depts, 520 employees, 3 sites"
**Current:** Basic list, no summary stats

```tsx
// ENHANCE AudiencePreviewCard:
<Card>
  <CardHeader>
    <CardTitle>Target Audience Summary</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600">
          {uniqueDepartments.size}
        </div>
        <div className="text-sm text-gray-600">Departments</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-green-600">
          {step3Data.targetEmployees.length}
        </div>
        <div className="text-sm text-gray-600">Employees</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-purple-600">
          {uniqueLocations.size}
        </div>
        <div className="text-sm text-gray-600">Sites</div>
      </div>
    </div>

    {/* Detailed employee list below */}
  </CardContent>
</Card>
```

---

## Step 4: Scheduling & Distribution - Detailed Gap Analysis

### ✅ IMPLEMENTED (50%)

1. ✅ **Start/End Date & Time** - `ScheduleConfig` component exists
2. ✅ **QR Code Generation** - `QRCodeGenerator` component exists
3. ✅ **URL Generation** - Basic implementation

### 🔴 MISSING (50%)

#### 1. Timezone Awareness (HIGH PRIORITY)

**Required:** Timezone defaults from Company, override per survey
**Current:** No timezone selection UI

```tsx
// ADD TO STEP 4:
<div>
  <Label>Timezone</Label>
  <Select
    value={step4Data.schedule?.timezone || companyTimezone}
    onValueChange={(tz) =>
      setStep4Data((prev) => ({
        ...prev,
        schedule: { ...prev.schedule, timezone: tz },
      }))
    }
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {TIMEZONES.map((tz) => (
        <SelectItem key={tz.value} value={tz.value}>
          {tz.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-gray-500 mt-1">
    Default: {companyTimezone} (from company settings)
  </p>
</div>
```

#### 2. Reminders Configuration (HIGH PRIORITY)

**Required:** Cadence and channels (email; optional WhatsApp/SMS)
**Current:** No reminder configuration UI

```tsx
// ADD REMINDER SETTINGS:
<Card>
  <CardHeader>
    <CardTitle>Reminders</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center space-x-2">
      <Checkbox
        id="enable-reminders"
        checked={step4Data.reminders?.enabled}
        onCheckedChange={(enabled) =>
          setStep4Data((prev) => ({
            ...prev,
            reminders: { ...prev.reminders, enabled: Boolean(enabled) },
          }))
        }
      />
      <Label htmlFor="enable-reminders">Send reminder notifications</Label>
    </div>

    {step4Data.reminders?.enabled && (
      <>
        <div>
          <Label>Reminder Schedule</Label>
          <Select
            value={step4Data.reminders.cadence}
            onValueChange={(cadence) =>
              setStep4Data((prev) => ({
                ...prev,
                reminders: { ...prev.reminders, cadence },
              }))
            }
          >
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="every-2-days">Every 2 Days</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </Select>
        </div>

        <div>
          <Label>Channels</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="email" defaultChecked />
              <Label htmlFor="email">📧 Email</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="whatsapp" />
              <Label htmlFor="whatsapp">📱 WhatsApp (Coming Soon)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="sms" />
              <Label htmlFor="sms">💬 SMS (Coming Soon)</Label>
            </div>
          </div>
        </div>
      </>
    )}
  </CardContent>
</Card>
```

#### 3. Tokenized vs Open Links (CRITICAL)

**Required:** Choose between unique tokenized links per user OR open link with access rules
**Current:** Only generates one URL, no token differentiation

```tsx
// ADD DISTRIBUTION TYPE SELECTOR:
<Card>
  <CardHeader>
    <CardTitle>Distribution Method</CardTitle>
  </CardHeader>
  <CardContent>
    <RadioGroup
      value={step4Data.distributionType}
      onValueChange={(type) =>
        setStep4Data({ ...step4Data, distributionType: type })
      }
    >
      <div className="space-y-3">
        <div className="flex items-start space-x-3 p-3 border rounded">
          <RadioGroupItem value="tokenized" id="tokenized" />
          <div className="flex-1">
            <Label htmlFor="tokenized" className="font-semibold">
              🔒 Tokenized Links (Recommended)
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Each employee receives a unique link. Tracks individual
              participation, prevents duplicate responses.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-3 border rounded">
          <RadioGroupItem value="open" id="open" />
          <div className="flex-1">
            <Label htmlFor="open" className="font-semibold">
              🌐 Open Link
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Single link shared with all. Anonymous responses, no tracking.
              Requires access rules to prevent abuse.
            </p>
          </div>
        </div>
      </div>
    </RadioGroup>

    {step4Data.distributionType === 'tokenized' && (
      <Alert className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Tokens will be generated for {step3Data.targetEmployees.length}{' '}
          employees
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

---

## Demographics Management - Complete System Missing (0% Complete)

### 🔴 CRITICAL BLOCKER - No Implementation Exists

**Requirement:** Dynamic, company-specific demographics system (per `req.md` Section 2.2)

**Current State:** Completely missing - no files, no components, no API routes

### Required Features:

#### 1. Company Demographics Definition UI

**Location to Create:** `src/app/admin/companies/[id]/demographics/page.tsx`

```tsx
// NEW FILE NEEDED: src/app/admin/companies/[id]/demographics/page.tsx
'use client';

import { useState } from 'react';
import { DemographicFieldBuilder } from '@/components/demographics/DemographicFieldBuilder';

export default function CompanyDemographicsPage({
  params,
}: {
  params: { id: string };
}) {
  const [demographicFields, setDemographicFields] = useState([
    { name: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    {
      name: 'age_group',
      type: 'select',
      options: ['18-25', '26-35', '36-45', '46+'],
    },
    {
      name: 'work_location',
      type: 'select',
      options: ['Office', 'Remote', 'Hybrid'],
    },
    {
      name: 'tenure',
      type: 'select',
      options: ['0-1yr', '1-3yr', '3-5yr', '5+yr'],
    },
    {
      name: 'education',
      type: 'select',
      options: ['High School', 'Bachelor', 'Master', 'PhD'],
    },
    {
      name: 'hierarchy',
      type: 'select',
      options: ['IC', 'Lead', 'Manager', 'Director', 'VP'],
    },
    { name: 'business_unit', type: 'select', options: [] }, // Load from departments
  ]);

  return (
    <div className="p-8">
      <h1>Company Demographics Configuration</h1>

      <DemographicFieldBuilder
        fields={demographicFields}
        onChange={setDemographicFields}
        onSave={saveCompanyDemographics}
      />
    </div>
  );
}
```

#### 2. CSV Upload with Demographics Mapping

**Location to Create:** `src/components/demographics/DemographicsCSVImporter.tsx`

```tsx
// CSV FORMAT EXPECTED:
// name, email, employee_id, gender, age_group, work_location, tenure, education, hierarchy, business_unit
// John Doe, john@example.com, EMP001, Male, 26-35, Office, 1-3yr, Bachelor, IC, Engineering

// NEW COMPONENT:
export function DemographicsCSVImporter({ companyId, demographicFields }) {
  const [csvData, setCsvData] = useState(null);
  const [mapping, setMapping] = useState({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Employee Demographics</CardTitle>
        <CardDescription>
          CSV must include: name, email, and all configured demographic fields
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CSVDropzone onDataParsed={setCsvData} />

        {csvData && (
          <ColumnMapper
            headers={csvData.headers}
            requiredFields={[
              'name',
              'email',
              ...demographicFields.map((f) => f.name),
            ]}
            onMappingComplete={setMapping}
          />
        )}

        {mapping && (
          <Button onClick={() => processAndUpload(csvData, mapping)}>
            Import {csvData.rowCount} Employees
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 3. User Profile Demographics

**Location to Modify:** `src/models/User.ts`

```typescript
// ADD TO USER SCHEMA:
const UserSchema = new Schema({
  // ... existing fields ...

  demographics: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map(),
  },

  // Example stored data:
  // demographics: {
  //   gender: 'Male',
  //   age_group: '26-35',
  //   work_location: 'Office',
  //   tenure: '1-3yr',
  //   education: 'Bachelor',
  //   hierarchy: 'IC',
  //   business_unit: 'Engineering'
  // }
});
```

#### 4. Survey Response Auto-Population

**Location to Modify:** `src/app/api/surveys/[id]/responses/route.ts`

```typescript
// WHEN USER SUBMITS RESPONSE:
POST / api / surveys / [id] / responses;

const createResponse = async (req: Request) => {
  const { surveyId, userId, answers } = await req.json();

  // FETCH USER DEMOGRAPHICS
  const user = await User.findById(userId).lean();

  const response = new Response({
    survey_id: surveyId,
    user_id: userId,
    answers: answers,

    // ✅ AUTO-POPULATE DEMOGRAPHICS (no user input required)
    demographics: user.demographics || {},

    submitted_at: new Date(),
  });

  await response.save();

  return NextResponse.json({ success: true });
};
```

#### 5. Reporting Dashboard Segmentation

**Location to Create:** `src/components/reports/DemographicSegmentation.tsx`

```tsx
// FILTER REPORTS BY DEMOGRAPHICS:
export function DemographicSegmentation({ surveyId }) {
  const [selectedDemographics, setSelectedDemographics] = useState({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segment Results By</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          onValueChange={(field) =>
            setSelectedDemographics({ field, values: [] })
          }
        >
          <SelectItem value="gender">Gender</SelectItem>
          <SelectItem value="age_group">Age Group</SelectItem>
          <SelectItem value="work_location">Work Location</SelectItem>
          <SelectItem value="tenure">Tenure</SelectItem>
          <SelectItem value="education">Education Level</SelectItem>
          <SelectItem value="hierarchy">Hierarchy Position</SelectItem>
        </Select>

        {selectedDemographics.field && (
          <DemographicChart
            surveyId={surveyId}
            demographicField={selectedDemographics.field}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Database Schema Changes Required

### 1. Company Model - Add Demographics Schema

**File:** `src/models/Company.ts`

```typescript
const CompanySchema = new Schema({
  // ... existing fields ...

  demographic_fields: [
    {
      name: { type: String, required: true },
      label: { type: String, required: true },
      type: {
        type: String,
        enum: ['select', 'text', 'number', 'date'],
        required: true,
      },
      options: [String], // For select type
      required: { type: Boolean, default: false },
      order: { type: Number, default: 0 },
    },
  ],

  demographics_config: {
    enabled: { type: Boolean, default: true },
    require_for_survey: { type: Boolean, default: false },
    auto_populate: { type: Boolean, default: true },
  },
});
```

### 2. Response Model - Add Demographics Field

**File:** `src/models/Response.ts`

```typescript
const ResponseSchema = new Schema({
  // ... existing fields ...

  demographics: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map(),
  },
});

// ADD INDEX FOR SEGMENTATION QUERIES:
ResponseSchema.index({ 'demographics.gender': 1 });
ResponseSchema.index({ 'demographics.age_group': 1 });
ResponseSchema.index({ 'demographics.work_location': 1 });
```

---

## API Routes to Create

### 1. Company Demographics Configuration

```
GET    /api/admin/companies/[id]/demographics      - Get demographic fields
POST   /api/admin/companies/[id]/demographics      - Save demographic configuration
PUT    /api/admin/companies/[id]/demographics      - Update configuration
```

### 2. User Demographics Management

```
GET    /api/admin/companies/[id]/users/demographics     - Get all user demographics
POST   /api/admin/companies/[id]/users/demographics     - Bulk import from CSV
PATCH  /api/admin/users/[userId]/demographics          - Update individual user
```

### 3. Reporting Segmentation

```
GET    /api/reports/[id]/demographics-breakdown         - Results by demographic
GET    /api/surveys/[id]/demographics-summary          - Demographics distribution
```

---

## Priority Implementation Roadmap

### 🔴 **PHASE 1: CRITICAL BLOCKERS (Week 1-2)**

1. **Step 1: Company Dropdown** - Cannot create surveys without selecting company
2. **Step 1: Survey Type Dropdown** - Core data model requirement
3. **Step 3: Company Data Pre-loading** - Blocking department/employee targeting
4. **Demographics System Foundation** - Database schema + User model changes

### 🟡 **PHASE 2: HIGH PRIORITY (Week 3-4)**

5. **Step 2: Bulk Add by Category** - Major UX improvement
6. **Step 2: Drag & Drop Reordering** - Essential for question flow
7. **Step 3: CSV Import Flow** - Connect existing components
8. **Step 3: Filters UI** - Enable targeted surveys
9. **Step 4: Reminders Configuration** - Business requirement for engagement
10. **Step 4: Tokenized vs Open Links** - Security and tracking requirement

### 🟢 **PHASE 3: MEDIUM PRIORITY (Week 5-6)**

11. **Step 1: Language Selector** - Bilingual support
12. **Step 1: Autosave on Blur** - Data safety
13. **Step 2: Duplicate Validation** - Data quality
14. **Step 3: De-duplication** - Data quality
15. **Step 3: Manual Entry UI** - Connect existing component
16. **Step 4: Timezone UI** - International support

### 🔵 **PHASE 4: POLISH (Week 7-8)**

17. **Step 2: Question Versioning** - Audit trail
18. **Step 3: Target Audience Summary Stats** - Better UX
19. **Demographics CSV Import UI** - Admin tooling
20. **Demographics Reporting Dashboard** - Analytics feature

---

## Files That Need to be Created

### New Components Needed:

```
src/components/companies/CompanySearchableDropdown.tsx
src/components/demographics/DemographicFieldBuilder.tsx
src/components/demographics/DemographicsCSVImporter.tsx
src/components/reports/DemographicSegmentation.tsx
src/components/reports/DemographicChart.tsx
src/components/ui/MultiSelect.tsx
```

### New API Routes Needed:

```
src/app/api/admin/companies/[id]/demographics/route.ts
src/app/api/admin/companies/[id]/users/demographics/route.ts
src/app/api/admin/users/[userId]/demographics/route.ts
src/app/api/reports/[id]/demographics-breakdown/route.ts
src/app/api/surveys/[id]/demographics-summary/route.ts
```

### New Admin Pages Needed:

```
src/app/admin/companies/[id]/demographics/page.tsx
```

---

## Estimated Development Time

| Phase     | Tasks                      | Estimated Time | Priority    |
| --------- | -------------------------- | -------------- | ----------- |
| Phase 1   | 4 critical blockers        | 2-3 weeks      | 🔴 CRITICAL |
| Phase 2   | 6 high priority features   | 3-4 weeks      | 🟡 HIGH     |
| Phase 3   | 6 medium priority features | 2-3 weeks      | 🟢 MEDIUM   |
| Phase 4   | 4 polish features          | 1-2 weeks      | 🔵 LOW      |
| **TOTAL** | **20 features**            | **8-12 weeks** |             |

---

## Next Immediate Actions

1. ✅ **Review this gap analysis** with stakeholders
2. 🔴 **Prioritize Phase 1 items** for immediate development
3. 🔴 **Create database migration** for demographics fields
4. 🔴 **Implement Company dropdown** in Step 1
5. 🔴 **Build CompanySearchableDropdown component**
6. 🔴 **Add Survey Type dropdown** to Step 1
7. 🔴 **Implement company data pre-loading** on Step 1 selection
8. 🔴 **Create demographics schema** in Company and User models

---

## Conclusion

**The microclimate wizard has good scaffolding (autosave, draft recovery, step navigation) but is missing ~70% of the core business requirements.** The most critical gaps are:

1. No company selection UI
2. No survey type differentiation
3. No company data pre-loading for targeting
4. Complete absence of demographics system
5. Missing CSV import flow integration
6. No reminder/distribution configuration

**Without Phase 1 completion, the system cannot be used in production.**
