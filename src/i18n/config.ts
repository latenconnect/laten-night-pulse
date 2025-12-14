import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

const LANGUAGE_KEY = 'laten_language';

// Get saved language or detect from browser
const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'hu') return saved;
    
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('hu') ? 'hu' : 'en';
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translations.en },
      hu: { translation: translations.hu },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    returnNull: false,
    returnEmptyString: false,
  });

// Sync language changes to localStorage and html lang attribute
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_KEY, lng);
    document.documentElement.lang = lng;
  }
});

export default i18n;
