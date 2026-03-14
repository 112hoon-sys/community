import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createPost, uploadImage, fetchPost, updatePost } from '../lib/api';
import { BOARDS } from '../config/boards';

export default function PostWritePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const boardParam = searchParams.get('board') || 'life';
  const editId = searchParams.get('id');
  const isEdit = !!editId;
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const selectableBoards = BOARDS.filter((b) => b.key !== 'nationality');
  const safeBoard = selectableBoards.find((b) => b.key === boardParam)?.key || selectableBoards[0]?.key || 'life';
  const [boardKey, setBoardKey] = useState(safeBoard);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [initialImageUrl, setInitialImageUrl] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    fetchPost(editId)
      .then((p) => {
        setTitle(p.title || '');
        setContent(p.content || '');
        const nextKey = p.board?.key || boardParam;
        setBoardKey(nextKey === 'nationality' ? safeBoard : nextKey);
        if (p.imageUrl) {
          setInitialImageUrl(p.imageUrl);
          setImagePreview(p.imageUrl);
        }
      })
      .catch(() => {
        alert('게시글 정보를 불러오지 못했습니다.');
        navigate(-1);
      });
  }, [isEdit, editId, boardParam, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      let imageUrl = initialImageUrl;
      if (imageFile) {
        const { url } = await uploadImage(imageFile);
        imageUrl = url;
      }
      const payload = {
        title: title.trim(),
        content: content.trim(),
        boardKey,
        imageUrl,
        authorId: user.sub,
        authorName: user.name,
        authorPicture: user.picture
      };
      const post = isEdit
        ? await updatePost(editId, payload)
        : await createPost(payload);
      navigate(`/post/${post.id}`);
    } catch (err) {
      alert(err.message || '작성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="page-padding">
        <p>글을 작성하려면 로그인해 주세요.</p>
        <Link to="/login">로그인 하러가기</Link>
      </div>
    );
  }

  return (
    <div className="page-padding">
      <h1 className="page-title">{isEdit ? '글 수정' : '글 작성'}</h1>
      <form onSubmit={handleSubmit} className="post-form">
        <select
          value={boardKey}
          onChange={(e) => setBoardKey(e.target.value)}
          required
        >
          {selectableBoards.map((b) => (
            <option key={b.key} value={b.key}>
              {b.nameKo}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setImageFile(file || null);
            setImagePreview(file ? URL.createObjectURL(file) : '');
          }}
        />
        {imagePreview && (
          <div style={{ marginBottom: 12 }}>
            <img src={imagePreview} alt="미리보기" style={{ maxWidth: '100%', borderRadius: 12 }} />
          </div>
        )}
        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)}>
            취소
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? '작성 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
