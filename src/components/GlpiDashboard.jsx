import { useState, useEffect } from 'react';
import { fetchGlpiItems, fetchGlpiTickets } from '../services/CrudService';

const GlpiDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [itemStats, setItemStats] = useState({
    total: 0,
    byType: { Computer: 0, Monitor: 0, NetworkEquipment: 0, Peripheral: 0 }
  });

  const [ticketStats, setTicketStats] = useState({
    total: 0,
    byType: { Incident: 0, Request: 0 }
  });



  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const itemTypes = ['Computer', 'Monitor', 'NetworkEquipment', 'Peripheral'];
      const itemPromises = itemTypes.map(async (type) => {
        try {
          const res = await fetchGlpiItems(type);
          return { type, count: Array.isArray(res) ? res.length : 0 };
        } catch {
          return { type, count: 0 };
        }
      });

      const itemResults = await Promise.all(itemPromises);
      
      let totalItemsCount = 0;
      const itemsByType = {};
      itemResults.forEach(res => {
        itemsByType[res.type] = res.count;
        totalItemsCount += res.count;
      });

      setItemStats({
        total: totalItemsCount,
        byType: itemsByType
      });

      try {
        const tickets = await fetchGlpiTickets();
        const cleanTickets = Array.isArray(tickets) ? tickets : [];
        
        let incidents = 0;
        let requests = 0;

        cleanTickets.forEach(ticket => {
          if (Number(ticket.type) === 2) {
            requests++;
          } else {
            incidents++;
          }
        });

        setTicketStats({
          total: cleanTickets.length,
          byType: {
            Incident: incidents,
            Request: requests
          }
        });

      } catch (e) {
        console.warn("Impossible de charger les statistiques des tickets :", e);
      }

    } catch (err) {
      setError(`Erreur lors du calcul des statistiques : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Chargement des indicateurs analytiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>Erreur système : {error}</div>
      </div>
    );
  }

  const itemTypeConfig = {
    Computer: { label: 'Ordinateurs', gradient: 'linear-gradient(90deg, #0072ff, #00c6ff)' },
    Monitor: { label: 'Ecrans', gradient: 'linear-gradient(90deg, #38bdf8, #7dd3fc)' },
    NetworkEquipment: { label: 'Materiels Reseau', gradient: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' },
    Peripheral: { label: 'Peripheriques', gradient: 'linear-gradient(90deg, #0284c7, #0ea5e9)' }
  };

  return (
    <div style={styles.page}>
      
      {/* En-tête de page */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.mainTitle}>Tableau de Bord Analytique</h2>
          <p style={styles.subtitle}>Vue generale des actifs du parc informatique et de la distribution des flux d'assistance.</p>
        </div>
        <button onClick={loadDashboardData} style={styles.refreshBtn}>
          Actualiser les indicateurs
        </button>
      </div>

      {/* ================= SECTION 1 : LES KPI GENERAUX ================= */}
      <div style={styles.kpiGrid}>
        
        {/* KPI Eléments Globaux */}
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #00d2ff' }}>
          <div style={styles.kpiLabel}>Elements Globaux du Parc</div>
          <div style={styles.kpiValueRow}>
            <span style={styles.kpiNumber}>{itemStats.total}</span>
            <span style={styles.kpiBadge}>Actifs</span>
          </div>
        </div>

        {/* KPI Tickets Totaux */}
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #ef4444' }}>
          <div style={styles.kpiLabel}>Volume Total de Tickets</div>
          <div style={styles.kpiValueRow}>
            <span style={styles.kpiNumber}>{ticketStats.total}</span>
            <span style={{ ...styles.kpiBadge, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>Flux</span>
          </div>
        </div>

      </div>

      {/* ================= SECTION 2 : REPARTITIONS ET DETAIL EN GRILLE ================= */}
      <div style={styles.detailsGrid}>
        
        {/* Bloc Repartition du Parc */}
        <div style={styles.contentCard}>
          <h3 style={styles.cardTitle}>Repartition Sommaire du Parc</h3>
          <div style={styles.itemDistributionList}>
            {Object.keys(itemStats.byType).map(type => {
              const config = itemTypeConfig[type] || { label: type, color: '#cbd5e1' };
              const percentage = itemStats.total > 0 ? Math.round((itemStats.byType[type] / itemStats.total) * 100) : 0;
              
              return (
                <div key={type} style={styles.distributionRow}>
                  <div style={styles.rowMetadata}>
                    <span style={styles.rowLabel}>{config.label}</span>
                    <span style={styles.rowValue}>
                      {itemStats.byType[type]} <span style={styles.rowPercentage}>({percentage}%)</span>
                    </span>
                  </div>
                  {/* Conteneur de barre de progression macro */}
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${percentage}%`, background: config.gradient }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloc Typologie des Tickets */}
        <div style={styles.contentCard}>
          <h3 style={styles.cardTitle}>Classification des Demandes</h3>
          <div style={styles.ticketTypeContainer}>
            
            {/* Carte Flux Incidents */}
            <div style={styles.ticketRowIncident}>
              <div style={styles.ticketMeta}>
                <div style={styles.ticketMainLabel}>Incidents</div>
                <div style={styles.ticketSubLabel}>Dysfonctionnements et pannes materielles</div>
              </div>
              <span style={styles.ticketCounterIncident}>{ticketStats.byType.Incident}</span>
            </div>

            {/* Carte Flux Demandes de Service */}
            <div style={styles.ticketRowRequest}>
              <div style={styles.ticketMeta}>
                <div style={styles.ticketMainLabelRequest}>Demandes de Service</div>
                <div style={styles.ticketSubLabel}>Besoins d'acces, dotations ou installations</div>
              </div>
              <span style={styles.ticketCounterRequest}>{ticketStats.byType.Request}</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

const styles = {
  page: { backgroundColor: '#f1f5f9', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', backgroundColor: '#f1f5f9' },
  loadingText: { color: '#0072ff', fontSize: '14px', fontFamily: 'monospace' },
  errorContainer: { padding: '24px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #ef4444', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  errorText: { color: '#dc2626', fontSize: '14px', margin: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '32px' },
  mainTitle: { fontSize: '24px', fontWeight: '700', color: '#0072ff', margin: '0 0 6px 0' },
  subtitle: { fontSize: '13px', color: '#64748b', margin: 0 },
  refreshBtn: { backgroundImage: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)', border: 'none', color: '#ffffff', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 114, 255, 0.2)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' },
  kpiCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  kpiLabel: { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  kpiValueRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '14px' },
  kpiNumber: { fontSize: '38px', fontWeight: '800', color: '#0f172a' },
  kpiBadge: { fontSize: '11px', fontWeight: '700', color: '#0072ff', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' },
  contentCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  cardTitle: { margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' },
  itemDistributionList: { display: 'flex', flexDirection: 'column', gap: '18px' },
  distributionRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  rowMetadata: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600' },
  rowLabel: { color: '#475569' },
  rowValue: { color: '#0f172a' },
  rowPercentage: { fontWeight: '400', color: '#94a3b8', fontSize: '12px', marginLeft: '4px' },
  progressBarBg: { width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  progressBarFill: { height: '100%', borderRadius: '3px' },
  ticketTypeContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  ticketRowIncident: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' },
  ticketMeta: { display: 'flex', flexDirection: 'column', gap: '4px' },
  ticketMainLabel: { fontWeight: '700', color: '#dc2626', fontSize: '14px' },
  ticketSubLabel: { fontSize: '12px', color: '#64748b' },
  ticketCounterIncident: { fontSize: '26px', fontWeight: '800', color: '#dc2626' },
  ticketRowRequest: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' },
  ticketMainLabelRequest: { fontWeight: '700', color: '#0284c7', fontSize: '14px' },
  ticketCounterRequest: { fontSize: '26px', fontWeight: '800', color: '#0284c7' }
};

export default GlpiDashboard;