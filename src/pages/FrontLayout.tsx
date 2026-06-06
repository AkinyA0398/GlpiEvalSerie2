import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';

export const FrontLayout: React.FC = () => {
  return (
    <div className="front-shell">
      {/* ── Top navbar ── */}
      <header className="front-nav">
        <div className="front-nav-inner">
          <Link to="/elements" className="front-brand">
            <div className="front-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <span>GLPI</span>
          </Link>

          <nav className="front-links">
            <NavLink to="/elements" className={({ isActive }) => `front-link ${isActive ? 'active' : ''}`} id="fnav-elements">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
              </svg>
              Éléments
            </NavLink>
            <NavLink to="/tickets/new" className={({ isActive }) => `front-link ${isActive ? 'active' : ''}`} id="fnav-new-ticket">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Créer un ticket
            </NavLink>
          </nav>

          <Link to="/login" className="front-admin-btn" id="fnav-admin">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zM2 20c0-4 4.5-7 10-7s10 3 10 7"/>
            </svg>
            Admin
          </Link>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="front-main">
        <Outlet />
      </main>
    </div>
  );
};
