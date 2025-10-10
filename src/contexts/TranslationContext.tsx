'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

type Locale = 'en' | 'es';
type Messages = Record<string, any>;

interface TranslationContextType {
  locale: Locale;
  messages: Messages;
  t: (key: string, params?: Record<string, any>) => string;
  setLocale: (locale: Locale) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [messages, setMessages] = useState<Messages>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize locale from localStorage
    const savedLocale =
      (localStorage.getItem('preferredLocale') as Locale) || 'en';
    loadMessages(savedLocale);

    // Listen for locale changes
    const handleLocaleChange = (event: CustomEvent<{ locale: Locale }>) => {
      loadMessages(event.detail.locale);
    };

    window.addEventListener(
      'localeChange',
      handleLocaleChange as EventListener
    );

    return () => {
      window.removeEventListener(
        'localeChange',
        handleLocaleChange as EventListener
      );
    };
  }, []);

  const loadMessages = async (newLocale: Locale) => {
    try {
      setLoading(true);
      const response = await import(`@/messages/${newLocale}.json`);
      setMessages(response.default);
      setLocaleState(newLocale);
    } catch (error) {
      console.error(`Failed to load messages for locale: ${newLocale}`, error);
      // Fallback to English
      if (newLocale !== 'en') {
        const fallback = await import('@/messages/en.json');
        setMessages(fallback.default);
        setLocaleState('en');
      }
    } finally {
      setLoading(false);
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    // Split the key by dots to traverse nested objects
    const keys = key.split('.');
    let value: any = messages;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    // If value is not a string, return the key
    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters in the translation
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? String(params[param]) : match;
      });
    }

    return value;
  };

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem('preferredLocale', newLocale);
    loadMessages(newLocale);
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <TranslationContext.Provider value={{ locale, messages, t, setLocale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations(namespace?: string) {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error(
      'useTranslations must be used within a TranslationProvider'
    );
  }

  const { t: originalT, messages } = context;

  // If a namespace is provided, create a scoped translation function
  if (namespace) {
    return (key: string, params?: Record<string, any>) => {
      return originalT(`${namespace}.${key}`, params);
    };
  }

  // Otherwise, return a function that requires the full key
  return (key: string, params?: Record<string, any>) => {
    return originalT(key, params);
  };
}

export function useLocale(): Locale {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error('useLocale must be used within a TranslationProvider');
  }

  return context.locale;
}

export function useSetLocale() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error('useSetLocale must be used within a TranslationProvider');
  }

  return context.setLocale;
}
