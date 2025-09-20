# Company Admin Dashboard API Fix

## Problem
The `/api/dashboard/company-admin` endpoint was returning a 500 Internal Server Error due to several issues in the database queries and model field mismatches.

## Root Causes Identified

### 1. **Incorrect Aggregation Pipeline**
- **Issue**: Line 67-71 attempted to unwind `$responses` from the Survey collection
- **Problem**: Responses are stored in a separate `Response` collection, not as an embedded array in Survey
- **Fix**: Replaced the aggregation with a direct count from the Response collection

### 2. **Wrong Field Names in Survey Queries**
- **Issue**: Code was looking for `target_departments` and `target_responses` fields
- **Problem**: The actual Survey model uses `department_ids` field, not `target_departments`
- **Fix**: Updated all references to use the correct field names

### 3. **Missing Model Import**
- **Issue**: Response model was not imported
- **Problem**: Caused the Response.countDocuments() call to fail
- **Fix**: Added `import Response from '@/models/Response';`

### 4. **Non-existent Fields in Data Mapping**
- **Issue**: Survey sanitization was trying to access `target_responses`, `target_departments`, and `completion_rate`
- **Problem**: These fields don't exist in the Survey model
- **Fix**: Removed references to non-existent fields

## Specific Changes Made

### 1. Added Response Model Import
```typescript
import Response from '@/models/Response';
```

### 2. Fixed Total Responses Count
**Before:**
```typescript
Survey.aggregate([
  { $match: { company_id: companyId } },
  { $unwind: '$responses' },
  { $count: 'total' },
]).then((result) => result[0]?.total || 0),
```

**After:**
```typescript
Response.countDocuments({ company_id: companyId }),
```

### 3. Fixed Department Analytics Aggregation
**Before:**
```typescript
{ $in: ['$$deptId', '$target_departments'] },
```

**After:**
```typescript
{ $in: ['$$deptId', '$department_ids'] },
```

### 4. Updated Survey Field Selection
**Before:**
```typescript
.select('title type start_date end_date response_count target_responses target_departments')
```

**After:**
```typescript
.select('title type start_date end_date response_count department_ids')
```

### 5. Fixed Survey Data Sanitization
**Before:**
```typescript
target_responses: survey.target_responses || 0,
target_departments: survey.target_departments || [],
completion_rate: survey.completion_rate || 0,
```

**After:**
```typescript
department_ids: survey.department_ids || [],
// Removed non-existent fields
```

### 6. Enhanced Error Handling and Debugging
- Added comprehensive console logging for debugging
- Enhanced error stack trace logging
- Added progress logging for each major operation

## Survey Model Schema Reference
Based on the actual Survey model (`src/models/Survey.ts`):

**Correct Fields:**
- `company_id` ✅
- `department_ids` ✅ (array of strings)
- `status` ✅
- `response_count` ✅
- `start_date` ✅
- `end_date` ✅

**Non-existent Fields (removed):**
- `target_departments` ❌
- `target_responses` ❌
- `completion_rate` ❌

## Response Model Schema Reference
Responses are stored in a separate collection with:
- `survey_id`: Reference to the survey
- `company_id`: Company identifier
- `user_id`: User who responded (optional for anonymous)
- `responses`: Array of question responses

## Testing Recommendations

1. **Check Server Logs**: Monitor console output for the debugging messages
2. **Verify Database Connection**: Ensure MongoDB connection is working
3. **Test with Valid Company Admin**: Ensure the user has proper role and company_id
4. **Check Data Existence**: Verify there are departments, surveys, and users for the company

## Expected API Response Structure
```json
{
  "companyKPIs": {
    "totalEmployees": number,
    "activeEmployees": number,
    "totalSurveys": number,
    "activeSurveys": number,
    "totalResponses": number,
    "completionRate": number,
    "departmentCount": number,
    "engagementTrend": number
  },
  "departmentAnalytics": [...],
  "aiInsights": [...],
  "ongoingSurveys": [...],
  "pastSurveys": [...],
  "recentActivity": [...],
  "demographicVersions": [...]
}
```

## Files Modified
- `src/app/api/dashboard/company-admin/route.ts` - Fixed all database queries and field references

The API should now work correctly and return proper company dashboard data for company admin users.
