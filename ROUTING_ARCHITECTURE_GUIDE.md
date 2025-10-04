# Survey System Routing Architecture

## Overview
The survey system has **two distinct route namespaces** that serve different purposes:

### `/survey/*` - Employee-Facing (Survey Participation)
Routes where employees **take surveys** and view results.

### `/surveys/*` - Admin-Facing (Survey Management)
Routes where administrators **create and manage surveys**.

---

## Route Details

### Employee Routes (`/survey/*`)

#### **`/survey/[id]`** - Take Survey
- **Purpose**: Employee interface for taking a survey
- **Component**: `SurveyInterface`
- **Features**:
  - Survey questions display
  - Answer submission
  - Progress tracking
  - Anonymous/identified modes
- **Access**: All employees (authenticated)
- **URL Example**: `/survey/abc123def456`

#### **`/survey/[id]/results`** (Planned)
- **Purpose**: View survey results
- **Access**: Based on survey visibility settings
- **URL Example**: `/survey/abc123def456/results`

---

### Admin Routes (`/surveys/*`)

#### **`/surveys`** - Survey List
- **Purpose**: View all surveys in the system
- **Component**: Survey list/dashboard
- **Features**:
  - List all surveys
  - Filter by status (draft, active, closed)
  - Quick actions (edit, delete, view stats)
- **Access**: Super Admin, Company Admin
- **URL Example**: `/surveys`

#### **`/surveys/create`** - Standard Creation Flow
- **Purpose**: Create surveys using **tab-based interface**
- **Component**: Enhanced survey creator (recently updated)
- **Features**:
  - **Builder Tab**: Add questions manually
  - **Library Tab**: Browse and add from question library
  - **Targeting Tab**: Select departments
  - **Invitations Tab**: Configure email invitations
  - **Schedule Tab**: Set start/end dates
  - **Preview Tab**: Review complete survey
  - **QR Code Tab**: Generate QR codes
- **Access**: Super Admin, Company Admin
- **Bundle Size**: 19.2 kB
- **URL**: `/surveys/create`

#### **`/surveys/create-wizard`** - Wizard Creation Flow
- **Purpose**: Create surveys using **step-by-step wizard**
- **Component**: Survey creation wizard
- **Features**:
  - Guided multi-step process
  - Same core features as `/surveys/create`
  - More user-friendly for first-time users
- **Access**: Super Admin, Company Admin
- **Bundle Size**: 313 kB (includes wizard framework)
- **URL**: `/surveys/create-wizard`

#### **`/surveys/[id]`** - Survey Details (Planned)
- **Purpose**: View/edit survey details
- **Features**:
  - Edit survey settings
  - View responses
  - Manage distribution
  - Close/reopen survey
- **Access**: Super Admin, Company Admin
- **URL Example**: `/surveys/abc123def456`

#### **`/surveys/[id]/edit`** (Planned)
- **Purpose**: Edit existing survey
- **Access**: Super Admin, Company Admin
- **URL Example**: `/surveys/abc123def456/edit`

---

## Route Comparison

| Feature | `/survey/[id]` (Take) | `/surveys/create` (Manage) |
|---------|----------------------|---------------------------|
| **Purpose** | Take surveys | Create surveys |
| **User Type** | All employees | Admins only |
| **Action** | Answer questions | Build surveys |
| **Data Flow** | Submit responses | Configure settings |
| **Navigation** | Survey UI | Admin tabs/wizard |
| **Bundle** | 9.22 kB | 19.2 kB |

---

## Why Two Namespaces?

### 1. **Separation of Concerns**
- **Taking surveys** (`/survey/*`) is a different user experience than **managing surveys** (`/surveys/*`)
- Employees don't need admin features cluttering their interface
- Admins need rich tooling not visible to survey takers

### 2. **Security & Access Control**
- Easy to apply middleware: `/surveys/*` requires admin role
- Clear permission boundaries
- Prevents accidental exposure of admin features

### 3. **Bundle Optimization**
- Survey-taking interface is lightweight (9.22 kB)
- Admin interfaces can be heavier with rich features (19.2 kB - 313 kB)
- Code-splitting happens naturally by route

### 4. **URL Clarity**
- `/survey/abc123` - "I'm taking a survey"
- `/surveys/create` - "I'm creating a survey"
- Clear intent from URL structure

---

## Common Misconceptions

### ❌ "Routes are duplicated"
**Reality**: Routes serve **different purposes**:
- `/survey/[id]` = employee takes survey #[id]
- `/surveys/create` = admin creates new survey

### ❌ "/survey and /surveys/create are the same"
**Reality**: They are **completely different**:
- `/survey/[id]` loads `SurveyInterface` component (9.22 kB)
- `/surveys/create` loads enhanced admin creator (19.2 kB)
- Different components, different data, different features

### ❌ "Why not just `/survey/create`?"
**Reality**: 
- `/survey/*` is reserved for survey participation
- `/survey/create` would confuse employees
- `/surveys/*` clearly signals "admin survey management area"

---

## Navigation Flow

### Employee Journey
```
Dashboard → Browse Surveys → Click Survey → /survey/[id] → Take Survey → Submit
```

### Admin Journey (Tab-Based)
```
Admin Panel → Surveys → Create New → /surveys/create → 
  Builder Tab → Library Tab → Targeting Tab → 
  Invitations Tab → Schedule Tab → Preview → Publish
```

### Admin Journey (Wizard-Based)
```
Admin Panel → Surveys → Create Wizard → /surveys/create-wizard → 
  Step 1 (Basic Info) → Step 2 (Questions) → 
  Step 3 (Targeting) → Step 4 (Schedule) → Review → Publish
```

---

## API Endpoints

### Survey Participation
- `GET /api/survey/[id]` - Fetch survey for taking
- `POST /api/survey/[id]/response` - Submit survey response
- `GET /api/survey/[id]/status` - Check completion status

### Survey Management
- `GET /api/surveys` - List all surveys (admin)
- `POST /api/surveys` - Create new survey
- `GET /api/surveys/[id]` - Get survey details (admin)
- `PUT /api/surveys/[id]` - Update survey
- `DELETE /api/surveys/[id]` - Delete survey

---

## Future Enhancements

### Planned Routes

#### Employee Routes
- `/survey/[id]/preview` - Preview before submitting
- `/survey/history` - My survey history
- `/survey/[id]/results` - View results (if allowed)

#### Admin Routes
- `/surveys/templates` - Survey templates library
- `/surveys/analytics` - Cross-survey analytics
- `/surveys/[id]/responses` - View all responses
- `/surveys/[id]/export` - Export survey data

---

## Technical Implementation

### Route Definitions (Next.js App Router)

```
app/
├── survey/
│   └── [id]/
│       └── page.tsx        # SurveyInterface (9.22 kB)
│
└── surveys/
    ├── page.tsx            # Survey list
    ├── create/
    │   └── page.tsx        # Tab-based creator (19.2 kB)
    └── create-wizard/
        └── page.tsx        # Wizard creator (313 kB)
```

### Middleware Protection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // /surveys/* requires admin role
  if (pathname.startsWith('/surveys')) {
    return requireRole(['super_admin', 'company_admin']);
  }
  
  // /survey/* requires authentication
  if (pathname.startsWith('/survey')) {
    return requireAuth();
  }
}
```

---

## Summary

- **`/survey/*`** = Employee-facing survey participation
- **`/surveys/*`** = Admin-facing survey management
- **Two creator options**: `/surveys/create` (tabs) vs `/surveys/create-wizard` (steps)
- **Completely separate** codebases, bundles, and user experiences
- **Not duplicates** - intentionally different routes for different purposes

---

## Related Documentation
- [SURVEY_CREATE_ENHANCEMENT_SUMMARY.md](./SURVEY_CREATE_ENHANCEMENT_SUMMARY.md) - Technical details of /surveys/create
- [SURVEY_CREATION_QUICK_START_GUIDE.md](./SURVEY_CREATION_QUICK_START_GUIDE.md) - User guide for creating surveys
- [SURVEY_CREATE_PAGE_ANALYSIS.md](./SURVEY_CREATE_PAGE_ANALYSIS.md) - Analysis and improvements
