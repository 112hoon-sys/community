import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendPushToUser } from '../lib/push.js';

export const likeRoutes = Router({ mergeParams: true });

likeRoutes.get('/', async (req, res) => {
  try {
    const postId = req.params.postId;
    const count = await prisma.like.count({ where: { postId } });
    const { userId } = req.query;
    let liked = false;
    if (userId) {
      const like = await prisma.like.findUnique({
        where: { authorId_postId: { authorId: userId, postId } }
      });
      liked = !!like;
    }
    res.json({ count, liked });
  } catch (error) {
    console.error('[Likes]', error);
    res.status(500).json({ error: '醫뗭븘??議고쉶 ?ㅽ뙣' });
  }
});

likeRoutes.post('/', async (req, res) => {
  try {
    const { authorId, authorName, authorPicture } = req.body;
    if (!authorId) return res.status(400).json({ error: '?묒꽦???꾩닔' });
    const post = await prisma.post.findUnique({ where: { id: req.params.postId } });
    if (!post) return res.status(404).json({ error: '寃뚯떆湲 ?놁쓬' });
    const user = await prisma.user.upsert({
      where: { id: authorId },
      create: { id: authorId, email: authorId + '@google', name: authorName, picture: authorPicture },
      update: { name: authorName, picture: authorPicture }
    });
    const existing = await prisma.like.findUnique({
      where: { authorId_postId: { authorId: user.id, postId: post.id } }
    });
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      const count = await prisma.like.count({ where: { postId: post.id } });
      return res.json({ liked: false, count });
    }
    await prisma.like.create({
      data: { postId: post.id, authorId: user.id }
    });
    if (post.authorId !== user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'like',
            postId: post.id,
            actorId: user.id,
            actorName: authorName || user.name
          }
        });
        const actorLabel = authorName || user.name || '누군가';
        await sendPushToUser(post.authorId, {
          title: '새 좋아요',
          body: `${actorLabel}님이 좋아요를 눌렀어요.`,
          url: `/post/${post.id}`,
          type: 'like'
        });
      } catch (e) {
        console.error('[Likes] create notification', e);
      }
    }
    const count = await prisma.like.count({ where: { postId: post.id } });
    res.json({ liked: true, count });
  } catch (error) {
    console.error('[Likes]', error);
    res.status(500).json({ error: '醫뗭븘??泥섎━ ?ㅽ뙣' });
  }
});


