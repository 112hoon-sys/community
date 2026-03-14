import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateText } from '../lib/api';

const CACHE = new Map();
const MAX_LEN = 5000;
const cacheKey = (text, target) => `${target}:${text?.slice?.(0, 200) || ''}`;

export default function TranslatableText({ text, tag: Tag = 'span', className, ...rest }) {
  const { lang, t } = useLanguage();
  const [translated, setTranslated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!text || !text.trim()) return;
    if (lang === 'ko') return;
    if (text.length > MAX_LEN) return;
    const key = cacheKey(text, lang);
    if (CACHE.has(key)) {
      setTranslated(CACHE.get(key));
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const t = await translateText(text.trim(), lang);
      CACHE.set(key, t);
      setTranslated(t);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [text, lang]);

  useEffect(() => {
    setTranslated(null);
    setError(false);
    setShowOriginal(false);
    load();
  }, [load]);

  if (!text) return null;
  const display = showOriginal || !translated || error ? text : translated;
  const hasTranslation = !!translated && !error && translated !== text;

  return (
    <Tag className={className} {...rest}>
      {display}
      {loading && <span style={{ color: '#9ca3af', marginLeft: 4 }}>…</span>}
      {hasTranslation && (
        <button
          type="button"
          onClick={() => setShowOriginal((v) => !v)}
          style={{
            marginLeft: 6,
            fontSize: 11,
            color: '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {showOriginal ? (t.showTranslation || '번역') : (t.showOriginal || '원문')}
        </button>
      )}
    </Tag>
  );
}
