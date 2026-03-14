import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const boards = await prisma.board.findMany({ include: { _count: { select: { posts: true } } } });
  const counts = boards.map((b) => ({ key: b.key, nameKo: b.nameKo, posts: b._count.posts }));
  console.log(counts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
