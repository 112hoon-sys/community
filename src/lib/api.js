// 媛쒕컻 ??Vite proxy ?ъ슜: /api -> localhost:3001
const API_URL = import.meta.env.VITE_API_URL || '';

function buildUrl(path) {
  return `${API_URL}${path}`;
}

async function api(path, options = {}) {
  const res = await fetch(buildUrl(path), {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function fetchExchangeRates() {
  return api('/api/exchange/rates');
}

export async function fetchBoards() {
  return api('/api/boards');
}

export async function fetchPosts(boardKey) {
  return api(boardKey ? `/api/posts?boardKey=${boardKey}` : '/api/posts');
}

export async function fetchPost(id) {
  return api(`/api/posts/${id}`);
}

export async function createPost(data) {
  return api('/api/posts', { method: 'POST', body: JSON.stringify(data) });
}

export async function updatePost(id, data) {
  return api(`/api/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deletePost(id, data) {
  return api(`/api/posts/${id}`, { method: 'DELETE', body: JSON.stringify(data) });
}

export async function fetchComments(postId) {
  return api(`/api/posts/${postId}/comments`);
}

export async function createComment(postId, data) {
  return api(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateComment(postId, commentId, data) {
  return api(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteComment(postId, commentId, data) {
  return api(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    body: JSON.stringify(data)
  });
}

export async function fetchLikes(postId, userId) {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return api(`/api/posts/${postId}/likes${q}`);
}

export async function toggleLike(postId, data) {
  return api(`/api/posts/${postId}/likes`, { method: 'POST', body: JSON.stringify(data) });
}

export async function fetchNotifications(userId) {
  return api(`/api/notifications?userId=${encodeURIComponent(userId)}`);
}

export async function markNotificationRead(id) {
  return api(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export async function translateText(text, target) {
  const res = await api('/api/translate', {
    method: 'POST',
    body: JSON.stringify({ text, target })
  });
  return res.translated || text;
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(buildUrl('/api/upload/image'), {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 413) {
      throw new Error(err.error || '파일은 10MB 이하만 업로드할 수 있습니다.');
    }
    throw new Error(err.error || res.statusText || '업로드 실패');
  }
  return res.json();
}

export async function fetchChatThreads(params = {}) {
  const q = new URLSearchParams(params).toString();
  return api(`/api/chats/threads?${q}`);
}

export async function createChatThread(data) {
  return api('/api/chats/threads', { method: 'POST', body: JSON.stringify(data) });
}

export async function fetchChatMessages(threadId) {
  return api(`/api/chats/threads/${threadId}/messages`);
}

export async function sendChatMessage(threadId, data) {
  return api(`/api/chats/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify(data) });
}

export async function markChatRead(threadId, data) {
  return api(`/api/chats/threads/${threadId}/read`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function fetchChatUnreadCount(params = {}) {
  const q = new URLSearchParams(params).toString();
  return api(`/api/chats/unread-count?${q}`);
}

export async function savePushSubscription(data) {
  return api('/api/push/subscribe', { method: 'POST', body: JSON.stringify(data) });
}

export async function removePushSubscription(data) {
  return api('/api/push/unsubscribe', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUserProfile(userId, data) {
  return api(`/api/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function fetchCommunityRooms() {
  return api('/api/rooms');
}

export async function fetchCommunityMessages(roomId) {
  return api(`/api/rooms/${roomId}/messages`);
}

export async function sendCommunityMessage(roomId, data) {
  return api(`/api/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify(data) });
}

