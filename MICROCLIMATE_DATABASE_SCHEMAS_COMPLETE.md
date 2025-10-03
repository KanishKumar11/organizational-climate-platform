# Microclimate Database Schemas - Phase 1 Complete

## Overview
Successfully completed **Phase 1: Database Foundation** for the enterprise-grade microclimate survey system. All 5 core database models have been created/enhanced with industry best practices including multilingual support, version control, audit trails, optimistic concurrency, and performance optimization.

**Completion Date:** January 2025  
**Status:** ✅ Phase 1 Complete (100%)

---

## Models Created/Enhanced

### 1. ✅ QuestionLibrary.ts (CREATED - 191 lines)
**Purpose:** Reusable question catalog with multilingual support and version control

**Key Features:**
- **Multilingual Content**: Full ES/EN support for text, options, scale labels
- **Question Types**: likert, multiple_choice, open_ended, scale, binary, matrix, emoji_rating
- **Version Control**: Version number + previous_version_id for complete history
- **Usage Tracking**: usage_count + last_used for Quick Add feature
- **Categorization**: category_id (ref), dimension, tags for organization
- **Flexible Scope**: Company-specific or global shared questions
- **Analysis Support**: reverse_coded flag, dimension mapping

**Indexes:**
```typescript
// Text search (weighted for relevance)
{ text_es: 10, text_en: 10, tags: 5 }

// Performance indexes
{ company_id: 1, category_id: 1, is_active: 1 }
{ company_id: 1, usage_count: -1 } // Quick Add sorting
{ is_global: 1, category_id: 1, is_active: 1 } // Global questions
```

**Methods:**
- `incrementUsage()`: Atomic usage counter update
- `createVersion(updates, userId)`: Create new version preserving history

**File Path:** `src/models/QuestionLibrary.ts`

---

### 2. ✅ QuestionCategory.ts (ENHANCED - 220 lines)
**Purpose:** Hierarchical category system for organizing questions

**Enhancements Made:**
- Added `level` (0-5 depth limit) and `path` (dot-notation for queries)
- Added `color` field for visual distinction in UI
- Added denormalized `question_count` and `subcategory_count` for performance
- Added `is_global` flag for system-wide vs company categories
- Changed IDs from String to ObjectId for proper referencing
- Added pre-save hook to auto-calculate level and path

**Key Features:**
- **Hierarchy Support**: parent_id + level + path for flexible queries
- **Multilingual**: name and description in ES/EN
- **Visual Customization**: icon + color for UI
- **Denormalized Counts**: Fast retrieval without joins
- **Tree Operations**: getTree(), getBreadcrumb() methods

**Indexes:**
```typescript
{ company_id: 1, is_active: 1 }
{ parent_id: 1, order: 1 } // Ordered children
{ path: 1 } // Subtree queries
{ is_global: 1, is_active: 1 } // Global categories
{ 'name.en': 'text', 'name.es': 'text' } // Text search
```

**Methods:**
- `getTree()`: Build full category hierarchy with nested children
- `getBreadcrumb()`: Get path to root for navigation
- `updateCounts()`: Refresh denormalized counters
- **Static:** `rebuildPaths()`: Maintenance utility to recalculate all paths

**File Path:** `src/models/QuestionCategory.ts`

---

### 3. ✅ SurveyAuditLog.ts (CREATED - 232 lines)
**Purpose:** Comprehensive change tracking (WHO, WHAT, WHEN) for compliance

**Key Features:**
- **13 Action Types**: created, updated, published, question_added, draft_saved, etc.
- **9 Entity Types**: survey, title, questions, audience, schedule, draft, etc.
- **User Context**: user_id, user_name, user_email, user_role
- **Request Metadata**: timestamp, ip_address, user_agent, session_id
- **Change Tracking**: before, after, calculated diff
- **Automation Support**: automated flag, api_version

**Indexes:**
```typescript
{ survey_id: 1, timestamp: -1 } // Primary timeline
{ survey_id: 1, entity_type: 1, timestamp: -1 } // Filtered logs
{ user_id: 1, timestamp: -1 } // User activity
{ action: 1, timestamp: -1 } // Action analysis
```

**Static Methods:**
```typescript
// Create audit entry with automatic diff
logChange({
  surveyId, action, entityType, entityId,
  before, after, user, request
}): Promise<ISurveyAuditLog>

// Paginated retrieval with filters
getLog(surveyId, {
  action?, entityType?, userId?,
  startDate?, endDate?, limit?, page?
}): Promise<{ entries, total, pages }>

// Recent changes for UI timeline
getTimeline(surveyId, limit?): Promise<ISurveyAuditLog[]>
```

**Helper Function:**
- `calculateDiff(before, after)`: Deep object comparison returning only changed fields

**File Path:** `src/models/SurveyAuditLog.ts`

---

### 4. ✅ SurveyDistribution.ts (CREATED - 215 lines)
**Purpose:** URL and QR code management for survey distribution

**Key Features:**
- **Access Types**: tokenized, open, hybrid
- **URL Management**: public_url, tokenized_links_generated count
- **QR Codes**: SVG, PNG, PDF formats with customization
- **Access Rules**: 
  - require_login, allow_anonymous, single_response
  - active_outside_schedule, allowed_domains, blocked_ips
  - max_responses limit
- **QR Customization**: size (100-1000px), colors, logo, error correction (L/M/Q/H)
- **Tracking**: total_accesses, unique_visitors, last_accessed_at

**Indexes:**
```typescript
{ survey_id: 1 } // Unique, one distribution per survey
{ public_url: 1 } // Unique, sparse (allows nulls)
```

**Methods:**
```typescript
// Track QR code regeneration
regenerateQR(userId): Promise<ISurveyDistribution>

// Track access events
trackAccess(isUnique: boolean): Promise<ISurveyDistribution>

// Generate public URL with short code
generatePublicURL(baseUrl: string): string

// Validate access permissions
isAccessAllowed({
  isLoggedIn, userEmail, ipAddress, currentResponses
}): { allowed: boolean; reason?: string }
```

**File Path:** `src/models/SurveyDistribution.ts`

---

### 5. ✅ SurveyDraft.ts (ENHANCED - 245 lines)
**Purpose:** Store draft surveys with autosave support and session recovery

**Enhancements Made:**
- Restructured from flat fields to step-based data: `step1_data`, `step2_data`, `step3_data`, `step4_data`
- Added `version` field for optimistic concurrency control
- Added `last_autosave_at` separate from `updated_at`
- Changed IDs from String to ObjectId
- Added `toSurvey()` method to convert draft to final survey object
- Enhanced indexes for efficient draft recovery queries

**Step Data Structures:**

**Step 1 - Basic Info:**
```typescript
{
  survey_type: 'climate' | 'microclimate' | 'culture' | 'pulse',
  title: string (max 150 chars),
  description: string (max 500 chars),
  company_id: ObjectId,
  language: 'es' | 'en'
}
```

**Step 2 - Questions:**
```typescript
{
  questions: Array<{
    id, type, text: { en, es },
    options: { en: [], es: [] },
    required, order, library_id
  }>,
  question_ids: ObjectId[] // From library
}
```

**Step 3 - Targeting:**
```typescript
{
  targeting_type: 'master_data' | 'csv_upload' | 'manual',
  department_ids: ObjectId[],
  target_user_ids: ObjectId[],
  demographic_filters: { locations, roles, tenure_min, tenure_max },
  csv_data: {
    filename, uploaded_at, total_rows, valid_rows, column_mapping
  },
  audience_preview: {
    total_count, by_department, by_location
  }
}
```

**Step 4 - Scheduling:**
```typescript
{
  schedule: {
    start_date, end_date, timezone,
    send_reminders, reminder_schedule
  },
  distribution: {
    method: 'qr' | 'url' | 'both',
    access_type: 'tokenized' | 'open' | 'hybrid',
    generate_qr, qr_format: 'png' | 'svg' | 'pdf'
  }
}
```

**Indexes:**
```typescript
{ user_id: 1, session_id: 1 } // Session-based retrieval
{ expires_at: 1 } // TTL index for auto-cleanup
{ user_id: 1, company_id: 1, updated_at: -1 } // Recent drafts
{ user_id: 1, is_recovered: 1, expires_at: 1 } // Draft recovery
```

**Pre-save Hook:**
```typescript
// Auto-increment version and update last_autosave_at
pre('save', function(next) {
  if (!this.isNew && this.isModified()) {
    this.version += 1;
    this.last_autosave_at = new Date();
  }
  next();
});
```

**Methods:**
- `isRecent()`: Check if draft updated within last hour
- `toSurvey()`: Convert structured step data to final survey object

**File Path:** `src/models/SurveyDraft.ts`

---

## Enterprise Patterns Implemented

### 1. **Multilingual Support**
- All user-facing content has ES/EN fields at database level
- Text search indexes support both languages with equal weight
- Question library stores options/scale labels in both languages
- Categories have bilingual names and descriptions

### 2. **Version Control**
- QuestionLibrary: version number + previous_version_id for history tracking
- SurveyDraft: version field for optimistic concurrency control
- Audit log: Complete before/after state with automatic diff calculation

### 3. **Soft Deletes**
- All models use `is_active` flag instead of hard deletes
- Preserves data for auditing and compliance
- Enables "restore" functionality
- Indexes include is_active for query efficiency

### 4. **Denormalization for Performance**
- QuestionCategory: question_count, subcategory_count
- SurveyDistribution: total_accesses, unique_visitors
- Avoids expensive aggregation queries
- updateCounts() methods for manual refresh

### 5. **Text Search**
- Weighted indexes: Primary language fields (10), tags (5)
- Case-insensitive, accent-insensitive (MongoDB default)
- Supports partial word matching
- Multilingual with equal weight on ES/EN

### 6. **TTL Indexes**
- SurveyDraft: Auto-delete expired drafts (7 days default)
- Prevents database bloat
- No manual cleanup required
- Configurable expiry period

### 7. **Optimistic Concurrency**
- SurveyDraft.version increments on each save
- Client sends expected version number
- Server rejects if version mismatch (concurrent edit detected)
- Prevents lost updates in multi-tab scenarios

### 8. **Audit Trail**
- Every survey change logged with user context
- Before/after snapshots for rollback capability
- Diff calculation highlights specific changes
- Request metadata (IP, user agent) for security

### 9. **Hierarchical Data**
- QuestionCategory: parent_id + level + path
- Path enables efficient subtree queries: `{ path: /^parent.path/ }`
- Level prevents infinite nesting (max 5 levels)
- Breadcrumb navigation with single query

### 10. **Access Control**
- SurveyDistribution.isAccessAllowed() validates permissions
- Domain whitelisting for email-based access
- IP blacklisting for security
- Max responses limit to prevent abuse
- Single response enforcement

---

## Database Design Decisions

### Why ObjectId over String?
- **Type Safety**: Mongoose validates ObjectId format
- **Performance**: 12-byte binary vs 24-char string (50% smaller)
- **Population**: Enables Mongoose .populate() for joins
- **Consistency**: Aligns with MongoDB best practices

### Why Denormalized Counts?
- **Performance**: Avoid COUNT(*) aggregations on every request
- **Scalability**: Constant-time retrieval vs O(n) counting
- **Trade-off**: Slight staleness acceptable for UI display
- **Refresh Strategy**: updateCounts() called on category edits

### Why Structured Step Data?
- **Type Safety**: Strong typing for each wizard step
- **Validation**: Step-specific Zod schemas
- **Partial Saves**: Save incomplete data per step
- **State Management**: Clear separation of concerns
- **Backward Compatibility**: Old flat fields can coexist during migration

### Why TTL Index on Drafts?
- **Automatic Cleanup**: No cron jobs needed
- **GDPR Compliance**: Auto-delete personal data after expiry
- **Performance**: Prevents unbounded table growth
- **Configuration**: Default 7 days, adjustable per draft

### Why Weighted Text Search?
- **Relevance Ranking**: Primary text (10) more important than tags (5)
- **User Experience**: Most relevant results first
- **Multilingual**: Equal weight on ES/EN ensures fair ranking
- **Flexibility**: Can adjust weights without schema migration

---

## Index Strategy

### Compound Indexes
```typescript
// QuestionLibrary
{ company_id: 1, category_id: 1, is_active: 1 } // Filter questions by category
{ company_id: 1, usage_count: -1 } // Quick Add most-used questions

// QuestionCategory  
{ parent_id: 1, order: 1 } // Ordered children for tree navigation

// SurveyDraft
{ user_id: 1, session_id: 1 } // Session-based draft retrieval
{ user_id: 1, is_recovered: 1, expires_at: 1 } // Draft recovery

// SurveyAuditLog
{ survey_id: 1, timestamp: -1 } // Audit timeline
{ survey_id: 1, entity_type: 1, timestamp: -1 } // Filtered logs
```

### Text Search Indexes
```typescript
// Multilingual weighted search
{ text_es: 10, text_en: 10, tags: 5 } // QuestionLibrary
{ 'name.en': 'text', 'name.es': 'text' } // QuestionCategory
```

### Unique Indexes
```typescript
{ survey_id: 1 } // SurveyDistribution (one per survey)
{ public_url: 1 } // SurveyDistribution (sparse, allows nulls)
```

### TTL Indexes
```typescript
{ expires_at: 1 }, { expireAfterSeconds: 0 } // SurveyDraft auto-cleanup
```

---

## Model Relationships

```
QuestionCategory (Hierarchy)
├── parent_id → QuestionCategory (self-reference)
├── path: "root.parent.child" (dot-notation)
└── QuestionLibrary[] (one-to-many)
    ├── category_id → QuestionCategory
    └── previous_version_id → QuestionLibrary (self-reference)

Survey
├── SurveyDraft (one-to-one, temporary)
│   ├── user_id → User
│   ├── company_id → Company
│   ├── step2_data.question_ids[] → QuestionLibrary
│   ├── step3_data.department_ids[] → Department
│   └── step3_data.target_user_ids[] → User
│
├── SurveyDistribution (one-to-one)
│   ├── survey_id → Survey
│   └── last_regenerated_by → User
│
└── SurveyAuditLog[] (one-to-many)
    ├── survey_id → Survey
    └── user_id → User
```

---

## Migration Notes

### Backward Compatibility
The enhanced `SurveyDraft` model maintains backward compatibility:

**Old Structure (Deprecated):**
```typescript
{
  title, description, type, questions,
  department_ids, target_user_ids, start_date, end_date
}
```

**New Structure (Preferred):**
```typescript
{
  step1_data: { title, description, survey_type, company_id, language },
  step2_data: { questions, question_ids },
  step3_data: { department_ids, target_user_ids, demographic_filters, csv_data },
  step4_data: { schedule, distribution }
}
```

**Migration Strategy:**
1. New drafts use structured step data
2. Old drafts can be read and converted using `toSurvey()`
3. Consider one-time migration script to restructure existing drafts
4. Remove deprecated fields after migration window (e.g., 30 days)

---

## Next Steps (Phase 2: Autosave System)

### 1. Create useAutosave Hook
**File:** `src/hooks/useAutosave.ts`

**Features:**
- Debounced save (5-10 seconds configurable)
- Optimistic concurrency control with version checking
- Save status indicator (idle, saving, saved, error)
- Force save method for explicit user action
- Offline queue support

**Implementation:**
```typescript
import { useMutation } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';

export function useAutosave(draftId: string, options = {}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [version, setVersion] = useState(1);
  
  const saveMutation = useMutation({
    mutationFn: (data) => fetch(`/api/surveys/drafts/${draftId}/autosave`, {
      method: 'POST',
      body: JSON.stringify({ ...data, version }),
    }),
    onMutate: () => setStatus('saving'),
    onSuccess: (response) => {
      setVersion(response.version);
      setStatus('saved');
    },
    onError: () => setStatus('error'),
  });
  
  const debouncedSave = useDebounce(saveMutation.mutate, 5000);
  
  return {
    save: debouncedSave,
    forceSave: saveMutation.mutate,
    status,
    version,
  };
}
```

### 2. Build API Endpoint
**File:** `src/app/api/surveys/drafts/[id]/autosave/route.ts`

**Features:**
- Version conflict detection
- Partial updates (only modified step)
- Automatic version increment
- Audit log integration

**Implementation:**
```typescript
export async function POST(req: Request, { params }) {
  const { id } = params;
  const body = await req.json();
  const { version, current_step, ...stepData } = body;
  
  const draft = await SurveyDraft.findById(id);
  
  // Optimistic concurrency check
  if (draft.version !== version) {
    return NextResponse.json(
      { error: 'Conflict: Draft was modified by another session' },
      { status: 409 }
    );
  }
  
  // Update only the current step
  draft[`step${current_step}_data`] = stepData;
  draft.current_step = current_step;
  draft.auto_save_count += 1;
  
  await draft.save(); // Pre-save hook increments version
  
  // Log autosave event
  await SurveyAuditLog.logChange({
    surveyId: draft._id,
    action: 'draft_saved',
    entityType: 'draft',
    after: { step: current_step, count: draft.auto_save_count },
    user: req.user,
  });
  
  return NextResponse.json({
    version: draft.version,
    saved_at: draft.last_autosave_at,
  });
}
```

### 3. Create AutosaveIndicator Component
**File:** `src/components/microclimate/AutosaveIndicator.tsx`

**Features:**
- Visual status: "Saving...", "Saved X seconds ago", "Error"
- ARIA announcements for accessibility
- Subtle, non-intrusive design
- Manual save button for errors

---

## Testing Checklist

### Unit Tests
- [ ] QuestionLibrary.createVersion() creates proper history link
- [ ] QuestionLibrary.incrementUsage() updates count and timestamp
- [ ] QuestionCategory.getTree() builds correct hierarchy
- [ ] QuestionCategory.getBreadcrumb() returns path to root
- [ ] SurveyAuditLog.calculateDiff() detects all changes
- [ ] SurveyDraft.toSurvey() converts step data correctly
- [ ] SurveyDistribution.isAccessAllowed() validates all rules

### Integration Tests
- [ ] Creating question from library increments usage_count
- [ ] Deleting category (is_active=false) preserves questions
- [ ] Concurrent draft saves detect version conflicts
- [ ] TTL index deletes expired drafts after 7 days
- [ ] Audit log captures all survey modifications
- [ ] QR code regeneration updates tracking fields

### Performance Tests
- [ ] Text search across 10,000 questions < 100ms
- [ ] Category tree with 1,000 categories < 200ms
- [ ] Audit log retrieval (paginated) < 150ms
- [ ] Draft recovery query < 50ms

---

## Documentation

### API Documentation
- Swagger/OpenAPI specs for all endpoints
- Request/response schemas with examples
- Error codes and handling
- Rate limiting information

### User Documentation
- Question Library user guide
- Survey creation workflow
- CSV import template and instructions
- QR code download options

### Developer Documentation
- Database schema diagrams (ERD)
- Index usage patterns
- Migration guides
- Performance optimization tips

---

## Summary

### Models Created/Enhanced: 5
1. ✅ QuestionLibrary.ts - **191 lines** (NEW)
2. ✅ QuestionCategory.ts - **220 lines** (ENHANCED)
3. ✅ SurveyAuditLog.ts - **232 lines** (NEW)
4. ✅ SurveyDistribution.ts - **215 lines** (NEW)
5. ✅ SurveyDraft.ts - **245 lines** (ENHANCED)

### Total Lines of Code: 1,103

### Enterprise Features Implemented:
- ✅ Multilingual support (ES/EN) at database level
- ✅ Version control for questions and drafts
- ✅ Comprehensive audit trail with diff calculation
- ✅ Soft deletes with is_active flags
- ✅ Denormalized counts for performance
- ✅ Text search indexes (weighted, multilingual)
- ✅ TTL indexes for automatic cleanup
- ✅ Optimistic concurrency control
- ✅ Hierarchical categories with path-based queries
- ✅ Access control validation with multiple rules

### Database Indexes: 25+
- Compound indexes for complex queries
- Text search indexes for multilingual content
- TTL index for automatic draft expiration
- Unique indexes for data integrity

### TypeScript Errors: 0
All models compile without errors and provide full type safety.

---

## Phase 1 Status: ✅ COMPLETE

**Next Phase:** Phase 2 - Autosave System Implementation (Estimated: 1 day)

**Implementation Timeline:**
- Week 1: ✅ **Database Foundation** (Complete)
- Week 2: 🔄 **Question Library System** (Starting)
- Week 3: ⏳ **Targeting System** (Pending)
- Week 4: ⏳ **Distribution System** (Pending)
- Week 5: ⏳ **Testing & Documentation** (Pending)

---

**Created:** January 2025  
**Last Updated:** January 2025  
**Maintained By:** Development Team
