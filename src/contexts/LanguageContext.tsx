import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import enTranslations from '../locales/en.json';
import urTranslations from '../locales/ur.json';

export type Locale = 'en' | 'ur';

interface LanguageContextType {
  locale: Locale;
  isRTL: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'shehri_locale';

type TranslationDictionary = Record<string, unknown>;

const translations: Record<Locale, TranslationDictionary> = {
  en: enTranslations as TranslationDictionary,
  ur: urTranslations as TranslationDictionary,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from localStorage or fallback to English
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ur' || saved === 'en') {
        return saved;
      }
    } catch {
      // Storage unavailable fallback
    }
    return 'en';
  });

  const isRTL = locale === 'ur';

  // Apply dir="rtl" and lang attributes on the document element whenever locale updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore storage errors
    }

    const html = document.documentElement;
    html.setAttribute('lang', locale);
    html.setAttribute('dir', isRTL ? 'rtl' : 'ltr');

    if (isRTL) {
      html.classList.add('locale-ur');
      document.body.classList.add('font-urdu-app');
    } else {
      html.classList.remove('locale-ur');
      document.body.classList.remove('font-urdu-app');
    }
  }, [locale, isRTL]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const toggleLocale = () => {
    setLocaleState((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  /**
   * Safe key-path lookup with parameter interpolation:
   * e.g. t('home.nearbyMissions') or t('home.pointsReward', { points: 50 })
   */
  const t = useMemo(() => {
    return (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      
      // Look in current locale dictionary
      let current: unknown = translations[locale];
      for (const k of keys) {
        if (current && typeof current === 'object' && k in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[k];
        } else {
          current = undefined;
          break;
        }
      }

      // Fallback to English dictionary if key not found in current locale
      if (current === undefined && locale !== 'en') {
        let fallback: unknown = translations.en;
        for (const k of keys) {
          if (fallback && typeof fallback === 'object' && k in (fallback as Record<string, unknown>)) {
            fallback = (fallback as Record<string, unknown>)[k];
          } else {
            fallback = undefined;
            break;
          }
        }
        current = fallback;
      }

      // If still not found, return the key itself
      if (current === undefined || typeof current !== 'string') {
        return path;
      }

      // Parameter interpolation {key}
      if (params) {
        let result = current;
        for (const [pKey, pVal] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
        }
        return result;
      }

      return current;
    };
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, isRTL, setLocale, toggleLocale, t }}>
      <div 
        dir={isRTL ? 'rtl' : 'ltr'} 
        className={isRTL ? 'font-urdu-app' : ''}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
