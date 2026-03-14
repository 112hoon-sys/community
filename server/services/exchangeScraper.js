/**
 * SBI 코스머니(SBICosmoney) 환율
 * 지원 14개국: 베트남, 중국, 필리핀, 네팔, 캄보디아, 인도네시아, 미국, 캐나다, 호주, 영국, 싱가포르, 말레이시아, 태국, 미얀마
 * 실제 SBI 페이지 스크래핑 전까지 ExchangeRate-API로 대체
 */

import * as cheerio from 'cheerio';

const SBICOSMONEY_URL = 'https://www.sbicosmoney.com/?lang=ko';

const SBI_COUNTRIES = [
  { country: 'Vietnam', countryKo: '베트남', unit: 'VND', flag: '🇻🇳' },
  { country: 'China', countryKo: '중국', unit: 'CNY', flag: '🇨🇳' },
  { country: 'Philippines', countryKo: '필리핀', unit: 'PHP', flag: '🇵🇭' },
  { country: 'Nepal', countryKo: '네팔', unit: 'NPR', flag: '🇳🇵' },
  { country: 'Cambodia', countryKo: '캄보디아', unit: 'USD', flag: '🇰🇭' },
  { country: 'Indonesia', countryKo: '인도네시아', unit: 'IDR', flag: '🇮🇩' },
  { country: 'USA', countryKo: '미국', unit: 'USD', flag: '🇺🇸' },
  { country: 'Canada', countryKo: '캐나다', unit: 'CAD', flag: '🇨🇦' },
  { country: 'Australia', countryKo: '호주', unit: 'AUD', flag: '🇦🇺' },
  { country: 'UK', countryKo: '영국', unit: 'GBP', flag: '🇬🇧' },
  { country: 'Singapore', countryKo: '싱가포르', unit: 'SGD', flag: '🇸🇬' },
  { country: 'Malaysia', countryKo: '말레이시아', unit: 'MYR', flag: '🇲🇾' },
  { country: 'Thailand', countryKo: '태국', unit: 'THB', flag: '🇹🇭' },
  { country: 'Myanmar', countryKo: '미얀마', unit: 'MMK', flag: '🇲🇲' }
];

let cachedRates = null;
let cachedAt = null;
const CACHE_MS = 10 * 60 * 1000; // 10분

async function fetchFromSBI() {
  try {
    const res = await fetch(SBICOSMONEY_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const rates = [];
    // SBI 사이트 구조에 맞춰 셀렉터 추가 필요. 현재는 빈 배열 반환
    return rates;
  } catch (e) {
    return [];
  }
}

async function fetchFromExchangeRateAPI() {
  const units = [...new Set(SBI_COUNTRIES.map((c) => c.unit))].join(',');
  const res = await fetch(`https://open.er-api.com/v6/latest/KRW?symbols=${units}`);
  const data = await res.json();
  if (data?.result !== 'success' || !data?.rates) return null;
  return data.rates;
}

export async function getExchangeRates() {
  if (cachedRates && cachedAt && Date.now() - cachedAt < CACHE_MS) {
    return { ...cachedRates, cached: true };
  }

  let apiRates = await fetchFromExchangeRateAPI();
  if (!apiRates) {
    apiRates = {};
  }

  const rates = SBI_COUNTRIES.map((c) => ({
    ...c,
    rate: apiRates[c.unit] != null ? Number(apiRates[c.unit]) : null
  }));

  const result = {
    source: 'SBI Cosmoney (fallback: ExchangeRate-API)',
    updatedAt: new Date().toISOString(),
    rates,
    remittanceLink: SBICOSMONEY_URL
  };

  cachedRates = result;
  cachedAt = Date.now();
  return { ...result, cached: false };
}
