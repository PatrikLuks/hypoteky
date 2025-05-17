import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import cs from './locales/cs.json';
import en from './locales/en.json';

// Základní inicializace i18n s dvěma jazyky

i18n
  .use(initReactI18next)
  .init({
    resources: {
      cs: { translation: cs },
      en: { translation: en }
    },
    lng: 'cs',
    fallbackLng: 'cs',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
