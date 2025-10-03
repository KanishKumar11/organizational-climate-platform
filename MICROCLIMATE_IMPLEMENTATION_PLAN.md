# Microclimate Survey System - Complete Implementation Plan

## 📋 Executive Summary

This document outlines the comprehensive implementation of an enterprise-grade Microclimate/Climate/Culture survey system with:

- ✅ **4-Step Wizard** with autosave
- ✅ **Question Library** with hierarchical categories
- ✅ **Advanced Targeting** with company master data
- ✅ **QR Code & URL Distribution**
- ✅ **Multilingual Support** (ES/EN)
- ✅ **Audit Trail** for all changes
- ✅ **Draft Recovery** after session expiry

## 🎯 Architecture Overview

### Technology Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **State Management**: React Query + Zustand (for autosave)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Backend**: Next.js API Routes + MongoDB + Mongoose
- **Real-time**: Server-Sent Events (SSE) for live updates
- **File Processing**: PapaParse (CSV), XLSX (Excel)
- **QR Generation**: qrcode.react
- **i18n**: next-intl

### Data Flow

```
User Input → Local State → Debounced Autosave → MongoDB Draft
          ↓
    React Query Cache ← API ← MongoDB
          ↓
    Optimistic Updates → UI Feedback
```

## 📁 File Structure

```
src/
├── app/api/
│   ├── surveys/
│   │   ├── drafts/
│   │   │   ├── route.ts                    # List/create drafts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts                # Get/update/delete draft
│   │   │   │   ├── autosave/route.ts       # Background autosave endpoint
│   │   │   │   └── recover/route.ts        # Recover draft after timeout
│   │   ├── route.ts                        # Create/list published surveys
│   │   ├── [id]/
│   │   │   ├── route.ts                    # Get/update survey
│   │   │   ├── audit/route.ts              # Audit trail
│   │   │   ├── qr-code/route.ts            # Generate QR code
│   │   │   ├── distribution/route.ts       # URL & access management
│   │   │   └── csv-import/route.ts         # Import targeting CSV
│   ├── question-library/
│   │   ├── route.ts                        # List questions
│   │   │   ├── categories/route.ts         # List/create categories
│   │   │   ├── quick-add/route.ts          # Frequently used questions
│   │   │   ├── search/route.ts             # Search with filters
│   │   │   └── bulk-add/route.ts           # Add by category
│   │   ├── [id]/
│   │   │   ├── route.ts                    # Get/update/delete question
│   │   │   └── versions/route.ts           # Question version history
│   └── companies/
│       └── [id]/
│           ├── master-data/route.ts        # Preload company data
│           └── audience-preview/route.ts   # Calculate audience stats
├── components/
│   └── survey/
│       ├── SurveyWizard/
│       │   ├── index.tsx                   # Main wizard orchestrator
│       │   ├── Step1BasicInfo.tsx          # Company, type, language
│       │   ├── Step2Questions.tsx          # Question library integration
│       │   ├── Step3Targeting.tsx          # Audience management
│       │   ├── Step4Scheduling.tsx         # Dates, URL, QR
│       │   ├── AutosaveIndicator.tsx       # Save status display
│       │   ├── DraftRecoveryBanner.tsx     # Restore unsaved work
│       │   └── ProgressStepper.tsx         # Visual progress
│       ├── QuestionLibrary/
│       │   ├── Browser.tsx                 # Hierarchical category view
│       │   ├── SearchFilter.tsx            # Advanced search
│       │   ├── QuickAdd.tsx                # Frequently used
│       │   ├── BulkSelector.tsx            # Checkbox tree
│       │   └── QuestionEditor.tsx          # Inline editing
│       ├── Targeting/
│       │   ├── CompanyDataLoader.tsx       # Preload from master data
│       │   ├── CSVImporter.tsx             # Upload & map columns
│       │   ├── FilterBuilder.tsx           # Dept, location, role filters
│       │   ├── AudiencePreview.tsx         # Read-only summary card
│       │   └── DeduplicationEngine.tsx     # Email/ID deduplication
│       ├── Distribution/
│       │   ├── QRCodeGenerator.tsx         # SVG/PNG export
│       │   ├── URLManager.tsx              # Tokenized links
│       │   └── AccessRulesConfig.tsx       # Open vs. tokenized
│       └── AuditTrail/
│           ├── ChangeLog.tsx               # Who, what, when
│           └── DiffViewer.tsx              # Before/after comparison
├── hooks/
│   ├── useSurveyWizard.ts                  # Wizard state management
│   ├── useAutosave.ts                      # Debounced save logic
│   ├── useDraftRecovery.ts                 # Restore drafts
│   ├── useQuestionLibrary.ts               # React Query for questions
│   ├── useTargetingData.ts                 # Company data fetching
│   └── useAuditTrail.ts                    # Track changes
├── lib/
│   ├── autosave-manager.ts                 # Autosave orchestration
│   ├── question-library-service.ts         # Question CRUD
│   ├── targeting-engine.ts                 # Audience calculation
│   ├── csv-processor.ts                    # CSV parsing & validation
│   ├── qr-code-service.ts                  # QR generation
│   ├── audit-trail-service.ts              # Change tracking
│   └── i18n-config.ts                      # Multilingual setup
├── models/
│   ├── SurveyDraft.ts                      # Draft schema
│   ├── QuestionLibrary.ts                  # Question catalog
│   ├── QuestionCategory.ts                 # Hierarchical categories
│   ├── SurveyAuditLog.ts                   # Audit trail
│   └── SurveyDistribution.ts               # URLs & QR codes
└── types/
    ├── survey-wizard.ts                    # Wizard interfaces
    ├── question-library.ts                 # Question types
    └── targeting.ts                        # Audience interfaces
```

## 🔧 Implementation Details

### STEP 1: Basic Info with Autosave

#### Component: `Step1BasicInfo.tsx`

```typescript
interface Step1Data {
  survey_type: 'microclimate' | 'climate' | 'culture';
  title: string;
  description?: string;
  company_id: string;
  company_type?: string;
  language: 'es' | 'en' | 'both';
}

Features:
- Searchable company dropdown with React Query
- Real-time validation (title required, max lengths)
- Background autosave every 5 seconds
- Visual save indicator (Saving... / Saved / Error)
- Company type auto-fill
```

#### Autosave Implementation

```typescript
// hooks/useAutosave.ts
import { useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useMutation } from '@tanstack/react-query';

export function useAutosave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options = { debounceMs: 5000, enabled: true }
) {
  const lastSaved = useRef<string>('');
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  const mutation = useMutation({
    mutationFn: saveFn,
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => setSaveStatus('error'),
  });

  const debouncedSave = useDebouncedCallback(() => {
    const currentData = JSON.stringify(data);
    if (currentData !== lastSaved.current && options.enabled) {
      lastSaved.current = currentData;
      mutation.mutate(data);
    }
  }, options.debounceMs);

  useEffect(() => {
    debouncedSave();
  }, [data, debouncedSave]);

  return { saveStatus, forceSave: () => mutation.mutate(data) };
}
```

#### API Endpoint: `/api/surveys/drafts/[id]/autosave`

```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { step, data, version } = await req.json();

  await connectDB();

  // Optimistic concurrency control
  const draft = await SurveyDraft.findOne({
    _id: params.id,
    created_by: session.user.id,
    version,
  });

  if (!draft) {
    return NextResponse.json(
      { error: 'Draft outdated or not found' },
      { status: 409 }
    );
  }

  draft[`step${step}_data`] = data;
  draft.version += 1;
  draft.last_modified = new Date();
  draft.last_autosave = new Date();

  await draft.save();

  return NextResponse.json({
    success: true,
    version: draft.version,
    timestamp: draft.last_autosave,
  });
}
```

### STEP 2: Questions with Library Integration

#### Component: `Step2Questions.tsx`

```typescript
interface Step2Features {
  quickAdd: Question[];           // Frequently used
  library: {
    categories: QuestionCategory[];
    questions: Question[];
    search: (query: string, filters: Filters) => Question[];
  };
  customCreate: (question: Partial<Question>) => void;
  bulkAdd: (categoryId: string) => void;
  dragReorder: (questions: Question[]) => void;
  multilingual: {
    editMode: 'es' | 'en' | 'both';
    sideBy Side: boolean;
  };
  versioning: {
    trackChanges: boolean;
    author: string;
    timestamp: Date;
  };
}
```

#### Question Library Service

```typescript
// lib/question-library-service.ts
export class QuestionLibraryService {
  async getQuickAddQuestions(companyId: string): Promise<Question[]> {
    // Get 10 most frequently used questions in last 30 days
    return await QuestionLibrary.aggregate([
      { $match: { company_id: companyId, is_active: true } },
      {
        $lookup: {
          from: 'survey_questions',
          localField: '_id',
          foreignField: 'library_question_id',
          as: 'usage',
        },
      },
      { $addFields: { usage_count: { $size: '$usage' } } },
      { $sort: { usage_count: -1, created_at: -1 } },
      { $limit: 10 },
    ]);
  }

  async searchQuestions(params: SearchParams): Promise<Question[]> {
    const { query, category, dimension, scale, tags, language } = params;

    const filter: any = { is_active: true };

    if (query) {
      filter.$text = { $search: query };
    }

    if (category) {
      filter.category_id = category;
    }

    if (dimension) {
      filter.dimension = dimension;
    }

    if (tags?.length) {
      filter.tags = { $in: tags };
    }

    if (language) {
      filter[`text_${language}`] = { $exists: true, $ne: '' };
    }

    return await QuestionLibrary.find(filter)
      .populate('category_id')
      .sort({ usage_count: -1, created_at: -1 })
      .limit(100);
  }

  async bulkAddByCategory(categoryId: string): Promise<Question[]> {
    return await QuestionLibrary.find({
      category_id: categoryId,
      is_active: true,
    }).sort({ order: 1 });
  }

  async createQuestion(data: CreateQuestionDTO): Promise<Question> {
    // Validate no duplicates
    const existing = await QuestionLibrary.findOne({
      company_id: data.company_id,
      text_en: data.text_en,
      is_active: true,
    });

    if (existing) {
      throw new Error('Duplicate question found');
    }

    const question = new QuestionLibrary({
      ...data,
      version: 1,
      created_by: data.created_by,
      created_at: new Date(),
    });

    await question.save();

    // Track in audit log
    await this.createAuditEntry({
      question_id: question._id,
      action: 'created',
      author: data.created_by,
      changes: { new: question.toObject() },
    });

    return question;
  }

  async updateQuestion(
    id: string,
    data: Partial<Question>,
    userId: string
  ): Promise<Question> {
    const original = await QuestionLibrary.findById(id);
    if (!original) throw new Error('Question not found');

    // Create new version
    const updated = await QuestionLibrary.findByIdAndUpdate(
      id,
      {
        ...data,
        version: original.version + 1,
        last_modified_by: userId,
        last_modified: new Date(),
      },
      { new: true }
    );

    // Track changes
    await this.createAuditEntry({
      question_id: id,
      action: 'updated',
      author: userId,
      changes: {
        before: original.toObject(),
        after: updated.toObject(),
      },
    });

    return updated;
  }
}
```

#### Multilingual Editor Component

```typescript
// components/survey/QuestionLibrary/MultilingualEditor.tsx
export function MultilingualEditor({
  question,
  onChange
}: {
  question: Question;
  onChange: (updated: Question) => void;
}) {
  const [editMode, setEditMode] = useState<'es' | 'en' | 'both'>('both');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={editMode === 'both' ? 'default' : 'outline'}
          onClick={() => setEditMode('both')}
        >
          Side-by-Side
        </Button>
        <Button
          variant={editMode === 'es' ? 'default' : 'outline'}
          onClick={() => setEditMode('es')}
        >
          Español
        </Button>
        <Button
          variant={editMode === 'en' ? 'default' : 'outline'}
          onClick={() => setEditMode('en')}
        >
          English
        </Button>
      </div>

      {editMode === 'both' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Español</Label>
            <Textarea
              value={question.text_es}
              onChange={(e) => onChange({ ...question, text_es: e.target.value })}
              placeholder="Texto en español..."
            />
          </div>
          <div>
            <Label>English</Label>
            <Textarea
              value={question.text_en}
              onChange={(e) => onChange({ ...question, text_en: e.target.value })}
              placeholder="Text in English..."
            />
          </div>
        </div>
      ) : (
        <div>
          <Label>{editMode === 'es' ? 'Español' : 'English'}</Label>
          <Textarea
            value={editMode === 'es' ? question.text_es : question.text_en}
            onChange={(e) => onChange({
              ...question,
              [editMode === 'es' ? 'text_es' : 'text_en']: e.target.value
            })}
          />
        </div>
      )}
    </div>
  );
}
```

### STEP 3: Advanced Targeting

#### Component: `Step3Targeting.tsx`

```typescript
interface TargetingData {
  preloaded: {
    departments: Department[];
    employees: Employee[];
    locations: Location[];
    roles: Role[];
  };
  filters: {
    department_ids: string[];
    location_ids: string[];
    role_filters: string[];
    seniority_levels: string[];
    tenure_range?: { min: number; max: number };
  };
  imported: Employee[];
  manual: Employee[];
  excluded_ids: string[];
}
```

#### Company Master Data Preload

```typescript
// API: /api/companies/[id]/master-data
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const [departments, employees, locations] = await Promise.all([
    Department.find({ company_id: params.id, is_active: true })
      .select('name code employee_count parent_id')
      .lean(),

    User.find({ companyId: params.id, is_active: true })
      .select(
        'name email employee_id department_id location role seniority tenure_months'
      )
      .lean(),

    Company.findById(params.id)
      .select('locations')
      .lean()
      .then((c) => c?.locations || []),
  ]);

  // Build demographics summary
  const demographics = {
    total_employees: employees.length,
    by_department: _.countBy(employees, 'department_id'),
    by_location: _.countBy(employees, 'location'),
    by_role: _.countBy(employees, 'role'),
    by_seniority: _.countBy(employees, 'seniority'),
    tenure_distribution: {
      '0-6mo': employees.filter((e) => e.tenure_months <= 6).length,
      '6mo-1yr': employees.filter(
        (e) => e.tenure_months > 6 && e.tenure_months <= 12
      ).length,
      '1-3yr': employees.filter(
        (e) => e.tenure_months > 12 && e.tenure_months <= 36
      ).length,
      '3yr+': employees.filter((e) => e.tenure_months > 36).length,
    },
  };

  return NextResponse.json({
    departments: buildDepartmentTree(departments),
    employees,
    locations,
    demographics,
  });
}
```

#### CSV Import Component

```typescript
// components/survey/Targeting/CSVImporter.tsx
import Papa from 'papaparse';

export function CSVImporter({ onImport }: { onImport: (data: Employee[]) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      preview: 5,
      complete: (results) => {
        setPreview(results.data);
        // Auto-detect column mapping
        const headers = results.meta.fields || [];
        const autoMapping = autoDetectMapping(headers);
        setMapping(autoMapping);
      }
    });

    setFile(file);
  };

  const autoDetectMapping = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {};
    const patterns = {
      email: /email|correo|e-mail/i,
      name: /name|nombre|full.?name/i,
      employee_id: /id|employee.?id|emp.?id|código/i,
      department: /department|dept|departamento/i,
      location: /location|site|ubicación|oficina/i,
      role: /role|position|cargo|puesto/i,
    };

    headers.forEach(header => {
      for (const [field, pattern] of Object.entries(patterns)) {
        if (pattern.test(header)) {
          mapping[field] = header;
          break;
        }
      }
    });

    return mapping;
  };

  const handleImport = async () => {
    if (!file) return;

    const result = await new Promise<Employee[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const employees = results.data.map((row: any) => ({
            name: row[mapping.name],
            email: row[mapping.email]?.toLowerCase().trim(),
            employee_id: row[mapping.employee_id],
            department: row[mapping.department],
            location: row[mapping.location],
            role: row[mapping.role],
          })).filter(e => e.email); // Remove empty rows

          // Validate
          const errors = validateEmployeeData(employees);
          if (errors.length > 0) {
            setErrors(errors);
            reject(errors);
          } else {
            resolve(employees);
          }
        },
        error: reject
      });
    });

    // Deduplicate by email
    const deduplicated = _.uniqBy(result, 'email');
    onImport(deduplicated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from CSV/XLSX</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
          />
          <p className="text-sm text-muted-foreground mt-1">
            <a href="/templates/employee-import-template.csv" className="underline">
              Download template
            </a>
          </p>
        </div>

        {preview.length > 0 && (
          <>
            <div>
              <h4 className="font-medium mb-2">Column Mapping</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(mapping).map(([field, column]) => (
                  <div key={field} className="flex items-center gap-2">
                    <Label className="w-32">{field}:</Label>
                    <Select value={column} onValueChange={(v) => setMapping({...mapping, [field]: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {preview.length > 0 && Object.keys(preview[0]).map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Emp ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row[mapping.name]}</TableCell>
                      <TableCell>{row[mapping.email]}</TableCell>
                      <TableCell>{row[mapping.employee_id]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Validation Errors ({errors.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {errors.slice(0, 5).map((err, i) => (
                      <li key={i}>Row {err.row}: {err.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleImport} disabled={errors.length > 0}>
              Import {preview.length} Employees
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

#### Audience Preview Component

```typescript
// components/survey/Targeting/AudiencePreview.tsx
export function AudiencePreview({ filters }: { filters: TargetingFilters }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['audience-preview', filters],
    queryFn: () => fetch('/api/companies/${companyId}/audience-preview', {
      method: 'POST',
      body: JSON.stringify(filters)
    }).then(r => r.json())
  });

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Target Audience Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Recipients"
            value={stats.total_recipients}
            icon={<Users />}
          />
          <StatCard
            label="Departments"
            value={stats.department_count}
            icon={<Building />}
          />
          <StatCard
            label="Locations"
            value={stats.location_count}
            icon={<MapPin />}
          />
          <StatCard
            label="Avg Tenure"
            value={`${stats.avg_tenure_months}mo`}
            icon={<Clock />}
          />
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Distribution</h4>
          {stats.distribution.map((item: any) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <span>{item.name}</span>
              <Badge variant="secondary">{item.count} ({item.percentage}%)</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### STEP 4: Scheduling & Distribution

#### Component: `Step4Scheduling.tsx`

```typescript
interface SchedulingData {
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  timezone: string;
  reminders: {
    enabled: boolean;
    schedule: Array<{
      type: 'before_start' | 'during' | 'before_end';
      offset_hours: number;
      channels: ('email' | 'sms' | 'whatsapp')[];
    }>;
  };
  distribution: {
    access_type: 'tokenized' | 'open' | 'hybrid';
    require_login: boolean;
    allow_anonymous: boolean;
    single_response: boolean;
  };
}
```

#### QR Code Generator Service

```typescript
// lib/qr-code-service.ts
import QRCode from 'qrcode';

export class QRCodeService {
  async generateQRCode(
    surveyId: string,
    options: QROptions = {}
  ): Promise<QRCodeData> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const url = `${baseUrl}/surveys/${surveyId}/respond`;

    // Generate different formats
    const [svgString, pngDataUrl, pdfBuffer] = await Promise.all([
      QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        width: options.size || 300,
        color: {
          dark: options.color || '#000000',
          light: options.backgroundColor || '#FFFFFF',
        },
      }),

      QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        width: options.size || 300,
      }),

      this.generatePDF(url, options),
    ]);

    // Save to database
    await SurveyDistribution.findOneAndUpdate(
      { survey_id: surveyId },
      {
        qr_code_svg: svgString,
        qr_code_png: pngDataUrl,
        qr_code_url: url,
        generated_at: new Date(),
      },
      { upsert: true }
    );

    return {
      svg: svgString,
      png: pngDataUrl,
      pdf: pdfBuffer,
      url,
    };
  }

  async generatePDF(url: string, options: QROptions): Promise<Buffer> {
    // Use pdf-lib to create a printable PDF with QR code
    // Include survey title, instructions, and QR code
    // Return buffer for download
  }
}
```

#### URL Management Component

```typescript
// components/survey/Distribution/URLManager.tsx
export function URLManager({ surveyId }: { surveyId: string }) {
  const { data: distribution, mutate } = useQuery({
    queryKey: ['distribution', surveyId],
    queryFn: () => fetch(`/api/surveys/${surveyId}/distribution`).then(r => r.json())
  });

  const [accessType, setAccessType] = useState<'tokenized' | 'open'>('tokenized');

  const generateURL = async (type: 'tokenized' | 'open') => {
    const response = await fetch(`/api/surveys/${surveyId}/distribution/generate-url`, {
      method: 'POST',
      body: JSON.stringify({ type })
    });
    const data = await response.json();
    mutate();
    return data.url;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution URLs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Access Type</Label>
          <RadioGroup value={accessType} onValueChange={setAccessType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tokenized" id="tokenized" />
              <Label htmlFor="tokenized">
                Tokenized (unique link per respondent)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="open" id="open" />
              <Label htmlFor="open">
                Open (same link for all, login required)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {accessType === 'tokenized' ? (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Unique URLs will be generated for each recipient and sent via email.
              Track individual responses and prevent duplicate submissions.
            </p>
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                {distribution?.tokenized_links_generated || 0} unique links generated
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div>
            <Label>Public URL</Label>
            <div className="flex gap-2">
              <Input
                value={distribution?.public_url || 'Not generated'}
                readOnly
              />
              <Button
                onClick={() => navigator.clipboard.writeText(distribution?.public_url)}
                variant="outline"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Anyone with this link can access the survey (login required based on settings)
            </p>
          </div>
        )}

        <Separator />

        <div>
          <h4 className="font-medium mb-2">QR Code</h4>
          <div className="flex gap-4">
            <div className="border rounded p-4">
              {distribution?.qr_code_svg && (
                <div dangerouslySetInnerHTML={{ __html: distribution.qr_code_svg }} />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download SVG
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Download PDF (Printable)
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-2">Access Rules</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Require Login</Label>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <Label>Allow Anonymous Responses</Label>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <Label>Single Response Per User</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active Outside Schedule</Label>
              <Switch />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Draft Recovery & Audit Trail

#### Draft Recovery Hook

```typescript
// hooks/useDraftRecovery.ts
export function useDraftRecovery(surveyId?: string) {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);

  useEffect(() => {
    // Check for draft on mount
    const checkDraft = async () => {
      const response = await fetch('/api/surveys/drafts/latest');
      const data = await response.json();

      if (data.draft && isRecent(data.draft.last_modified)) {
        setHasDraft(true);
        setDraftData(data.draft);
      }
    };

    checkDraft();
  }, []);

  const recoverDraft = async () => {
    // Restore draft data to wizard state
    return draftData;
  };

  const discardDraft = async () => {
    await fetch(`/api/surveys/drafts/${draftData._id}`, {
      method: 'DELETE',
    });
    setHasDraft(false);
    setDraftData(null);
  };

  return { hasDraft, draftData, recoverDraft, discardDraft };
}

function isRecent(timestamp: string): boolean {
  const age = Date.now() - new Date(timestamp).getTime();
  return age < 24 * 60 * 60 * 1000; // Less than 24 hours
}
```

#### Draft Recovery Banner

```typescript
// components/survey/SurveyWizard/DraftRecoveryBanner.tsx
export function DraftRecoveryBanner() {
  const { hasDraft, draftData, recoverDraft, discardDraft } = useDraftRecovery();

  if (!hasDraft) return null;

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900">Unsaved Draft Found</AlertTitle>
      <AlertDescription className="text-orange-800">
        You have an unsaved survey draft from{' '}
        {formatDistanceToNow(new Date(draftData.last_modified), { addSuffix: true })}.
        <div className="flex gap-2 mt-2">
          <Button
            onClick={recoverDraft}
            size="sm"
            variant="default"
          >
            Recover Draft
          </Button>
          <Button
            onClick={discardDraft}
            size="sm"
            variant="outline"
          >
            Start Fresh
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

#### Audit Trail Service

```typescript
// lib/audit-trail-service.ts
export class AuditTrailService {
  async logChange(params: AuditLogParams): Promise<void> {
    const entry = new SurveyAuditLog({
      survey_id: params.surveyId,
      action: params.action,
      entity_type: params.entityType, // 'title', 'questions', 'audience', 'schedule'
      entity_id: params.entityId,
      changes: {
        before: params.before,
        after: params.after,
      },
      user_id: params.userId,
      user_name: params.userName,
      user_role: params.userRole,
      timestamp: new Date(),
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    });

    await entry.save();
  }

  async getAuditLog(surveyId: string): Promise<AuditEntry[]> {
    return await SurveyAuditLog.find({ survey_id: surveyId })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
  }

  async getChangesByEntity(
    surveyId: string,
    entityType: string
  ): Promise<AuditEntry[]> {
    return await SurveyAuditLog.find({
      survey_id: surveyId,
      entity_type: entityType,
    })
      .sort({ timestamp: -1 })
      .lean();
  }
}
```

## 📊 Database Schemas

### SurveyDraft Model

```typescript
// models/SurveyDraft.ts
const SurveyDraftSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, default: 1 },

    // Step 1: Basic Info
    step1_data: {
      survey_type: {
        type: String,
        enum: ['microclimate', 'climate', 'culture'],
      },
      title: String,
      description: String,
      company_type: String,
      language: { type: String, enum: ['es', 'en', 'both'], default: 'both' },
    },

    // Step 2: Questions
    step2_data: {
      questions: [
        {
          library_id: { type: Schema.Types.ObjectId, ref: 'QuestionLibrary' },
          text_es: String,
          text_en: String,
          type: String,
          options: [String],
          category: String,
          dimension: String,
          required: Boolean,
          order: Number,
        },
      ],
      from_template: Boolean,
      template_id: { type: Schema.Types.ObjectId, ref: 'SurveyTemplate' },
    },

    // Step 3: Targeting
    step3_data: {
      filters: {
        department_ids: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
        location_ids: [String],
        role_filters: [String],
        seniority_levels: [String],
        tenure_range: { min: Number, max: Number },
      },
      imported_employees: [
        {
          name: String,
          email: String,
          employee_id: String,
          department: String,
          location: String,
          role: String,
        },
      ],
      manual_additions: [
        {
          name: String,
          email: String,
          employee_id: String,
        },
      ],
      excluded_ids: [String],
      total_recipients: Number,
    },

    // Step 4: Scheduling
    step4_data: {
      start_date: Date,
      end_date: Date,
      timezone: String,
      reminders: [
        {
          type: String,
          offset_hours: Number,
          channels: [String],
        },
      ],
      distribution: {
        access_type: { type: String, enum: ['tokenized', 'open', 'hybrid'] },
        require_login: Boolean,
        allow_anonymous: Boolean,
        single_response: Boolean,
      },
    },

    created_at: { type: Date, default: Date.now },
    last_modified: { type: Date, default: Date.now },
    last_autosave: Date,
    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }, // 7 days
  },
  {
    timestamps: true,
  }
);

// Index for efficient draft retrieval
SurveyDraftSchema.index({ created_by: 1, last_modified: -1 });
SurveyDraftSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.models.SurveyDraft ||
  mongoose.model('SurveyDraft', SurveyDraftSchema);
```

### QuestionLibrary Model

```typescript
// models/QuestionLibrary.ts
const QuestionLibrarySchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionCategory',
      required: true,
    },

    text_es: { type: String, required: true },
    text_en: { type: String, required: true },

    type: {
      type: String,
      enum: [
        'likert',
        'multiple_choice',
        'open_ended',
        'scale',
        'binary',
        'matrix',
      ],
      required: true,
    },

    options_es: [String],
    options_en: [String],

    scale: {
      min: Number,
      max: Number,
      labels_es: Map,
      labels_en: Map,
    },

    dimension: { type: String }, // e.g., 'engagement', 'satisfaction', 'leadership'
    tags: [String],

    reverse_coded: { type: Boolean, default: false }, // For sentiment analysis

    // Version control
    version: { type: Number, default: 1 },
    previous_version_id: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionLibrary',
    },

    // Usage tracking
    usage_count: { type: Number, default: 0 },
    last_used: Date,

    // Metadata
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    last_modified_by: { type: Schema.Types.ObjectId, ref: 'User' },
    is_active: { type: Boolean, default: true },
    is_global: { type: Boolean, default: false }, // Available to all companies

    created_at: { type: Date, default: Date.now },
    last_modified: Date,
  },
  {
    timestamps: true,
  }
);

// Text search index
QuestionLibrarySchema.index({
  text_es: 'text',
  text_en: 'text',
  tags: 'text',
});

// Compound indexes for efficient queries
QuestionLibrarySchema.index({ company_id: 1, category_id: 1, is_active: 1 });
QuestionLibrarySchema.index({ company_id: 1, usage_count: -1 });

export default mongoose.models.QuestionLibrary ||
  mongoose.model('QuestionLibrary', QuestionLibrarySchema);
```

### QuestionCategory Model

```typescript
// models/QuestionCategory.ts
const QuestionCategorySchema = new Schema(
  {
    name_es: { type: String, required: true },
    name_en: { type: String, required: true },
    description_es: String,
    description_en: String,

    parent_id: { type: Schema.Types.ObjectId, ref: 'QuestionCategory' }, // For hierarchy
    level: { type: Number, default: 0 }, // 0 = root, 1 = subcategory, etc.

    icon: String,
    color: String,

    order: Number,

    company_id: { type: Schema.Types.ObjectId, ref: 'Company' },
    is_global: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },

    question_count: { type: Number, default: 0 }, // Denormalized for performance

    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

QuestionCategorySchema.index({ company_id: 1, parent_id: 1, is_active: 1 });
QuestionCategorySchema.index({ is_global: 1, level: 1 });

export default mongoose.models.QuestionCategory ||
  mongoose.model('QuestionCategory', QuestionCategorySchema);
```

### SurveyAuditLog Model

```typescript
// models/SurveyAuditLog.ts
const SurveyAuditLogSchema = new Schema(
  {
    survey_id: { type: Schema.Types.ObjectId, ref: 'Survey', required: true },

    action: {
      type: String,
      enum: [
        'created',
        'updated',
        'deleted',
        'published',
        'cancelled',
        'completed',
        'question_added',
        'question_removed',
        'question_modified',
        'audience_updated',
        'schedule_changed',
        'settings_modified',
      ],
      required: true,
    },

    entity_type: {
      type: String,
      enum: [
        'survey',
        'title',
        'description',
        'questions',
        'audience',
        'schedule',
        'distribution',
        'settings',
      ],
      required: true,
    },
    entity_id: String, // For specific entities like question ID

    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },

    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    user_name: String,
    user_role: String,

    timestamp: { type: Date, default: Date.now },
    ip_address: String,
    user_agent: String,
  },
  {
    timestamps: false,
  }
);

SurveyAuditLogSchema.index({ survey_id: 1, timestamp: -1 });
SurveyAuditLogSchema.index({ user_id: 1, timestamp: -1 });
SurveyAuditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.models.SurveyAuditLog ||
  mongoose.model('SurveyAuditLog', SurveyAuditLogSchema);
```

### SurveyDistribution Model

```typescript
// models/SurveyDistribution.ts
const SurveyDistributionSchema = new Schema(
  {
    survey_id: {
      type: Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
      unique: true,
    },

    access_type: {
      type: String,
      enum: ['tokenized', 'open', 'hybrid'],
      default: 'tokenized',
    },

    public_url: String,
    tokenized_links_generated: { type: Number, default: 0 },

    qr_code_svg: String,
    qr_code_png: String,
    qr_code_pdf_url: String,
    qr_code_url: String,

    access_rules: {
      require_login: { type: Boolean, default: true },
      allow_anonymous: { type: Boolean, default: false },
      single_response: { type: Boolean, default: true },
      active_outside_schedule: { type: Boolean, default: false },
      allowed_domains: [String],
      blocked_ips: [String],
    },

    generated_at: Date,
    regenerated_count: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SurveyDistribution ||
  mongoose.model('SurveyDistribution', SurveyDistributionSchema);
```

## 🚀 Implementation Timeline

### Phase 1: Foundation (Week 1)

- [ ] Database schemas (SurveyDraft, QuestionLibrary, QuestionCategory, SurveyAuditLog)
- [ ] Autosave hook and service
- [ ] Draft recovery system
- [ ] Basic wizard structure

### Phase 2: Question Library (Week 2)

- [ ] Question library CRUD APIs
- [ ] Category hierarchy system
- [ ] Quick Add functionality
- [ ] Search and filter
- [ ] Multilingual editor
- [ ] Bulk add by category

### Phase 3: Targeting System (Week 3)

- [ ] Company master data preload API
- [ ] CSV import component
- [ ] Column mapping UI
- [ ] Deduplication engine
- [ ] Filter builder
- [ ] Audience preview

### Phase 4: Distribution (Week 4)

- [ ] QR code generation service
- [ ] URL management system
- [ ] Access rules configuration
- [ ] Tokenized link generation
- [ ] Download formats (PNG, SVG, PDF)

### Phase 5: Polish & Testing (Week 5)

- [ ] Audit trail implementation
- [ ] Error handling and retry logic
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation

## 📝 Testing Strategy

### Unit Tests

```typescript
// __tests__/hooks/useAutosave.test.ts
describe('useAutosave', () => {
  it('should debounce saves', async () => {
    const saveFn = jest.fn();
    const { result } = renderHook(() => useAutosave(data, saveFn));

    // Should not call immediately
    expect(saveFn).not.toHaveBeenCalled();

    // Should call after debounce period
    await waitFor(() => expect(saveFn).toHaveBeenCalledTimes(1), {
      timeout: 6000,
    });
  });

  it('should handle save errors gracefully', async () => {
    const saveFn = jest.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAutosave(data, saveFn));

    await waitFor(() => expect(result.current.saveStatus).toBe('error'));
  });
});
```

### Integration Tests

```typescript
// __tests__/api/surveys/drafts.test.ts
describe('POST /api/surveys/drafts/[id]/autosave', () => {
  it('should save draft with optimistic concurrency control', async () => {
    const draft = await createTestDraft();

    const response = await fetch(`/api/surveys/drafts/${draft._id}/autosave`, {
      method: 'POST',
      body: JSON.stringify({
        step: 1,
        data: { title: 'Updated Title' },
        version: draft.version,
      }),
    });

    expect(response.status).toBe(200);
    const updated = await SurveyDraft.findById(draft._id);
    expect(updated.version).toBe(draft.version + 1);
  });

  it('should reject outdated versions', async () => {
    const draft = await createTestDraft();

    const response = await fetch(`/api/surveys/drafts/${draft._id}/autosave`, {
      method: 'POST',
      body: JSON.stringify({
        step: 1,
        data: { title: 'Updated Title' },
        version: draft.version - 1, // Old version
      }),
    });

    expect(response.status).toBe(409); // Conflict
  });
});
```

### E2E Tests

```typescript
// __tests__/e2e/survey-wizard.test.ts
describe('Survey Wizard Flow', () => {
  it('should complete full survey creation with autosave', async () => {
    // Step 1: Basic Info
    await page.goto('/surveys/create-wizard');
    await page.fill('[name="title"]', 'Employee Engagement Survey');
    await page.selectOption('[name="survey_type"]', 'climate');
    await page.selectOption('[name="company_id"]', testCompany._id);

    // Wait for autosave
    await page.waitForSelector(
      '[data-testid="save-indicator"][data-status="saved"]'
    );

    // Step 2: Questions
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Quick Add")');
    await page.click('[data-question-id="frequently-used-1"]');

    // Step 3: Targeting
    await page.click('button:has-text("Next")');
    await page.check('[data-department="engineering"]');

    // Verify audience preview updates
    await page.waitForSelector(
      '[data-testid="total-recipients"]:has-text("42")'
    );

    // Step 4: Schedule & Distribution
    await page.click('button:has-text("Next")');
    await page.fill('[name="start_date"]', '2025-10-10');

    // Generate QR code
    await page.click('button:has-text("Generate QR Code")');
    await page.waitForSelector('[data-testid="qr-code-preview"]');

    // Publish
    await page.click('button:has-text("Publish Survey")');

    // Verify redirect to survey page
    await page.waitForURL(/\/surveys\/[a-f0-9]{24}$/);
  });

  it('should recover draft after session expiry', async () => {
    // Start creating survey
    await page.goto('/surveys/create-wizard');
    await page.fill('[name="title"]', 'Test Draft Recovery');

    // Wait for autosave
    await page.waitForSelector(
      '[data-testid="save-indicator"][data-status="saved"]'
    );

    // Simulate session expiry
    await page.context().clearCookies();

    // Reload page
    await page.reload();

    // Should show recovery banner
    await page.waitForSelector('[data-testid="draft-recovery-banner"]');

    // Recover draft
    await page.click('button:has-text("Recover Draft")');

    // Verify data restored
    await expect(page.locator('[name="title"]')).toHaveValue(
      'Test Draft Recovery'
    );
  });
});
```

## 🔒 Security Considerations

### 1. Input Validation

- All user inputs validated with Zod schemas
- SQL injection prevention (using Mongoose)
- XSS prevention (sanitize user-generated content)
- File upload validation (CSV size, format, content)

### 2. Authorization

- Role-based access control (RBAC)
- Company scoping (users can only access their company data)
- Permission checks on every API endpoint
- Audit trail for compliance

### 3. Data Privacy

- PII handling for employee data
- GDPR compliance (right to deletion, data export)
- Encryption at rest and in transit
- Anonymous response tracking

### 4. Rate Limiting

- Autosave endpoint: 60 requests/minute
- CSV import: 10 requests/hour
- QR generation: 100 requests/day

## 📊 Performance Optimization

### 1. Database Optimization

- Indexes on frequently queried fields
- Denormalized counters (question_count, usage_count)
- TTL indexes for draft cleanup
- Aggregation pipelines for audience preview

### 2. Caching Strategy

- React Query cache for question library (5 min TTL)
- Server-side caching for company master data (10 min TTL)
- CDN caching for QR code images
- Memoization for complex calculations

### 3. Load Time Optimization

- Code splitting by wizard step
- Lazy loading for question library browser
- Optimistic updates for autosave
- Prefetching next step data

### 4. Scalability

- Background jobs for CSV processing (>1000 rows)
- Queue system for tokenized link generation
- Horizontal scaling for API routes
- Database sharding by company_id

## 🌐 Internationalization (i18n)

### Setup

```typescript
// lib/i18n-config.ts
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'es'] as const;
export const defaultLocale = 'en';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'America/Mexico_City',
    now: new Date(),
  };
});
```

### Translation Files

```json
// messages/en.json
{
  "survey": {
    "wizard": {
      "step1": {
        "title": "Basic Information",
        "survey_type": "Survey Type",
        "microclimate": "Micro-climate",
        "climate": "Climate",
        "culture": "Culture"
      },
      "step2": {
        "title": "Questions",
        "quick_add": "Quick Add",
        "from_library": "From Library",
        "create_new": "Create New"
      }
    }
  }
}

// messages/es.json
{
  "survey": {
    "wizard": {
      "step1": {
        "title": "Información Básica",
        "survey_type": "Tipo de Encuesta",
        "microclimate": "Microclima",
        "climate": "Clima",
        "culture": "Cultura"
      },
      "step2": {
        "title": "Preguntas",
        "quick_add": "Agregar Rápido",
        "from_library": "De la Biblioteca",
        "create_new": "Crear Nueva"
      }
    }
  }
}
```

### Usage in Components

```typescript
import { useTranslations } from 'next-intl';

export function Step1BasicInfo() {
  const t = useTranslations('survey.wizard.step1');

  return (
    <div>
      <h2>{t('title')}</h2>
      <Label>{t('survey_type')}</Label>
      <Select>
        <SelectItem value="microclimate">{t('microclimate')}</SelectItem>
        <SelectItem value="climate">{t('climate')}</SelectItem>
        <SelectItem value="culture">{t('culture')}</SelectItem>
      </Select>
    </div>
  );
}
```

## 📚 Documentation Deliverables

1. **API Documentation** - OpenAPI/Swagger specs
2. **User Guide** - Step-by-step wizard usage
3. **Admin Guide** - Question library management
4. **Developer Guide** - Architecture and extension points
5. **Migration Guide** - Upgrading from existing system
6. **Troubleshooting** - Common issues and solutions

## ✅ Success Metrics

- **Performance**: < 2s page load, < 500ms API response
- **Reliability**: 99.9% uptime, zero data loss on autosave
- **Usability**: < 5 min to create survey, < 3 clicks to add question
- **Adoption**: 80% of surveys use question library within 30 days
- **Quality**: > 95% user satisfaction, < 5% error rate

---

**Status**: Ready for Implementation
**Priority**: P0 (Core Platform Feature)
**Estimated Effort**: 5 weeks (1 developer)
**Dependencies**: React Query migration (completed), TypeScript errors fixed (completed)
