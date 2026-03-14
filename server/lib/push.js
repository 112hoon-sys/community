import webpush from 'web-push';
import { prisma } from './prisma.js';

const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

const isEnabled = Boolean(publicKey && privateKey);

if (isEnabled) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function buildSubscription(sub) {
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth
    }
  };
}

export async function sendPushToUser(userId, payload) {
  if (!isEnabled || !userId) return { ok: false, reason: 'push-disabled' };

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return { ok: false, reason: 'no-subs' };

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(buildSubscription(sub), JSON.stringify(payload))
    )
  );

  const staleEndpoints = [];
  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      const statusCode = result.reason?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        staleEndpoints.push(subs[idx].endpoint);
      }
    }
  });

  if (staleEndpoints.length) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints } }
    });
  }

  return { ok: true, sent: results.length, removed: staleEndpoints.length };
}

export function pushEnabled() {
  return isEnabled;
}
