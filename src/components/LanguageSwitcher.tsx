'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check, Languages } from 'lucide-react';

type Locale = 'en' | 'es';

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

const languageNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

const languageFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
};

const locales: Locale[] = ['en', 'es'];

export function LanguageSwitcher({
  variant = 'ghost',
  size = 'sm',
  showLabel = true,
}: LanguageSwitcherProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get current locale from localStorage or default to 'en'
    const savedLocale =
      (localStorage.getItem('preferredLocale') as Locale) || 'en';
    if (locales.includes(savedLocale)) {
      setLocale(savedLocale);
    }
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('preferredLocale', newLocale);

    // Trigger custom event for components to react to language change
    window.dispatchEvent(
      new CustomEvent('localeChange', { detail: { locale: newLocale } })
    );

    // Reload page to apply new translations
    window.location.reload();
  };

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Globe className="h-4 w-4" />
          {showLabel && (
            <>
              <span className="hidden sm:inline-block">
                {languageNames[locale]}
              </span>
              <span className="sm:hidden">{languageFlags[locale]}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLanguageChange(loc)}
            className="flex items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{languageFlags[loc]}</span>
              <span>{languageNames[loc]}</span>
            </div>
            {locale === loc && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile or tight spaces
export function LanguageSwitcherCompact() {
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLocale =
      (localStorage.getItem('preferredLocale') as Locale) || 'en';
    if (locales.includes(savedLocale)) {
      setLocale(savedLocale);
    }
  }, []);

  const handleToggle = () => {
    const newLocale: Locale = locale === 'en' ? 'es' : 'en';
    setLocale(newLocale);
    localStorage.setItem('preferredLocale', newLocale);

    // Trigger custom event for components to react to language change
    window.dispatchEvent(
      new CustomEvent('localeChange', { detail: { locale: newLocale } })
    );

    // Reload page to apply new translations
    window.location.reload();
  };

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="gap-2"
      title={`Switch to ${locale === 'en' ? 'Spanish' : 'English'}`}
    >
      <Languages className="h-4 w-4" />
      <span className="font-medium">{locale.toUpperCase()}</span>
    </Button>
  );
}
