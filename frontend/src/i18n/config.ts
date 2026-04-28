import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import bn from '@/locales/bn.json';
import ar from '@/locales/ar.json';
import fr from '@/locales/fr.json';

const resources = {
  en: { translation: en },
  bn: { translation: bn },
  ar: { translation: ar },
  fr: { translation: fr },
};

// সংরক্ষিত ভাষা পড়ো
const savedLang = localStorage.getItem('lang') || 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;