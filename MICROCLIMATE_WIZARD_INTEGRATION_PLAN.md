# Microclimate Wizard Integration Plan

## Current Situation (October 4, 2025)

### ✅ What's Complete
- **9/9 Wizard Features Built** (100% feature complete)
  - CompanySearchableDropdown
  - Survey Type & Language selectors
  - QuestionLibraryBrowser with bulk selection
  - CSV Import with 4-stage validation
  - Drag-and-drop question reordering
  - ReminderScheduler
  - DistributionTypeSelector
- **All components working in demo**: `/demo/microclimate-wizard`
- **Build passing**: 0 TypeScript errors

### ❌ Current Issues

#### 1. **Runtime Error: `e.filter is not a function`**
**Root Cause**: Missing `/api/microclimate-templates` endpoint

**Location**: 
- `src/components/microclimate/TemplateSelector.tsx` (line 141)
- Called from `MicroclimateDashboard.tsx` and other components

**The Problem**:
```typescript
// TemplateSelector.tsx line 132
setTemplates(data.templates || []); // Expects { templates: [...] }

// But API doesn't exist yet, so data is undefined or wrong format
// Then line 141 tries:
const filteredTemplates = templates.filter(...) // CRASH if templates isn't array
```

**Fix Required**: Create the templates API endpoint

#### 2. **Wizard in Demo Route Instead of Production**
**Current**: `/demo/microclimate-wizard`
**Should Be**: 
- `/microclimates/create` (new dedicated route)
- OR integrated into existing `/microclimates` page with modal/wizard

---

## Integration Strategy

### Phase 1: Fix Runtime Error (HIGH PRIORITY - 2 hours)

#### Task 1.1: Create Templates API
```bash
Create: src/app/api/microclimate-templates/route.ts
```

**Endpoints Needed**:
```typescript
GET /api/microclimate-templates
  - Returns: { templates: MicroclimateTemplate[] }
  - Filters: category, language, tags
  - Permissions: All authenticated users

GET /api/microclimate-templates/[id]
  - Returns: { template: MicroclimateTemplate }
  
POST /api/microclimate-templates (Super Admin only)
  - Create custom template
```

**Template Structure**:
```typescript
interface MicroclimateTemplate {
  _id: string;
  name: string;
  description: string;
  category: 'engagement' | 'wellbeing' | 'leadership' | 'custom';
  tags: string[];
  questions: Array<{
    text_es: string;
    text_en: string;
    type: 'likert' | 'emoji_rating' | 'multiple_choice' | 'open_ended';
    options_es?: string[];
    options_en?: string[];
    category: string;
  }>;
  estimated_duration: number;
  target_audience: string;
  created_by?: string;
  is_default: boolean;
}
```

#### Task 1.2: Add Error Handling to TemplateSelector
```typescript
// src/components/microclimate/TemplateSelector.tsx
const fetchTemplates = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/microclimate-templates');
    if (response.ok) {
      const data = await response.json();
      // DEFENSIVE: Ensure it's an array
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } else {
      console.error('Failed to fetch templates');
      setTemplates([]); // Fallback to empty array
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
    setTemplates([]); // Prevent crash
  } finally {
    setLoading(false);
  }
};
```

#### Task 1.3: Similar Fix for MicroclimateDashboard
Already properly initialized with `useState<Microclimate[]>([])` ✅

---

### Phase 2: Production Route Integration (MEDIUM PRIORITY - 3 hours)

#### Option A: Dedicated Creation Route (RECOMMENDED)

**Create**: `src/app/microclimates/create/page.tsx`

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MicroclimateWizard } from '@/components/microclimate/MicroclimateWizard';
import { toast } from 'sonner';

export default function CreateMicroclimatePage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleComplete = async (surveyData: any) => {
    try {
      const response = await fetch('/api/microclimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: surveyData.title,
          description: surveyData.description,
          questions: surveyData.questions,
          targeting: surveyData.targeting,
          scheduling: surveyData.scheduling,
          distribution: surveyData.distribution,
          reminders: surveyData.reminders,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        toast.success('Microclimate survey created successfully!');
        router.push(`/microclimates/${data._id}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create survey');
      }
    } catch (error) {
      console.error('Error creating microclimate:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleCancel = () => {
    router.push('/microclimates');
  };

  return (
    <DashboardLayout>
      <MicroclimateWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
        language="es"
      />
    </DashboardLayout>
  );
}
```

**Update Dashboard**: Add "Create New" button
```typescript
// src/components/microclimate/MicroclimateDashboard.tsx
<Button onClick={() => router.push('/microclimates/create')}>
  <Plus className="w-4 h-4 mr-2" />
  Create Microclimate Survey
</Button>
```

#### Option B: Modal Integration
Use dialog to show wizard in modal on existing `/microclimates` page

---

### Phase 3: API Schema Updates (LOW PRIORITY - 2 hours)

#### Update Microclimate Schema
```typescript
// src/models/Microclimate.ts
// Add these fields:
distribution: {
  mode: { type: String, enum: ['tokenized', 'open'], required: true },
  securityAcknowledged: Boolean,
  allowAnonymous: Boolean,
  generateQRCode: Boolean,
},
reminders: {
  enabled: Boolean,
  intervals: [{
    value: Number,
    unit: String,
    email_template_es: String,
    email_template_en: String,
  }],
},
```

#### Update POST /api/microclimates
Handle new wizard data structure from distribution & reminders

---

## Migration Checklist

### Immediate (Fix Error - Do This First!)
- [ ] Create `/api/microclimate-templates/route.ts`
- [ ] Add seed data for default templates
- [ ] Add defensive `.filter()` error handling
- [ ] Test that error is resolved

### Short Term (Production Integration)
- [ ] Create `/microclimates/create/page.tsx`
- [ ] Update MicroclimateDashboard with "Create" button
- [ ] Test wizard in production route
- [ ] Verify API integration works

### Long Term (Data Persistence)
- [ ] Update Microclimate model schema
- [ ] Update API to handle distribution config
- [ ] Implement reminder scheduling service
- [ ] Add tokenized link generation
- [ ] Create email sending service

---

## Testing Strategy

### Unit Tests
```bash
# Test wizard components
npm run test -- MicroclimateWizard
npm run test -- DistributionTypeSelector
npm run test -- ReminderScheduler
```

### Integration Tests
1. **Create microclimate survey** - Full wizard flow
2. **CSV import** - Upload departments, validate, confirm
3. **Question library** - Browse, bulk select, add to survey
4. **Distribution config** - Select mode, acknowledge security
5. **Reminders** - Configure intervals, preview emails

### E2E Tests
1. Login → Navigate to /microclimates/create
2. Complete wizard (all 4 steps)
3. Submit survey creation
4. Verify survey appears in dashboard
5. Verify targeting works
6. Verify reminders scheduled

---

## Rollout Plan

### Week 1: Fix Critical Error
- Deploy templates API
- Add error handling
- Verify no more crashes

### Week 2: Production Route
- Create `/microclimates/create`
- Update dashboard navigation
- Internal testing

### Week 3: Backend Integration
- Update schema
- Test API endpoints
- Data validation

### Week 4: Launch
- User acceptance testing
- Documentation
- Production deployment

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Templates API missing | HIGH | Create immediately with seed data |
| Schema migration | MEDIUM | Use optional fields, backward compatible |
| Email service dependency | LOW | Queue for background processing |
| User adoption | LOW | Clear UI, good documentation |

---

## Success Metrics

- ✅ Zero `e.filter is not a function` errors
- ✅ Wizard accessible from production route
- ✅ Survey creation success rate > 95%
- ✅ CSV import works for 100+ departments
- ✅ Reminders send on schedule
- ✅ Distribution modes working correctly

---

## Next Steps (Recommended Order)

1. **NOW**: Create templates API (2 hours)
2. **TODAY**: Test error is fixed (30 min)
3. **MONDAY**: Create production route (3 hours)
4. **TUESDAY**: Update backend schema (2 hours)
5. **WEDNESDAY**: E2E testing (4 hours)
6. **THURSDAY**: Deploy to staging (2 hours)
7. **FRIDAY**: Production deployment (1 hour)

Total Estimated Time: **~15 hours over 1 week**
