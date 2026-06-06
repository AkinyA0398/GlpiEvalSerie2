import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const BackofficeLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => { logout(); navigate('/login'); }, 400);
  };

  return (
    <div className={`bo-shell ${loggingOut ? 'fade-out' : ''}`}>
      <aside className="bo-sidebar">
        <div className="bo-brand">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#sg2)"/>
            <defs>
              <linearGradient id="sg2" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
            <path d="M24 12a6 6 0 0 0-6 6v2h-2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V22a2 2 0 0 0-2-2h-2v-2a6 6 0 0 0-6-6zm0 3a3 3 0 0 1 3 3v2h-6v-2a3 3 0 0 1 3-3zm0 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="white"/>
          </svg>
          <span>GLPI Admin</span>
        </div>

        <nav className="bo-nav">
          <div className="bo-nav-section">Vue générale</div>
          <NavLink to="/backoffice/dashboard" className={({ isActive }) => `bo-nav-link ${isActive ? 'active' : ''}`} id="nav-dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/backoffice/tickets" className={({ isActive }) => `bo-nav-link ${isActive ? 'active' : ''}`} id="nav-tickets">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Tickets</span>
          </NavLink>

          <div className="bo-nav-section" style={{ marginTop: 16 }}>Administration</div>
          <NavLink to="/backoffice/import" className={({ isActive }) => `bo-nav-link ${isActive ? 'active' : ''}`} id="nav-import">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Importer les données</span>
          </NavLink>
          <NavLink to="/backoffice/reset" className={({ isActive }) => `bo-nav-link ${isActive ? 'active' : ''}`} id="nav-reset">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4.65"/>
            </svg>
            <span>Réinitialiser</span>
          </NavLink>
        </nav>

        <button className="bo-logout" onClick={handleLogout} id="btn-logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Déconnexion
        </button>
      </aside>
      <main className="bo-main"><Outlet /></main>
    </div>
  );
};
