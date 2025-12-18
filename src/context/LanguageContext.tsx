import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';

export type Language = 'en' | 'hu' | 'zh' | 'vi' | 'fr' | 'it' | 'es' | 'de' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tArray: (key: string) => string[];
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t: i18nT, i18n: i18nInstance, ready } = useTranslation();
  const [isReady, setIsReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (i18n.isInitialized) {
      setIsReady(true);
    } else {
      const handleInit = () => setIsReady(true);
      i18n.on('initialized', handleInit);
      return () => {
        i18n.off('initialized', handleInit);
      };
    }
  }, []);

  const language = (i18nInstance.language as Language) || 'en';

  const setLanguage = useCallback((lang: Language) => {
    i18nInstance.changeLanguage(lang);
  }, [i18nInstance]);

  const t = useCallback((key: string): string => {
    if (!isReady) return key;
    const result = i18nT(key, { returnObjects: false });
    return typeof result === 'string' ? result : key;
  }, [i18nT, isReady]);

  const tArray = useCallback((key: string): string[] => {
    if (!isReady) return [];
    const result = i18nT(key, { returnObjects: true });
    if (Array.isArray(result)) {
      return result.filter((item): item is string => typeof item === 'string');
    }
    return [];
  }, [i18nT, isReady]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tArray, isReady }}>
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
