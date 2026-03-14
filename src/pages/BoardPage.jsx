import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import TranslatableText from '../components/TranslatableText';
import { BOARDS } from '../config/boards';
import { useAuth } from '../contexts/AuthContext';
import { fetchPosts, fetchCommunityRooms } from '../lib/api';
import { Heart, MessageCircle } from 'lucide-react';

const roomFlags = {
  vn: '🇻🇳',
  cn: '🇨🇳',
  th: '🇹🇭',
  id: '🇮🇩',
  ph: '🇵🇭',
  my: '🇲🇾',
  np: '🇳🇵',
  kh: '🇰🇭',
  mm: '🇲🇲',
  en: '🌐',
  other: '✨'
};

export default function BoardPage() {
  const { boardKey } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    if (boardKey === 'nationality') {
      let mounted = true;
      const loadRooms = () => {
        fetchCommunityRooms()
          .then((data) => mounted && setRooms(data))
          .catch(() => mounted && setRooms([]))
          .finally(() => mounted && setLoading(false));
      };
      loadRooms();
      const intervalId = setInterval(loadRooms, 3000);
      return () => {
        mounted = false;
        clearInterval(intervalId);
      };
    }
    let mounted = true;
    const loadPosts = () => {
      fetchPosts(boardKey)
        .then((data) => mounted && setPosts(data))
        .catch(() => mounted && setPosts([]))
        .finally(() => mounted && setLoading(false));
    };
    loadPosts();
    const intervalId = setInterval(loadPosts, 5000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [boardKey]);

  if (loading) return <div className="page-padding">로딩 중...</div>;

  const boardTitle = BOARDS.find((b) => b.key === boardKey)?.nameKo || boardKey;

  return (
    <div className="page-padding">
      <div className="board-header">
        <Link to="/boards" className="back-link">게시판</Link>
        <h1 className="page-title">{boardTitle}</h1>
      </div>
      {boardKey === 'nationality' ? (
        <div className="community-room-list">
          {rooms.length === 0 ? (
            <p className="empty-message">아직 채팅방이 없습니다.</p>
          ) : (
            rooms.map((room) => (
              <Link key={room.id} to={`/community/${room.id}`} className="community-room-card">
                <div className="room-flag">
                  <span>{roomFlags[room.key] || '🌏'}</span>
                </div>
                <div className="room-main">
                  <div className="room-head">
                    <h3>{room.nameKo}</h3>
                    <span className="community-room-count">{room._count?.messages ?? 0}개 대화</span>
                  </div>
                  <p className="room-desc">{room.description}</p>
                  <div className="room-meta">
                    <span className="room-last">
                      {room.lastMessage || '첫 대화를 시작해보세요.'}
                    </span>
                    {room.lastMessageAt && (
                      <time>
                        {new Date(room.lastMessageAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="post-list">
          {posts.length === 0 ? (
            <p className="empty-message">아직 글이 없습니다.</p>
          ) : (
            posts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="post-item">
                <div className="post-item-header">
                <img
                  src={
                    post.author?.picture ||
                    post.imageUrl ||
                    'https://ui-avatars.com/api/?name=' + (post.author?.name || '?')
                  }
                  alt=""
                  className="post-avatar"
                />
                  <span>{post.author?.name || '익명'}</span>
                  <span className="post-time">
                    {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <h3><TranslatableText text={post.title} tag="span" /></h3>
                <div className="post-meta">
                  <span><MessageCircle size={14} /> {post._count?.comments ?? 0}</span>
                  <span><Heart size={14} /> {post._count?.likes ?? 0}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
      {user && boardKey !== 'nationality' && (
        <Link to={`/post/new?board=${boardKey}`} className="btn-primary btn-fab">
          + 글쓰기
        </Link>
      )}
    </div>
  );
}
