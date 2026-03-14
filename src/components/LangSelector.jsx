import React, { useState, useRef, useEffect } from 'react';

export default function LangSelector({ currentLang, onSelect, supportedLangs }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const flagMap = {
    ko: { emoji: '🇰🇷', twemoji: '1f1f0-1f1f7' },
    en: { emoji: '🇺🇸', twemoji: '1f1fa-1f1f8' },
    vi: { emoji: '🇻🇳', twemoji: '1f1fb-1f1f3' },
    zh: { emoji: '🇨🇳', twemoji: '1f1e8-1f1f3' },
    th: { emoji: '🇹🇭', twemoji: '1f1f9-1f1ed' },
    id: { emoji: '🇮🇩', twemoji: '1f1ee-1f1e9' },
    tl: { emoji: '🇵🇭', twemoji: '1f1f5-1f1ed' },
    ms: { emoji: '🇲🇾', twemoji: '1f1f2-1f1fe' },
    ne: { emoji: '🇳🇵', twemoji: '1f1f3-1f1f5' },
    km: { emoji: '🇰🇭', twemoji: '1f1f0-1f1ed' },
    my: { emoji: '🇲🇲', twemoji: '1f1f2-1f1f2' }
  };

  const current = flagMap[currentLang] || { emoji: '🌐', twemoji: '' };
  const codesToShow = Object.keys(supportedLangs || {});
  const twemojiBase = 'https://twemoji.maxcdn.com/v/latest/svg/';

  const renderFlag = (code, size = 18) => {
    const data = flagMap[code];
    if (!data) {
      return <span className="flag-emoji" aria-hidden="true">🌐</span>;
    }
    return (
      <img
        className="flag-img"
        src={`${twemojiBase}${data.twemoji}.svg`}
        alt={supportedLangs?.[code] || code.toUpperCase()}
        width={size}
        height={size}
        loading="lazy"
      />
    );
  };

  return (
    <div className="lang-selector" ref={ref}>
      <button
        type="button"
        className="ghost-button flag-button"
        onClick={() => setOpen(!open)}
        aria-label="Language selector"
      >
        {current.twemoji ? (
          <img
            className="flag-img"
            src={`${twemojiBase}${current.twemoji}.svg`}
            alt={supportedLangs?.[currentLang] || 'Language'}
            width={18}
            height={18}
            loading="lazy"
          />
        ) : (
          <span className="flag-emoji" aria-hidden="true">{current.emoji}</span>
        )}
      </button>
      {open && (
        <div className="lang-dropdown">
          {codesToShow.map((code) => (
            <button
              key={code}
              type="button"
              className={currentLang === code ? 'active' : ''}
              onClick={() => {
                onSelect(code);
                setOpen(false);
              }}
              aria-label={supportedLangs?.[code] || code.toUpperCase()}
            >
              {renderFlag(code)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
