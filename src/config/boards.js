/**
 * 게시판 카테고리 정의
 */
export const BOARD_CATEGORIES = {
  LIFE: 'life',
  VISA: 'visa',
  REGION: 'region',
  NATIONALITY: 'nationality',
  JOB: 'job',
  MARKET: 'market',
  REMITTANCE: 'remittance'
};

export const BOARDS = [
  {
    key: BOARD_CATEGORIES.LIFE,
    nameKo: '생활정보',
    nameEn: 'Life Info',
    desc: '정착, 생활 팁, 제도 안내'
  },
  {
    key: BOARD_CATEGORIES.VISA,
    nameKo: '비자/행정',
    nameEn: 'Visa & Legal',
    desc: '비자, 체류, 서류 가이드'
  },
  {
    key: BOARD_CATEGORIES.REGION,
    nameKo: '지역정보',
    nameEn: 'Regional Info',
    desc: '맛집, 병원, 생활권 정보'
  },
  {
    key: BOARD_CATEGORIES.NATIONALITY,
    nameKo: '국적/언어 커뮤니티',
    nameEn: 'Community',
    desc: '국적/언어별 모임과 소통'
  },
  {
    key: BOARD_CATEGORIES.JOB,
    nameKo: '구인구직',
    nameEn: 'Jobs & Study',
    desc: '채용, 아르바이트, 학업'
  },
  {
    key: BOARD_CATEGORIES.MARKET,
    nameKo: '중고마켓',
    nameEn: 'Marketplace',
    desc: '중고거래, 나눔, 생활용품'
  },
  {
    key: BOARD_CATEGORIES.REMITTANCE,
    nameKo: '송금/환율',
    nameEn: 'Remittance',
    desc: '환율, 해외송금, 금융 정보'
  }
];
