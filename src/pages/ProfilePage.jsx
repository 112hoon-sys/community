import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, uploadImage } from '../lib/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [nickname, setNickname] = useState(user?.name || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.picture || '');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="page-padding">
        <p>프로필을 수정하려면 로그인해 주세요.</p>
        <Link to="/login">로그인 하러가기</Link>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || saving) return;
    setSaving(true);
    try {
      let picture = imagePreview || '';
      if (imageFile) {
        const { url } = await uploadImage(imageFile);
        picture = url;
      }
      const updated = await updateUserProfile(user.sub, {
        name: nickname.trim(),
        picture,
        email: user.email
      });
      updateUser({
        name: updated.name || nickname.trim(),
        picture: updated.picture || picture
      });
      alert('프로필이 저장되었습니다.');
      navigate(-1);
    } catch (err) {
      alert(err.message || '프로필 저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-padding">
      <Link to="/" className="back-link">홈</Link>
      <h1 className="page-title">프로필</h1>
      <form onSubmit={handleSave} className="profile-form">
        <div className="profile-avatar">
          {imagePreview ? (
            <img src={imagePreview} alt="" />
          ) : (
            <div className="profile-avatar-fallback">{nickname?.[0] || '?'}</div>
          )}
        </div>
        <div className="profile-actions">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setImageFile(file || null);
              setImagePreview(file ? URL.createObjectURL(file) : imagePreview);
            }}
          />
          {imagePreview && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setImageFile(null);
                setImagePreview('');
              }}
            >
              프로필 이미지 삭제
            </button>
          )}
        </div>
        <label className="form-label">닉네임</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요"
          required
        />
        <label className="form-label">이메일</label>
        <input type="email" value={user.email || ''} disabled />
        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)}>
            취소
          </button>
          <button type="submit" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
      <div style={{ marginTop: 16 }}>
        <button type="button" className="btn-danger" onClick={logout}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
