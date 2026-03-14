/**
 * Supported languages for UI
 */
export const SUPPORTED_LANGS = {
  ko: '한국어',
  en: 'English',
  vi: 'Tiếng Việt',
  zh: '中文',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
  tl: 'Filipino',
  ms: 'Bahasa Melayu',
  ne: 'नेपाली',
  km: 'ខ្មែរ',
  my: 'မြန်မာ'
};

const LANG_CODES = Object.keys(SUPPORTED_LANGS);

export function getDeviceLang() {
  if (typeof window === 'undefined') return 'ko';
  return (navigator.language || navigator.userLanguage || 'ko').split('-')[0].toLowerCase();
}

export function detectLang() {
  if (typeof window === 'undefined') return 'ko';
  const stored = localStorage.getItem('kconnect_lang');
  if (stored && LANG_CODES.includes(stored)) return stored;
  const device = getDeviceLang();
  return LANG_CODES.includes(device) ? device : 'ko';
}

export function isSupportedLang(code) {
  return LANG_CODES.includes(code?.split('-')[0]?.toLowerCase());
}

export function needsGoogleTranslate() {
  return !isSupportedLang(getDeviceLang());
}
