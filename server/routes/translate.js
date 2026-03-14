import { Router } from 'express';

const MAX_LEN = 5000;
const TIMEOUT_MS = 4000;
const DEEPL_URL = 'https://api-free.deepl.com/v2/translate';

export const translateRoutes = Router();

const langMap = { ko: 'KO', en: 'EN', vi: 'VI', zh: 'ZH', th: 'TH', id: 'ID' };

translateRoutes.post('/', async (req, res) => {
  try {
    const { text, target } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });

    const to = langMap[target] || 'EN';
    const trimmed = text.slice(0, MAX_LEN);

    const key = process.env.DEEPL_API_KEY || '';
    if (!key) {
      return res.json({ translated: trimmed, detected: null, fallback: true, reason: 'missing-key' });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(DEEPL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `DeepL-Auth-Key ${key}`
        },
        body: new URLSearchParams({
          text: trimmed,
          target_lang: to
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Translate] DeepL error', errText);
        return res.json({ translated: trimmed, detected: null, fallback: true, reason: 'api-error' });
      }

      const data = await response.json();
      const translated = data?.translations?.[0]?.text || trimmed;
      const detected = data?.translations?.[0]?.detected_source_language;
      return res.json({ translated, detected, fallback: translated === trimmed });
    } catch (innerErr) {
      console.warn('[Translate] DeepL fallback', innerErr?.message || innerErr);
      return res.json({ translated: trimmed, detected: null, fallback: true, reason: 'network' });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error('[Translate]', error);
    res.json({ translated: req.body?.text || '', detected: null, fallback: true });
  }
});
