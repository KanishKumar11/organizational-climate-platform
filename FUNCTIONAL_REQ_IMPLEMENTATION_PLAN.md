# Functional Requirements Implementation Plan

## Implementation Status

### ✅ Phase 1: Foundation Models & Services (COMPLETED)

1. **Question Library System (CLIMA-002)**
   - ✅ QuestionCategory model with hierarchical structure
   - ✅ LibraryQuestion model with ES/EN support
   - ✅ QuestionLibraryService with search/filtering
   - ✅ Duplicate prevention
   - ✅ Versioning system
   - ✅ Usage tracking

2. **Autosave & Draft System (CLIMA-006)**
   - ✅ SurveyDraft model
   - ✅ useAutosave hook with debouncing
   - ✅ useSessionExpiry hook
   - ✅ LocalStorage backup
   - ✅ TTL-based auto-cleanup

### 🔄 Phase 2: Core Features (IN PROGRESS)

3. **Company-Based Survey Creation (CLIMA-001)**
   - ⏳ Update Survey model to require company_id
   - ⏳ Company selector in Step 1
   - ⏳ Preload departments/users on company selection
   - ⏳ Validation: cannot proceed without Company + Title

4. **Enhanced Targeting (CLIMA-003)**
   - ⏳ CSV/XLSX import with column mapping
   - ⏳ Deduplication by Email/ID
   - ⏳ Target Audience Preview with counts
   - ⏳ Filter by department/location/demographics

5. **Scheduling System (CLIMA-004)**
   - ⏳ End Date & Time fields
   - ⏳ Timezone awareness
   - ⏳ Validation: Start < End
   - ⏳ Reminder system
   - ⏳ Auto-close at end time

6. **Distribution System (CLIMA-005)**
   - ⏳ QR Code generation (PNG/SVG)
   - ⏳ Tokenized per-user links
   - ⏳ Anonymous link option
   - ⏳ Access control based on time window

### 📋 Phase 3: API Endpoints (PENDING)

7. **Question Library APIs**
   - ⏳ GET /api/question-library/search
   - ⏳ GET /api/question-library/categories
   - ⏳ POST /api/question-library/questions
   - ⏳ GET /api/question-library/popular
   - ⏳ POST /api/question-library/check-duplicate

8. **Draft Management APIs**
   - ⏳ POST /api/surveys/drafts (autosave)
   - ⏳ GET /api/surveys/drafts/latest
   - ⏳ DELETE /api/surveys/drafts/:id

9. **Targeting APIs**
   - ⏳ POST /api/surveys/:id/import-targets
   - ⏳ GET /api/surveys/:id/audience-preview
   - ⏳ GET /api/companies/:id/departments
   - ⏳ GET /api/companies/:id/users

10. **Distribution APIs**
    - ⏳ POST /api/surveys/:id/generate-qr
    - ⏳ POST /api/surveys/:id/generate-links

### 🎨 Phase 4: UI Components (PENDING)

11. **Survey Creation Wizard**
    - ⏳ Step 1: Basic Info with Company selector
    - ⏳ Step 2: Questions with Library browser
    - ⏳ Step 3: Targeting with import/preview
    - ⏳ Step 4: Scheduling & Distribution

12. **Question Library Browser**
    - ⏳ Category tree navigation
    - ⏳ Search with filters
    - ⏳ Side-by-side ES/EN preview
    - ⏳ Drag-and-drop to survey

13. **Autosave Components**
    - ⏳ Draft recovery banner
    - ⏳ Save status indicator
    - ⏳ Session expiry warning modal

14. **Distribution Components**
    - ⏳ QR code display/download
    - ⏳ Link generator with token options
    - ⏳ Preview access window

### 🌐 Phase 5: Internationalization (PENDING)

15. **ES/EN Support (CLIMA-011)**
    - ⏳ i18n setup (next-i18next or next-intl)
    - ⏳ Translation files
    - ⏳ Language switcher
    - ⏳ Side-by-side question editor

### 🔧 Phase 6: Performance & Quality (PENDING)

16. **Performance Optimization (CLIMA-007)**
    - ⏳ Lazy loading for large lists
    - ⏳ Pagination (20-50 items per page)
    - ⏳ Debounced search (300ms)
    - ⏳ React Query for caching
    - ⏳ Code splitting

17. **Error Handling (CLIMA-008)**
    - ⏳ Actionable error messages
    - ⏳ Field-level validation
    - ⏳ Idempotent retry logic
    - ⏳ Error logging (Sentry)

18. **Testing**
    - ⏳ Unit tests for services
    - ⏳ Integration tests for APIs
    - ⏳ E2E tests for wizard flow

---

## Implementation Priority (Revised)

### P0 - Critical (Week 1-2)

1. ✅ Question Library models
2. ✅ Autosave system
3. ⏳ Company-required Step 1
4. ⏳ Basic question library UI
5. ⏳ Draft recovery
6. ⏳ End date/time scheduling

### P1 - High (Week 3-4)

7. ⏳ CSV import for targeting
8. ⏳ QR code generation
9. ⏳ Performance optimizations
10. ⏳ ES/EN localization
11. ⏳ Error handling improvements

### P2 - Medium (Week 5-6)

12. ⏳ Telemetry/analytics
13. ⏳ Advanced filtering
14. ⏳ Role-based permissions UI
15. ⏳ Email domain validation

---

## Files Created

### Models

- ✅ `src/models/QuestionCategory.ts`
- ✅ `src/models/LibraryQuestion.ts`
- ✅ `src/models/SurveyDraft.ts`

### Services

- ✅ `src/lib/question-library-service.ts`

### Hooks

- ✅ `src/hooks/useAutosave.ts`

### APIs (To Be Created)

- ⏳ `src/app/api/question-library/search/route.ts`
- ⏳ `src/app/api/question-library/categories/route.ts`
- ⏳ `src/app/api/surveys/drafts/route.ts`
- ⏳ `src/app/api/surveys/[id]/import-targets/route.ts`
- ⏳ `src/app/api/surveys/[id]/generate-qr/route.ts`

### Components (To Be Created)

- ⏳ `src/components/surveys/CompanySelector.tsx`
- ⏳ `src/components/surveys/QuestionLibraryBrowser.tsx`
- ⏳ `src/components/surveys/DraftRecoveryBanner.tsx`
- ⏳ `src/components/surveys/SessionExpiryWarning.tsx`
- ⏳ `src/components/surveys/TargetImporter.tsx`
- ⏳ `src/components/surveys/QRCodeGenerator.tsx`
- ⏳ `src/components/surveys/SurveyWizard.tsx`

---

## Next Steps

1. **Fix TypeScript Compilation Issues**
   - Fix useRef type error in useAutosave.ts
   - Fix mongoose method call errors in question-library-service.ts

2. **Create API Endpoints**
   - Question library search/browse
   - Draft autosave
   - Target import

3. **Build Survey Creation Wizard**
   - Multi-step form with progress indicator
   - Company selector in Step 1
   - Question library in Step 2
   - Targeting in Step 3
   - Scheduling in Step 4

4. **Implement Autosave**
   - Integrate useAutosave hook
   - Add draft recovery banner
   - Add session expiry warning

5. **Add ES/EN Support**
   - Setup i18n library
   - Create translation files
   - Update UI components

---

## Dependencies Needed

```json
{
  "qrcode": "^1.5.3", // QR code generation
  "qrcode.react": "^3.1.0", // React QR component
  "papaparse": "^5.4.1", // CSV parsing
  "xlsx": "^0.18.5", // Excel import
  "next-intl": "^3.0.0", // Internationalization
  "@tanstack/react-query": "^5.0.0", // Data fetching/caching
  "date-fns-tz": "^2.0.0", // Timezone handling
  "zod": "^3.22.0" // Schema validation
}
```

---

## Database Migrations

### Required Indexes

```javascript
// QuestionCategory
db.questioncategories.createIndex({ company_id: 1, is_active: 1 });
db.questioncategories.createIndex({ parent_id: 1, order: 1 });

// LibraryQuestion
db.libraryquestions.createIndex({ category_id: 1, is_active: 1, is_latest: 1 });
db.libraryquestions.createIndex({ company_id: 1, is_global: 1 });
db.libraryquestions.createIndex({ tags: 1 });

// SurveyDraft
db.surveydrafts.createIndex({ user_id: 1, session_id: 1 });
db.surveydrafts.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
```

### Survey Model Updates

```typescript
// Add to existing Survey model:
- company_id: required (was optional)
- end_date: required with time
- end_time_timezone: string
- distribution_config: {
    qr_code_url?: string,
    token_type: 'per_user' | 'anonymous',
    anonymous_link?: string
  }
```

---

## Testing Strategy

### Unit Tests

- Question library search/filtering
- Duplicate detection
- Autosave debouncing
- Session expiry calculations

### Integration Tests

- Survey creation with company
- Question import from library
- Target CSV import
- QR code generation

### E2E Tests

- Complete survey creation flow
- Draft recovery after session timeout
- Multi-language survey creation

---

## Documentation

### For Developers

- API documentation (OpenAPI/Swagger)
- Component storybook
- Service method documentation

### For Users

- Survey creation guide
- Question library usage
- Target import instructions
- QR code distribution guide

---

_Status: Foundation complete, moving to core features implementation_
_Last Updated: October 3, 2025_
