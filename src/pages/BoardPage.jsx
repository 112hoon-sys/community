import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import TranslatableText from '../components/TranslatableText';
import { BOARDS } from '../config/boards';
import { useAuth } from '../contexts/AuthContext';
import { fetchPosts } from '../lib/api';
import { Heart, MessageCircle } from 'lucide-react';

export default function BoardPage() {
  const { boardKey } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts(boardKey)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [boardKey]);

  if (loading) return <div className="page-padding">로딩 중...</div>;

  const boardTitle = BOARDS.find((b) => b.key === boardKey)?.nameKo || boardKey;

  return (
    <div className="page-padding">
      <div className="board-header">
        <Link to="/boards" className="back-link">게시판</Link>
        <h1 className="page-title">{boardTitle}</h1>
      </div>
      <div className="post-list">
        {posts.length === 0 ? (
          <p className="empty-message">아직 글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className="post-item">
              <div className="post-item-header">
                <img
                  src={
                    post.imageUrl ||
                    post.author?.picture ||
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
      {user && (
        <Link to={`/post/new?board=${boardKey}`} className="btn-primary btn-fab">
          + 글쓰기
        </Link>
      )}
    </div>
  );
}
