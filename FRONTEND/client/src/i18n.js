import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Qui importeremo le nostre traduzioni
import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  it: {
    translation: translationIT,
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