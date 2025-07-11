import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const enTranslations = {
  translation: {
    login: 'Login',
    pos: 'POS',
    inventory: 'Inventory',
    loginPage: 'Login Page',
    posPage: 'Point of Sale',
    inventoryPage: 'Inventory Management',
    loginTitle: 'Login to your Account',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign In',
    loginFailed: 'Invalid username or password.',
    logout: 'Logout',
    // Add more translations as needed
  },
};

// Arabic translations
const arTranslations = {
  translation: {
    login: 'تسجيل الدخول',
    pos: 'نقطة البيع',
    inventory: 'إدارة المخزون',
    loginPage: 'صفحة تسجيل الدخول',
    posPage: 'نقطة البيع',
    inventoryPage: 'إدارة المخزون',
    loginTitle: 'تسجيل الدخول إلى حسابك',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    loginFailed: 'اسم المستخدم أو كلمة المرور غير صالحة.',
    logout: 'تسجيل الخروج',
    // Add more translations as needed
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    debug: true, // Enable debug mode for development
    fallbackLng: 'en', // Fallback language if detection fails
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    resources: {
      en: enTranslations,
      ar: arTranslations,
    },
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      // Caches a language choice in localStorage
      caches: ['localStorage'],
    }
  });

export default i18n;
