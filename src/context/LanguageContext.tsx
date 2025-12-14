import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';

export type Language = 'en' | 'hu' | 'zh' | 'vi' | 'fr' | 'it' | 'es' | 'de' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tArray: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t: i18nT, i18n } = useTranslation();

  const language = (i18n.language as Language) || 'en';

  const setLanguage = useCallback((lang: Language) => {
    i18n.changeLanguage(lang);
  }, [i18n]);

  const t = useCallback((key: string): string => {
    const result = i18nT(key, { returnObjects: false });
    return typeof result === 'string' ? result : key;
  }, [i18nT]);

  const tArray = useCallback((key: string): string[] => {
    const result = i18nT(key, { returnObjects: true });
    if (Array.isArray(result)) {
      return result.filter((item): item is string => typeof item === 'string');
    }
    return [];
  }, [i18nT]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tArray }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
