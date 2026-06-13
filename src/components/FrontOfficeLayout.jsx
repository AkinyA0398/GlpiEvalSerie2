import React from 'react';
import { Link } from 'react-router-dom';

const FrontOfficeLayout = ({ children }) => {
  return (
    <div style={styles.container}>
      {/* Barre laterale gauche */}
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <h2 style={styles.logoText}>GLPI Support</h2>
          <span style={styles.logoSub}>Frontoffice / Espace Public</span>
        </div>
        
        <nav style={styles.nav}>
            <Link to="/ticketKanban" style={styles.navLink}>Liste tickets (Kanban)</Link>
          <Link to="/list" style={styles.navLink}>Vue du parc materiel</Link>
          <Link to="/ticket" style={styles.navLinkAction}>+ Declarer un ticket</Link>
          
        </nav>

        <div style={styles.footerInfo}>
          <Link to="/admin" style={styles.adminAccessBtn}>
            Acces Administration
          </Link>
        </div>
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
  navLink: { color: '#5A6178', textDecoration: 'none', fontSize: '14px', fontWeight: '500', padding: '10px 14px', borderRadius: '8px', transition: 'all 0.2s' },
  navLinkAction: { color: '#FFFFFF', backgroundColor: '#4338CA', textDecoration: 'none', fontSize: '14px', fontWeight: '600', padding: '12px 14px', borderRadius: '8px', transition: 'all 0.2s', marginTop: '8px', textAlign: 'center' },
  footerInfo: { borderTop: '1px solid #E2E6EF', paddingTop: '16px', display: 'flex', flexDirection: 'column' },
  adminAccessBtn: { color: '#8B92A8', textDecoration: 'none', fontSize: '12px', fontWeight: '500', transition: 'color 0.2s', textAlign: 'center' },
  mainContent: { flexGrow: 1, marginLeft: '260px', padding: '40px', boxSizing: 'border-box', minWidth: 0, backgroundColor: '#F8F9FC' },
  contentWrapper: { maxWidth: '1200px', margin: '0 auto' }
};

export default FrontOfficeLayout;