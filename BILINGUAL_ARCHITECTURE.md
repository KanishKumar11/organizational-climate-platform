# 🏗️ Bilingual Platform Architecture

## 📐 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Sidebar                                                     │    │
│  │  ┌────────────────────────────────────────────────────┐    │    │
│  │  │  Profile Dropdown                                   │    │    │
│  │  │  ┌──────────────────────────────────────────────┐ │    │    │
│  │  │  │  LanguageSwitcherCompact                     │ │    │    │
│  │  │  │  [🌐 EN] ←→ [🌐 ES]                       │ │    │    │
│  │  │  └──────────────────────────────────────────────┘ │    │    │
│  │  └────────────────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Any Component (Dashboard, Surveys, etc.)                  │    │
│  │  ┌──────────────────────────────────────────────────────┐ │    │
│  │  │  const t = useTranslations('namespace')              │ │    │
│  │  │  <h1>{t('title')}</h1>                              │ │    │
│  │  └──────────────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────┬───────────────────────────┘
                                        │
                                        ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    TRANSLATION CONTEXT                               │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  TranslationProvider                                        │    │
│  │  ├── State: locale, messages                               │    │
│  │  ├── Hook: useTranslations(namespace)                      │    │
│  │  ├── Hook: useLocale()                                     │    │
│  │  └── Hook: useSetLocale()                                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          │                                           │
│                          ↓                                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Translation Logic                                          │    │
│  │  ├── Load messages from /messages/{locale}.json           │    │
│  │  ├── Parse keys with dot notation                         │    │
│  │  ├── Replace parameters {param}                            │    │
│  │  └── Return translated string                              │    │
│  └────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────┬───────────────────────────┘
                                        │
                                        ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    TRANSLATION FILES                                 │
│                                                                       │
│  ┌──────────────────────────┐    ┌──────────────────────────┐      │
│  │  src/messages/en.json     │    │  src/messages/es.json     │      │
│  │  ┌────────────────────┐  │    │  ┌────────────────────┐  │      │
│  │  │ {                  │  │    │  │ {                  │  │      │
│  │  │   "common": {      │  │    │  │   "common": {      │  │      │
│  │  │     "save": "Save" │  │    │  │     "save":        │  │      │
│  │  │   },               │  │    │  │     "Guardar"      │  │      │
│  │  │   "surveys": {     │  │    │  │   },               │  │      │
│  │  │     "title":       │  │    │  │   "surveys": {     │  │      │
│  │  │     "Surveys"      │  │    │  │     "title":       │  │      │
│  │  │   }                │  │    │  │     "Encuestas"    │  │      │
│  │  │ }                  │  │    │  │   }                │  │      │
│  │  └────────────────────┘  │    │  │ }                  │  │      │
│  │  250+ keys                │    │  └────────────────────┘  │      │
│  └──────────────────────────┘    │  250+ keys                │      │
│                                    └──────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                                        │
                                        ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                                 │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  localStorage                                               │    │
│  │  ┌──────────────────────────────────────────────────────┐ │    │
│  │  │  Key: "preferredLocale"                              │ │    │
│  │  │  Value: "en" | "es"                                  │ │    │
│  │  └──────────────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### **Language Switch Flow:**

```
┌──────────────────┐
│  USER CLICKS     │
│  Language Button │
│  [🌐 EN]        │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────────┐
│  LanguageSwitcherCompact         │
│  onClick() triggered             │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  setLocale('es')                 │
│  - Update state                  │
│  - Save to localStorage          │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  localStorage.setItem()          │
│  "preferredLocale": "es"         │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  window.dispatchEvent()          │
│  CustomEvent('localeChange')     │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  window.location.reload()        │
│  Full page refresh               │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  App Reloads                     │
│  Root Layout Renders             │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  TranslationProvider Initializes │
│  - Read localStorage             │
│  - locale = "es"                 │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  Load Messages                   │
│  import('/messages/es.json')     │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  Set messages state              │
│  messages = { ...spanish }       │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  All Components Re-render        │
│  useTranslations() returns       │
│  Spanish translations            │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│  UI Updates                      │
│  "Save" → "Guardar"             │
│  "Surveys" → "Encuestas"        │
└──────────────────────────────────┘
```

---

## 🧩 Component Hierarchy

```
App Root
│
├── RootLayout (src/app/layout.tsx)
│   └── <TranslationProvider>  ← Translation Context
│       │
│       ├── SessionProvider
│       ├── QueryProvider
│       └── PWAProvider
│           │
│           └── Pages
│               │
│               ├── DashboardLayout
│               │   ├── Sidebar
│               │   │   ├── Header
│               │   │   ├── Navigation (useTranslations)
│               │   │   └── Footer
│               │   │       └── ProfileDropdown
│               │   │           └── LanguageSwitcherCompact
│               │   │
│               │   └── Main Content
│               │       └── Page Components (useTranslations)
│               │
│               ├── SurveyPages (useTranslations)
│               ├── MicroclimatePages (useTranslations)
│               ├── ActionPlanPages (useTranslations)
│               └── UserPages (useTranslations)
```

---

## 🎣 Hook Usage Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Component                                               │
│                                                          │
│  import { useTranslations } from                        │
│    '@/contexts/TranslationContext'                     │
│                                                          │
│  function MyComponent() {                               │
│    const t = useTranslations('surveys')  ←─────┐       │
│                                                  │       │
│    return <h1>{t('title')}</h1>  ←──────────────┤       │
│  }                                               │       │
└──────────────────────────────────────────────────┼───────┘
                                                   │
                                                   │
┌──────────────────────────────────────────────────┼───────┐
│  TranslationContext                              │       │
│                                                  │       │
│  const t = (key, params) => {                    │       │
│    // key = 'title'                              │       │
│    // namespace = 'surveys'                      │       │
│    // Full path: 'surveys.title'  ←──────────────┘       │
│                                                          │
│    const fullKey = 'surveys.title'                       │
│    const value = messages.surveys.title  ←─────┐         │
│    return value // "Surveys" or "Encuestas"    │         │
│  }                                               │         │
└──────────────────────────────────────────────────┼─────────┘
                                                   │
                                                   │
┌──────────────────────────────────────────────────┼─────────┐
│  Translation Files                               │         │
│                                                  │         │
│  en.json                    es.json              │         │
│  {                          {                    │         │
│    "surveys": {              "surveys": {        │         │
│      "title": "Surveys" ──┐   "title":          │         │
│    }                       │   "Encuestas" ──────┼─────────┘
│  }                         │  }                  │
│                            └──────────────────────┘
└───────────────────────────────────────────────────────────┘
```

---

## 🗄️ File Structure

```
organizational-climate-platform/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx  ← TranslationProvider integrated
│   │   ├── [locale]/
│   │   │   └── layout.tsx  ← Locale-specific layout (optional)
│   │   └── dashboard/
│   │       └── page.tsx  ← Uses useTranslations
│   │
│   ├── components/
│   │   ├── LanguageSwitcher.tsx  ← Language switcher UI
│   │   ├── layout/
│   │   │   └── DashboardLayout.tsx  ← Contains switcher
│   │   └── examples/
│   │       └── TranslationExample.tsx  ← Examples
│   │
│   ├── contexts/
│   │   └── TranslationContext.tsx  ← Translation provider
│   │
│   ├── lib/
│   │   └── i18n-utils.ts  ← Formatting utilities
│   │
│   ├── messages/
│   │   ├── en.json  ← English translations (250+ keys)
│   │   └── es.json  ← Spanish translations (250+ keys)
│   │
│   └── i18n.ts  ← Configuration
│
├── BILINGUAL_IMPLEMENTATION_GUIDE.md
├── BILINGUAL_QUICK_START.md
├── BILINGUAL_VISUAL_GUIDE.md
├── BILINGUAL_IMPLEMENTATION_SUMMARY.md
└── BILINGUAL_PHASE_1_COMPLETE.md
```

---

## ⚙️ Configuration Flow

```
┌─────────────────────────────────────────────────────────────┐
│  src/i18n.ts                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  export const locales = ['en', 'es']                │   │
│  │  export const defaultLocale = 'en'                  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  src/contexts/TranslationContext.tsx                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TranslationProvider                                 │   │
│  │  - Initialize with defaultLocale                    │   │
│  │  - Load messages dynamically                        │   │
│  │  - Provide hooks                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  src/app/layout.tsx                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  <TranslationProvider>                              │   │
│  │    {children}                                       │   │
│  │  </TranslationProvider>                             │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  All Child Components                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Can use:                                           │   │
│  │  - useTranslations()                                │   │
│  │  - useLocale()                                      │   │
│  │  - useSetLocale()                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Type Safety

```typescript
┌─────────────────────────────────────────────────────────────┐
│  Type Definitions                                            │
│                                                              │
│  type Locale = 'en' | 'es'  ← Only valid locales           │
│                                                              │
│  type Messages = Record<string, any>  ← Translation object  │
│                                                              │
│  interface TranslationContextType {                         │
│    locale: Locale                     ← Current language    │
│    messages: Messages                 ← Loaded translations │
│    t: (key: string, params?) => string  ← Translate fn     │
│    setLocale: (locale: Locale) => void  ← Change language  │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Translation Resolution

```
User calls: t('createSurvey')
Namespace: 'surveys'

Step 1: Construct full key
┌──────────────────────────┐
│ fullKey = 'surveys.createSurvey'
└──────────────────────────┘
         │
         ↓
Step 2: Split by dots
┌──────────────────────────┐
│ keys = ['surveys', 'createSurvey']
└──────────────────────────┘
         │
         ↓
Step 3: Traverse object
┌──────────────────────────┐
│ value = messages
│ value = messages['surveys']
│ value = messages['surveys']['createSurvey']
└──────────────────────────┘
         │
         ↓
Step 4: Return value
┌──────────────────────────┐
│ EN: "Create Survey"
│ ES: "Crear Encuesta"
└──────────────────────────┘
```

---

## 🌊 Event Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Event Timeline                                              │
│                                                              │
│  t=0    User clicks [🌐 EN]                                │
│         │                                                    │
│  t=1    onClick() → setLocale('es')                        │
│         │                                                    │
│  t=2    localStorage.setItem('preferredLocale', 'es')      │
│         │                                                    │
│  t=3    window.dispatchEvent('localeChange')               │
│         │                                                    │
│  t=4    window.location.reload()                           │
│         │                                                    │
│  t=5    App restarts                                       │
│         │                                                    │
│  t=6    TranslationProvider.useEffect()                    │
│         │                                                    │
│  t=7    localStorage.getItem('preferredLocale') → 'es'    │
│         │                                                    │
│  t=8    loadMessages('es')                                 │
│         │                                                    │
│  t=9    import('/messages/es.json')                        │
│         │                                                    │
│  t=10   setMessages(spanishMessages)                       │
│         │                                                    │
│  t=11   Components render with Spanish text               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Considerations

```
┌─────────────────────────────────────────────────────────────┐
│  Performance Optimizations                                   │
│                                                              │
│  ✅ Messages loaded once at app start                       │
│  ✅ Dynamic imports for code splitting                      │
│  ✅ Memoization in TranslationContext                       │
│  ✅ localStorage for persistence (no API calls)             │
│  ✅ No re-renders on locale change (page reload)            │
│                                                              │
│  Bundle Size:                                                │
│  - TranslationContext: ~5KB                                 │
│  - en.json: ~15KB                                           │
│  - es.json: ~15KB                                           │
│  - Total: ~35KB (minimal impact)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Comparison with Other Approaches

```
┌────────────────────────────────────────────────────────────────┐
│  Option A (Current) vs Option B (Middleware Routing)          │
│                                                                 │
│  OPTION A (Implemented):                                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  URL: /dashboard                                      │    │
│  │  Language: Stored in localStorage                     │    │
│  │  Switching: window.location.reload()                  │    │
│  │  Middleware: No changes needed                        │    │
│  │  Complexity: Low                                      │    │
│  │  SEO: No locale-specific URLs                         │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                 │
│  OPTION B (Not Implemented):                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  URL: /en/dashboard, /es/dashboard                    │    │
│  │  Language: From URL path                              │    │
│  │  Switching: router.push('/es/dashboard')              │    │
│  │  Middleware: Complex integration needed               │    │
│  │  Complexity: High                                     │    │
│  │  SEO: Locale-specific URLs                            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                 │
│  Why Option A?                                                 │
│  ✅ Simpler implementation                                    │
│  ✅ No middleware conflicts                                   │
│  ✅ Faster to deploy                                          │
│  ✅ Works with existing auth                                  │
│  ❌ But: No SEO benefits from locale URLs                     │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎓 Learning Path for Developers

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Understand the Context                             │
│  - Read TranslationContext.tsx                              │
│  - See how hooks are created                                │
│  - Understand state management                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Explore Translation Files                          │
│  - Open en.json and es.json                                 │
│  - See namespace structure                                  │
│  - Find relevant keys for your component                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Study Examples                                     │
│  - Open TranslationExample.tsx                              │
│  - See all usage patterns                                   │
│  - Copy patterns for your needs                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Start Simple                                       │
│  - Pick one component                                       │
│  - Add 'use client'                                         │
│  - Import useTranslations                                   │
│  - Replace one hardcoded string                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Test and Iterate                                   │
│  - Run the app                                              │
│  - Switch languages                                         │
│  - See your translation work                                │
│  - Repeat for more strings                                  │
└─────────────────────────────────────────────────────────────┘
```

---

**Architecture Status:** ✅ **COMPLETE**  
**Documentation:** ✅ **COMPREHENSIVE**  
**Ready for:** Phase 2 - Component Migration

---

_Last Updated: October 5, 2025_
