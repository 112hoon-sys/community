import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchBoards, fetchPosts } from '../lib/api';
import TranslatableText from '../components/TranslatableText';
import {
  FileText,
  MapPin,
  Users,
  Briefcase,
  ShoppingBag,
  DollarSign,
  ShieldCheck
} from 'lucide-react';

const icons = {
  life: FileText,
  visa: ShieldCheck,
  region: MapPin,
  nationality: Users,
  job: Briefcase,
  market: ShoppingBag,
  remittance: DollarSign
};

export default function BoardListPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('search')?.trim() || '';

  useEffect(() => {
    let mounted = true;
    const load = () => {
      fetchBoards()
        .then((data) => mounted && setBoards(data))
        .catch(() => mounted && setBoards([]))
        .finally(() => mounted && setLoading(false));
    };
    load();
    const intervalId = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery) return;
    setSearchLoading(true);
    fetchPosts()
      .then((posts) => {
        const q = searchQuery.toLowerCase();
        const results = (posts || []).filter((post) =>
          [post.title, post.content, post.board?.nameKo, post.board?.nameEn, post.author?.name]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(q))
        );
        setSearchResults(results);
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [searchQuery]);

  if (loading) return <div className="page-padding">{t.rateUpdating || '로딩 중...'}</div>;

  return (
    <div className="page-padding">
      <h1 className="page-title">{searchQuery ? (t.searchResults || '검색 결과') : (t.boards || '게시판')}</h1>
      {searchQuery ? (
        <div>
          <div className="feed-status" style={{ marginBottom: 12 }}>
            "{searchQuery}"
          </div>
          {searchLoading && <div className="feed-status">{t.rateUpdating || '로딩 중...'}</div>}
          {!searchLoading && searchResults.length === 0 && (
            <div className="feed-status">{t.searchNoResults || '검색 결과가 없습니다.'}</div>
          )}
          {!searchLoading && searchResults.length > 0 && (
            <div className="post-list">
              {searchResults.map((post) => (
                <Link key={post.id} to={`/post/${post.id}`} className="post-item">
                  <div className="post-content">
                    <div className="post-meta">
                      <span>{post.author?.name || '익명'}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <h3><TranslatableText text={post.title} tag="span" /></h3>
                    <p><TranslatableText text={post.content} tag="span" /></p>
                  </div>
                  <span className="post-tag">{post.board?.nameKo || post.board?.nameEn || post.board?.key}</span>
                </Link>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <Link to="/boards" className="link">{t.boards || '게시판'}</Link>
          </div>
        </div>
      ) : (
        <div className="board-grid">
          {boards.map((board) => {
            const Icon = icons[board.key] || FileText;
            return (
              <Link
                key={board.id}
                to={`/board/${board.key}`}
                className="board-card"
              >
                <div className="board-icon">
                  <Icon size={24} />
                </div>
                <div>
                  <h3>{board.nameKo}</h3>
                  <p>{board.description}</p>
                  <span className="board-count">{board._count?.posts ?? 0}개 글</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {user && (
        <Link to="/post/new" className="btn-primary">
          {t.newPost || '글쓰기'}
        </Link>
      )}
    </div>
  );
}
