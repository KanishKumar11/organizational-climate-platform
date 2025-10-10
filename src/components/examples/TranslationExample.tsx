'use client';

import { useTranslations, useLocale } from '@/contexts/TranslationContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Example component demonstrating how to use translations
 *
 * This shows the three main ways to use translations:
 * 1. useTranslations with namespace (recommended for component-specific translations)
 * 2. useTranslations without namespace (for accessing any translation key)
 * 3. useLocale for getting current locale
 */

export function TranslationExampleComponent() {
  // Method 1: Using namespace (most common)
  // This creates a scoped translation function for the 'common' namespace
  const t = useTranslations('common');

  // Method 2: Using without namespace (for accessing any key)
  const tGlobal = useTranslations();

  // Method 3: Get current locale
  const locale = useLocale();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Translation Examples</h1>

      {/* Example 1: Simple translations */}
      <Card>
        <CardHeader>
          <CardTitle>Example 1: Simple Translations</CardTitle>
          <CardDescription>Using translations with a namespace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Current locale: <Badge>{locale}</Badge>
            </p>
          </div>

          <div className="space-x-2">
            <Button>{t('save')}</Button>
            <Button variant="outline">{t('cancel')}</Button>
            <Button variant="destructive">{t('delete')}</Button>
          </div>

          <div className="space-y-2">
            <p>
              <strong>Loading:</strong> {t('loading')}
            </p>
            <p>
              <strong>Search:</strong> {t('search')}
            </p>
            <p>
              <strong>Filter:</strong> {t('filter')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Example 2: Status badges */}
      <Card>
        <CardHeader>
          <CardTitle>Example 2: Status Translations</CardTitle>
          <CardDescription>Translating status indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="default">{t('active')}</Badge>
            <Badge variant="secondary">{t('inactive')}</Badge>
            <Badge variant="outline">{t('pending')}</Badge>
            <Badge variant="destructive">{t('draft')}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Example 3: Survey-specific translations */}
      <Card>
        <CardHeader>
          <CardTitle>Example 3: Feature-Specific Translations</CardTitle>
          <CardDescription>
            Using translations from different namespaces
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{tGlobal('surveys.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tGlobal('surveys.description')}
            </p>
            <Button>{tGlobal('surveys.createSurvey')}</Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">
              {tGlobal('microclimates.title')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tGlobal('microclimates.description')}
            </p>
            <Button>{tGlobal('microclimates.recordMicroclimate')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Example 4: Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Example 4: Navigation Translations</CardTitle>
          <CardDescription>Menu items and navigation</CardDescription>
        </CardHeader>
        <CardContent>
          <nav className="space-y-2">
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>{tGlobal('navigation.dashboard')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📋</span>
              <span>{tGlobal('navigation.surveys')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <span>{tGlobal('navigation.microclimates')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📈</span>
              <span>{tGlobal('navigation.actionPlans')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>{tGlobal('navigation.users')}</span>
            </div>
          </nav>
        </CardContent>
      </Card>

      {/* Example 5: Translations with parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Example 5: Translations with Parameters</CardTitle>
          <CardDescription>Dynamic content in translations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>{tGlobal('validation.minLength', { min: 8 })}</p>
          <p>{tGlobal('validation.maxLength', { max: 100 })}</p>
        </CardContent>
      </Card>

      {/* Code examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage in Your Components</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
            <code>{`// Import the hook
import { useTranslations } from '@/contexts/TranslationContext';

// In your component
export function MyComponent() {
  // Option 1: With namespace (recommended)
  const t = useTranslations('surveys');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <Button>{t('createSurvey')}</Button>
    </div>
  );
}

// Option 2: Without namespace (full key path)
export function AnotherComponent() {
  const t = useTranslations();
  
  return <h1>{t('surveys.title')}</h1>;
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default TranslationExampleComponent;
