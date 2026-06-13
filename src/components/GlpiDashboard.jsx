import React, { useState, useEffect } from 'react';
import { fetchGlpiItems, fetchGlpiTickets } from '../services/CrudService';

const GlpiDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [itemStats, setItemStats] = useState({
    total: 0,
    // CORRECTION : Utilisation de la casse et des types exacts de l'API GLPI
    byType: { Computer: 0, Monitor: 0, Phone: 0 }
  });

  const [ticketStats, setTicketStats] = useState({
    total: 0,
    byType: { Incident: 0, Request: 0 }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Les endpoints GLPI valides correspondants a votre parc
      const itemTypes = ['Computer', 'Monitor', 'Phone'];
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
      const itemsByType = { Computer: 0, Monitor: 0, Phone: 0 };
      
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
        <div style={styles.errorText}>Erreur systeme : {error}</div>
      </div>
    );
  }

  const itemTypeConfig = {
    Computer: { label: 'Ordinateurs', color: '#4338CA' },
    Monitor: { label: 'Ecrans', color: '#6366F1' },
    Phone: { label: 'Telephones', color: '#818CF8' }
  };

  return (
    <div style={styles.page}>
      
      {/* En-tete de page */}
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
        
        {/* KPI Elements Globaux */}
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #4338CA' }}>
          <div style={styles.kpiLabel}>Elements Globaux du Parc</div>
          <div style={styles.kpiValueRow}>
            <span style={styles.kpiNumber}>{itemStats.total}</span>
            <span style={styles.kpiBadge}>Actifs</span>
          </div>
        </div>

        {/* KPI Tickets Totaux */}
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #D97706' }}>
          <div style={styles.kpiLabel}>Volume Total de Tickets</div>
          <div style={styles.kpiValueRow}>
            <span style={styles.kpiNumber}>{ticketStats.total}</span>
            <span style={{ ...styles.kpiBadge, color: '#D97706', backgroundColor: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)' }}>Flux</span>
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
              const config = itemTypeConfig[type] || { label: type, color: '#8B92A8' };
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
                    <div style={{ ...styles.progressBarFill, width: `${percentage}%`, backgroundColor: config.color }} />
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
  page: { backgroundColor: '#F8F9FC', color: '#1A1D2E', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', backgroundColor: '#F8F9FC' },
  loadingText: { color: '#4338CA', fontSize: '14px', fontWeight: '600' },
  errorContainer: { padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.2)' },
  errorText: { color: '#DC2626', fontSize: '14px', margin: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', borderBottom: '1px solid #E2E6EF', paddingBottom: '20px', marginBottom: '32px' },
  mainTitle: { fontSize: '24px', fontWeight: '800', color: '#1A1D2E', margin: '0 0 6px 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '14px', color: '#8B92A8', margin: 0 },
  refreshBtn: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#4338CA', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(26, 29, 46, 0.04)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' },
  kpiCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(26, 29, 46, 0.05)' },
  kpiLabel: { fontSize: '12px', fontWeight: '600', color: '#8B92A8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  kpiValueRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '14px' },
  kpiNumber: { fontSize: '38px', fontWeight: '800', color: '#1A1D2E' },
  kpiBadge: { fontSize: '11px', fontWeight: '700', color: '#4338CA', backgroundColor: 'rgba(67, 56, 202, 0.08)', border: '1px solid rgba(67, 56, 202, 0.25)', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' },
  contentCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(26, 29, 46, 0.05)' },
  cardTitle: { margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#1A1D2E', borderBottom: '1px solid #E2E6EF', paddingBottom: '12px' },
  itemDistributionList: { display: 'flex', flexDirection: 'column', gap: '18px' },
  distributionRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  rowMetadata: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600' },
  rowLabel: { color: '#5A6178' },
  rowValue: { color: '#1A1D2E' },
  rowPercentage: { fontWeight: '400', color: '#8B92A8', fontSize: '12px', marginLeft: '4px' },
  progressBarBg: { width: '100%', height: '6px', backgroundColor: '#F1F3F9', borderRadius: '3px', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: '3px', transition: 'width 0.6s ease' },
  ticketTypeContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  ticketRowIncident: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'rgba(220, 38, 38, 0.03)', borderRadius: '10px', border: '1px solid rgba(220, 38, 38, 0.12)' },
  ticketMeta: { display: 'flex', flexDirection: 'column', gap: '4px' },
  ticketMainLabel: { fontWeight: '700', color: '#DC2626', fontSize: '14px' },
  ticketSubLabel: { fontSize: '12px', color: '#8B92A8' },
  ticketCounterIncident: { fontSize: '26px', fontWeight: '800', color: '#DC2626' },
  ticketRowRequest: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'rgba(67, 56, 202, 0.03)', borderRadius: '10px', border: '1px solid rgba(67, 56, 202, 0.12)' },
  ticketMainLabelRequest: { fontWeight: '700', color: '#4338CA', fontSize: '14px' },
  ticketCounterRequest: { fontSize: '26px', fontWeight: '800', color: '#4338CA' }
};

export default GlpiDashboard;