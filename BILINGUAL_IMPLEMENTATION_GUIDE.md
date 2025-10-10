# Bilingual Platform Implementation Guide (English/Spanish)

## 🌐 Overview

This document outlines the complete bilingual (English/Spanish) implementation for the Organizational Climate Platform using `next-intl`.

**Implementation Date:** January 2025  
**Status:** 🚧 **IN PROGRESS**  
**Supported Languages:** English (en), Spanish (es)

---

## 📦 Dependencies Installed

```bash
npm install next-intl --save
```

**Package:** `next-intl` - Next.js internationalization library with App Router support

---

## 🏗️ Infrastructure Setup

### 1. Configuration Files

#### **`src/i18n.ts`** - Main i18n Configuration

```typescript
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
```

**Purpose:** Central configuration for supported locales and default language.

---

### 2. Translation Files

#### **Directory Structure:**

```
src/messages/
├── en.json  (English translations)
└── es.json  (Spanish translations)
```

#### **Translation Categories:**

- `common` - Shared UI elements (buttons, labels, status)
- `navigation` - Menu items, navigation links
- `auth` - Authentication (login, signup, passwords)
- `dashboard` - Dashboard metrics and widgets
- `surveys` - Survey creation, management, results
- `microclimates` - Real-time feedback features
- `actionPlans` - Action plan management
- `users` - User management and roles
- `departments` - Department administration
- `export` - Export functionality (PDF, CSV)
- `notifications` - System notifications
- `analytics` - Analytics and reporting
- `settings` - User/system settings
- `validation` - Form validation messages
- `errors` - Error messages
- `success` - Success messages
- `language` - Language switcher

#### **Total Translations:**

- **English:** 250+ strings
- **Spanish:** 250+ strings (complete translations)

---

### 3. Components Created

#### **`src/components/LanguageSwitcher.tsx`**

Two variants:

**1. Full Dropdown Switcher:**

```tsx
<LanguageSwitcher variant="ghost" size="sm" showLabel={true} />
```

Features:

- Dropdown menu with all languages
- Shows current language with check mark
- Language flags (🇺🇸 🇪🇸)
- Responsive (full text on desktop, flags on mobile)
- Stores preference in localStorage

**2. Compact Toggle Switcher:**

```tsx
<LanguageSwitcherCompact />
```

Features:

- Simple toggle button (EN ⇄ ES)
- Perfect for mobile or tight spaces
- One-click switching

---

### 4. Utility Functions

#### **`src/lib/i18n-utils.ts`** - Translation Helpers

**Available Functions:**

```typescript
// Get common translations
const { common, navigation, validation, errors, success } =
  useCommonTranslations();

// Date/Time formatting
formatDate(new Date(), 'es'); // "5 de enero de 2025"
formatDateTime(new Date(), 'en'); // "January 5, 2025, 10:30 AM"

// Number formatting
formatNumber(1234.56, 'es'); // "1.234,56"
formatCurrency(99.99, 'USD', 'es'); // "$99,99"
formatPercentage(85.5, 'en'); // "85.5%"

// Get translation keys for dynamic values
getStatusKey('active'); // "common.active"
getRoleKey('company_admin'); // "users.companyAdmin"
getPriorityKey('high'); // "actionPlans.high"
```

---

## 🔧 Implementation Steps

### Step 1: Update Root Layout (REQUIRED)

The app needs to be restructured to support locale-based routing.

**Current structure:**

```
src/app/
├── layout.tsx
├── page.tsx
└── dashboard/
    └── page.tsx
```

**New structure required:**

```
src/app/
├── [locale]/
│   ├── layout.tsx (LocaleLayout)
│   ├── page.tsx
│   └── dashboard/
│       └── page.tsx
```

**Migration Command:**

```bash
# Move all app pages into [locale] directory
mkdir -p src/app/[locale]
mv src/app/!(api|[locale]) src/app/[locale]/
```

---

### Step 2: Update Navigation Components

Add `LanguageSwitcher` to navigation bars.

#### **Example: Main Navbar**

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export function Navbar() {
  const t = useTranslations('navigation');

  return (
    <nav>
      <Link href="/dashboard">{t('dashboard')}</Link>
      <Link href="/surveys">{t('surveys')}</Link>
      <Link href="/microclimates">{t('microclimates')}</Link>

      {/* Add language switcher */}
      <LanguageSwitcher />
    </nav>
  );
}
```

---

### Step 3: Update Page Components

Replace hardcoded text with translation hooks.

#### **Before:**

```tsx
export default function SurveysPage() {
  return (
    <div>
      <h1>Surveys</h1>
      <Button>Create Survey</Button>
    </div>
  );
}
```

#### **After:**

```tsx
'use client';
import { useTranslations } from 'next-intl';

export default function SurveysPage() {
  const t = useTranslations('surveys');
  const common = useTranslations('common');

  return (
    <div>
      <h1>{t('title')}</h1>
      <Button>{t('createSurvey')}</Button>
    </div>
  );
}
```

---

### Step 4: Update Form Validation

Replace validation messages with translated versions.

#### **Example: Form Schema**

```tsx
import { useTranslations } from 'next-intl';
import { z } from 'zod';

export function useSurveySchema() {
  const t = useTranslations('validation');

  return z.object({
    title: z.string().min(1, t('required')),
    email: z.string().email(t('invalidEmail')),
    password: z.string().min(8, t('passwordTooShort')),
  });
}
```

---

### Step 5: Update Export Services

Add locale parameter to PDF/CSV exports for bilingual reports.

#### **PDF Export Service Update:**

```typescript
// src/lib/pdf-export-service.ts

export interface PDFExportOptions {
  locale?: 'en' | 'es';
  // ... existing options
}

export class PDFExportService {
  private locale: 'en' | 'es';

  constructor(options: PDFExportOptions = {}) {
    this.locale = options.locale || 'en';
    // ... existing code
  }

  private getTranslations() {
    // Load translations based on locale
    return require(`@/messages/${this.locale}.json`);
  }

  exportSurveyResults(data: SurveyPDFData): Blob {
    const t = this.getTranslations();

    // Use translated labels
    this.addSection(t.surveys.results);
    this.addKeyValue(t.surveys.responseRate, data.responseRate);
    // ... rest of export logic
  }
}
```

---

### Step 6: Update Email Templates

Create bilingual email templates.

#### **Example: Survey Invitation Email**

```typescript
// src/lib/email-templates/survey-invitation.ts

interface EmailTemplateData {
  recipientName: string;
  surveyTitle: string;
  invitationLink: string;
  locale: 'en' | 'es';
}

export function getSurveyInvitationEmail(data: EmailTemplateData) {
  const translations = {
    en: {
      subject: 'You are invited to participate in a survey',
      greeting: 'Hello',
      body: 'You have been invited to participate in the following survey:',
      cta: 'Start Survey',
      footer: 'Thank you for your participation',
    },
    es: {
      subject: 'Estás invitado a participar en una encuesta',
      greeting: 'Hola',
      body: 'Has sido invitado a participar en la siguiente encuesta:',
      cta: 'Iniciar Encuesta',
      footer: 'Gracias por tu participación',
    },
  };

  const t = translations[data.locale];

  return {
    subject: t.subject,
    html: `
      <h1>${t.greeting} ${data.recipientName},</h1>
      <p>${t.body}</p>
      <h2>${data.surveyTitle}</h2>
      <a href="${data.invitationLink}">${t.cta}</a>
      <p>${t.footer}</p>
    `,
  };
}
```

---

## 🗂️ Database Schema Updates

### Add Language Preference to User Model

```typescript
// src/models/User.ts

const UserSchema = new Schema({
  // ... existing fields
  preferred_language: {
    type: String,
    enum: ['en', 'es'],
    default: 'en',
  },
});
```

### Add Multilingual Content to Survey Model

```typescript
// src/models/Survey.ts

const SurveySchema = new Schema({
  title: {
    en: { type: String, required: true },
    es: { type: String },
  },
  description: {
    en: { type: String },
    es: { type: String },
  },
  questions: [
    {
      text: {
        en: { type: String, required: true },
        es: { type: String },
      },
      options: [
        {
          en: { type: String },
          es: { type: String },
        },
      ],
    },
  ],
});
```

---

## 📋 Migration Checklist

### Phase 1: Infrastructure ✅

- [x] Install next-intl
- [x] Create i18n configuration
- [x] Create translation files (en.json, es.json)
- [x] Create LanguageSwitcher component
- [x] Create i18n utility functions
- [x] Create locale layout wrapper

### Phase 2: Core Components 🔄

- [ ] Update root app layout for [locale] routing
- [ ] Add LanguageSwitcher to main navbar
- [ ] Update dashboard page
- [ ] Update authentication pages
- [ ] Update settings page

### Phase 3: Feature Pages 🔄

- [ ] Update survey pages (list, create, edit, results)
- [ ] Update microclimate pages
- [ ] Update action plan pages
- [ ] Update user management pages
- [ ] Update department pages
- [ ] Update analytics/reports pages

### Phase 4: Forms & Validation ⏳

- [ ] Update all form schemas with translated validation
- [ ] Update error messages
- [ ] Update success toasts
- [ ] Update confirmation dialogs

### Phase 5: Export & Email ⏳

- [ ] Update PDF export service with locale support
- [ ] Update CSV export service with locale support
- [ ] Create bilingual email templates
- [ ] Update notification service

### Phase 6: Database & API ⏳

- [ ] Add preferred_language to User model
- [ ] Add multilingual fields to Survey model
- [ ] Add multilingual fields to Microclimate model
- [ ] Update API responses to return localized content

### Phase 7: Testing & QA ⏳

- [ ] Test all pages in English
- [ ] Test all pages in Spanish
- [ ] Test language switching
- [ ] Test locale persistence
- [ ] Test exports in both languages
- [ ] Test emails in both languages
- [ ] Cross-browser testing

---

## 🎯 Usage Examples

### In Client Components

```tsx
'use client';
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('surveys');

  return <h1>{t('title')}</h1>;
}
```

### In Server Components

```tsx
import { getTranslations } from 'next-intl/server';

export default async function MyServerComponent() {
  const t = await getTranslations('surveys');

  return <h1>{t('title')}</h1>;
}
```

### With Parameters

```tsx
const t = useTranslations('validation');

// Translation with parameter
// en.json: "minLength": "Minimum length is {min} characters"
// es.json: "minLength": "La longitud mínima es de {min} caracteres"

<p>{t('minLength', { min: 8 })}</p>;
```

### Dynamic Keys

```tsx
const t = useTranslations('common');
const status = 'active'; // From API

<Badge>{t(status)}</Badge>;
```

---

## 🚀 Deployment Notes

### Environment Variables

No additional environment variables needed for i18n.

### Build Configuration

Update `next.config.ts` (if needed):

```typescript
const config = {
  // ... existing config
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
};
```

### URL Structure

After implementation, URLs will have locale prefix:

- English: `https://app.example.com/en/dashboard`
- Spanish: `https://app.example.com/es/dashboard`

Root URL (`/`) will redirect to user's preferred language or browser default.

---

## 🔍 Testing Guide

### Manual Testing

1. **Language Switching:**
   - Click language switcher
   - Verify all UI text changes
   - Verify language persists on page reload
   - Verify language persists across navigation

2. **Form Validation:**
   - Submit forms with errors
   - Verify error messages are in selected language
   - Verify success messages are in selected language

3. **Exports:**
   - Export PDF in English
   - Export PDF in Spanish
   - Verify labels and headers are translated
   - Export CSV and verify headers

4. **Emails:**
   - Trigger survey invitation
   - Verify email is in recipient's preferred language
   - Test reminder emails

### Automated Testing

```typescript
// Example: Test language switching
describe('Language Switcher', () => {
  it('should switch between English and Spanish', () => {
    render(<LanguageSwitcher />);

    // Check default language
    expect(screen.getByText('English')).toBeInTheDocument();

    // Click language switcher
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Español'));

    // Verify language changed
    expect(screen.getByText('Español')).toBeInTheDocument();
  });
});
```

---

## 📚 Translation Contribution Guide

### Adding New Translations

1. **Add to `en.json`:**

```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

2. **Add to `es.json`:**

```json
{
  "newFeature": {
    "title": "Nueva Funcionalidad",
    "description": "Esta es una nueva funcionalidad"
  }
}
```

3. **Use in component:**

```tsx
const t = useTranslations('newFeature');
<h1>{t('title')}</h1>;
```

### Translation Best Practices

1. **Keep keys consistent** across all language files
2. **Use nested objects** for organization
3. **Avoid hardcoded text** - always use translation keys
4. **Include context** in key names (e.g., `surveys.createSurvey` not just `create`)
5. **Test both languages** before committing
6. **Use parameters** for dynamic content

---

## 🐛 Known Issues & Limitations

### Current Limitations:

1. **Server Components:** Some components may need to be converted to client components to use `useTranslations` hook
2. **Dynamic Imports:** Translation files are loaded at build time
3. **SEO:** Need to implement hreflang tags for better SEO
4. **RTL Support:** Currently only LTR languages supported

### Future Enhancements:

- [ ] Add more languages (Portuguese, French)
- [ ] Implement RTL support for Arabic
- [ ] Add language-specific date/time formats
- [ ] Implement translation management UI for admins
- [ ] Add translation memory/glossary

---

## 📞 Support & Resources

**Documentation:**

- next-intl Docs: https://next-intl-docs.vercel.app/
- Translation Files: `src/messages/*.json`
- Configuration: `src/i18n.ts`
- Components: `src/components/LanguageSwitcher.tsx`

**Common Issues:**

1. **"Missing translation" errors:**
   - Check that key exists in both `en.json` and `es.json`
   - Verify key path is correct
   - Clear `.next` cache and rebuild

2. **Language not persisting:**
   - Check localStorage in browser DevTools
   - Verify middleware is running
   - Check cookie settings

3. **Server component errors:**
   - Use `getTranslations` from `next-intl/server`
   - Or convert to client component with `'use client'`

---

## ✅ Success Criteria

Bilingual implementation is complete when:

- [ ] All UI text is translatable
- [ ] Language switcher works on all pages
- [ ] Forms show translated validation
- [ ] Exports work in both languages
- [ ] Emails sent in user's preferred language
- [ ] URL structure includes locale prefix
- [ ] Language preference persists
- [ ] No hardcoded strings remain
- [ ] Both languages fully tested
- [ ] Documentation complete

---

**Status:** 🚧 **Infrastructure Complete - Migration Pending**  
**Next Step:** Restructure app directory for locale routing  
**Estimated Completion:** TBD based on app complexity  
**Last Updated:** January 2025
