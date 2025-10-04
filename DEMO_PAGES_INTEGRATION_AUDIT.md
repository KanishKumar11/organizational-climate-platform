# Demo Pages Integration Audit

**Date:** October 4, 2025  
**Status:** 🔍 **IN PROGRESS - Mapping Demo to Production**

---

## 📊 Overview

There are **7 demo pages** in `/app/demo/` that showcase advanced features. Some are integrated into production, others need migration.

| Demo Page | Production Route | Status | Components to Integrate |
|-----------|------------------|--------|------------------------|
| `/demo/action-plans` | `/action-plans` | 🟡 **Partial** | BulkActionPlanCreator, AlertsPanel, CommitmentTracker |
| `/demo/ai-insights` | ❌ **Missing** | 🔴 **Not Integrated** | AIInsightsPanel, sentiment analysis UI |
| `/demo/benchmarks` | `/benchmarks` | ✅ **Complete** | Already integrated |
| `/demo/charts` | ❌ **Missing** | 🔴 **Not Integrated** | Chart library showcase page |
| `/demo/microclimate-live` | `/microclimates/[id]/live` | 🟢 **Likely Complete** | RealTimeMicroclimateVisualization |
| `/demo/microclimate-wizard` | `/microclimates/create-wizard` | ✅ **Complete** | Just integrated! |
| `/demo/question-bank` | ❌ **Missing** | 🔴 **Not Integrated** | QuestionBankManager, QuestionRecommendations, QuestionAnalytics |

---

## 🔍 Detailed Analysis

### 1. ✅ `/demo/microclimate-wizard` → `/microclimates/create-wizard`

**Status:** ✅ **COMPLETE** (Just integrated in previous session)

**What Was Done:**
- Created production route at `/microclimates/create-wizard`
- All 9 Phase 1-3 features working
- Authentication & authorization added
- API integration complete

**No Further Action Needed**

---

### 2. 🟡 `/demo/action-plans` → `/action-plans`

**Current State:**
- Production route **EXISTS** at `/action-plans`
- Uses `ActionPlanDashboard` component ✅
- Has create route at `/action-plans/create` ✅

**Missing from Production:**
- ❌ **BulkActionPlanCreator** - Create multiple action plans at once from AI insights
- ❌ **AlertsPanel** - Real-time alerts for overdue/at-risk action plans
- ❌ **CommitmentTracker** - Track team member commitments and accountability

**Demo Features (lines 1-349):**
```tsx
// Demo has these views:
- 'dashboard' ✅ (in production)
- 'single' ✅ (in production /create)
- 'bulk' ❌ (MISSING - BulkActionPlanCreator)
- 'list' ✅ (in production dashboard)
- 'alerts' ❌ (MISSING - AlertsPanel)
- 'commitments' ❌ (MISSING - CommitmentTracker)
```

**Integration Priority:** 🔴 **HIGH**
- Bulk creation saves time for admins
- Alerts prevent missed deadlines
- Commitment tracking improves accountability

**Recommended Action:**
1. Add tabs to `/action-plans` page for Alerts and Commitments
2. Add "Bulk Create from Insights" button
3. Create `/action-plans/bulk-create` route

---

### 3. 🔴 `/demo/ai-insights` → ❌ **NO PRODUCTION ROUTE**

**Current State:**
- **No production equivalent exists**
- AI functionality likely scattered across other pages

**Demo Components (lines 1-231):**
```tsx
<AIInsightsPanel 
  surveyId="..."
  responses={sampleResponses}
  context={sampleContext}
/>
```

**Features:**
- Sentiment analysis visualization
- Theme detection
- Action recommendations
- Context-aware insights
- Real-time response analysis

**Integration Priority:** 🟡 **MEDIUM**
- AI insights are valuable but may be embedded elsewhere
- Could be integrated into survey results pages
- Or create dedicated `/ai-insights` or `/analytics/ai` page

**Recommended Action:**
1. Check if AIInsightsPanel is used in `/surveys/[id]/results`
2. If not, create `/ai-insights` page
3. Or add as tab in survey results

---

### 4. ✅ `/demo/benchmarks` → `/benchmarks`

**Current State:**
- Production route **EXISTS** at `/benchmarks`
- Components already integrated:
  - ✅ `BenchmarkManager`
  - ✅ `BenchmarkComparison`
  - ✅ `TrendAnalysis`

**Status:** ✅ **COMPLETE**

**No Further Action Needed** - Already properly integrated!

---

### 5. 🔴 `/demo/charts` → ❌ **NO PRODUCTION SHOWCASE**

**Current State:**
- **No dedicated charts showcase page**
- Chart components exist and are used in various pages
- Missing: Unified visualization gallery/demo

**Demo Components (lines 1-386):**
```tsx
import {
  AnimatedBarChart,      // ✅ Component exists
  AnimatedLineChart,     // ✅ Component exists
  AnimatedPieChart,      // ✅ Component exists
  HeatMap,              // ✅ Component exists
  WordCloud,            // ✅ Component exists
  SentimentVisualization, // ✅ Component exists
  KPIDisplay,           // ✅ Component exists
  RecommendationCard,   // ✅ Component exists
} from '@/components/charts';
```

**Integration Priority:** 🟢 **LOW**
- Charts are already used in production pages
- Demo is mainly a showcase/documentation
- Could be useful for testing/documentation

**Recommended Action:**
1. **Option A:** Keep as demo only (for testing/documentation)
2. **Option B:** Create `/analytics/visualizations` showcase page
3. **Option C:** Integrate into Storybook/component library

**Recommendation:** Keep as demo - it serves its purpose

---

### 6. 🟢 `/demo/microclimate-live` → `/microclimates/[id]/live`

**Current State:**
- Production route **EXISTS** at `/microclimates/[id]/live`
- Uses `RealTimeMicroclimateVisualization` component

**Demo Features (lines 1-363):**
```tsx
<RealTimeMicroclimateVisualization
  microclimate={mockMicroclimateData}
  enableSimulation={true}
  refreshInterval={5000}
/>
```

**Integration Status:** 🟢 **LIKELY COMPLETE**
- Component exists in production
- Need to verify real-time updates work
- Demo adds simulation mode for testing

**Integration Priority:** 🟢 **LOW** (verify only)

**Recommended Action:**
1. Verify `/microclimates/[id]/live` uses component correctly
2. Check if simulation mode needed for testing
3. Ensure WebSocket/polling works in production

---

### 7. 🔴 `/demo/question-bank` → ❌ **NO PRODUCTION ROUTE**

**Current State:**
- **No production route exists**
- This is a significant missing feature

**Demo Components (lines 1-258):**
```tsx
<QuestionBankManager />          // ✅ Component exists
<QuestionRecommendations />      // ✅ Component exists
<QuestionAnalytics />            // ✅ Component exists
```

**Features:**
- Centralized question repository
- AI-powered question recommendations
- Question effectiveness analytics
- Question lifecycle management
- Usage tracking

**Integration Priority:** 🔴 **HIGH**
- Core feature for survey management
- Used in wizard (library browser)
- Should be accessible standalone

**Recommended Action:**
1. Create `/question-bank` production page
2. Add authentication & role-based access
3. Integrate with existing QuestionLibraryBrowser
4. Add navigation link in dashboard

---

## 📋 Integration Priority Matrix

### 🔴 **Critical (Do First)**

1. **Question Bank** - Core feature, needed for admin workflows
   - Create `/question-bank/page.tsx`
   - Integrate QuestionBankManager, QuestionRecommendations, QuestionAnalytics
   - Add to navigation menu

2. **Action Plans - Bulk/Alerts/Commitments** - High-value admin features
   - Add BulkActionPlanCreator to existing page
   - Add AlertsPanel tab
   - Add CommitmentTracker tab

### 🟡 **Medium (Do Next)**

3. **AI Insights** - Valuable analytics, may be elsewhere
   - Audit if AIInsightsPanel is already used
   - If not, create `/ai-insights` or integrate into results pages

### 🟢 **Low (Optional)**

4. **Microclimate Live** - Verify only
   - Check production route works correctly
   - Verify real-time updates functional

5. **Charts Demo** - Keep as demo
   - No integration needed
   - Serves as component showcase/documentation

---

## 🎯 Recommended Integration Plan

### **Phase 1: Critical Missing Features** (Priority 1)

**Week 1: Question Bank**
- [ ] Create `/app/question-bank/page.tsx`
- [ ] Add DashboardLayout wrapper
- [ ] Integrate QuestionBankManager component
- [ ] Add tab navigation (Manager | Recommendations | Analytics)
- [ ] Add authentication guards
- [ ] Add to main navigation menu
- [ ] Test CRUD operations
- [ ] Document usage

**Week 2: Action Plans Enhancement**
- [ ] Add tab navigation to `/action-plans`
- [ ] Create "Bulk Create" tab with BulkActionPlanCreator
- [ ] Create "Alerts" tab with AlertsPanel
- [ ] Create "Commitments" tab with CommitmentTracker
- [ ] Update ActionPlanNavbar to support tabs
- [ ] Test workflow end-to-end
- [ ] Document new features

### **Phase 2: Medium Priority** (Priority 2)

**Week 3: AI Insights Audit**
- [ ] Search codebase for AIInsightsPanel usage
- [ ] If missing, create `/ai-insights/page.tsx`
- [ ] Or integrate into `/surveys/[id]/results`
- [ ] Add real-time sentiment analysis
- [ ] Connect to backend AI service
- [ ] Test with real survey data

### **Phase 3: Verification** (Priority 3)

**Week 4: Microclimate Live Verification**
- [ ] Test `/microclimates/[id]/live` route
- [ ] Verify RealTimeMicroclimateVisualization works
- [ ] Check WebSocket/polling functionality
- [ ] Test with active microclimate
- [ ] Document any issues

---

## 🚀 Quick Start: Question Bank Integration

**Estimated Time:** 4-6 hours

### Step 1: Create Production Page
```bash
Create: src/app/question-bank/page.tsx
```

### Step 2: Template
```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import QuestionBankManager from '@/components/question-bank/QuestionBankManager';
import QuestionRecommendations from '@/components/question-bank/QuestionRecommendations';
import QuestionAnalytics from '@/components/question-bank/QuestionAnalytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type ActiveTab = 'manager' | 'recommendations' | 'analytics';

export default function QuestionBankPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('manager');

  // Role check
  const canManageQuestions = ['super_admin', 'company_admin'].includes(user?.role || '');

  if (!canManageQuestions) {
    return <AccessDenied />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-gray-600">
            Manage, recommend, and analyze survey questions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b">
          <Button 
            variant={activeTab === 'manager' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('manager')}
          >
            Manager
          </Button>
          <Button 
            variant={activeTab === 'recommendations' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('recommendations')}
          >
            AI Recommendations
          </Button>
          <Button 
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </Button>
        </div>

        {/* Active Tab Content */}
        {activeTab === 'manager' && <QuestionBankManager />}
        {activeTab === 'recommendations' && <QuestionRecommendations />}
        {activeTab === 'analytics' && <QuestionAnalytics />}
      </div>
    </DashboardLayout>
  );
}
```

### Step 3: Add to Navigation
```typescript
// In your navigation component, add:
{
  name: 'Question Bank',
  href: '/question-bank',
  icon: QuestionMarkIcon,
  roles: ['super_admin', 'company_admin'],
}
```

---

## 📊 Integration Checklist

### Question Bank
- [ ] Create `/app/question-bank/page.tsx`
- [ ] Add DashboardLayout wrapper
- [ ] Implement tab navigation
- [ ] Add role-based access control
- [ ] Add to main navigation
- [ ] Test all three tabs
- [ ] Verify API integration
- [ ] Add loading states
- [ ] Add error handling
- [ ] Document usage

### Action Plans Enhancement
- [ ] Review existing `/action-plans/page.tsx`
- [ ] Add tab navigation component
- [ ] Integrate BulkActionPlanCreator
- [ ] Integrate AlertsPanel
- [ ] Integrate CommitmentTracker
- [ ] Update routing
- [ ] Test workflows
- [ ] Update documentation

### AI Insights
- [ ] Audit AIInsightsPanel current usage
- [ ] Decide: Standalone page vs integration
- [ ] Implement chosen approach
- [ ] Connect to AI backend
- [ ] Test with real data
- [ ] Add to navigation (if standalone)

---

## 🎨 Design Consistency

When integrating, maintain consistency with production:

### Standard Production Page Template:
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function FeaturePage() {
  const { user, canAccessFeature } = useAuth();

  // 1. Authentication check
  if (!user) return <Redirect to="/auth/signin" />;
  
  // 2. Authorization check
  if (!canAccessFeature) return <AccessDenied />;

  // 3. Feature content
  return (
    <DashboardLayout>
      {/* Your content */}
    </DashboardLayout>
  );
}
```

### Key Patterns:
- ✅ Use `DashboardLayout` wrapper
- ✅ Add `useAuth()` for permissions
- ✅ Show loading states
- ✅ Handle errors gracefully
- ✅ Use existing UI components
- ✅ Follow responsive design
- ✅ Support dark mode
- ✅ Add proper TypeScript types

---

## 🔧 Technical Debt Notes

### Components That Need Backend Support:
1. **BulkActionPlanCreator** - Needs bulk create API endpoint
2. **AlertsPanel** - Needs real-time alerts service
3. **CommitmentTracker** - Needs commitment tracking database schema
4. **QuestionRecommendations** - Needs AI recommendation service
5. **QuestionAnalytics** - Needs analytics aggregation API

### Database Schema Updates Needed:
```sql
-- For Commitment Tracker
CREATE TABLE action_plan_commitments (
  id UUID PRIMARY KEY,
  action_plan_id UUID REFERENCES action_plans(id),
  user_id UUID REFERENCES users(id),
  commitment_text TEXT,
  due_date TIMESTAMP,
  status VARCHAR(20),
  created_at TIMESTAMP
);

-- For Question Analytics
ALTER TABLE question_bank 
ADD COLUMN usage_count INTEGER DEFAULT 0,
ADD COLUMN effectiveness_score DECIMAL(3,2),
ADD COLUMN last_used_at TIMESTAMP;
```

---

## 📈 Success Metrics

After integration, track:
- ✅ All demo features accessible in production
- ✅ User adoption rates for new features
- ✅ Reduction in manual question creation time
- ✅ Action plan completion rates improve
- ✅ Question effectiveness scores visible
- ✅ Zero permission errors
- ✅ All features mobile-responsive

---

## 🎓 Summary

**Total Demo Pages:** 7  
**Already Integrated:** 2 (Microclimate Wizard, Benchmarks)  
**Needs Integration:** 3 (Question Bank, Action Plans enhancements, AI Insights)  
**Verification Only:** 1 (Microclimate Live)  
**Keep as Demo:** 1 (Charts showcase)

**Estimated Integration Time:** 2-3 weeks (40-60 hours)  
**Priority:** Start with Question Bank (most critical missing feature)

---

**Next Step:** Begin with Question Bank integration (highest priority, standalone feature)
