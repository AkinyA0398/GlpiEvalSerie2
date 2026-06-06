import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ADMIN_CODE } from '../auth/AuthContext';

export const LoginPage: React.FC = () => {
  const [code, setCode] = useState(ADMIN_CODE); // pré-rempli par défaut
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/backoffice/import';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(code.trim());
    if (ok) {
      navigate(from, { replace: true });
    } else {
      setError('Code incorrect. Accès refusé.');
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
  };

  return (
    <div className="login-bg">
      <div className={`login-card ${shaking ? 'shake' : ''}`}>
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="url(#grad)"/>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/>
                <stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
            <path d="M24 12a6 6 0 0 0-6 6v2h-2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V22a2 2 0 0 0-2-2h-2v-2a6 6 0 0 0-6-6zm0 3a3 3 0 0 1 3 3v2h-6v-2a3 3 0 0 1 3-3zm0 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="white"/>
          </svg>
        </div>
        <h1 className="login-title">Backoffice</h1>
        <p className="login-subtitle">Entrez le code d'accès administrateur</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="access-code">Code d'accès</label>
            <input
              id="access-code"
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); }}
              placeholder="Code unique"
              autoComplete="off"
              spellCheck={false}
              className={error ? 'input-error' : ''}
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" id="btn-login">
            <span>Accéder au backoffice</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </form>

        <p className="login-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          Application GLPI — Accès restreint
        </p>
      </div>
    </div>
  );
};
