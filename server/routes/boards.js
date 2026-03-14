import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const boardRoutes = Router();

boardRoutes.get('/', async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { posts: true } }
      }
    });
    res.json(boards);
  } catch (error) {
    console.error('[Boards]', error);
    res.status(500).json({ error: '게시판 목록 조회 실패' });
  }
});

boardRoutes.get('/:key', async (req, res) => {
  try {
    const board = await prisma.board.findUnique({
      where: { key: req.params.key }
    });
    if (!board) return res.status(404).json({ error: '게시판 없음' });
    res.json(board);
  } catch (error) {
    console.error('[Boards]', error);
    res.status(500).json({ error: '게시판 조회 실패' });
  }
});
