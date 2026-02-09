// i18n/index.js — Lightweight i18n module (no external dependencies)
import ko from './ko.js';
import en from './en.js';

const locales = { ko, en };
let current = 'ko';

// Try to restore from localStorage (graceful fallback for Worker/Node)
try {
  const saved = localStorage.getItem('cohortiq-lang');
  if (saved && locales[saved]) current = saved;
} catch {
  // Worker or Node context — default to 'ko'
}

/**
 * Translate a key with optional interpolation params.
 * @param {string} key - Dot-separated key (e.g. 'status.analyzing')
 * @param {Object} [params] - Interpolation values (e.g. { count: 5 })
 * @returns {string}
 */
export function t(key, params) {
  let text = locales[current]?.[key] ?? locales.en[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replaceAll(`{{${k}}}`, v);
    });
  }
  return text;
}

/** @returns {'ko'|'en'} */
export function getLocale() {
  return current;
}

/**
 * Switch locale, persist to localStorage, and fire a custom event.
 * @param {'ko'|'en'} lang
 */
export function setLocale(lang) {
  if (!locales[lang]) return;
  current = lang;
  try {
    localStorage.setItem('cohortiq-lang', lang);
  } catch {
    // Worker or Node context
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('locale-change', { detail: lang }));
  }
}
