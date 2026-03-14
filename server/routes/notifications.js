import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const notificationRoutes = Router();

notificationRoutes.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const list = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(list);
  } catch (error) {
    console.error('[Notifications]', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

notificationRoutes.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('[Notifications]', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});
