
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
    backgroundColor: '#f1f5f9',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    color: '#0f172a'
  },
  card: {
    maxWidth: '980px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '22px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '18px',
    marginBottom: '18px'
  },
  title: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0072ff' 
  },
  subtitle: {
    marginTop: 6,
    fontSize: '13px',
    color: '#64748b'
  },
  confirmBox: {
    border: '1px dashed #cbd5e1',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '14px',
    backgroundColor: '#f8fafc'
  },
  confirmText: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: 1.5
  },
  actionWrap: {
    marginTop: 12
  }
};

export default ResetData;