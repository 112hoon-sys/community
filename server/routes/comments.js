import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendPushToUser } from '../lib/push.js';

export const commentRoutes = Router({ mergeParams: true });

commentRoutes.get('/', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.postId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true, picture: true } } }
    });
    res.json(comments);
  } catch (error) {
    console.error('[Comments]', error);
    res.status(500).json({ error: '?볤? 議고쉶 ?ㅽ뙣' });
  }
});

commentRoutes.post('/', async (req, res) => {
  try {
    const postId = req.params.postId;
    const { content, authorId, authorName, authorPicture } = req.body;
    if (!content || !authorId) return res.status(400).json({ error: '?댁슜, ?묒꽦???꾩닔' });
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: '寃뚯떆湲 ?놁쓬' });
    const user = await prisma.user.upsert({
      where: { id: authorId },
      create: { id: authorId, email: authorId + '@google', name: authorName, picture: authorPicture },
      update: { name: authorName, picture: authorPicture }
    });
    const comment = await prisma.comment.create({
      data: { content, postId: post.id, authorId: user.id },
      include: { author: { select: { id: true, name: true, picture: true } } }
    });
    if (post.authorId !== user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'comment',
            postId: post.id,
            actorId: user.id,
            actorName: authorName || user.name
          }
        });
        const actorLabel = authorName || user.name || '누군가';
        await sendPushToUser(post.authorId, {
          title: '새 댓글',
          body: `${actorLabel}님이 댓글을 남겼어요.`,
          url: `/post/${post.id}`,
          type: 'comment'
        });
      } catch (e) {
        console.error('[Comments] create notification', e);
      }
    }
    res.status(201).json(comment);
  } catch (error) {
    console.error('[Comments]', error);
    res.status(500).json({ error: '?볤? ?묒꽦 ?ㅽ뙣' });
  }
});

commentRoutes.patch('/:commentId', async (req, res) => {
  try {
    const { content, authorId } = req.body;
    if (!content || !authorId) return res.status(400).json({ error: '?댁슜, ?묒꽦???꾩닔' });
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.commentId }
    });
    if (!comment) return res.status(404).json({ error: '?볤? ?놁쓬' });
    if (comment.postId !== req.params.postId) {
      return res.status(400).json({ error: '?볤???寃뚯떆湲怨??쇱튂?섏? ?딆뒿?덈떎.' });
    }
    if (comment.authorId !== authorId) {
      return res.status(403).json({ error: '?섏젙 沅뚰븳???놁뒿?덈떎.' });
    }
    const updated = await prisma.comment.update({
      where: { id: comment.id },
      data: { content },
      include: { author: { select: { id: true, name: true, picture: true } } }
    });
    res.json(updated);
  } catch (error) {
    console.error('[Comments]', error);
    res.status(500).json({ error: '?볤? ?섏젙 ?ㅽ뙣' });
  }
});

commentRoutes.delete('/:commentId', async (req, res) => {
  try {
    const { authorId } = req.body;
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.commentId }
    });
    if (!comment) return res.status(404).json({ error: '?볤? ?놁쓬' });
    if (comment.postId !== req.params.postId) {
      return res.status(400).json({ error: '?볤???寃뚯떆湲怨??쇱튂?섏? ?딆뒿?덈떎.' });
    }
    if (!authorId || comment.authorId !== authorId) {
      return res.status(403).json({ error: '??젣 沅뚰븳???놁뒿?덈떎.' });
    }
    await prisma.comment.delete({ where: { id: comment.id } });
    res.json({ ok: true });
  } catch (error) {
    console.error('[Comments]', error);
    res.status(500).json({ error: '?볤? ??젣 ?ㅽ뙣' });
  }
});


