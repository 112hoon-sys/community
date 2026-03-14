import React, { createContext, useContext, useState, useEffect } from 'react';
import { SUPPORTED_LANGS, detectLang, isSupportedLang, needsGoogleTranslate } from '../config/i18n';
import { getTranslation } from '../locales/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('ko');
  const [useGoogleTranslate, setUseGoogleTranslate] = useState(false);

  useEffect(() => {
    const detected = detectLang();
    setLang(detected);
    setUseGoogleTranslate(needsGoogleTranslate());
  }, []);

  const setLanguage = (code) => {
    const next = code?.split('-')[0]?.toLowerCase();
    if (next) {
      setLang(next);
      localStorage.setItem('kconnect_lang', next);
      setUseGoogleTranslate(!(next in SUPPORTED_LANGS));
    }
  };

  const t = getTranslation(lang);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang: setLanguage,
        t,
        supportedLangs: SUPPORTED_LANGS,
        useGoogleTranslate,
        isSupported: !useGoogleTranslate
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
