import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { pushEnabled } from '../lib/push.js';

export const pushRoutes = Router();

pushRoutes.get('/status', (_, res) => {
  res.json({ enabled: pushEnabled() });
});

pushRoutes.post('/subscribe', async (req, res) => {
  try {
    const { userId, subscription, userAgent } = req.body || {};
    if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'invalid subscription' });
    }

    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null
      },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null
      }
    });

    return res.json({ ok: true, id: saved.id });
  } catch (error) {
    console.error('[Push] subscribe', error);
    return res.status(500).json({ error: 'failed to subscribe' });
  }
});

pushRoutes.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return res.json({ ok: true });
  } catch (error) {
    console.error('[Push] unsubscribe', error);
    return res.status(500).json({ error: 'failed to unsubscribe' });
  }
});
