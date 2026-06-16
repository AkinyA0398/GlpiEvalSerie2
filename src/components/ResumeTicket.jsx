import { useState, useEffect, useCallback } from 'react';
import { fetchGlpiTickets } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';
import { apiLocalStatus } from '../api/configApi';

const ResumeTicket = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [hardwareSummary, setHardwareSummary] = useState([]);

  const calculateHardwareCosts = useCallback((links, glpiCosts, localCosts) => {
    const summary = {
      Computer: { count: 0, glpiCost: 0, superCost: 0, reouverture: 0 },
      Phone: { count: 0, glpiCost: 0, superCost: 0, reouverture: 0 },
      Monitor: { count: 0, glpiCost: 0, superCost: 0, reouverture: 0 }
    };

    links.forEach(link => {
      const type = link.itemtype; 
      const ticketId = parseInt(link.tickets_id, 10);

      if (!summary[type]) {
        summary[type] = { count: 0, glpiCost: 0, superCost: 0, reouverture: 0 };
      }

      summary[type].count += 1;

      const costsForTicket = glpiCosts.filter(c => parseInt(c.tickets_id, 10) === ticketId);
      let ticketGlpiTotal = costsForTicket.reduce((sum, item) => {
        const fixed = parseFloat(item.cost_fixed) || 0;
        const material = parseFloat(item.cost_material) || 0;
        const time = parseFloat(item.cost_time) || 0;
        const minutes = parseInt(item.actiontime, 10) || 0;
        return sum + fixed + material + (time * (minutes / 3600));
      }, 0);

      const totalItemsOnTicket = links.filter(l => parseInt(l.tickets_id, 10) === ticketId).length;
      summary[type].glpiCost += totalItemsOnTicket > 0 ? (ticketGlpiTotal / totalItemsOnTicket) : ticketGlpiTotal;
    });

    localCosts.forEach(entry => {
      const type = entry.item_id; 
      const costValue = parseFloat(entry.cost) || 0;
      const reouvertureValue = parseFloat(entry.prix) || 0; 

      if (summary[type]) {
        summary[type].superCost += costValue;
        summary[type].reouverture += reouvertureValue; 
      } else {
        summary[type] = { count: 0, glpiCost: 0, superCost: costValue, reouverture: reouvertureValue };
      }
    });

    const formattedData = Object.keys(summary).map(key => ({
      category: key,
      count: summary[key].count,
      glpiCost: summary[key].glpiCost,
      superCost: summary[key].superCost,
      reouverture: summary[key].reouverture, 
      totalCost: summary[key].glpiCost + summary[key].superCost + summary[key].reouverture
    }));

    setHardwareSummary(formattedData);
  }, []);

  const loadAllCostData = useCallback(async () => {
    setLoading(true);
    try {
      const [, linksRes, costsGlpiRes, costsLocalRes] = await Promise.all([
        fetchGlpiTickets(),
        apiGlpi('Item_Ticket'),
        apiGlpi('TicketCost'),
        apiLocalStatus('cost')
      ]);

      const cleanLinks = Array.isArray(linksRes) ? linksRes : [];
      const cleanCostsGlpi = Array.isArray(costsGlpiRes) ? costsGlpiRes : [];
      const cleanCostsLocal = Array.isArray(costsLocalRes) ? costsLocalRes : [];

      calculateHardwareCosts(cleanLinks, cleanCostsGlpi, cleanCostsLocal);

    } catch (err) {
      console.error("Erreur lors du calcul du résumé :", err);
      setMessage({ text: "Impossible de charger le résumé des tickets.", type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [calculateHardwareCosts]);

  useEffect(() => {
    let isMounted = true;
    const fetchAndLoad = async () => {
      if (isMounted) {
        await loadAllCostData();
      }
    };
    fetchAndLoad();
    return () => { isMounted = false; };
  }, [loadAllCostData]);


  const grandTotalReouverture = hardwareSummary.reduce((sum, item) => sum + item.reouverture, 0);
  const grandTotalGlpi = hardwareSummary.reduce((sum, item) => sum + item.glpiCost, 0);
  const grandTotalSuper = hardwareSummary.reduce((sum, item) => sum + item.superCost, 0);
  const grandTotalAll = hardwareSummary.reduce((sum, item) => sum + item.totalCost, 0);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Chargement du résumé financier...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.mainTitle}>Résumé Financier des Tickets</h2>
          <p style={styles.subtitle}>Tableau de bord : Catégorie, Coût GLPI, Coût Saisi, Coût Réouverture</p>
        </div>
        <button onClick={loadAllCostData} style={styles.refreshBtn}>Actualiser</button>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Catégorie</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Coût GLPI</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Coût Saisi</th>
              <th style={{ ...styles.th, textAlign: 'right', color: '#64748b' }}>Coût Réouverture</th>
              <th style={{ ...styles.th, textAlign: 'right', color: '#00d2ff' }}>Somme (Tous Coûts)</th>
            </tr>
          </thead>
          <tbody>
            {hardwareSummary.map((item, idx) => (
              <tr key={idx} style={styles.tr}>
                <td style={styles.tdHardware}>
                  {item.category}
                </td>
                <td style={{ ...styles.tdCost, color: '#1A1D2E' }}>
                  {item.glpiCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
                </td>
                <td style={{ ...styles.tdCost, color: '#4338CA' }}>
                  {item.superCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
                </td>
                <td style={{ ...styles.tdCost, color: '#5A6178', textAlign: 'right' }}>
                  {item.reouverture.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
                </td>
                <td style={{ ...styles.tdCost, fontWeight: '700', color: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.04)' }}>
                  {item.totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
                </td>
              </tr>
            ))}

            {/* LIGNE DE TOTAL GLOBAL */}
            <tr style={styles.totalRow}>
              <td style={styles.tdTotalLabel}>TOTAL GLOBAL</td>
              <td style={styles.tdTotalValue}>
                {grandTotalGlpi.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
              </td>
              <td style={{ ...styles.tdTotalValue, color: '#4338CA' }}>
                {grandTotalSuper.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
              </td>
              <td style={{ ...styles.tdTotalValue, color: '#5A6178' }}>
                {grandTotalReouverture.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
              </td>
              <td style={{ ...styles.tdTotalValue, color: '#FFFFFF', backgroundColor: '#059669', textAlign: 'right' }}>
                {grandTotalAll.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8F9FC' },
  loadingText: { color: '#4338CA', fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600' },
  page: { backgroundColor: '#F8F9FC', minHeight: '100vh', color: '#1A1D2E', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: '30px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #E2E6EF', paddingBottom: '16px' },
  mainTitle: { fontSize: '24px', fontWeight: '800', color: '#1A1D2E', margin: '0 0 6px 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '14px', color: '#8B92A8', margin: 0 },
  refreshBtn: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#5A6178', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(26, 29, 46, 0.04)' },
  alertError: { padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626' },
  tableWrapper: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(26, 29, 46, 0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  thRow: { backgroundColor: '#F8F9FC', borderBottom: '2px solid #E2E6EF' },
  th: { padding: '16px 20px', color: '#5A6178', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #E2E6EF', transition: 'background-color 0.2s' },
  tdHardware: { padding: '16px 20px', fontWeight: '700', color: '#1A1D2E', textTransform: 'capitalize' },
  tdCost: { padding: '16px 20px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' },
  totalRow: { backgroundColor: '#F1F3F9', borderTop: '3px solid #E2E6EF' },
  tdTotalLabel: { padding: '20px', fontWeight: '800', color: '#059669', letterSpacing: '0.5px', textTransform: 'uppercase' },
  tdTotalValue: { padding: '20px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '16px', fontWeight: '800', color: '#1A1D2E' }
};

export default ResumeTicket;
