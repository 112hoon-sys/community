import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const boards = await prisma.board.findMany({ orderBy: { key: 'asc' } });
  console.log(boards);
  const posts = await prisma.post.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { board: { select: { key: true, nameKo: true } } }
  });
  console.log(posts.map((p) => ({ id: p.id, title: p.title, boardKey: p.board?.key, boardName: p.board?.nameKo })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
