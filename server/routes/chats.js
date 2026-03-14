import express from 'express';
import { prisma } from '../lib/prisma.js';
import { sendPushToUser } from '../lib/push.js';

export const chatRoutes = express.Router();

async function getThreadRole(thread, userId) {
  if (thread.sellerId === userId) return 'seller';
  if (thread.buyerId === userId) return 'buyer';
  return null;
}

chatRoutes.post('/threads', async (req, res) => {
  try {
    const { postId, buyerId, buyerName, buyerPicture } = req.body || {};
    if (!postId || !buyerId) return res.status(400).json({ error: 'postId and buyerId required' });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: { select: { id: true, name: true, picture: true } } }
    });
    if (!post) return res.status(404).json({ error: 'post not found' });

    const sellerId = post.authorId;

    await prisma.user.upsert({
      where: { id: buyerId },
      create: {
        id: buyerId,
        email: buyerId + '@google',
        name: buyerName || '사용자',
        picture: buyerPicture || null
      },
      update: {
        name: buyerName || undefined,
        picture: buyerPicture || undefined
      }
    });

    if (sellerId) {
      await prisma.user.upsert({
        where: { id: sellerId },
        create: {
          id: sellerId,
          email: sellerId + '@google',
          name: post.author?.name || '작성자',
          picture: post.author?.picture || null
        },
        update: {
          name: post.author?.name || undefined,
          picture: post.author?.picture || undefined
        }
      });
    }

    const existing = await prisma.chatThread.findUnique({
      where: { postId_buyerId: { postId, buyerId } }
    });

    if (existing) return res.json(existing);

    const thread = await prisma.chatThread.create({
      data: { postId, buyerId, sellerId }
    });

    return res.json(thread);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed to create thread' });
  }
});

chatRoutes.get('/threads', async (req, res) => {
  try {
    const { postId, sellerId, buyerId } = req.query;
    if (!postId) return res.status(400).json({ error: 'postId required' });

    if (sellerId) {
      const threads = await prisma.chatThread.findMany({
        where: { postId, sellerId },
        include: {
          buyer: { select: { id: true, name: true, picture: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { updatedAt: 'desc' }
      });

      const mapped = threads.map((t) => {
        const last = t.messages[0];
        return {
          ...t,
          lastMessage: last?.content || '',
          lastMessageAt: last?.createdAt || t.lastMessageAt,
          unreadCount: t.messages.length ? 0 : 0
        };
      });

      const withUnread = await Promise.all(
        mapped.map(async (t) => {
          const count = await prisma.chatMessage.count({
            where: {
              threadId: t.id,
              senderId: { not: sellerId },
              readBySeller: false
            }
          });
          return { ...t, unreadCount: count };
        })
      );

      return res.json(withUnread);
    }

    if (buyerId) {
      const thread = await prisma.chatThread.findUnique({
        where: { postId_buyerId: { postId, buyerId } },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
      });
      return res.json(thread ? [thread] : []);
    }

    return res.status(400).json({ error: 'sellerId or buyerId required' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed to fetch threads' });
  }
});

chatRoutes.get('/threads/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { threadId: id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, picture: true } } }
    });
    return res.json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed to fetch messages' });
  }
});

chatRoutes.post('/threads/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, content, senderName, senderPicture } = req.body || {};
    if (!senderId || !content?.trim()) return res.status(400).json({ error: 'senderId and content required' });

    const thread = await prisma.chatThread.findUnique({ where: { id } });
    if (!thread) return res.status(404).json({ error: 'thread not found' });

    const role = await getThreadRole(thread, senderId);
    if (!role) return res.status(403).json({ error: 'not a participant' });

    const message = await prisma.chatMessage.create({
      data: {
        threadId: id,
        senderId,
        content: content.trim(),
        readByBuyer: role === 'buyer',
        readBySeller: role === 'seller'
      }
    });

    await prisma.chatThread.update({
      where: { id },
      data: { lastMessageAt: message.createdAt }
    });

    if (senderName || senderPicture) {
      try {
        await prisma.user.upsert({
          where: { id: senderId },
          create: { id: senderId, email: senderId + '@google', name: senderName, picture: senderPicture },
          update: { name: senderName, picture: senderPicture }
        });
      } catch (e) {
        console.error('[Chats] upsert sender', e);
      }
    }

    const receiverId = role === 'buyer' ? thread.sellerId : thread.buyerId;
    if (receiverId && receiverId !== senderId) {
      try {
        await prisma.notification.create({
          data: {
            userId: receiverId,
            type: 'chat',
            postId: thread.postId,
            actorId: senderId,
            actorName: senderName
          }
        });
        const actorLabel = senderName || '누군가';
        await sendPushToUser(receiverId, {
          title: '새 메시지',
          body: `${actorLabel}님이 메시지를 보냈어요.`,
          url: `/post/${thread.postId}`,
          type: 'chat'
        });
      } catch (e) {
        console.error('[Chats] create notification', e);
      }
    }

    return res.json(message);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed to send message' });
  }
});

chatRoutes.patch('/threads/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const thread = await prisma.chatThread.findUnique({ where: { id } });
    if (!thread) return res.status(404).json({ error: 'thread not found' });

    const role = await getThreadRole(thread, userId);
    if (!role) return res.status(403).json({ error: 'not a participant' });

    const data = role === 'seller' ? { readBySeller: true } : { readByBuyer: true };

    await prisma.chatMessage.updateMany({
      where: {
        threadId: id,
        senderId: { not: userId }
      },
      data
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed to mark read' });
  }
});

chatRoutes.get('/unread-count', async (req, res) => {
  try {
    const { userId, postId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [{ sellerId: userId }, { buyerId: userId }],
        ...(postId ? { postId } : {})
      }
    });

    let total = 0;

    for (const t of threads) {
      const isSeller = t.sellerId === userId;
      const count = await prisma.chatMessage.count({
        where: {
          threadId: t.id,
          senderId: { not: userId },
          ...(isSeller ? { readBySeller: false } : { readByBuyer: false })
        }
      });
      total += count;
    }

    return res.json({ count: total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed to get unread count' });
  }
});
