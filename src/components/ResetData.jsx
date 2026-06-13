import React from 'react';
import GlpiReset from './GlpiReset';

const ResetData = () => {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.titleRow}>
          <div>
            <div style={styles.title}>Administration - Réinitialisation</div>
            <div style={styles.subtitle}>Espace de confirmation pour remettre l'application à zéro.</div>
          </div>
        </div>

        <div style={styles.confirmBox}>
          <div style={styles.confirmText}>
            Cette action purge proprement l'ensemble des données structurelles, les tickets, les liaisons matérielles ainsi que les utilisateurs configurés via l'API.
          </div>
        </div>

        <div style={styles.actionWrap}>
          <GlpiReset />
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    padding: '28px 18px',
    backgroundColor: '#F8F9FC',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: '#1A1D2E'
  },
  card: {
    maxWidth: '980px',
    margin: '0 auto',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E6EF',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(26, 29, 46, 0.05)'
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '18px',
    marginBottom: '18px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#1A1D2E',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    marginTop: 6,
    fontSize: '14px',
    color: '#8B92A8'
  },
  confirmBox: {
    border: '1px dashed #E2E6EF',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '14px',
    backgroundColor: '#F8F9FC'
  },
  confirmText: {
    fontSize: '14px',
    color: '#5A6178',
    lineHeight: 1.5,
    fontWeight: 500
  },
  actionWrap: {
    marginTop: 12
  }
};

export default ResetData;