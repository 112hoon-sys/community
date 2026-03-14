import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

const TEST_USERS = [
  { sub: 'user-1', name: '김민교', email: 'minkyo@test.com', picture: '' },
  { sub: 'user-2', name: '우혜주', email: 'hyeju@test.com', picture: '' },
  { sub: 'user-3', name: '빈순남', email: 'sunnam@test.com', picture: '' },
  { sub: 'user-4', name: '김태건', email: 'taegon@test.com', picture: '' },
  { sub: 'user-5', name: '이보영', email: 'boyoung@test.com', picture: '' },
  { sub: 'user-6', name: '유정', email: 'yoojung@test.com', picture: '' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSuccess = (tokenResponse) => {
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        login({ sub: data.sub, email: data.email, name: data.name, picture: data.picture });
        navigate('/');
      })
      .catch((err) => {
        console.error('Google userinfo error:', err);
        alert('Google 사용자 정보를 가져오지 못했습니다.');
      });
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const access_token = params.get('access_token');
      if (access_token) {
        window.history.replaceState(null, '', window.location.pathname);
        handleSuccess({ access_token });
      }
    }
  }, []);

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    ux_mode: 'popup',
    scope: 'email profile',
    onSuccess: handleSuccess,
    onError: (err) => {
      console.error('Google login error:', err);
      alert('Google 로그인에 문제가 있습니다.');
    }
  });

  const handleTestLogin = (user) => {
    login(user);
    navigate('/');
  };

  return (
    <div className="page-padding login-page">
      <h1 className="page-title">로그인</h1>
      <p>커뮤니티 활동을 위해 로그인해 주세요.</p>

      <button type="button" className="btn-google" onClick={() => googleLogin()}>
        Google로 로그인
      </button>

      <div style={{ margin: '28px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: '#EBEBEB' }} />
        <span style={{ fontSize: 12, color: '#ADB5BD', whiteSpace: 'nowrap' }}>테스트 계정으로 입장</span>
        <div style={{ flex: 1, height: 1, background: '#EBEBEB' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {TEST_USERS.map((user) => (
          <button
            key={user.sub}
            type="button"
            onClick={() => handleTestLogin(user)}
            style={{
              padding: '12px',
              border: '1.5px solid #EBEBEB',
              borderRadius: 12,
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'border-color 0.15s, background 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6F0F'; e.currentTarget.style.background = '#FFF0E6'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#fff'; }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6F0F, #FF9A5C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0
            }}>
              {user.name[0]}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#212124' }}>{user.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}