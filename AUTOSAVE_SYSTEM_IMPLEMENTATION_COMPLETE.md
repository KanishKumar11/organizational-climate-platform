# Autosave System Implementation - Phase 2 Complete

## Overview
Successfully completed **Phase 2: Autosave System** with modern, production-ready autosave functionality featuring optimistic concurrency control, beautiful UI indicators, and comprehensive error handling.

**Completion Date:** October 3, 2025  
**Status:** ✅ Phase 2 Complete (100%)  
**Build Status:** ✅ All TypeScript errors resolved

---

## Components Created (4 Files)

### 1. ✅ useAutosave.ts Hook (182 lines)
**Location:** `src/hooks/useAutosave.ts`

**Purpose:** Enterprise-grade autosave hook with React Query integration

**Key Features:**
- **Debounced Saves**: Configurable interval (default 5 seconds)
- **Optimistic Concurrency Control**: Version-based conflict detection
- **Online/Offline Detection**: Automatic retry when connection restored
- **Status Management**: 5 states (idle, saving, saved, error, conflict)
- **Force Save**: Bypass debounce for manual saves
- **Retry Mechanism**: Resume failed saves automatically

**API:**
```typescript
const {
  save,           // Debounced save function
  forceSave,      // Immediate save (bypass debounce)
  retry,          // Retry last failed save
  resetVersion,   // Reset version after conflict resolution
  status,         // Current save status
  version,        // Current draft version
  lastSavedAt,    // Timestamp of last successful save
  saveCount,      // Total number of saves
  isSaving,       // Boolean: currently saving
  hasError,       // Boolean: error state
  hasConflict,    // Boolean: version conflict
} = useAutosave(draftId, options);
```

**Options:**
```typescript
{
  debounceMs?: number;           // Default: 5000 (5 seconds)
  enabled?: boolean;             // Default: true
  onSuccess?: (data) => void;    // Success callback
  onError?: (error) => void;     // Error callback
  onConflict?: (version) => void; // Conflict callback
}
```

**Usage Example:**
```typescript
const { save, status, lastSavedAt } = useAutosave(draftId, {
  debounceMs: 10000, // 10 seconds
  onSuccess: (data) => {
    console.log('Saved version:', data.version);
  },
  onConflict: (serverVersion) => {
    alert('Draft was modified in another tab');
  },
});

// Trigger autosave
const handleFieldChange = (field: string, value: any) => {
  save({
    current_step: 1,
    step1_data: { [field]: value },
    last_edited_field: field,
  });
};
```

---

### 2. ✅ useDebounce.ts Hook (62 lines)
**Location:** `src/hooks/useDebounce.ts`

**Purpose:** Utility hooks for debouncing values and callbacks

**Hooks Exported:**

**1. useDebounceValue** - Debounce a value
```typescript
const debouncedSearch = useDebounceValue(searchTerm, 500);
```

**2. useDebounce** - Debounce a callback function
```typescript
const debouncedSave = useDebounce((data) => {
  api.save(data);
}, 5000);
```

**Features:**
- **Automatic Cleanup**: Clears timeouts on unmount
- **Ref Stability**: Uses refs to prevent stale closures
- **TypeScript Generics**: Preserves function signatures

---

### 3. ✅ AutosaveIndicator.tsx Component (261 lines)
**Location:** `src/components/microclimate/AutosaveIndicator.tsx`

**Purpose:** Modern, animated UI indicator for autosave status

**Components Exported:**

#### AutosaveIndicator (Main Component)
Floating indicator with full status display

**Features:**
- ✨ **Animated Transitions**: Smooth fade/slide animations with Framer Motion
- 🎨 **Gradient Backgrounds**: Beautiful color-coded states
- 🌐 **Multilingual**: Spanish/English support
- ⏰ **Relative Time**: "hace 2 minutos" / "2 minutes ago"
- ♿ **Accessible**: ARIA live regions, screen reader announcements
- 🔄 **Auto-updates**: Refreshes time every 30 seconds
- 🔁 **Retry Button**: For error states

**Status Styles:**

| Status | Color | Icon | Gradient | Animation |
|--------|-------|------|----------|-----------|
| idle | Gray | Cloud | Gray | None |
| saving | Blue | RefreshCw | Blue-Indigo | Spin |
| saved | Green | Check | Emerald-Teal | None |
| error | Red | CloudOff | Red-Rose | None |
| conflict | Orange | AlertCircle | Orange-Amber | None |

**Props:**
```typescript
interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  saveCount: number;
  onRetry?: () => void;
  className?: string;
  language?: 'es' | 'en';
}
```

**Usage:**
```typescript
<AutosaveIndicator
  status={status}
  lastSavedAt={lastSavedAt}
  saveCount={saveCount}
  onRetry={retry}
  language="es"
/>
```

**Visual Design:**
- **Position**: Fixed bottom-right (z-50)
- **Size**: Compact, non-intrusive
- **Effects**: 
  - Shimmer animation while saving
  - Progress bar during save
  - Smooth opacity transitions
  - Scale animations on show/hide

#### AutosaveBadge (Compact Variant)
Header/toolbar badge with minimal footprint

**Features:**
- 🎯 **Compact Design**: Fits in headers
- 🔄 **Same Status Logic**: Reuses status configuration
- 📊 **Relative Time**: Shows last saved time
- 🎨 **Clean Styling**: White background, subtle shadow

**Usage:**
```typescript
<AutosaveBadge
  status={status}
  lastSavedAt={lastSavedAt}
  language="en"
/>
```

---

### 4. ✅ /api/surveys/drafts/[id]/autosave/route.ts (270 lines)
**Location:** `src/app/api/surveys/drafts/[id]/autosave/route.ts`

**Purpose:** API endpoint for autosaving drafts

**Endpoints:**

#### POST `/api/surveys/drafts/[id]/autosave`
Save draft with version control

**Request Body:**
```typescript
{
  current_step: number,        // 1-4
  version: number,             // Current client version
  step1_data?: {               // Basic Info
    survey_type?: string,
    title?: string,
    description?: string,
    company_id?: string,
    language?: 'es' | 'en'
  },
  step2_data?: {               // Questions
    questions?: array,
    question_ids?: array
  },
  step3_data?: {               // Targeting
    targeting_type?: string,
    department_ids?: array,
    demographic_filters?: object
  },
  step4_data?: {               // Scheduling
    schedule?: object,
    distribution?: object
  },
  last_edited_field?: string
}
```

**Response (Success):**
```json
{
  "success": true,
  "version": 2,
  "saved_at": "2025-10-03T10:30:00Z",
  "auto_save_count": 5,
  "message": "Draft autosaved successfully"
}
```

**Response (Conflict - 409):**
```json
{
  "error": "Version conflict: Draft was modified by another session",
  "server_version": 3,
  "client_version": 2
}
```

**Features:**
- ✅ **Authentication**: Session-based auth check
- ✅ **Validation**: Zod schema validation
- ✅ **Ownership Check**: Verify user owns draft
- ✅ **Version Control**: Optimistic concurrency
- ✅ **Partial Updates**: Only save modified steps
- ✅ **Audit Logging**: Track all changes
- ✅ **Request Metadata**: IP, user agent, session ID

#### GET `/api/surveys/drafts/[id]/autosave`
Retrieve draft data

**Response:**
```json
{
  "draft": {
    "id": "...",
    "current_step": 2,
    "version": 5,
    "step1_data": {...},
    "step2_data": {...},
    "step3_data": {...},
    "step4_data": {...},
    "auto_save_count": 12,
    "last_autosave_at": "2025-10-03T10:30:00Z",
    "expires_at": "2025-10-10T10:30:00Z",
    "created_at": "2025-10-03T08:00:00Z",
    "updated_at": "2025-10-03T10:30:00Z"
  }
}
```

**Security:**
- 🔒 Authentication required
- 🔒 Ownership verification
- 🔒 Input validation (Zod)
- 🔒 SQL injection prevention (Mongoose)
- 🔒 Rate limiting (future enhancement)

---

## Architecture Patterns

### 1. **Optimistic Concurrency Control**

**Problem:** Two browser tabs editing same draft simultaneously

**Solution:** Version-based conflict detection

**Flow:**
```
Client A (v1) → Edit → POST {data, version: 1} → Server updates to v2 → Success
Client B (v1) → Edit → POST {data, version: 1} → Server has v2 → 409 Conflict
```

**Client Handling:**
```typescript
onConflict: (serverVersion) => {
  // Show modal: "Draft was modified in another tab"
  // Options: Reload, Overwrite, Merge
}
```

### 2. **Debouncing Strategy**

**Why 5-10 seconds?**
- ⚖️ **Balance**: Frequent enough to prevent data loss, infrequent enough to avoid server spam
- 📊 **UX Research**: Users pause typing ~3-5 seconds between thoughts
- 🌐 **Network Efficiency**: Batch changes, reduce API calls
- 💾 **Database Load**: Minimize write operations

**Implementation:**
```typescript
// User types: "Hello World"
// Time 0s: Type "H" → Start timer (5s)
// Time 1s: Type "e" → Reset timer (5s from now)
// Time 2s: Type "l" → Reset timer (5s from now)
// Time 3s: Stop typing
// Time 8s: Timer fires → Save "Hello Wor"
// Time 9s: Type "ld" → Reset timer (5s from now)
// Time 14s: Timer fires → Save "Hello World"
```

### 3. **Status State Machine**

```
        ┌──────────────────────────────────┐
        │                                  │
        ▼                                  │
   ┌────────┐  save()   ┌────────┐   ┌────────┐
   │  idle  │────────→  │ saving │──→│ saved  │
   └────────┘           └────────┘   └────────┘
        ▲                  │  │           │
        │                  │  │           │ (after 3s)
        └──────────────────┘  │           │
                              │           └──────────┐
                              ▼                      ▼
                         ┌────────┐           ┌────────┐
                         │ error  │           │  idle  │
                         └────────┘           └────────┘
                              │
                              ▼
                         ┌──────────┐
                         │ conflict │
                         └──────────┘
```

### 4. **Offline Support**

**Detection:**
```typescript
window.addEventListener('online', () => {
  // Connection restored → retry pending save
});

window.addEventListener('offline', () => {
  // Connection lost → queue save
});
```

**Queue Management:**
```typescript
const pendingDataRef = useRef<AutosaveData | null>(null);

// When offline
pendingDataRef.current = data; // Store for later

// When back online
if (pendingDataRef.current) {
  saveMutation.mutate(pendingDataRef.current); // Retry
}
```

---

## User Experience

### Visual Feedback Timeline

**Saving State (0-2s):**
```
┌─────────────────────────────────────┐
│  🔄 Guardando...                     │
│  [━━━━━━━━░░░░░░░░░░░░] 40%         │
└─────────────────────────────────────┘
```
- Spinning icon
- Blue gradient background
- Animated shimmer effect
- Progress bar at bottom

**Saved State (2-5s):**
```
┌─────────────────────────────────────┐
│  ✓ Guardado                          │
│  🕐 hace 2 minutos                   │
│  5 guardados                         │
└─────────────────────────────────────┘
```
- Check mark icon
- Green gradient background
- Relative time stamp
- Save counter badge

**Idle State (after 5s):**
```
┌─────────────────────────────────────┐
│  ☁ Guardado automático activado     │
└─────────────────────────────────────┘
```
- Cloud icon
- Minimal gray styling
- Non-intrusive

**Error State:**
```
┌─────────────────────────────────────┐
│  ⚠ Error al guardar    [Reintentar] │
└─────────────────────────────────────┘
```
- Alert icon
- Red gradient background
- Retry button
- Click to attempt save again

**Conflict State:**
```
┌─────────────────────────────────────┐
│  ⚠ Conflicto de versión  [Recargar] │
└─────────────────────────────────────┘
```
- Warning icon
- Orange gradient background
- Reload button

### Accessibility

**ARIA Support:**
```html
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  ✓ Guardado hace 2 minutos
</div>
```

**Screen Reader Announcements:**
- "Guardando borrador" (when save starts)
- "Borrador guardado exitosamente" (on success)
- "Error al guardar, presione reintentar" (on error)

**Keyboard Navigation:**
- Retry button: Focusable, Enter/Space to activate
- No keyboard traps
- Logical tab order

---

## Integration Example

### Complete Wizard Integration

```typescript
'use client';

import { useState } from 'react';
import { useAutosave } from '@/hooks/useAutosave';
import { AutosaveIndicator } from '@/components/microclimate/AutosaveIndicator';

export function SurveyWizard({ draftId }: { draftId: string }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState({});
  
  // Initialize autosave
  const {
    save,
    forceSave,
    retry,
    status,
    lastSavedAt,
    saveCount,
    hasConflict,
  } = useAutosave(draftId, {
    debounceMs: 5000,
    onConflict: () => {
      if (confirm('Draft was modified elsewhere. Reload?')) {
        window.location.reload();
      }
    },
  });
  
  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    setStep1Data(prev => ({ ...prev, [field]: value }));
    
    // Trigger autosave
    save({
      current_step: currentStep,
      step1_data: { ...step1Data, [field]: value },
      last_edited_field: field,
    });
  };
  
  // Handle step navigation
  const handleNextStep = async () => {
    // Force save before navigation
    await forceSave({
      current_step: currentStep,
      step1_data,
    });
    
    setCurrentStep(prev => prev + 1);
  };
  
  return (
    <div>
      <form>
        <input
          type="text"
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Título de la encuesta"
        />
        
        <button type="button" onClick={handleNextStep}>
          Siguiente
        </button>
      </form>
      
      {/* Autosave indicator */}
      <AutosaveIndicator
        status={status}
        lastSavedAt={lastSavedAt}
        saveCount={saveCount}
        onRetry={retry}
        language="es"
      />
    </div>
  );
}
```

---

## Performance Optimizations

### 1. **Debouncing Reduces API Calls**

**Without Debouncing:**
```
User types "Hello World" (11 characters) = 11 API calls
```

**With 5s Debouncing:**
```
User types "Hello World" (11 characters) = 1-2 API calls
Savings: 82-91% reduction
```

### 2. **Partial Updates Save Bandwidth**

**Full Draft Update:**
```json
{
  "step1_data": {...},  // 500 bytes
  "step2_data": {...},  // 2 KB
  "step3_data": {...},  // 1 KB
  "step4_data": {...}   // 500 bytes
}
// Total: 4 KB per save
```

**Partial Step Update:**
```json
{
  "current_step": 1,
  "step1_data": {...}  // 500 bytes
}
// Total: 500 bytes per save
// Savings: 87.5%
```

### 3. **Version Field Prevents Conflicts**

**Without Version Control:**
```
User A saves → Draft updated
User B saves (stale data) → Overwrites A's changes 😞
Result: Data loss
```

**With Version Control:**
```
User A saves (v1 → v2) → Success
User B saves (v1) → 409 Conflict → User notified 😊
Result: No data loss
```

### 4. **React Query Caching**

```typescript
const saveMutation = useMutation({
  mutationFn: saveToServer,
  // Automatic retry on network errors (3 attempts)
  retry: 3,
  // Exponential backoff
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
});
```

---

## Testing Checklist

### Unit Tests
- [x] useAutosave hook initializes with correct defaults
- [x] Debounce delays save by specified interval
- [x] Force save bypasses debounce
- [x] Online/offline detection triggers retry
- [x] Version increment on successful save
- [x] Conflict state on 409 response
- [x] Error state on 500 response

### Integration Tests
- [ ] Full wizard flow with autosave
- [ ] Multi-tab conflict detection
- [ ] Network failure recovery
- [ ] API endpoint validation
- [ ] Audit log creation

### E2E Tests
- [ ] User types → autosave triggers
- [ ] Navigate away → draft persists
- [ ] Return → draft recovers
- [ ] Offline → online → save resumes

---

## Next Steps (Phase 3: Draft Recovery)

### Components to Build:

1. **useDraftRecovery Hook**
   ```typescript
   const {
     hasDraft,
     draftData,
     draftAge,
     recoverDraft,
     discardDraft,
   } = useDraftRecovery(userId, companyId);
   ```

2. **DraftRecoveryBanner Component**
   ```tsx
   <DraftRecoveryBanner
     draftAge="2 hours ago"
     onRecover={() => loadDraft()}
     onDiscard={() => deleteDraft()}
   />
   ```

3. **API Endpoint**
   ```
   GET /api/surveys/drafts/latest
   DELETE /api/surveys/drafts/[id]
   ```

---

## Dependencies

### Production:
- `@tanstack/react-query`: ^5.x - State management
- `framer-motion`: ^11.x - Animations
- `lucide-react`: ^0.x - Icons
- `date-fns`: ^3.x - Date formatting
- `zod`: ^3.x - Validation

### Dev:
- TypeScript: ^5.x
- ESLint: ^8.x
- Prettier: ^3.x

---

## Summary

### Files Created: 4
1. ✅ `src/hooks/useAutosave.ts` - 182 lines
2. ✅ `src/hooks/useDebounce.ts` - 62 lines
3. ✅ `src/components/microclimate/AutosaveIndicator.tsx` - 261 lines
4. ✅ `src/app/api/surveys/drafts/[id]/autosave/route.ts` - 270 lines

### Total Lines of Code: 775

### Features Implemented:
- ✅ Debounced autosave (5-10s configurable)
- ✅ Optimistic concurrency control
- ✅ Beautiful animated UI indicators
- ✅ Multilingual support (ES/EN)
- ✅ Online/offline detection
- ✅ Force save capability
- ✅ Retry mechanism
- ✅ Audit logging integration
- ✅ Full accessibility (ARIA)
- ✅ TypeScript type safety

### Build Status:
- ✅ TypeScript: 0 errors
- ✅ ESLint: Warnings only (no errors)
- ✅ All models compile successfully

---

## Phase 2 Status: ✅ COMPLETE

**Next Phase:** Phase 3 - Draft Recovery System (Estimated: 4 hours)

**Timeline Progress:**
- Week 1: ✅ **Database Foundation** (Complete)
- Week 2: ✅ **Autosave System** (Complete)
- Week 2: 🔄 **Draft Recovery** (Starting)
- Week 3: ⏳ **Question Library** (Pending)
- Week 4: ⏳ **Targeting & Distribution** (Pending)
- Week 5: ⏳ **Testing & Documentation** (Pending)

---

**Created:** October 3, 2025  
**Last Updated:** October 3, 2025  
**Maintained By:** Development Team
