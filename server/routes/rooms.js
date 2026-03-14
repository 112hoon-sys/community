import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const roomRoutes = Router();

const COMMUNITY_ROOMS = [
  { key: 'vn', nameKo: '베트남', nameEn: 'Vietnam', description: '베트남 커뮤니티 오픈채팅' },
  { key: 'cn', nameKo: '중국', nameEn: 'China', description: '중국 커뮤니티 오픈채팅' },
  { key: 'th', nameKo: '태국', nameEn: 'Thailand', description: '태국 커뮤니티 오픈채팅' },
  { key: 'id', nameKo: '인도네시아', nameEn: 'Indonesia', description: '인도네시아 커뮤니티 오픈채팅' },
  { key: 'ph', nameKo: '필리핀', nameEn: 'Philippines', description: '필리핀 커뮤니티 오픈채팅' },
  { key: 'my', nameKo: '말레이시아', nameEn: 'Malaysia', description: '말레이시아 커뮤니티 오픈채팅' },
  { key: 'np', nameKo: '네팔', nameEn: 'Nepal', description: '네팔 커뮤니티 오픈채팅' },
  { key: 'kh', nameKo: '캄보디아', nameEn: 'Cambodia', description: '캄보디아 커뮤니티 오픈채팅' },
  { key: 'mm', nameKo: '미얀마', nameEn: 'Myanmar', description: '미얀마 커뮤니티 오픈채팅' },
  { key: 'en', nameKo: '영어권', nameEn: 'English', description: '영어권 커뮤니티 오픈채팅' },
  { key: 'other', nameKo: '기타국가', nameEn: 'Others', description: '기타 국가 커뮤니티 오픈채팅' }
];

async function ensureCommunityRooms() {
  const count = await prisma.communityRoom.count();
  if (count > 0) return;
  await prisma.$transaction(
    COMMUNITY_ROOMS.map((room) =>
      prisma.communityRoom.upsert({
        where: { key: room.key },
        create: room,
        update: room
      })
    )
  );
}

roomRoutes.get('/', async (req, res) => {
  try {
    await ensureCommunityRooms();
    const rooms = await prisma.communityRoom.findMany({
      orderBy: { nameKo: 'asc' },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true, picture: true } } }
        }
      }
    });
    const mapped = rooms.map((room) => {
      const last = room.messages?.[0];
      return {
        ...room,
        lastMessage: last?.content || (last?.imageUrl ? '사진' : ''),
        lastMessageAt: last?.createdAt || null,
        lastSender: last?.sender ? { id: last.sender.id, name: last.sender.name, picture: last.sender.picture } : null,
        messages: undefined
      };
    });
    const sorted = mapped.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
    return res.json(sorted);
  } catch (err) {
    console.error('[Rooms]', err);
    return res.status(500).json({ error: 'failed to fetch rooms' });
  }
});

roomRoutes.get('/:id', async (req, res) => {
  try {
    const room = await prisma.communityRoom.findUnique({ where: { id: req.params.id } });
    if (!room) return res.status(404).json({ error: 'room not found' });
    return res.json(room);
  } catch (err) {
    console.error('[Rooms] get', err);
    return res.status(500).json({ error: 'failed to fetch room' });
  }
});

roomRoutes.get('/:id/messages', async (req, res) => {
  try {
    const messages = await prisma.communityMessage.findMany({
      where: { roomId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, picture: true } } }
    });
    return res.json(messages);
  } catch (err) {
    console.error('[Rooms] messages', err);
    return res.status(500).json({ error: 'failed to fetch messages' });
  }
});

roomRoutes.post('/:id/messages', async (req, res) => {
  try {
    const { senderId, content, imageUrl, senderName, senderPicture } = req.body || {};
    if (!senderId) return res.status(400).json({ error: 'senderId required' });
    const trimmed = content?.trim();
    if (!trimmed && !imageUrl) {
      return res.status(400).json({ error: 'content or imageUrl required' });
    }

    const room = await prisma.communityRoom.findUnique({ where: { id: req.params.id } });
    if (!room) return res.status(404).json({ error: 'room not found' });

    await prisma.user.upsert({
      where: { id: senderId },
      create: {
        id: senderId,
        email: senderId + '@google',
        name: senderName || null,
        picture: senderPicture || null
      },
      update: {
        ...(senderName !== undefined ? { name: senderName } : {}),
        ...(senderPicture !== undefined ? { picture: senderPicture } : {})
      }
    });

    const message = await prisma.communityMessage.create({
      data: {
        roomId: room.id,
        senderId,
        content: trimmed || null,
        imageUrl: imageUrl || null
      },
      include: { sender: { select: { id: true, name: true, picture: true } } }
    });

    return res.status(201).json(message);
  } catch (err) {
    console.error('[Rooms] send', err);
    return res.status(500).json({ error: 'failed to send message' });
  }
});
