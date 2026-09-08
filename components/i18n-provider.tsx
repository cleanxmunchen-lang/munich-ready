'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '@/locales/en';
import de from '@/locales/de';

type Lang = 'en' | 'de';
const LOCALE_KEY = 'munich-ready-language';
const messages: Record<Lang, any> = { en, de };

function getPreferredLang(): Lang {
  try {
    if (typeof window === 'undefined') return 'en';
    const stored = localStorage.getItem(LOCALE_KEY) as Lang | null;
    if (stored && (stored === 'en' || stored === 'de')) return stored;
    const nav = (navigator && (navigator.language || (navigator as any).userLanguage)) || 'en';
    if (typeof nav === 'string' && nav.startsWith('de')) return 'de';
    return 'en';
  } catch (e) {
    return 'en';
  }
}

const I18nContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string, fallback?: string) => string;
} | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  useEffect(() => {
    const initial = getPreferredLang();
    setLangState(initial);
    try {
      document.documentElement.lang = initial;
    } catch (e) {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
      document.documentElement.lang = l;
    } catch (e) {}
  };

  const t = useMemo(() => {
    return (path: string, fallback = ''): string => {
      const parts = path.split('.');
      let obj: any = messages[lang] || messages.en;
      for (const p of parts) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, p)) obj = obj[p];
        else {
          // fallback to english
          const eobj: any = messages['en'];
          let ecur: any = eobj;
          for (const pp of parts) {
            if (ecur && Object.prototype.hasOwnProperty.call(ecur, pp)) ecur = ecur[pp];
            else {
              return fallback || path;
            }
          }
          return typeof ecur === 'string' ? ecur : fallback || path;
        }
      }
      return typeof obj === 'string' ? obj : fallback || path;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
