import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import TranslatableText from '../components/TranslatableText';
import {
  fetchPost,
  fetchLikes,
  createComment,
  toggleLike,
  deletePost,
  updateComment,
  deleteComment,
  fetchChatThreads,
  createChatThread,
  fetchChatMessages,
  sendChatMessage,
  markChatRead,
  fetchChatUnreadCount
} from '../lib/api';
import { Heart, MessageCircle, Share2, MessageSquare, X } from 'lucide-react';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const { user } = useAuth();
  const { t } = useLanguage();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatThreads, setChatThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatUnread, setChatUnread] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchPost(id)
      .then((p) => {
        setPost(p);
        if (user) {
          return fetchLikes(id, user.sub).then((r) => setLiked(r.liked));
        }
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id, user?.sub]);

  const isOwner = user && post && post.authorId === user.sub;
  const boardKey = post?.board?.key || post?.boardKey || post?.category || '';
  const boardName = post?.board?.nameKo || post?.board?.nameEn || '';
  const isChatEligible = ['market', 'job', 'marketplace', 'jobs'].includes(boardKey)
    || /중고|구인|Job|Market/i.test(boardName);

  const refreshUnread = async () => {
    if (!user || !post || !isChatEligible) return;
    try {
      const res = await fetchChatUnreadCount({ userId: user.sub, postId: post.id });
      setChatUnread(res.count || 0);
    } catch {
      setChatUnread(0);
    }
  };

  useEffect(() => {
    refreshUnread();
  }, [post?.id, user?.sub, post?.board?.key]);

  const loadMessages = async (threadId) => {
    if (!threadId) return;
    setChatLoading(true);
    try {
      const msgs = await fetchChatMessages(threadId);
      setChatMessages(msgs);
      await markChatRead(threadId, { userId: user.sub });
      await refreshUnread();
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  const openChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!post) return;
    setChatOpen(true);
    setChatLoading(true);
    try {
      if (isOwner) {
        const threads = await fetchChatThreads({ postId: post.id, sellerId: user.sub });
        setChatThreads(threads);
        if (threads.length > 0) {
          setActiveThread(threads[0]);
          await loadMessages(threads[0].id);
        } else {
          setActiveThread(null);
          setChatMessages([]);
        }
      } else {
        const thread = await createChatThread({ postId: post.id, buyerId: user.sub, buyerName: user?.name, buyerPicture: user?.picture });
        setChatThreads([thread]);
        setActiveThread(thread);
        await loadMessages(thread.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectThread = async (thread) => {
    setActiveThread(thread);
    await loadMessages(thread.id);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeThread) return;
    try {
      const msg = await sendChatMessage(activeThread.id, {
        senderId: user.sub,
        content: chatInput.trim(),
        senderName: user?.name,
        senderPicture: user?.picture
      });
      setChatMessages((prev) => [
        ...prev,
        { ...msg, sender: { id: user.sub, name: user.name, picture: user.picture } }
      ]);
      setChatInput('');
      await refreshUnread();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('로그인 후 좋아요를 누를 수 있습니다.');
      navigate('/login');
      return;
    }
    try {
      const res = await toggleLike(id, {
        authorId: user.sub,
        authorName: user.name,
        authorPicture: user.picture
      });
      setLiked(res.liked);
      setPost((p) => (p ? { ...p, _count: { ...p._count, likes: res.count } } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || submitting) return;
    if (!user) {
      alert('로그인 후 댓글을 작성할 수 있습니다.');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const newComment = await createComment(id, {
        content: comment.trim(),
        authorId: user.sub,
        authorName: user.name,
        authorPicture: user.picture
      });
      setPost((p) =>
        p
          ? {
              ...p,
              comments: [...(p.comments || []), newComment],
              _count: { ...p._count, comments: (p._count?.comments || 0) + 1 }
            }
          : null
      );
      setComment('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
        text: post?.content?.slice(0, 100)
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다.');
    }
  };

  if (loading) return <div className="page-padding">로딩 중...</div>;
  if (!post) return <div className="page-padding">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="page-padding">
      <Link to={`/board/${post.board?.key}`} className="back-link">목록</Link>
      <article className="post-detail">
        <div className="post-detail-header">
          <img
            src={
              post.imageUrl ||
              post.author?.picture ||
              'https://ui-avatars.com/api/?name=' + (post.author?.name || '?')
            }
            alt=""
            className="post-avatar"
          />
          <div>
            <strong>{post.author?.name || '익명'}</strong>
            <span className="post-time">
              {new Date(post.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>
          {isOwner && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="action-btn"
                onClick={() => navigate(`/post/new?id=${post.id}&board=${post.board?.key || ''}`)}
              >
                수정
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={async () => {
                  if (!window.confirm('정말 이 글을 삭제하시겠습니까?')) return;
                  try {
                    await deletePost(post.id, { authorId: user.sub });
                    navigate(`/board/${post.board?.key}`);
                  } catch (e) {
                    alert(e.message || '삭제 실패');
                  }
                }}
              >
                삭제
              </button>
            </div>
          )}
        </div>
        <h1><TranslatableText text={post.title} tag="span" /></h1>
        {post.imageUrl && (
          <div style={{ marginBottom: 16 }}>
            <img
              src={post.imageUrl}
              alt={post.title}
              style={{ maxWidth: '100%', borderRadius: 16 }}
            />
          </div>
        )}
        <div className="post-content"><TranslatableText text={post.content} tag="span" /></div>
        <div className="post-actions">
          <button
            type="button"
            className={`action-btn ${liked ? 'active' : ''}`}
            onClick={handleLike}
          >
            <Heart size={18} />
            <span>{post._count?.likes ?? 0}</span>
          </button>
          <span className="action-btn">
            <MessageCircle size={18} />
            <span>{post._count?.comments ?? post.comments?.length ?? 0}</span>
          </span>
          <button type="button" className="action-btn" onClick={handleShare}>
            <Share2 size={18} />
            <span>공유</span>
          </button>
        </div>
      </article>
      <section className="comments">
        <h3>댓글</h3>
        {user ? (
          <form onSubmit={handleComment} className="comment-form">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="댓글을 입력하세요."
              disabled={submitting}
            />
            <button type="submit" disabled={submitting || !comment.trim()}>
              등록
            </button>
          </form>
        ) : (
          <div className="feed-status" style={{ marginBottom: 16 }}>
            댓글과 좋아요는 로그인 후 이용할 수 있습니다.{' '}
            <Link to="/login">로그인 하러가기</Link>
          </div>
        )}
        <div className="comment-list">
          {(post.comments || []).map((c) => (
            <div key={c.id} className="comment-item">
              <img
                src={c.author?.picture || 'https://ui-avatars.com/api/?name=' + (c.author?.name || '?')}
                alt=""
                className="comment-avatar"
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{c.author?.name || '익명'}</strong>
                  <span className="comment-time">
                    {new Date(c.createdAt).toLocaleString('ko-KR')}
                  </span>
                  {user && c.authorId === user.sub && (
                    <>
                      <button
                        type="button"
                        className="action-btn"
                        style={{ fontSize: 12, padding: 0 }}
                        onClick={() => {
                          setEditingCommentId(c.id);
                          setEditingContent(c.content);
                        }}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        style={{ fontSize: 12, padding: 0 }}
                        onClick={async () => {
                          if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;
                          try {
                            await deleteComment(id, c.id, { authorId: user.sub });
                            setPost((p) =>
                              p
                                ? {
                                    ...p,
                                    comments: (p.comments || []).filter((x) => x.id !== c.id),
                                    _count: {
                                      ...p._count,
                                      comments: (p._count?.comments || 1) - 1
                                    }
                                  }
                                : p
                            );
                          } catch (err) {
                            alert(err.message || '댓글 삭제 실패');
                          }
                        }}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
                {editingCommentId === c.id ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!editingContent.trim()) return;
                      try {
                        const updated = await updateComment(id, c.id, {
                          content: editingContent.trim(),
                          authorId: user.sub
                        });
                        setPost((p) =>
                          p
                            ? {
                                ...p,
                                comments: (p.comments || []).map((x) =>
                                  x.id === c.id ? { ...x, content: updated.content } : x
                                )
                              }
                            : p
                        );
                        setEditingCommentId(null);
                        setEditingContent('');
                      } catch (err) {
                        alert(err.message || '댓글 수정 실패');
                      }
                    }}
                  >
                    <input
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                    <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                      <button type="submit" className="action-btn" style={{ padding: 0 }}>
                        저장
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        style={{ padding: 0 }}
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingContent('');
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <p><TranslatableText text={c.content} tag="span" /></p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      {isChatEligible && (
        <>
          <button type="button" className="chat-fab" onClick={openChat}>
            <MessageSquare size={18} />
            <span>{t.chatStart || '1:1 대화하기'}</span>
            {chatUnread > 0 && <span className="chat-badge">{chatUnread}</span>}
          </button>
          {chatOpen && (
            <div className="chat-panel">
              <div className="chat-panel-header">
                <div>
                  <strong>{t.chatTitle || '1:1 채팅'}</strong>
                  <span className="chat-panel-sub">{post.title}</span>
                </div>
                <button type="button" className="icon-button" onClick={() => setChatOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className={`chat-panel-body ${isOwner ? '' : 'single'}`}>
                {isOwner && (
                  <div className="chat-thread-list">
                    {chatThreads.length === 0 && (
                      <div className="chat-empty">{t.chatThreadEmpty || '아직 채팅이 없습니다.'}</div>
                    )}
                    {chatThreads.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`chat-thread-item ${activeThread?.id === t.id ? 'active' : ''}`}
                        onClick={() => handleSelectThread(t)}
                      >
                        <span className="chat-thread-name">{t.buyer?.name || '익명'}</span>
                        {t.unreadCount > 0 && (
                          <span className="chat-thread-badge">{t.unreadCount}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="chat-messages">
                  {chatLoading && <div className="chat-empty">{t.chatLoading || '불러오는 중...'}</div>}
                  {!chatLoading && (!activeThread || chatMessages.length === 0) && (
                    <div className="chat-empty">{t.chatEmpty || '메시지가 없습니다.'}</div>
                  )}
                  {!chatLoading &&
                    chatMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`chat-message ${m.senderId === user?.sub ? 'me' : 'them'}`}
                      >
                        <div className="chat-bubble">
                          <TranslatableText text={m.content} tag="span" />
                          <time>
                            {new Date(m.createdAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </time>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <form className="chat-input" onSubmit={handleSendChat}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t.chatInputPlaceholder || '메시지 입력'}
                  disabled={!activeThread}
                />
                <button type="submit" disabled={!chatInput.trim() || !activeThread}>
                  {t.chatSend || '전송'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}





