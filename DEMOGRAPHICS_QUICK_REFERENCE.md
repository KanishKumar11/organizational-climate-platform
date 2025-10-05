# Demographics System - Quick Reference Card

## 🚀 Quick Start

### For Admins: Create Demographic Fields

1. Navigate to `/admin/demographics`
2. Click "Add Field"
3. Fill in:
   - Label: "Gender"
   - Key: "gender" (lowercase, underscores only)
   - Type: "Select"
   - Options: Add each option
   - Required: Check if needed
4. Click "Create Field"

### For Admins: Upload User Demographics via CSV

1. Go to `/admin/demographics` or `/surveys/create` demographics tab
2. Click "Download Template"
3. Fill in user emails and demographic values
4. Upload CSV file
5. Review preview
6. Confirm upload

### For Survey Creators: Add Demographics to Survey

1. Create survey at `/surveys/create`
2. Complete Questions and Targeting tabs
3. Click "Demographics" tab
4. Select desired demographic fields
5. (Optional) Upload CSV with user demographics
6. Continue to Invitations, Schedule
7. Publish survey

### For Developers: Access Demographics Data

```typescript
// Fetch company's demographic fields
const response = await fetch(
  `/api/demographics/fields?company_id=${companyId}`
);
const { fields } = await response.json();

// In survey response - demographics auto-populated
// No code needed! Just works automatically
```

---

## 📊 API Endpoints Cheat Sheet

```
GET    /api/demographics/fields              # List company fields
POST   /api/demographics/fields              # Create field
GET    /api/demographics/fields/[id]         # Get single field
PUT    /api/demographics/fields/[id]         # Update field
PATCH  /api/demographics/fields/[id]         # Toggle active
DELETE /api/demographics/fields/[id]         # Delete field
POST   /api/demographics/fields/reorder      # Reorder fields
POST   /api/demographics/upload/preview      # Preview CSV
POST   /api/demographics/upload              # Upload CSV
```

---

## 🔑 Key Files

| Component | Path                                              |
| --------- | ------------------------------------------------- |
| Admin UI  | `src/app/admin/demographics/page.tsx`             |
| Selector  | `src/components/surveys/DemographicsSelector.tsx` |
| Model     | `src/models/DemographicField.ts`                  |
| API       | `src/app/api/demographics/**`                     |
| Hook      | `src/hooks/useSurveyProgress.ts`                  |

---

## ⚙️ Field Types

| Type     | Use Case           | Example             |
| -------- | ------------------ | ------------------- |
| `select` | Predefined options | Gender, Department  |
| `text`   | Free-form text     | Location, Job Title |
| `number` | Numeric values     | Years of Service    |
| `date`   | Date values        | Hire Date           |

---

## 📝 CSV Format

```csv
email,gender,age_group,location
user@company.com,Male,25-34,New York
```

**Rules:**

- First column MUST be `email`
- Headers must match field keys exactly
- Values must match options for select fields

---

## 🔐 Permissions

| Role          | Can View | Can Create | Can Edit | Can Delete |
| ------------- | -------- | ---------- | -------- | ---------- |
| Employee      | ❌       | ❌         | ❌       | ❌         |
| Supervisor    | ❌       | ❌         | ❌       | ❌         |
| Dept Admin    | ❌       | ❌         | ❌       | ❌         |
| Company Admin | ✅ Own   | ✅         | ✅       | ✅         |
| Super Admin   | ✅ All   | ✅         | ✅       | ✅         |

---

## 🐛 Common Issues

**Issue:** "Field with this key already exists"  
**Fix:** Use a different field key (e.g., `gender_v2`)

**Issue:** "User not found" in CSV upload  
**Fix:** Ensure user exists with exact email in your company

**Issue:** "Invalid value for field"  
**Fix:** Value must exactly match one of the predefined options

**Issue:** Demographics not auto-populating  
**Fix:** Check user has demographics set in User model

---

## 💡 Best Practices

1. **Use lowercase with underscores** for field keys
2. **Keep option lists short** (< 10 options ideal)
3. **Include "Other" or "Prefer not to say"** for sensitive fields
4. **Test CSV with 5 rows** before bulk upload
5. **Download template first** to ensure correct format
6. **Don't delete fields** in use by active surveys

---

## 📈 Typical Demographic Fields

```javascript
// Common field examples
const commonFields = [
  { field: 'gender', type: 'select' },
  { field: 'age_group', type: 'select' },
  { field: 'department', type: 'select' },
  { field: 'location', type: 'text' },
  { field: 'tenure', type: 'select' },
  { field: 'education', type: 'select' },
  { field: 'job_level', type: 'select' },
  { field: 'employee_type', type: 'select' },
];
```

---

## 🔄 Workflow

```
Admin Creates Fields
       ↓
Admin Uploads User Demographics (CSV)
       ↓
Survey Creator Selects Fields
       ↓
Survey Published
       ↓
User Responds (Demographics Auto-Populate)
       ↓
Results Include Demographics
       ↓
Dashboard Filters by Demographics (Future)
```

---

## 🎯 Auto-Population Flow

```typescript
// Automatic in SurveyResponseFlow.tsx
// When user submits survey:

const demographics = {};
selectedDemographicFields.forEach((fieldId) => {
  const field = demographicFields.find((f) => f._id === fieldId);
  if (userDemographics[field.key]) {
    demographics[field.key] = userDemographics[field.key];
  }
});

// Added to submission automatically
const response = {
  survey_id,
  responses: [...answers],
  demographics, // ← Automatically included
  is_complete: true,
};
```

---

## 🧪 Testing Commands

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## 📞 Need Help?

- **Documentation:** See `DEMOGRAPHICS_IMPLEMENTATION_COMPLETE.md`
- **Testing Guide:** See `DEMOGRAPHICS_TESTING_GUIDE.md`
- **Full Summary:** See `DEMOGRAPHICS_FINAL_SUMMARY.md`
- **Support:** Contact Development Team

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** ✅ Production Ready
