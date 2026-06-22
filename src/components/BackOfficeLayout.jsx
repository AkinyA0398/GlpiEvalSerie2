import { Link, useNavigate } from 'react-router-dom';

const BackOfficeLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/LoginBack');
  };

  return (
    <div style={styles.container}>
      {/* Barre latérale gauche */}
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <h2 style={styles.logoText}>GLPI Admin</h2>
          <span style={styles.logoSub}>Backoffice</span>
        </div>
        
        <nav style={styles.nav}>
          <Link to="/admin" style={styles.navLink}>Tableau de bord</Link>
          <Link to="/adminTicket" style={styles.navLink}>Gestion des tickets</Link>
          <Link to="/statusConfig" style={styles.navLink}>Config statuts</Link>
          <Link to="/testCsv" style={styles.navLink}>Importation CSV</Link>
          <Link to="/listreouverture" style={styles.navLink}>Résumé Réouverture</Link>
          <Link to="/cost" style={styles.navLink}>Résumé Tickets</Link>
          <Link to="/CsvMvt" style={styles.navLink}>Import Mouvement</Link>
          <Link to="/admin/reset" style={styles.navLink}>Reinitialisation</Link>
          <Link to="/list" style={styles.navLinkPublic}>Retour Vue Publique</Link>
        </nav>

        <button 
          onClick={handleLogout} 
          style={styles.logoutBtn}
          onMouseOver={(e) => { e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.06)'; }}
          onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; }}
        >
          Deconnexion
        </button>
      </aside>

      {/* Zone de contenu principale */}
      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          {children}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#F8F9FC', color: '#1A1D2E', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  sidebar: { width: '260px', backgroundColor: '#F1F3F9', borderRight: '1px solid #E2E6EF', display: 'flex', flexDirection: 'column', padding: '24px', position: 'fixed', height: '100vh', boxSizing: 'border-box', zIndex: 100 },
  logoContainer: { marginBottom: '32px', borderBottom: '1px solid #E2E6EF', paddingBottom: '16px' },
  logoText: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#4338CA', letterSpacing: '-0.02em' },
  logoSub: { fontSize: '11px', color: '#8B92A8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 },
  navLink: { color: '#5A6178', textDecoration: 'none', fontSize: '14px', fontWeight: '500', padding: '10px 14px', borderRadius: '8px', transition: 'all 0.2s', borderLeft: '3px solid transparent' },
  navLinkPublic: { color: '#4338CA', textDecoration: 'none', fontSize: '14px', fontWeight: '600', padding: '10px 14px', borderRadius: '8px', transition: 'all 0.2s', borderLeft: '3px solid #4338CA', backgroundColor: 'rgba(67, 56, 202, 0.06)', marginTop: '12px' },
  logoutBtn: { backgroundColor: 'transparent', border: '1px solid #DC2626', color: '#DC2626', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'background-color 0.2s' },
  mainContent: { flexGrow: 1, marginLeft: '260px', padding: '40px', boxSizing: 'border-box', minWidth: 0, backgroundColor: '#F8F9FC' },
  contentWrapper: { maxWidth: '1200px', margin: '0 auto' }
};

export default BackOfficeLayout;