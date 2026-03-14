import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import AutoTranslate from './AutoTranslate';

export default function TranslateWrapper() {
  const { useGoogleTranslate } = useLanguage();
  return <AutoTranslate enabled={useGoogleTranslate} />;
}
