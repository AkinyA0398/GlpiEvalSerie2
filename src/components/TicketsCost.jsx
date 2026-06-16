import React, { useState, useEffect } from 'react';
import { fetchGlpiTickets } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';
import { apiLocalStatus } from '../api/configApi';
import { fetchGlpiItems } from '../services/CrudService';
const TicketsCost = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [items,setItems]=useState([]);  
  const [tickets, setTickets] = useState([]);
  const [allLinks, setAllLinks] = useState([]);
  const [allCostsGlpi, setAllCostsGlpi] = useState([]);
  const [allSuperCostsLocal, setAllSuperCostsLocal] = useState([]);

  const [hardwareSummary, setHardwareSummary] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    loadAllCostData();
  }, []);

  const loadAllCostData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, linksRes, costsGlpiRes, costsLocalRes, detailsLocalRes] = await Promise.all([
        fetchGlpiTickets(),
        apiGlpi('Item_Ticket'),
        apiGlpi('TicketCost'),
        apiLocalStatus('cost'),       
        apiLocalStatus('costDetails') 
      ]);
      const typesToFetch = ['Computer', 'Monitor', 'Phone']; 
            const itemsPromises = typesToFetch.map(async (type) => {
              try {
                const res = await fetchGlpiItems(type);
                const cleanItems = Array.isArray(res) ? res : [];
                return cleanItems.map(item => ({ ...item, itemtype: type }));
              } catch(er) {
                console.log(er);
                return [] ; 
              }
            });
      
            const allItemsResults = await Promise.all(itemsPromises);
      const flattenedItems = allItemsResults.flat();
      const cleanTickets = Array.isArray(ticketsRes) ? ticketsRes : [];
      const cleanLinks = Array.isArray(linksRes) ? linksRes : [];
      const cleanCostsGlpi = Array.isArray(costsGlpiRes) ? costsGlpiRes : [];
      const cleanCostsLocal = Array.isArray(costsLocalRes) ? costsLocalRes : [];
      const cleanDetailsLocal = Array.isArray(detailsLocalRes) ? detailsLocalRes : [];
      setItems(flattenedItems);
      setTickets(cleanTickets);
      setAllLinks(cleanLinks);
      setAllCostsGlpi(cleanCostsGlpi);
      setAllSuperCostsLocal(cleanCostsLocal);

      calculateHardwareCosts(cleanLinks, cleanCostsGlpi, cleanCostsLocal, cleanDetailsLocal, cleanTickets, flattenedItems);

    } catch (err) {
      console.error("Erreur lors du calcul de la synthèse financière :", err);
      setMessage({ text: "Impossible de charger la synthèse analytique.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateHardwareCosts = (links, glpiCosts, localTotals, localDetails, rawTickets, glpiItems) => {
    const summary = {};

    links.forEach(link => {
      const type = link.itemtype; 
      const ticketId = parseInt(link.tickets_id, 10);
      const itemId = parseInt(link.items_id, 10); 
      
      const matchedHardware = glpiItems.find(
        i => i.itemtype === type && parseInt(i.id, 10) === itemId
      );
      // console.log(glpiItems);
      const correspondingTicket = rawTickets.find(t => parseInt(t.id, 10) === ticketId);
      const itemName = matchedHardware?.name || correspondingTicket?.item_name || `${type} #${itemId}`;
    
      if (!summary[type]) {
        summary[type] = { count: 0, glpiCost: 0, superCost: 0, reouverture: 0, details: {} };
      }

      if (!summary[type].details[itemId]) {
        summary[type].details[itemId] = { 
          id: itemId, 
          name: itemName,
          glpiCost: 0, 
          superCost: 0, 
          reouverture: 0 
        };
      }

      const costsForTicket = glpiCosts.filter(c => parseInt(c.tickets_id, 10) === ticketId);
      let ticketGlpiTotal = costsForTicket.reduce((sum, item) => {
        const fixed = parseFloat(item.cost_fixed) || 0;
        const material = parseFloat(item.cost_material) || 0;
        const time = parseFloat(item.cost_time) || 0;
        const minutes = parseInt(item.actiontime, 10) || 0;
        return sum + fixed + material + (time * (minutes / 3600));
      }, 0);

      const totalItemsOnTicket = links.filter(l => parseInt(l.tickets_id, 10) === ticketId).length;
      const distributedGlpiCost = totalItemsOnTicket > 0 ? (ticketGlpiTotal / totalItemsOnTicket) : ticketGlpiTotal;

      summary[type].glpiCost += distributedGlpiCost;
      summary[type].details[itemId].glpiCost += distributedGlpiCost;
    });

    Object.keys(summary).forEach(type => {
      summary[type].count = Object.keys(summary[type].details).length;
    });

    localTotals.forEach(entry => {
      const type = entry.item_id; 
      if (summary[type]) {
        summary[type].superCost = parseFloat(entry.cost) || 0;
        summary[type].reouverture = parseFloat(entry.prix) || 0;
      }
    });

    localDetails.forEach(detail => {
      const ticketId = parseInt(detail.id_ticket, 10);
      const costValue = parseFloat(detail.cost) || 0;
      const reouvertureValue = parseFloat(detail.prix) || 0;

      const linksForTicket = links.filter(l => parseInt(l.tickets_id, 10) === ticketId);
      const totalEquipements = linksForTicket.length;

      if (totalEquipements > 0) {
        const shareCost = costValue / totalEquipements;
        const shareReouverture = reouvertureValue / totalEquipements;

        linksForTicket.forEach(link => {
          const type = link.itemtype;
          const itemId = parseInt(link.items_id, 10);

          if (summary[type] && summary[type].details[itemId]) {
            summary[type].details[itemId].superCost += shareCost;
            summary[type].details[itemId].reouverture += shareReouverture;
          }
        });
      }
    });

    const formattedData = Object.keys(summary).map(key => ({
      hardwareType: key,
      count: summary[key].count,
      glpiCost: summary[key].glpiCost,
      superCost: summary[key].superCost,
      reouverture: summary[key].reouverture, 
      totalCost: summary[key].glpiCost + summary[key].superCost + summary[key].reouverture,
      itemsList: Object.values(summary[key].details)
    }));
    setHardwareSummary(formattedData);
  };

  const openDetailsModal = (item) => {
    setModalData(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const grandTotalReouverture = hardwareSummary.reduce((sum, item) => sum + item.reouverture, 0);
  const grandTotalGlpi = hardwareSummary.reduce((sum, item) => sum + item.glpiCost, 0);
  const grandTotalSuper = hardwareSummary.reduce((sum, item) => sum + item.superCost, 0);
  const grandTotalAll = hardwareSummary.reduce((sum, item) => sum + item.totalCost, 0);
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Calcul analytique et distribution des coûts d'infrastructure...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.mainTitle}>Comptabilité Analytique par Parc Matériel</h2>
          <p style={styles.subtitle}>Répartition des charges financières : GLPI vs Base Locale SQLite</p>
        </div>
        <button onClick={loadAllCostData} style={styles.refreshBtn}>Actualiser les coûts</button>
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
              <th style={styles.th}>Type d'infrastructure (Cliquer pour voir les équipements)</th>
              <th style={{ ...styles.th, textAlign: 'right', color: '#64748b' }}>Réouverture (Local)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Coût GLPI (Native)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Super Coût (Clôture)</th>
              <th style={{ ...styles.th, textAlign: 'right', color: '#00d2ff' }}>Coût Total Brut</th>
            </tr>
          </thead>
          <tbody>
            {hardwareSummary.map((item, idx) => (
              <tr key={idx} onClick={() => openDetailsModal(item)} style={styles.trInteractive}>
                <td style={styles.tdHardware}>
              
                  {item.hardwareType} ({item.count})
                </td>
                <td style={{ ...styles.tdCost, color: '#416ea8ff' }}>
                  {item.reouverture.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} 
                </td>
                <td style={{ ...styles.tdCost, color: '#346291ff' }}>
                  {item.glpiCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} 
                </td>
                <td style={{ ...styles.tdCost, color: '#38bdf8' }}>
                  {item.superCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} 
                </td>
                <td style={{ ...styles.tdCost, fontWeight: '700', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.02)' }}>
                  {item.totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} 
                </td>
              </tr>
            ))}

            {/* LIGNE DE TOTAL GLOBAL */}
            <tr style={styles.totalRow}>
              <td style={styles.tdTotalLabel}>TOTAL PARC INFORMATIQUE</td>
              <td style={{ ...styles.tdTotalValue, color: '#25548eff' }}>
                {grandTotalReouverture.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} 
              </td>
              <td style={styles.tdTotalValue}>
                {grandTotalGlpi.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} 
              </td>
              <td style={{ ...styles.tdTotalValue, color: '#38bdf8' }}>
                {grandTotalSuper.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} 
              </td>
              <td style={{ ...styles.tdTotalValue, color: '#121212', backgroundColor: '#10b981', textAlign: 'right' }}>
                {grandTotalAll.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} 
              </td>
            </tr>
          </tbody>
        </table>
      </div>

     
      {isModalOpen && modalData && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Détails Équipements — {modalData.hardwareType}</h3>
              <button style={styles.closeModalBtn} onClick={closeModal}>&times;</button>
            </div>
            
            <div style={styles.modalBody}>
              <table style={styles.nestedTable}>
                <thead>
                  <tr style={styles.nestedThRow}>
                    <th style={styles.nestedTh}>Nom de l'Équipement</th>
                    <th style={styles.nestedThRight}>Réouverture</th>
                    <th style={styles.nestedThRight}>Coût GLPI</th>
                    <th style={styles.nestedThRight}>Super Coût</th>
                    <th style={styles.nestedThRight}>Total Machine</th>
                  </tr>
                </thead>
                <tbody>
                  {modalData.itemsList.map((subItem, sIdx) => (
                    <tr key={sIdx} style={styles.nestedTr}>
                      <td style={styles.nestedTdName}>🖥️ {subItem.name}</td>
                      <td style={styles.nestedTdValue}>{subItem.reouverture.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA</td>
                      <td style={styles.nestedTdValue}>{subItem.glpiCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA</td>
                      <td style={styles.nestedTdValue}>{subItem.superCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA</td>
                      <td style={{ ...styles.nestedTdValue, color: '#00d2ff', fontWeight: '600' }}>
                        {(subItem.glpiCost + subItem.superCost + subItem.reouverture).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
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

export default TicketsCost;