import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BOARDS = [
  { key: 'life', nameKo: '생활정보', nameEn: 'Life Info', description: '정착, 생활 팁, 제도 안내' },
  { key: 'visa', nameKo: '비자/행정', nameEn: 'Visa & Legal', description: '비자, 체류, 서류 가이드' },
  { key: 'region', nameKo: '지역정보', nameEn: 'Regional Info', description: '맛집, 병원, 생활권 정보' },
  { key: 'nationality', nameKo: '국적/언어 커뮤니티', nameEn: 'Community', description: '국적/언어별 모임과 소통' },
  { key: 'job', nameKo: '구인구직', nameEn: 'Jobs & Study', description: '채용, 아르바이트, 학업' },
  { key: 'market', nameKo: '중고마켓', nameEn: 'Marketplace', description: '중고거래, 나눔, 생활용품' },
  { key: 'remittance', nameKo: '송금/환율', nameEn: 'Remittance', description: '환율, 해외송금, 금융 정보' }
];

async function main() {
  for (const b of BOARDS) {
    await prisma.board.upsert({
      where: { key: b.key },
      create: b,
      update: b
    });
  }
  console.log('Boards ensured');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
