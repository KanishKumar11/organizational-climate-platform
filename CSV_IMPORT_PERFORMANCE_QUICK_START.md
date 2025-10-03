# CSV Import & Performance Features - Quick Start Guide

## Table of Contents

1. [CSV Import Feature](#csv-import-feature)
2. [Performance Optimizations](#performance-optimizations)
3. [Developer Guide](#developer-guide)
4. [Troubleshooting](#troubleshooting)

---

## CSV Import Feature

### For End Users

#### Preparing Your CSV File

**Supported Formats**:

- `.csv` (Comma-separated values)
- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

**Required Column**:

- `email` (must be valid email format)

**Optional Columns**:

- `name`, `first_name`, `last_name`
- `employee_id`
- `department`
- `position`
- `phone`
- `location`
- `hire_date`
- `manager_email`

**Example CSV**:

```csv
email,name,employee_id,department,position
john.doe@company.com,John Doe,EMP001,Engineering,Senior Developer
jane.smith@company.com,Jane Smith,EMP002,HR,HR Manager
bob.johnson@company.com,Bob Johnson,EMP003,Sales,Account Executive
```

**Spanish Column Names** (also supported):

```csv
correo,nombre,empleado_id,departamento,cargo
juan.perez@empresa.com,Juan Pérez,EMP001,Ingeniería,Desarrollador Senior
maria.garcia@empresa.com,María García,EMP002,RRHH,Gerente de RRHH
```

#### Using the Import Feature

1. **Navigate to Survey Creation**:
   - Go to "Create New Survey"
   - Complete Steps 1 and 2 (Basic Info and Questions)

2. **Step 3: Targeting**:
   - Click "Import from CSV/Excel"
   - You'll see a 3-step wizard

3. **Step 1: Upload File**:
   - Drag and drop your file OR click to browse
   - Maximum file size: 10MB
   - Accepted formats: CSV, XLSX, XLS

4. **Step 2: Map Columns**:
   - Review auto-detected column mappings
   - Adjust if needed using dropdown menus
   - Green checkmarks indicate required fields are mapped

5. **Step 3: Preview & Confirm**:
   - Review statistics:
     - Total rows uploaded
     - Valid entries
     - Duplicates found
     - Errors detected
   - Check error list (if any)
   - Review duplicate entries
   - Preview first 50 rows
   - Click "Import Users" to confirm

6. **Result**:
   - Success message shows count of imported users
   - Users are automatically added to survey targets
   - Continue to Step 4 (Scheduling)

#### Download Template

Click "Download Template" button to get a pre-formatted CSV with example data:

- Correct column headers
- Sample data for reference
- Ready to fill with your employees

---

## Performance Optimizations

### For End Users

#### What You'll Notice

1. **Faster Page Loads**:
   - Initial page loads 30-40% faster
   - Survey creation wizard appears instantly

2. **Instant Data Display**:
   - Previously loaded data appears immediately
   - Fresh data loads in background

3. **Offline-like Experience**:
   - Navigate between pages without waiting
   - Data cached for 5-30 minutes (depending on type)

4. **Real-time Updates**:
   - Survey responses update every 30 seconds
   - Window focus triggers data refresh

5. **Loading Skeletons**:
   - Visual placeholders during load
   - Smooth transitions to real content

#### Cache Behavior

**How long data stays fresh**:

- **Categories**: 30 minutes (rarely change)
- **Departments**: 10 minutes (change infrequently)
- **Users & Surveys**: 5 minutes (moderate changes)
- **Responses**: 30 seconds (real-time data)
- **Drafts**: Always fresh (critical data)

**When cache clears**:

- After creating/updating/deleting items
- Manual page refresh
- After 10 minutes of inactivity

---

## Developer Guide

### Using React Query Hooks

#### Fetching Data

```typescript
import { useCompanies, useCompany } from '@/hooks/useQueries';

function MyComponent() {
  // List all companies
  const { data, isLoading, error } = useCompanies({ status: 'active' });

  // Single company
  const { data: company } = useCompany('company-id');

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{data.map(...)}</div>;
}
```

#### Creating/Updating Data

```typescript
import { useCreateSurvey, useSaveDraft } from '@/hooks/useQueries';

function CreateSurvey() {
  const createSurvey = useCreateSurvey();
  const saveDraft = useSaveDraft();

  const handleSubmit = async (data) => {
    try {
      const result = await createSurvey.mutateAsync(data);
      console.log('Created:', result);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  const handleAutosave = (data) => {
    saveDraft.mutate(data); // Fire and forget
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      {createSurvey.isPending && <Spinner />}
    </form>
  );
}
```

#### Prefetching Data

```typescript
import { prefetchQuery, queryKeys } from '@/lib/react-query-config';

const handleCompanySelect = async (companyId: string) => {
  // Preload data for next step
  await Promise.all([
    prefetchQuery({
      queryKey: queryKeys.companies.departments(companyId),
      queryFn: () => fetchDepartments(companyId),
    }),
    prefetchQuery({
      queryKey: queryKeys.companies.users(companyId),
      queryFn: () => fetchUsers(companyId),
    }),
  ]);

  // Navigate to next step - data already loaded!
  router.push('/next-step');
};
```

### Using Lazy Components

#### Import Lazy Version

```typescript
// ❌ Old way: Loads immediately
import CSVImport from '@/components/surveys/CSVImport';

// ✅ New way: Loads on demand
import CSVImport from '@/components/surveys/CSVImportLazy';

// Usage is identical
<CSVImport onImportComplete={handleImport} />
```

#### Available Lazy Components

1. `SurveyCreationWizardLazy` - Main wizard (~200KB)
2. `QuestionLibraryBrowserLazy` - Question browser (~150KB)
3. `QRCodeGeneratorLazy` - QR code generator (~50KB)
4. `CSVImportLazy` - CSV import (~100KB)

**Total Savings**: ~500KB not loaded until needed

### CSV Import Service API

#### Basic Usage

```typescript
import CSVImportService from '@/lib/csv-import-service';

// Parse CSV
const result = await CSVImportService.parseCSV(file);

// Parse Excel
const result = await CSVImportService.parseXLSX(file);

// Auto-detect columns
const mapping = CSVImportService.autoDetectMapping(headers);

// Validate data
const validation = CSVImportService.validateData(data, { requireEmail: true });

// Full import pipeline
const importResult = await CSVImportService.importUsers({
  file,
  columnMapping: mapping,
  deduplicateBy: 'email',
  validateOptions: { requireEmail: true },
});

// Generate template
const csvString = CSVImportService.generateTemplate();
```

#### Custom Validation

```typescript
const result = await CSVImportService.importUsers({
  file,
  columnMapping,
  validateOptions: {
    requireEmail: true,
    requireName: true,
    customValidators: [
      {
        field: 'department',
        validate: (value) => {
          const validDepts = ['HR', 'Engineering', 'Sales'];
          return validDepts.includes(value);
        },
        errorMessage: 'Invalid department',
      },
    ],
  },
});
```

#### Handling Results

```typescript
const result = await CSVImportService.importUsers(options);

if (result.success) {
  console.log('Imported:', result.data.length, 'users');
  console.log('Duplicates:', result.duplicates.length);
  console.log('Errors:', result.errors.length);

  // Process valid users
  result.data.forEach((user) => {
    console.log(user.email, user.name);
  });

  // Handle duplicates
  if (result.duplicates.length > 0) {
    console.warn('Duplicates found:', result.duplicates);
  }

  // Display errors
  result.errors.forEach((error) => {
    console.error(`Row ${error.row}: ${error.message}`);
  });
} else {
  console.error('Import failed');
}
```

### Query Key Structure

```typescript
import { queryKeys } from '@/lib/react-query-config';

// Companies
queryKeys.companies.all           → ['companies']
queryKeys.companies.lists()       → ['companies', 'list']
queryKeys.companies.list(filters) → ['companies', 'list', filters]
queryKeys.companies.detail(id)    → ['companies', 'detail', id]
queryKeys.companies.departments(id) → ['companies', id, 'departments']
queryKeys.companies.users(id)     → ['companies', id, 'users']

// Surveys
queryKeys.surveys.all             → ['surveys']
queryKeys.surveys.detail(id)      → ['surveys', 'detail', id]
queryKeys.surveys.responses(id)   → ['surveys', id, 'responses']
queryKeys.surveys.draft(sessionId) → ['surveys', 'draft', sessionId]

// Question Library
queryKeys.questionLibrary.questions(filters) → ['questionLibrary', 'questions', filters]
queryKeys.questionLibrary.categories()       → ['questionLibrary', 'categories']
```

### Cache Invalidation

```typescript
import { invalidateQueries, queryKeys } from '@/lib/react-query-config';

// After creating a survey
invalidateQueries(queryKeys.surveys.lists());

// After updating a company
invalidateQueries(queryKeys.companies.detail(companyId));
invalidateQueries(queryKeys.companies.lists());

// After importing users
invalidateQueries(queryKeys.companies.users(companyId));

// Invalidate everything for a company
invalidateQueries(['companies', companyId]);
```

---

## Troubleshooting

### CSV Import Issues

#### "File too large" Error

- **Cause**: File exceeds 10MB limit
- **Solution**:
  - Split file into smaller chunks
  - Remove unnecessary columns
  - Use XLSX instead of CSV (better compression)

#### "Invalid email format" Errors

- **Cause**: Email column contains invalid emails
- **Solution**:
  - Check for typos: missing @, .com, etc.
  - Ensure no extra spaces
  - Valid format: `user@domain.com`

#### "No email column detected"

- **Cause**: Email column not recognized
- **Solution**:
  - Name column exactly: `email`, `Email`, or `E-mail`
  - In Spanish: `correo` or `Correo electrónico`
  - Manually map in Step 2

#### Duplicates Not Detected

- **Cause**: Deduplication strategy doesn't match data
- **Solution**:
  - If using emails: Ensure emails are consistent
  - If using employee IDs: Check for missing IDs
  - Use "both" strategy for strictest matching

#### Column Mapping Incorrect

- **Cause**: Auto-detection failed
- **Solution**:
  - Manually adjust mappings in Step 2
  - Use standard column names next time
  - Download template for correct format

### Performance Issues

#### Data Not Updating

- **Cause**: Stale cache
- **Solution**:
  - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
  - Close and reopen tab
  - Cache auto-refreshes after 5-30 minutes

#### Slow Initial Load

- **Cause**: Large bundle on first visit
- **Solution**:
  - Normal on first load (downloading code)
  - Subsequent loads will be fast
  - Use lazy loading (already implemented)

#### Memory Issues

- **Cause**: Too many cached queries
- **Solution**:
  - Cache auto-clears after 10 minutes
  - Close unused tabs
  - Refresh browser if needed

### Developer Issues

#### TypeScript Errors with Hooks

```typescript
// ❌ Wrong
const data = useCompanies();

// ✅ Correct
const { data, isLoading, error } = useCompanies();
```

#### Mutation Not Invalidating Cache

```typescript
// ❌ Wrong
const createSurvey = useCreateSurvey();
await createSurvey.mutateAsync(data);
// Cache not invalidated

// ✅ Correct - invalidation is automatic in mutation definition
// Check src/hooks/useQueries.ts for onSuccess handlers
```

#### Lazy Component Not Loading

```typescript
// ❌ Wrong
import CSVImport from './CSVImportLazy';
<CSVImport />

// ✅ Correct - add error boundary
import { ErrorBoundary } from 'react-error-boundary';
import CSVImport from './CSVImportLazy';

<ErrorBoundary fallback={<div>Failed to load</div>}>
  <CSVImport />
</ErrorBoundary>
```

---

## Best Practices

### For Administrators

1. **CSV Imports**:
   - Download template first
   - Validate data in Excel before upload
   - Start with small batch (10-20 users) to test
   - Check for duplicates before import
   - Review preview carefully

2. **Data Management**:
   - Clean up old surveys regularly
   - Archive inactive departments
   - Verify user emails periodically
   - Export data for backup

### For Developers

1. **React Query**:
   - Always use provided hooks
   - Don't bypass cache with direct fetch
   - Use prefetching for anticipated navigation
   - Implement optimistic updates for better UX

2. **Code Splitting**:
   - Use lazy components for heavy features
   - Add loading skeletons
   - Implement error boundaries
   - Monitor bundle sizes

3. **CSV Import**:
   - Use CSVImportService for consistency
   - Handle all error cases
   - Provide clear user feedback
   - Test with various file formats

4. **Performance**:
   - Monitor cache hit rates in DevTools
   - Use React Query DevTools in development
   - Optimize query keys for cache efficiency
   - Implement pagination for large datasets

---

## FAQ

**Q: Can I import more than 10MB of users?**  
A: Split your file into multiple smaller files or contact support to increase the limit.

**Q: What happens to duplicates?**  
A: Duplicates are detected and shown in preview. You can choose to skip them or update existing users.

**Q: How do I update existing users via CSV?**  
A: Import the CSV with updated data. The system will detect duplicates and you can choose to merge changes.

**Q: Can I undo an import?**  
A: Currently not supported. Review the preview carefully before confirming import.

**Q: How long is data cached?**  
A: 5-30 minutes depending on data type. Categories cache longest (30min), responses shortest (30s).

**Q: Can I clear the cache manually?**  
A: Hard refresh the page (Ctrl+Shift+R) or use React Query DevTools to invalidate specific queries.

**Q: Why is the first page load slow?**  
A: First load downloads code bundles. Subsequent loads use cached bundles and are much faster.

**Q: Can I use TSV or other formats?**  
A: Currently only CSV and Excel (.xlsx, .xls) are supported.

---

## Support

### Getting Help

1. **Check this guide** for common issues
2. **Review error messages** carefully - they usually explain the problem
3. **Check browser console** (F12) for technical details
4. **Try the template** to ensure correct format
5. **Contact support** with:
   - Screenshot of error
   - Sample CSV file (anonymized)
   - Steps to reproduce

### Reporting Bugs

Include:

- Browser and version
- File format (CSV/XLSX/XLS)
- File size
- Number of rows
- Error message (exact text)
- Screenshots

---

## Changelog

### Version 1.0.0 (Current)

- ✅ CSV/Excel import with auto-mapping
- ✅ Deduplication by email/employee_id
- ✅ React Query caching and optimization
- ✅ Code splitting for 4 major components
- ✅ Template generation
- ✅ Comprehensive validation
- ✅ Loading skeletons
- ✅ Error handling and user feedback

### Planned Features

- ⏳ Import history and rollback
- ⏳ Bulk edit after import
- ⏳ Google Sheets integration
- ⏳ Advanced deduplication rules
- ⏳ Import scheduling
- ⏳ Undo/redo functionality
