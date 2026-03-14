import React, { useEffect } from 'react';
import { getDeviceLang, isSupportedLang } from '../config/i18n';

/**
 * Reddit처럼 디바이스 언어가 지원 목록에 없으면
 * 구글 번역 위젯으로 페이지 내 자동 번역
 */
export default function AutoTranslate({ enabled }) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (document.getElementById('google-translate-auto')) return;

    const deviceLang = getDeviceLang();
    if (isSupportedLang(deviceLang)) return;

    const div = document.createElement('div');
    div.id = 'google-translate-auto';
    div.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;';
    document.body.appendChild(div);

    window.googleTranslateElementInit = () => {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'ko',
            includedLanguages: 'ko,en,vi,zh-CN,zh-TW,th,id,tl,ms,ne,km,my,fr,es,de,ja,ru,ar,pt,hi',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          },
          'google-translate-auto'
        );
        setTimeout(() => {
          const sel = document.querySelector('.goog-te-combo') || document.querySelector('#google_translate_auto select');
          if (sel) {
            const opts = Array.from(sel.options);
            const idx = opts.findIndex((o) => o.value === deviceLang || o.value?.startsWith?.(deviceLang));
            if (idx >= 0) {
              sel.selectedIndex = idx;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }, 800);
      } catch (e) {
        console.warn('[AutoTranslate]', e);
      }
    };

    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById('google-translate-auto');
      if (el) el.remove();
      const s = document.querySelector('script[src*="translate.google.com"]');
      if (s) s.remove();
    };
  }, [enabled]);

  return null;
}
