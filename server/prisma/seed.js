import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

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

const SAMPLE_POSTS = {
  life: [
    { title: '정착 체크리스트', content: '은행 계좌, 핸드폰 개통, 교통카드 정리.' },
    { title: '건강보험 문의', content: '국민건강보험 가입과 혜택이 궁금해요.' }
  ],
  visa: [
    { title: '비자 연장 서류 팁', content: '비자 연장 시 필요한 서류 정리 공유합니다.' },
    { title: '체류기간 변경 방법', content: '체류기간 변경 절차 및 준비물 공유.' }
  ],
  region: [
    { title: '안산 병원 추천', content: '외국인 진료 잘 보는 병원 추천 부탁드립니다.' },
    { title: '수원 맛집 추천', content: '가성비 좋은 맛집 공유합니다.' }
  ],
  nationality: [
    { title: '베트남 커뮤니티 모임', content: '이번 주말 모임 같이 하실 분?' }
  ],
  job: [
    { title: '카페 주말 알바 구해요', content: '주말 오전 카페 알바 구인합니다.' },
    { title: '물류 야간 포장', content: '야간 포장 알바, 로테이션 근무.' }
  ],
  market: [
    { title: '전자레인지 판매', content: '중고 전자레인지 판매합니다. 직거래.' },
    { title: '자전거 팝니다', content: '헬멧 포함, 상태 좋음.' }
  ],
  remittance: [
    { title: '송금 수수료 비교', content: '서비스별 송금 수수료 비교 공유.' }
  ]
};

async function main() {
  for (const b of BOARDS) {
    await prisma.board.upsert({
      where: { key: b.key },
      create: b,
      update: b
    });
  }
  console.log('Boards seeded');

  const author = await prisma.user.upsert({
    where: { email: 'seed@kconnect.kr' },
    create: {
      email: 'seed@kconnect.kr',
      name: 'K-Connect 샘플',
      picture: null
    },
    update: {}
  });

  await prisma.chatMessage.deleteMany({});
  await prisma.chatThread.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({ where: { authorId: author.id } });

  const boards = await prisma.board.findMany();
  for (const board of boards) {
    const posts = SAMPLE_POSTS[board.key];
    if (!posts) continue;
    for (const p of posts) {
      await prisma.post.create({
        data: {
          title: p.title,
          content: p.content,
          boardId: board.id,
          authorId: author.id
        }
      });
    }
    console.log(`${board.nameEn} seeded (${posts.length})`);
  }
  console.log('Sample posts seeded');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
