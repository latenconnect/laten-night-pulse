import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
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
  const [isReady, setIsReady] = useState(i18n.isInitialized);
  const [language, setLanguageState] = useState<Language>((i18n.language as Language) || 'en');

  useEffect(() => {
    const checkReady = () => {
      if (i18n.isInitialized) {
        setIsReady(true);
        setLanguageState((i18n.language as Language) || 'en');
      }
    };
    
    // Check immediately
    checkReady();
    
    // Listen for initialization
    const handleInit = () => {
      setIsReady(true);
      setLanguageState((i18n.language as Language) || 'en');
    };
    
    const handleLanguageChange = (lng: string) => {
      setLanguageState((lng as Language) || 'en');
    };
    
    i18n.on('initialized', handleInit);
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('initialized', handleInit);
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    i18n.changeLanguage(lang);
  }, []);

  const t = useCallback((key: string): string => {
    if (!isReady || !i18n.isInitialized) return key;
    try {
      const result = i18n.t(key, { returnObjects: false });
      return typeof result === 'string' ? result : key;
    } catch {
      return key;
    }
  }, [isReady]);

  const tArray = useCallback((key: string): string[] => {
    if (!isReady || !i18n.isInitialized) return [];
    try {
      const result = i18n.t(key, { returnObjects: true });
      if (Array.isArray(result)) {
        return result.filter((item): item is string => typeof item === 'string');
      }
      return [];
    } catch {
      return [];
    }
  }, [isReady]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tArray, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Default fallback for when context is not yet ready
const defaultContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
  tArray: () => [],
  isReady: false,
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  // Return default context instead of throwing to handle initialization race conditions
  return context || defaultContext;
};
