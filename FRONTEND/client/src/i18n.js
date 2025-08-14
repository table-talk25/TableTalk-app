import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Carichiamo solo l'italiano all'avvio per ridurre il bundle iniziale
import translationIT from './locales/it/translation.json';

const resources = {
  it: { translation: translationIT },
};

// Loader dinamico per le altre lingue (lazy-load on demand)
const dynamicLanguageLoaders = {
  en: () => import('./locales/en/translation.json'),
  fr: () => import('./locales/fr/translation.json'),
  de: () => import('./locales/de/translation.json'),
  es: () => import('./locales/es/translation.json'),
  ar: () => import('./locales/ar/translation.json'),
  zh: () => import('./locales/zh/translation.json'),
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'it',
    fallbackLng: 'it',
    interpolation: { escapeValue: false },
  });

// Quando cambia lingua, carica il pacchetto se non è già presente
i18n.on('languageChanged', async (lng) => {
  try {
    if (!i18n.hasResourceBundle(lng, 'translation') && dynamicLanguageLoaders[lng]) {
      const mod = await dynamicLanguageLoaders[lng]();
      i18n.addResourceBundle(lng, 'translation', mod.default, true, true);
    }
  } catch (err) {
    // In caso di errore, restiamo su fallback 'it'
    // console.warn('Errore caricamento lingua', lng, err);
  }
});

export default i18n;