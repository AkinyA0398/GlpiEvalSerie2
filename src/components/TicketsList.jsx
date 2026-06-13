import React, { useState, useEffect } from 'react';
import { fetchGlpiTickets, deleteGlpiTicket } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';
import { apiLocalStatus } from '../api/configApi';
const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [allLinks, setAllLinks] = useState([]);
  const [allCosts, setAllCosts] = useState([]);
  const [kanbanStatuses, setKanbanStatuses] = useState([]); 
  // ÉTAT POUR LE POP-UP GLOBAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const CURRENT_LANG = localStorage.getItem('kanban_lang') || 'fr';
  const priorityLabels = { 1: 'Très basse', 2: 'Basse', 3: 'Moyenne', 4: 'Haute', 5: 'Très haute' };
  const typeLabels = { 1: 'Incident', 2: 'Demande' };
  
  var statusConfig = {
    1: { label: 'Nouveau', color: '#00d2ff', bg: 'rgba(0, 210, 255, 0.1)', border: '#00d2ff' },
    2: { label: 'En cours (Attribué)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)', border: '#38bdf8' },
    3: { label: 'Planifié', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: '#a855f7' },
    4: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' },
    5: { label: 'Résolu', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
    6: { label: 'Clos', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: '#94a3b8' },
  };

  useEffect(() => {
    loadAllTicketsData();
  }, []);

  const loadAllTicketsData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, linksRes, costsRes] = await Promise.all([
        fetchGlpiTickets(),
        apiGlpi('Item_Ticket'),
        apiGlpi('TicketCost')
      ]);
      
      const cleanTickets = Array.isArray(ticketsRes) ? ticketsRes : [];
      cleanTickets.sort((a, b) => b.id - a.id);
      
      setTickets(cleanTickets);
      setAllLinks(Array.isArray(linksRes) ? linksRes : []);
      setAllCosts(Array.isArray(costsRes) ? costsRes : []);
      const localStatuses = await apiLocalStatus(`status?lang=${CURRENT_LANG}`);

              const formattedStatuses = {};
              localStatuses.forEach(status => {
                formattedStatuses[status.id] = {
                  id: status.id, 
                  label: status.name,
                  color: status.couleur,
                  border: status.couleur,
                  bg: status.couleur.startsWith('#') ? `${status.couleur}0D` : 'rgba(0, 210, 255, 0.05)' 
                };
              });

            setKanbanStatuses(formattedStatuses);

            console.log("kanbastatues",kanbanStatuses);
            
            

    } catch (err) {
      console.error("Erreur lors de l'initialisation des données GLPI:", err);
      setMessage({ text: "Impossible de charger les données du support informatique.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  console.log("KanbanStatuses a changé et vaut maintenant :", kanbanStatuses);
}, [kanbanStatuses]);
  const handleDelete = async (ticketId) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive du ticket #${ticketId} ?`)) return;
    
    setActionLoading(true);
    try {
      await deleteGlpiTicket(ticketId);
      setMessage({ text: `Ticket #${ticketId} purgé avec succès du système.`, type: 'success' });
      setSelectedTicket(null);
      setIsModalOpen(false);
      await loadAllTicketsData();
    } catch (err) {
      setMessage({ text: `Échec de l'opération de purge : ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return "Non spécifiée";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  const linkedItems = allLinks.filter(item => parseInt(item.tickets_id, 10) === selectedTicket?.id);
  const ticketCosts = allCosts.filter(cost => parseInt(cost.tickets_id, 10) === selectedTicket?.id);
  
  const totalTicketCost = ticketCosts.reduce((sum, item) => {
    const fixed = parseFloat(item.cost_fixed) || 0;
    const material = parseFloat(item.cost_material) || 0;
    const time = parseFloat(item.cost_time) || 0;
    const minutes = parseInt(item.actiontime, 10) || 0;
    console.log(minutes);
    let ok=0;
    if(time==0){
      ok=0;
    }else{
      ok=(minutes/60)/time;
    }
    return sum + fixed + material + ok;
  }, 0);
console.log("ticket",ticketCosts);
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Indexation et synchronisation des tickets d'assistance...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      
      {/* EN-TÊTE PRINCIPAL */}
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.mainTitle}>Gestion des Tickets d'Assistance</h2>
          <p style={styles.subtitle}>Suivi opérationnel, imputation analytique des coûts et liaison matérielle.</p>
        </div>
        <button onClick={loadAllTicketsData} style={styles.refreshBtn}>Synchroniser</button>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      {/* BLOC LAYOUT DEUX COLONNES */}
      <div style={styles.layoutGrid}>
        
        {/* PANNEAU GAUCHE : TABLEAU DES ENREGISTREMENTS */}
        <div style={styles.leftColumn}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={{ ...styles.th, width: '60px' }}>ID</th>
                  <th style={styles.th}>Intitulé / Type</th>
                  <th style={{ ...styles.th, width: '130px' }}>Statut</th>
                  <th style={{ ...styles.th, width: '100px' }}>Urgence</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => {
  // Recherche d'abord dans l'API, sinon dans la config locale, sinon un fallback neutre
  const status = kanbanStatuses[ticket.status] || statusConfig[ticket.status] || {
    label: `Statut ${ticket.status}`,
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.1)',
    border: '#334155'
  };

  const isSelected = selectedTicket?.id === ticket.id;

  return (
    <tr 
      key={ticket.id} 
      onClick={() => {
        setSelectedTicket(ticket);
        setIsModalOpen(false);
      }}
      style={{ 
        ...styles.tr,
        backgroundColor: isSelected ? 'rgba(0, 210, 255, 0.04)' : 'transparent',
        borderColor: isSelected ? '#00d2ff' : '#1e1e1e'
      }}
    >
      <td style={styles.tdId}>#{ticket.id}</td>
      <td style={styles.tdContent}>
        <div style={styles.ticketName} title={ticket.name}>{ticket.name}</div>
        <span style={styles.ticketTypeLabel}>{typeLabels[ticket.type] || 'Ticket'}</span>
      </td>
      <td style={styles.td}>
        <span style={{ 
          backgroundColor: status.bg, 
          color: status.color, 
          border: `1px solid ${status.border}`, 
          ...styles.statusBadge 
        }}>
          {status.label}
        </span>
      </td>
      <td style={styles.tdUrgency}>{priorityLabels[ticket.urgency] || 'Moyenne'}</td>
    </tr>
  );
})}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANNEAU DROIT : APERÇU RAPIDE AVEC BOUTON D'OUVERTURE DU POP-UP */}
        <div style={styles.rightColumn}>
          {selectedTicket ? (
            <div style={styles.previewCard}>
              <span style={styles.cardMetaTag}>Sélection active</span>
              <h3 style={styles.previewTitle}>#{selectedTicket.id} - {selectedTicket.name}</h3>
              
              <div style={styles.previewMeta}>
                <div><strong>Classification :</strong> {typeLabels[selectedTicket.type] || 'Ticket'}</div>
                <div><strong>Impact financier :</strong> <span style={{color: '#10b981'}}>{totalTicketCost.toFixed(2)} MGA</span></div>
              </div>

              <button 
                onClick={() => setIsModalOpen(true)} 
                style={styles.btnOpenModalGlobal}
              >
                Ouvrir le dossier complet
              </button>
            </div>
          ) : (
            <div style={styles.emptyStateBox}>
              Sélectionnez un ticket d'assistance dans le registre pour initialiser l'affichage de son dossier.
            </div>
          )}
        </div>

      </div>

      {/* ========================================== */}
      {/* POP-UP : DOSSIER TECHNIQUE & COMPTABLE     */}
      {/* ========================================== */}
      {isModalOpen && selectedTicket && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            
            {/* En-tête Pop-up */}
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.cardMetaTag}>Fiche Technique Intervenant</span>
                <h3 style={styles.modalTitle}>#{selectedTicket.id} - {selectedTicket.name}</h3>
                <div style={styles.cardDate}>Indexation initiale : {selectedTicket.date || 'Donnée non synchronisée'}</div>
              </div>
              <span style={{ 
                backgroundColor: (kanbanStatuses[selectedTicket.status] || {}).bg || '#1e293b', 
                color: (statusConfig[selectedTicket.status] || {}).color || '#94a3b8', 
                border: `1px solid ${(statusConfig[selectedTicket.status] || {}).border || '#334155'}`,
                ...styles.statusBadge
              }}>
                {(kanbanStatuses[selectedTicket.status] || {}).label || selectedTicket.status}
              </span>
            </div>

            {/* Corps du Pop-up */}
            <div style={styles.modalBody}>
              
              {/* Grille des Métadonnées Critiques */}
              <div style={styles.metaDataGrid}>
                <div style={styles.metaItem}>
                  <label style={styles.metaLabel}>Classification</label>
                  <span style={styles.metaValue}>{typeLabels[selectedTicket.type] || 'Non identifié'}</span>
                </div>
                <div style={styles.metaItem}>
                  <label style={styles.metaLabel}>Niveau d'urgence</label>
                  <span style={styles.metaValue}>{priorityLabels[selectedTicket.urgency] || 'Moyenne'}</span>
                </div>
                <div style={styles.metaItem}>
                  <label style={styles.metaLabel}>Temps d'action cumulé</label>
                  <span style={styles.metaValue}>{formatDuration(selectedTicket.actiontime)}</span>
                </div>
                <div style={styles.metaItem}>
                  <label style={styles.metaLabel}>Identifiant externe</label>
                  <span style={{ ...styles.metaValue, fontFamily: 'monospace' }}>{selectedTicket.externalid || 'Aucune référence'}</span>
                </div>
              </div>

              {/* Bloc Description textuelle */}
              <div style={styles.sectionBlock}>
                <label style={styles.sectionTitle}>Description textuelle de l'incident</label>
                <div style={styles.descriptionBox} dangerouslySetInnerHTML={{ __html: selectedTicket.content }} />
              </div>

              {/* Bloc Liaisons Matérielles */}
              <div style={styles.sectionBlock}>
                <label style={styles.sectionTitle}>Éléments d'infrastructure impactés</label>
                {linkedItems.length > 0 ? (
                  <div style={styles.badgeContainer}>
                    {linkedItems.map((item, idx) => (
                      <span key={idx} style={styles.hardwareBadge}>
                        {item.itemtype} (Ref-ID: {item.items_id})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={styles.emptyInlineText}>Aucune attribution de matériel pour ce ticket.</span>
                )}
              </div>

              {/* Tableau Complet de Comptabilité Analytique */}
              <div style={{ marginTop: '24px' }}>
                <label style={styles.sectionTitle}>Synthèse financière complète (GLPI Native Structure)</label>
                {ticketCosts.length > 0 ? (
                  <div style={styles.costTableWrapper}>
                    <table style={styles.costTable}>
                      <thead>
                        <tr style={styles.costThRow}>
                          <th style={styles.costTh}>Nom</th>
                          <th style={styles.costTh}>Date de début</th>
                          <th style={styles.costTh}>Date de fin</th>
                          <th style={styles.costTh}>Budget</th>
                          <th style={styles.costTh}>Durée</th>
                          <th style={styles.costTh}>Coût horaire</th>
                          <th style={styles.costTh}>Coût fixe</th>
                          <th style={styles.costTh}>Coût matériel</th>
                          <th style={styles.costTh}>Coût total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketCosts.map((cost, idx) => {
                          const fixed = parseFloat(cost.cost_fixed) || 0;
                          const material = parseFloat(cost.cost_material) || 0;
                          const hourly = parseFloat(cost.cost_time) || 0;
                          const minutes = parseInt(cost.actiontime, 10) || 0;
                          const lineTotal = fixed + material + (hourly * (minutes / 60));

                          return (
                            <tr key={idx} style={styles.costTr}>
                              <td style={styles.costTd}>{cost.name || "Coût analytique d'importation"}</td>
                              <td style={styles.costTd}>{cost.begin_date || '-'}</td>
                              <td style={styles.costTd}>{cost.end_date || '-'}</td>
                              <td style={styles.costTd}>{cost.budgets_id && cost.budgets_id !== 0 ? cost.budgets_id : '-'}</td>
                              <td style={styles.costTd}>{minutes > 0 ? `${minutes} minutes` : '0 seconde'}</td>
                              <td style={styles.costTd}>{hourly.toFixed(2)}</td>
                              <td style={styles.costTd}>{fixed.toFixed(2)}</td>
                              <td style={styles.costTd}>{material.toFixed(2)}</td>
                              <td style={{ ...styles.costTd, fontWeight: '700', color: '#f8fafc' }}>{lineTotal.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                        
                        <tr style={styles.costTotalRow}>
                          <td colSpan="4" style={{ ...styles.costTd, fontWeight: '700', color: '#10b981' }}>TOTAL CUMULÉ</td>
                          <td style={{ ...styles.costTd, fontWeight: '700' }}>
                            {ticketCosts.reduce((sum, c) => sum + (parseInt(c.actiontime, 10) || 0), 0)} min
                          </td>
                          <td style={styles.costTd}>-</td>
                          <td style={styles.costTd}>
                            {ticketCosts.reduce((sum, c) => sum + (parseFloat(c.cost_fixed) || 0), 0).toFixed(2)}
                          </td>
                          <td style={styles.costTd}>
                            {ticketCosts.reduce((sum, c) => sum + (parseFloat(c.cost_material) || 0), 0).toFixed(2)}
                          </td>
                          <td style={{ ...styles.costTd, fontWeight: '700', color: '#10b981' }}>
                            {totalTicketCost.toFixed(2)} MGA
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={styles.emptyInlineText}>Aucun coût enregistré pour ce ticket.</div>
                )}
              </div>

            </div>

            {/* Pied du Pop-up avec Actions */}
            <div style={styles.modalFooter}>
              <button
                onClick={() => handleDelete(selectedTicket.id)}
                disabled={actionLoading}
                style={actionLoading ? styles.btnDeleteDisabled : styles.btnDeleteActive}
              >
                {actionLoading ? 'Purge...' : 'Purger le ticket'}
              </button>
              <button style={styles.btnCloseModal} onClick={() => setIsModalOpen(false)}>
                Fermer le dossier
              </button>
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
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #E2E6EF', paddingBottom: '16px' },
  mainTitle: { fontSize: '24px', fontWeight: '800', color: '#1A1D2E', margin: '0 0 6px 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '14px', color: '#8B92A8', margin: 0 },
  refreshBtn: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#5A6178', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(26, 29, 46, 0.04)' },
  alertSuccess: { padding: '14px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.25)', color: '#059669' },
  alertError: { padding: '14px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626' },
  layoutGrid: { display: 'flex', width: '100%', gap: '30px', alignItems: 'flex-start' },
  leftColumn: { width: '65%', flexShrink: 0 },
  rightColumn: { width: '35%', flexGrow: 1, position: 'sticky', top: '20px' },
  tableWrapper: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26, 29, 46, 0.04)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  thRow: { backgroundColor: '#F8F9FC', borderBottom: '2px solid #E2E6EF' },
  th: { padding: '16px 20px', color: '#5A6178', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #E2E6EF', cursor: 'pointer', transition: 'background-color 0.2s' },
  tdId: { padding: '16px 20px', fontWeight: '700', color: '#8B92A8', fontFamily: "'JetBrains Mono', monospace" },
  tdContent: { padding: '16px 20px', maxWidth: '280px' },
  ticketName: { fontWeight: '700', color: '#1A1D2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' },
  ticketTypeLabel: { color: '#5A6178', fontSize: '12px', display: 'block', marginTop: '4px', fontWeight: '500' },
  td: { padding: '16px 20px' },
  tdUrgency: { padding: '16px 20px', color: '#5A6178', fontWeight: '500' },
  statusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-block' },
  emptyStateBox: { border: '2px dashed #E2E6EF', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#8B92A8', fontStyle: 'italic', backgroundColor: '#F8F9FC', fontSize: '14px' },

  // PANNEAU DROIT CONFIGURATION ÉPURÉE
  previewCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(26, 29, 46, 0.04)' },
  previewTitle: { margin: '8px 0 16px 0', color: '#1A1D2E', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.01em' },
  previewMeta: { backgroundColor: '#F8F9FC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E6EF', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '20px' },
  btnOpenModalGlobal: { width: '100%', backgroundColor: '#4338CA', border: 'none', color: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(67, 56, 202, 0.2)' },

  // PARAMÈTRES DU POP-UP STRUCTUREL COMPLET
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(26, 29, 46, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '16px', width: '95%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(26, 29, 46, 0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px', borderBottom: '1px solid #E2E6EF', backgroundColor: '#F8F9FC', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' },
  modalTitle: { margin: '6px 0', color: '#1A1D2E', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.01em' },
  cardDate: { fontSize: '13px', color: '#5A6178', marginTop: '2px', fontWeight: '500' },
  cardMetaTag: { fontSize: '11px', fontWeight: '800', color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.5px' },
  modalBody: { padding: '32px', overflowY: 'auto', flexGrow: 1 },
  
  // GRILLE INTERNE DU POP-UP
  metaDataGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px', backgroundColor: '#F8F9FC', padding: '20px', borderRadius: '10px', border: '1px solid #E2E6EF' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  metaLabel: { fontSize: '11px', color: '#5A6178', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  metaValue: { fontSize: '14px', color: '#1A1D2E', fontWeight: '600' },
  sectionBlock: { marginBottom: '24px' },
  sectionTitle: { fontSize: '12px', color: '#5A6178', fontWeight: '700', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E6EF', paddingBottom: '8px' },
  descriptionBox: { backgroundColor: '#F8F9FC', border: '1px solid #E2E6EF', padding: '16px', borderRadius: '10px', fontSize: '14px', color: '#1A1D2E', whiteSpace: 'pre-line', maxHeight: '160px', overflowY: 'auto', lineHeight: '1.6' },
  badgeContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  hardwareBadge: { backgroundColor: '#FFFFFF', color: '#4338CA', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E6EF', fontWeight: '700', boxShadow: '0 1px 2px rgba(26, 29, 46, 0.03)' },
  emptyInlineText: { fontSize: '13px', color: '#8B92A8', fontStyle: 'italic', marginTop: '4px', display: 'block' },

  // CONFIGURATION DU GRANDE TABLEAU DE COÛTS
  costTableWrapper: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '10px', overflowX: 'auto', marginTop: '10px', boxShadow: '0 1px 3px rgba(26, 29, 46, 0.04)' },
  costTable: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
  costThRow: { backgroundColor: '#F8F9FC', borderBottom: '1px solid #E2E6EF' },
  costTh: { padding: '12px 16px', color: '#5A6178', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.5px', fontSize: '11px' },
  costTr: { borderBottom: '1px solid #E2E6EF' },
  costTd: { padding: '12px 16px', color: '#1A1D2E', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontWeight: '500' },
  costTotalRow: { backgroundColor: 'rgba(5, 150, 105, 0.04)', borderTop: '2px solid #E2E6EF' },

  // ACTIONS BAS DE FENÊTRE MODALE
  modalFooter: { padding: '20px 24px', borderTop: '1px solid #E2E6EF', display: 'flex', justifyContent: 'space-between', gap: '12px', backgroundColor: '#F8F9FC', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' },
  btnDeleteActive: { backgroundColor: '#FFFFFF', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(220, 38, 38, 0.05)' },
  btnDeleteDisabled: { backgroundColor: '#F1F3F9', border: '1px solid #E2E6EF', color: '#8B92A8', padding: '10px 20px', borderRadius: '10px', cursor: 'not-allowed', fontSize: '14px', fontWeight: '600' },
  btnCloseModal: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#5A6178', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(26, 29, 46, 0.03)' }
};

export default TicketsList;