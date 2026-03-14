self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'KoreaMate';
  const body = data.body || '새 알림이 도착했어요.';
  const url = data.url || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      icon: '/vite.svg'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || '/';
  const url = target.startsWith('http') ? target : `${self.location.origin}${target}`;
  event.waitUntil(self.clients.openWindow(url));
});
