import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const visaBoard = await prisma.board.findUnique({ where: { key: 'visa' } });
  const lifeBoard = await prisma.board.findUnique({ where: { key: 'life' } });
  if (!visaBoard || !lifeBoard) {
    console.log('visa or life board missing');
    return;
  }

  const candidates = await prisma.post.findMany({
    where: {
      boardId: lifeBoard.id,
      OR: [
        { title: { contains: '비자' } },
        { content: { contains: '비자' } }
      ]
    }
  });

  if (!candidates.length) {
    console.log('no visa candidates found');
    return;
  }

  const ids = candidates.map((p) => p.id);
  const result = await prisma.post.updateMany({
    where: { id: { in: ids } },
    data: { boardId: visaBoard.id }
  });

  console.log(`moved ${result.count} posts to visa board`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
