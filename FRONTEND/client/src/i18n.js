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
    // 🌍 Configurazione pluralizzazione dinamica
    pluralSeparator: '_',
    keySeparator: '.',
    // Configurazione pluralizzazione per lingue supportate
    pluralRules: {
      // Italiano: 1, 2+, 0
      it: {
        numbers: [1, 2, 0],
        plurals: function(n) {
          if (n === 1) return 0;
          if (n >= 2 && n <= 19) return 1;
          return 2;
        }
      },
      // Inglese: 1, other
      en: {
        numbers: [1, 2],
        plurals: function(n) {
          return n === 1 ? 0 : 1;
        }
      },
      // Francese: 0, 1, other
      fr: {
        numbers: [0, 1, 2],
        plurals: function(n) {
          if (n === 0) return 0;
          if (n === 1) return 1;
          return 2;
        }
      },
      // Tedesco: 1, other
      de: {
        numbers: [1, 2],
        plurals: function(n) {
          return n === 1 ? 0 : 1;
        }
      },
      // Spagnolo: 1, other
      es: {
        numbers: [1, 2],
        plurals: function(n) {
          return n === 1 ? 0 : 1;
        }
      },
      // Arabo: 0, 1, 2, 3-10, 11+
      ar: {
        numbers: [0, 1, 2, 3, 4],
        plurals: function(n) {
          if (n === 0) return 0;
          if (n === 1) return 1;
          if (n === 2) return 2;
          if (n >= 3 && n <= 10) return 3;
          return 4;
        }
      },
      // Cinese: sempre singolare
      zh: {
        numbers: [1],
        plurals: function() {
          return 0;
        }
      }
    }
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