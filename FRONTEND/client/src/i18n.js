import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importiamo tutte le nostre traduzioni
import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';
import translationFR from './locales/fr/translation.json';
import translationDE from './locales/de/translation.json';
import translationES from './locales/es/translation.json';
import translationAR from './locales/ar/translation.json';
import translationZH from './locales/zh/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  it: {
    translation: translationIT,
  },
  fr: {
    translation: translationFR,
  },
  de: {
    translation: translationDE,
  },
  es: {
    translation: translationES,
  },
  ar: {
    translation: translationAR,
  },
  zh: {
    translation: translationZH,
  },
};

i18n
  .use(initReactI18next) // Passa i18n a react-i18next
  .init({
    resources,
    lng: 'it', // Lingua predefinita
    fallbackLng: 'it', // Lingua da usare se mancano traduzioni
    interpolation: {
      escapeValue: false, // Non necessario per React
    },
  });

export default i18n;