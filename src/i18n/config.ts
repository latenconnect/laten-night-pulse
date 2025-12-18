import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

const LANGUAGE_KEY = 'laten_language';

const SUPPORTED_LANGUAGES = ['en', 'hu', 'zh', 'vi', 'fr', 'it', 'es', 'de', 'ko'];

// Get saved language or detect from browser
const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
    
    const browserLang = navigator.language.toLowerCase();
    // Check for exact match first
    if (SUPPORTED_LANGUAGES.includes(browserLang)) return browserLang;
    // Check for language prefix match
    const langPrefix = browserLang.split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(langPrefix)) return langPrefix;
    
    return 'en';
  }
  return 'en';
};

// Build resources from translations object dynamically
const resources: Record<string, { translation: Record<string, unknown> }> = {};
Object.keys(translations).forEach((lang) => {
  resources[lang] = { translation: (translations as Record<string, Record<string, unknown>>)[lang] };
});

// Initialize i18n synchronously
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: getInitialLanguage(),
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes
      },
      returnNull: false,
      returnEmptyString: false,
      react: {
        useSuspense: false, // Disable suspense to prevent async issues
      },
    });
}

// Sync language changes to localStorage and html lang attribute
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_KEY, lng);
    document.documentElement.lang = lng;
  }
});

export default i18n;
