import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchCommunityRooms,
  fetchCommunityMessages,
  sendCommunityMessage,
  uploadImage
} from '../lib/api';
import TranslatableText from '../components/TranslatableText';

export default function CommunityRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const rooms = await fetchCommunityRooms();
        const found = rooms.find((r) => r.id === roomId);
        if (!found) {
          setRoom(null);
          setMessages([]);
          return;
        }
        if (!mounted) return;
        setRoom(found);
        const msgs = await fetchCommunityMessages(roomId);
        if (!mounted) return;
        setMessages(msgs);
      } catch (e) {
        console.error(e);
        setRoom(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const intervalId = setInterval(async () => {
      try {
        const msgs = await fetchCommunityMessages(roomId);
        setMessages(msgs);
      } catch (e) {
        console.error(e);
      }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [roomId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (sending) return;
    if (!input.trim() && !imageFile) return;
    setSending(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const { url } = await uploadImage(imageFile);
        imageUrl = url;
      }
      const msg = await sendCommunityMessage(roomId, {
        senderId: user.sub,
        content: input.trim(),
        imageUrl,
        senderName: user.name,
        senderPicture: user.picture
      });
      setMessages((prev) => [
        ...prev,
        msg
      ]);
      setInput('');
      setImageFile(null);
      setImagePreview('');
    } catch (e) {
      console.error(e);
      alert(e.message || '메시지 전송 실패');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="page-padding">로딩 중...</div>;
  if (!room) return <div className="page-padding">채팅방을 찾을 수 없습니다.</div>;

  return (
    <div className="page-padding">
      <Link to="/board/nationality" className="back-link">국적/언어 커뮤니티</Link>
      <div className="community-header">
        <h1 className="page-title">{room.nameKo}</h1>
        <p className="community-sub">{room.description}</p>
      </div>
      <div className="community-chat">
        <div className="chat-messages community-chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">첫 메시지를 남겨보세요.</div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-message ${m.senderId === user?.sub ? 'me' : 'them'}`}
            >
              <div className="chat-bubble">
                <div className="chat-sender">
                  {m.sender?.picture ? (
                    <img src={m.sender.picture} alt="" className="chat-avatar" />
                  ) : (
                    <div className="chat-avatar chat-avatar-fallback">{m.sender?.name?.[0] || '?'}</div>
                  )}
                  <span>{m.sender?.name || '익명'}</span>
                </div>
                {m.content && <TranslatableText text={m.content} tag="span" />}
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="첨부 이미지" className="chat-image" />
                )}
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
        <form className="chat-input community-chat-input" onSubmit={handleSend}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지 입력"
          />
          <label className="chat-upload">
            사진
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setImageFile(file || null);
                setImagePreview(file ? URL.createObjectURL(file) : '');
              }}
            />
          </label>
          <button type="submit" disabled={sending || (!input.trim() && !imageFile)}>
            전송
          </button>
        </form>
        {imagePreview && (
          <div className="chat-image-preview">
            <img src={imagePreview} alt="미리보기" />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreview('');
              }}
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
