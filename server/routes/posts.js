import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const postRoutes = Router();

postRoutes.get('/', async (req, res) => {
  try {
    const { boardKey } = req.query;
    if (!boardKey) {
      const posts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          author: { select: { id: true, name: true, picture: true } },
          board: { select: { key: true, nameKo: true, nameEn: true } },
          _count: { select: { comments: true, likes: true } }
        }
      });
      return res.json(posts);
    }
    const board = await prisma.board.findUnique({ where: { key: boardKey } });
    if (!board) return res.status(404).json({ error: '게시판 없음' });
    const posts = await prisma.post.findMany({
      where: { boardId: board.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, picture: true } },
        board: { select: { key: true, nameKo: true, nameEn: true } },
        _count: { select: { comments: true, likes: true } }
      }
    });
    res.json(posts);
  } catch (error) {
    console.error('[Posts]', error);
    res.status(500).json({ error: '게시글 목록 조회 실패' });
  }
});

postRoutes.get('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true, picture: true } },
        board: { select: { key: true, nameKo: true, nameEn: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, picture: true } } }
        },
        _count: { select: { likes: true } }
      }
    });
    if (!post) return res.status(404).json({ error: '게시글 없음' });
    res.json(post);
  } catch (error) {
    console.error('[Posts]', error);
    res.status(500).json({ error: '게시글 조회 실패' });
  }
});

postRoutes.post('/', async (req, res) => {
  try {
    const { title, content, boardKey, authorId, authorName, authorPicture, imageUrl } = req.body;
    if (!title || !content || !boardKey || !authorId) {
      return res.status(400).json({ error: '제목, 내용, 게시판, 작성자 필수' });
    }
    const board = await prisma.board.findUnique({ where: { key: boardKey } });
    if (!board) return res.status(404).json({ error: '게시판 없음' });
    const user = await prisma.user.upsert({
      where: { id: authorId },
      create: { id: authorId, email: authorId + '@google', name: authorName, picture: authorPicture },
      update: { name: authorName, picture: authorPicture }
    });
    const post = await prisma.post.create({
      data: {
        title,
        content,
        imageUrl: imageUrl || null,
        boardId: board.id,
        authorId: user.id
      },
      include: {
        author: { select: { id: true, name: true, picture: true } },
        board: { select: { key: true, nameKo: true, nameEn: true } },
        _count: { select: { comments: true, likes: true } }
      }
    });
    res.status(201).json(post);
  } catch (error) {
    console.error('[Posts]', error);
    res.status(500).json({ error: '게시글 작성 실패' });
  }
});

postRoutes.patch('/:id', async (req, res) => {
  try {
    const { title, content, imageUrl, authorId } = req.body;
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: '게시글 없음' });
    if (!authorId || post.authorId !== authorId) {
      return res.status(403).json({ error: '수정 권한이 없습니다.' });
    }
    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        title: title ?? post.title,
        content: content ?? post.content,
        imageUrl: imageUrl !== undefined ? imageUrl : post.imageUrl
      },
      include: {
        author: { select: { id: true, name: true, picture: true } },
        board: { select: { key: true, nameKo: true, nameEn: true } },
        _count: { select: { comments: true, likes: true } }
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('[Posts]', error);
    res.status(500).json({ error: '게시글 수정 실패' });
  }
});

postRoutes.delete('/:id', async (req, res) => {
  try {
    const { authorId } = req.body;
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: '게시글 없음' });
    if (!authorId || post.authorId !== authorId) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }
    await prisma.comment.deleteMany({ where: { postId: post.id } });
    await prisma.like.deleteMany({ where: { postId: post.id } });
    await prisma.post.delete({ where: { id: post.id } });
    res.json({ ok: true });
  } catch (error) {
    console.error('[Posts]', error);
    res.status(500).json({ error: '게시글 삭제 실패' });
  }
});
