import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Home, FileText, User } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const isHome = location.pathname === '/';

  return (
    <div className="layout-shell">
      {!isHome && (
        <header className="layout-header">
          <Link to="/" className="logo">
            <span>KoreaMate</span>
          </Link>
          <nav className="layout-nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <Home size={18} />
              <span>{t.nav?.[0] || '홈'}</span>
            </Link>
            <Link to="/boards" className={location.pathname.startsWith('/board') ? 'active' : ''}>
              <FileText size={18} />
              <span>{t.boards || '게시판'}</span>
            </Link>

            {user ? (
              <button type="button" onClick={logout} className="nav-user">
                <div className="avatar-wrapper">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="avatar-img" />
                  ) : (
                    <div className="avatar-fallback">{user.name?.[0] || '?'}</div>
                  )}
                </div>
                <span className="user-name">{user.name}</span>
              </button>
            ) : (
              <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
                <User size={18} />
                <span>{t.login || '로그인'}</span>
              </Link>
            )}
          </nav>
        </header>
      )}
      <div className="layout-content">
        <Outlet />
      </div>
    </div>
  );
}
