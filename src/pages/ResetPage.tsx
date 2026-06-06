import React, { useState } from 'react';

export const ResetPage: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'confirming' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleAskConfirm = () => setStatus('confirming');
  const handleCancel = () => setStatus('idle');

  const handleConfirm = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Erreur serveur (HTTP ${res.status}) : le serveur n'a pas renvoyé de JSON valide.`);
      }
      if (!res.ok) throw new Error(data.error || data.message || 'Erreur lors de la réinitialisation');
      setMessage(data.message || 'Données réinitialisées avec succès.');
      setStatus('success');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  };

  return (
    <div className="bo-page">
      <div className="bo-page-header">
        <div>
          <h1 className="bo-page-title">Réinitialiser les données</h1>
          <p className="bo-page-sub">Supprime toutes les données dans GLPI (les fichiers locaux sont conservés)</p>
        </div>
      </div>

      <div className="bo-cards-grid-single">
        <div className="bo-card reset-card">
          {/* Icône */}
          <div className="reset-icon-wrap">
            <div className="reset-icon-pulse" />
            <div className="reset-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-4.65"/>
              </svg>
            </div>
          </div>

          <h2 className="reset-title">Réinitialisation GLPI</h2>
          <p className="reset-desc">
            Cette action supprime <strong>toutes les données</strong> importées dans GLPI
            (ordinateurs, moniteurs, documents).
            <br /><br />
            📁 Les fichiers locaux dans <code>/import/csv</code> et <code>/import/image</code> sont <strong>conservés</strong>.
            <br />
            ⚠️ La suppression dans GLPI est <strong>irréversible</strong>.
          </p>

          {/* Effets de l'opération */}
          <div className="reset-effects">
            <div className="effect-item effect-danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Ordinateurs GLPI supprimés
            </div>
            <div className="effect-item effect-danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Moniteurs GLPI supprimés
            </div>
            <div className="effect-item effect-danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Documents GLPI supprimés
            </div>
            <div className="effect-item" style={{ color: 'var(--success)', opacity: 0.85 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Fichiers locaux conservés
            </div>
          </div>

          {/* État : message retour */}
          {(status === 'success' || status === 'error') && message && (
            <div className={`bo-alert ${status === 'success' ? 'alert-success' : 'alert-error'}`}>
              {status === 'success' ? '✅' : '❌'} {message}
            </div>
          )}

          {/* Bouton principal / confirmation */}
          {status !== 'confirming' && status !== 'loading' && (
            <button
              className="bo-btn bo-btn-danger"
              onClick={status === 'success' || status === 'error' ? handleAskConfirm : handleAskConfirm}
              id="btn-reset-ask"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-4.65"/>
              </svg>
              Réinitialiser les données
            </button>
          )}

          {status === 'loading' && (
            <button className="bo-btn bo-btn-danger" disabled>
              <span className="spinner" />
              Réinitialisation en cours…
            </button>
          )}

          {/* Panneau de confirmation */}
          {status === 'confirming' && (
            <div className="confirm-panel">
              <p className="confirm-question">⚠️ Confirmer la réinitialisation ?</p>
              <div className="confirm-actions">
                <button className="bo-btn bo-btn-ghost" onClick={handleCancel} id="btn-reset-cancel">
                  Annuler
                </button>
                <button className="bo-btn bo-btn-danger" onClick={handleConfirm} id="btn-reset-confirm">
                  Oui, réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
