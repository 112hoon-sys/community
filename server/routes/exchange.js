import { Router } from 'express';
import { getExchangeRates } from '../services/exchangeScraper.js';

export const exchangeRoutes = Router();

exchangeRoutes.get('/rates', async (req, res) => {
  try {
    const rates = await getExchangeRates();
    res.json(rates);
  } catch (error) {
    console.error('[Exchange] Error:', error.message);
    res.status(500).json({
      error: '환율 정보를 불러오지 못했습니다.',
      fallback: true
    });
  }
});
