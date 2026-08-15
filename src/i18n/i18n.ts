import { type Language, translations } from './translations';

const STORAGE_KEY = 'crazy_go_language';

let currentLanguage: Language = 'es';
const listeners: Array<(lang: Language) => void> = [];

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  if (lang !== 'es' && lang !== 'en') {
    lang = 'es';
  }
  currentLanguage = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    console.warn('Could not save language to localStorage', e);
  }

  // Update HTML lang attribute
  document.documentElement.lang = lang;

  // Update all DOM elements with data-i18n attributes
  applyTranslationsToDOM();

  // Notify listeners
  for (const listener of listeners) {
    try {
      listener(lang);
    } catch (e) {
      console.error('Error in language change listener', e);
    }
  }
}

export function onLanguageChange(listener: (lang: Language) => void): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = translations[currentLanguage] || translations.es;
  let text = dict[key];

  if (!text) {
    // Fallback to Spanish or English if key not found
    text = (translations.es && translations.es[key]) || (translations.en && translations.en[key]) || key;
  }

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }

  return text;
}

export function applyTranslationsToDOM(): void {
  // Elements with data-i18n
  const textElements = document.querySelectorAll<HTMLElement>('[data-i18n]');
  textElements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // Elements with data-i18n-html
  const htmlElements = document.querySelectorAll<HTMLElement>('[data-i18n-html]');
  htmlElements.forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (key) {
      el.innerHTML = t(key);
    }
  });

  // Elements with data-i18n-title
  const titleElements = document.querySelectorAll<HTMLElement>('[data-i18n-title]');
  titleElements.forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.setAttribute('title', t(key));
    }
  });

  // Elements with data-i18n-placeholder
  const placeholderElements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]');
  placeholderElements.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.placeholder = t(key);
    }
  });
}

export function initI18n(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    if (saved === 'es' || saved === 'en') {
      currentLanguage = saved;
    } else {
      // Check browser language
      const navLang = navigator.language.slice(0, 2).toLowerCase();
      currentLanguage = navLang === 'es' ? 'es' : 'en';
    }
  } catch (e) {
    currentLanguage = 'es';
  }

  document.documentElement.lang = currentLanguage;
  applyTranslationsToDOM();
}
