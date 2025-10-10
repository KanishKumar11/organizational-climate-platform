# Bilingual Implementation Quick Start Guide

## 🚀 How to Use Translations in Your Components

### ✅ **Setup Complete**

The bilingual infrastructure is ready to use! Here's what's already configured:

- ✅ Translation files: `src/messages/en.json` & `src/messages/es.json`
- ✅ Translation context: `src/contexts/TranslationContext.tsx`
- ✅ Language switcher: In sidebar profile dropdown
- ✅ Root layout: TranslationProvider integrated
- ✅ 250+ translation keys available

---

## 📖 Quick Reference

### **1. Basic Usage (Recommended)**

```tsx
'use client';

import { useTranslations } from '@/contexts/TranslationContext';

export function MyComponent() {
  // Use with namespace for scoped translations
  const t = useTranslations('surveys');

  return (
    <div>
      <h1>{t('title')}</h1> {/* → "Surveys" / "Encuestas" */}
      <Button>{t('createSurvey')}</Button>{' '}
      {/* → "Create Survey" / "Crear Encuesta" */}
    </div>
  );
}
```

### **2. Access Any Translation**

```tsx
import { useTranslations } from '@/contexts/TranslationContext';

export function AnotherComponent() {
  // Use without namespace for full path access
  const t = useTranslations();

  return (
    <div>
      <h1>{t('surveys.title')}</h1>
      <p>{t('common.loading')}</p>
      <Button>{t('actionPlans.createPlan')}</Button>
    </div>
  );
}
```

### **3. Translations with Parameters**

```tsx
const t = useTranslations('validation');

// Translation: "Minimum length is {min} characters"
<p>{t('minLength', { min: 8 })}</p>;
// Result EN: "Minimum length is 8 characters"
// Result ES: "La longitud mínima es de 8 caracteres"
```

### **4. Get Current Locale**

```tsx
import { useLocale } from '@/contexts/TranslationContext';

export function MyComponent() {
  const locale = useLocale(); // 'en' or 'es'

  return <Badge>{locale.toUpperCase()}</Badge>;
}
```

---

## 📂 Available Translation Namespaces

| Namespace       | Keys | Usage Example                                  |
| --------------- | ---- | ---------------------------------------------- |
| `common`        | 35+  | `t('save')`, `t('cancel')`, `t('delete')`      |
| `navigation`    | 13   | `t('dashboard')`, `t('surveys')`               |
| `auth`          | 18   | `t('signIn')`, `t('signUp')`                   |
| `dashboard`     | 10   | `t('welcome')`, `t('overview')`                |
| `surveys`       | 38   | `t('createSurvey')`, `t('responseRate')`       |
| `microclimates` | 18   | `t('recordMicroclimate')`, `t('moodTracker')`  |
| `actionPlans`   | 26   | `t('createPlan')`, `t('assignResponsible')`    |
| `users`         | 26   | `t('addUser')`, `t('editUser')`                |
| `departments`   | 6    | `t('addDepartment')`, `t('manageDepartments')` |
| `export`        | 13   | `t('exportPDF')`, `t('exportCSV')`             |
| `notifications` | 7    | `t('viewAll')`, `t('markAsRead')`              |
| `analytics`     | 10   | `t('viewReport')`, `t('participationRate')`    |
| `settings`      | 13   | `t('general')`, `t('security')`                |
| `validation`    | 8    | `t('required')`, `t('invalidEmail')`           |
| `errors`        | 7    | `t('somethingWentWrong')`, `t('tryAgain')`     |
| `success`       | 8    | `t('saved')`, `t('created')`                   |
| `language`      | 4    | `t('switchLanguage')`, `t('currentLanguage')`  |

---

## 🔑 Common Translation Keys

### Buttons

```tsx
const t = useTranslations('common');

<Button>{t('save')}</Button>           // Save / Guardar
<Button>{t('cancel')}</Button>         // Cancel / Cancelar
<Button>{t('delete')}</Button>         // Delete / Eliminar
<Button>{t('edit')}</Button>           // Edit / Editar
<Button>{t('add')}</Button>            // Add / Agregar
<Button>{t('create')}</Button>         // Create / Crear
<Button>{t('submit')}</Button>         // Submit / Enviar
<Button>{t('close')}</Button>          // Close / Cerrar
```

### Status Indicators

```tsx
const t = useTranslations('common');

<Badge>{t('active')}</Badge>           // Active / Activo
<Badge>{t('inactive')}</Badge>         // Inactive / Inactivo
<Badge>{t('pending')}</Badge>          // Pending / Pendiente
<Badge>{t('completed')}</Badge>        // Completed / Completado
<Badge>{t('draft')}</Badge>            // Draft / Borrador
```

### Form Labels

```tsx
const t = useTranslations('common');

<Label>{t('name')}</Label>             // Name / Nombre
<Label>{t('email')}</Label>            // Email / Correo electrónico
<Label>{t('description')}</Label>      // Description / Descripción
<Label>{t('startDate')}</Label>        // Start Date / Fecha de inicio
<Label>{t('endDate')}</Label>          // End Date / Fecha de fin
```

---

## 🎯 Real-World Examples

### Example 1: Survey Creation Page

```tsx
'use client';

import { useTranslations } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateSurveyPage() {
  const t = useTranslations('surveys');
  const common = useTranslations('common');
  const validation = useTranslations('validation');

  return (
    <div>
      <h1>{t('createSurvey')}</h1>
      <form>
        <Input placeholder={t('titlePlaceholder')} required />
        <Button type="submit">{common('save')}</Button>
        <Button variant="outline">{common('cancel')}</Button>
      </form>
    </div>
  );
}
```

### Example 2: Dashboard Stats

```tsx
'use client';

import { useTranslations } from '@/contexts/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardStats() {
  const t = useTranslations('dashboard');

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{t('activeSurveys')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">12</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('responseRate')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">85%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('activeUsers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">234</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Example 3: Navigation Menu

```tsx
'use client';

import { useTranslations } from '@/contexts/TranslationContext';
import { LayoutDashboard, FileText, Users, BarChart3 } from 'lucide-react';

export function NavigationMenu() {
  const t = useTranslations('navigation');

  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), href: '/dashboard' },
    { icon: FileText, label: t('surveys'), href: '/surveys' },
    { icon: Users, label: t('users'), href: '/users' },
    { icon: BarChart3, label: t('analytics'), href: '/analytics' },
  ];

  return (
    <nav>
      {menuItems.map((item) => (
        <a key={item.href} href={item.href}>
          <item.icon />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
```

---

## 🛠️ How Language Switching Works

### User Flow:

1. User clicks their profile in sidebar
2. Clicks on language switcher (EN ⇄ ES)
3. Language preference saved to localStorage
4. Page reloads with new translations

### Technical Flow:

```
User clicks → setLocale() → localStorage →
window.location.reload() → TranslationProvider loads new messages
```

---

## 📝 Adding New Translations

### Step 1: Add to English file

Edit `src/messages/en.json`:

```json
{
  "myFeature": {
    "title": "My New Feature",
    "description": "This is a new feature",
    "button": "Click Here"
  }
}
```

### Step 2: Add to Spanish file

Edit `src/messages/es.json`:

```json
{
  "myFeature": {
    "title": "Mi Nueva Funcionalidad",
    "description": "Esta es una nueva funcionalidad",
    "button": "Haz clic aquí"
  }
}
```

### Step 3: Use in component

```tsx
const t = useTranslations('myFeature');

return (
  <div>
    <h1>{t('title')}</h1>
    <p>{t('description')}</p>
    <Button>{t('button')}</Button>
  </div>
);
```

---

## ⚠️ Important Notes

### ✅ DO:

- Always use `'use client'` directive for components using `useTranslations`
- Keep translation keys consistent across both language files
- Use namespaces to organize translations logically
- Test both languages after adding translations

### ❌ DON'T:

- Don't hardcode text in components - always use translations
- Don't forget to add keys to both `en.json` AND `es.json`
- Don't use `useTranslations` in Server Components (use `'use client'`)

---

## 🧪 Testing Your Translations

1. **Open the app** in your browser
2. **Click on your profile** in the sidebar (bottom)
3. **Click the language switcher** (EN / ES button)
4. **Verify** all text changes to the selected language
5. **Navigate** to different pages to confirm translations work everywhere

---

## 📚 View Full Example

See a complete working example:

- File: `src/components/examples/TranslationExample.tsx`
- Shows all translation patterns
- Copy patterns for your own components

---

## 🆘 Troubleshooting

### Translation not showing?

```tsx
// Check if key exists in JSON
console.log(messages.surveys.title); // Should not be undefined

// Check if namespace is correct
const t = useTranslations('surveys'); // Not 'survey' (singular)
```

### Getting the key back instead of translation?

- Key doesn't exist in JSON file
- Check spelling and capitalization
- Make sure key exists in BOTH en.json and es.json

### Component not updating on language change?

- Make sure component is wrapped in TranslationProvider
- Add `'use client'` directive at the top of the file
- Language switch triggers page reload

---

## 🎓 Next Steps

1. **Start updating components** - Begin with dashboard, navigation
2. **Update forms** - Add translated labels and validation
3. **Update modals/dialogs** - Translate confirmation messages
4. **Update toasts** - Use success/error translations
5. **Update exports** - Add locale parameter to PDF/CSV

---

**Ready to start?** Import `useTranslations` and replace your first hardcoded string! 🎉
