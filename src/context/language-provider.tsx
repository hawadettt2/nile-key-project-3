'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { translations, TranslationKeys } from '@/lib/i18n';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: Record<TranslationKeys, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const storageKey = 'nile-key-language';
  const defaultLanguage = 'ar';

  const [language, setLanguage] = useState<string>(defaultLanguage);

  useEffect(() => {
    // This runs once on the client after hydration
    let storedLanguage: string;
    try {
        storedLanguage = localStorage.getItem(storageKey) || defaultLanguage;
    } catch (e) {
        storedLanguage = defaultLanguage;
    }
    if (storedLanguage && ['en', 'ar'].includes(storedLanguage)) {
        setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    // This runs whenever the language state changes
    try {
      localStorage.setItem(storageKey, language);
    } catch (e) {
      console.error("Failed to save language to localStorage", e);
    }
  }, [language]);
  
  const t = useMemo(() => {
    return translations[language as 'en' | 'ar'] || translations.ar;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
