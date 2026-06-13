import { useState, useEffect } from 'react';
import { fetchGlpiTickets, deleteGlpiTicket } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';

const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [allLinks, setAllLinks] = useState([]);
  const [allCosts, setAllCosts] = useState([]);
  
  // ÉTAT POUR LE POP-UP GLOBAL
  const [isModalOpen, setIsModalOpen] = useState(false);

  const priorityLabels = { 1: 'Très basse', 2: 'Basse', 3: 'Moyenne', 4: 'Haute', 5: 'Très haute' };
  const typeLabels = { 1: 'Incident', 2: 'Demande' };
  
  const statusConfig = {
    1: { label: 'Nouveau', color: '#0072ff', bg: '#eff6ff', border: '#bfdbfe' },
    2: { label: 'En cours (Attribué)', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
    3: { label: 'Planifié', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    4: { label: 'En attente', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    5: { label: 'Résolu', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    6: { label: 'Clos', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  };



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

    } catch (err) {
      console.error("Erreur lors de l'initialisation des données GLPI:", err);
      setMessage({ text: "Impossible de charger les données du support informatique.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAllTicketsData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
    return sum + fixed + material + (time * (minutes / 60));
  }, 0);

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
                  const status = statusConfig[ticket.status] || { label: `Code ${ticket.status}`, color: '#94a3b8', bg: '#1e293b', border: '#334155' };
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
                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                        borderColor: isSelected ? '#0072ff' : '#e2e8f0'
                      }}
                    >
                      <td style={styles.tdId}>#{ticket.id}</td>
                      <td style={styles.tdContent}>
                        <div style={styles.ticketName} title={ticket.name}>{ticket.name}</div>
                        <span style={styles.ticketTypeLabel}>{typeLabels[ticket.type] || 'Ticket'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}`, ...styles.statusBadge }}>
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
                backgroundColor: (statusConfig[selectedTicket.status] || {}).bg || '#1e293b', 
                color: (statusConfig[selectedTicket.status] || {}).color || '#94a3b8', 
                border: `1px solid ${(statusConfig[selectedTicket.status] || {}).border || '#334155'}`,
                ...styles.statusBadge
              }}>
                {(statusConfig[selectedTicket.status] || {}).label || selectedTicket.status}
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
                disabled={actionLoading || Number(selectedTicket?.status) === 6}
                style={actionLoading || Number(selectedTicket?.status) === 6 ? styles.btnDeleteDisabled : styles.btnDeleteActive}
                title={Number(selectedTicket?.status) === 6 ? 'Ticket clôturé (Clos) : purge interdite' : undefined}
              >
                {actionLoading ? 'Purge...' : (Number(selectedTicket?.status) === 6 ? 'Purger le ticket (bloqué)' : 'Purger le ticket')}
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
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f1f5f9' },
  loadingText: { color: '#0072ff', fontSize: '14px', fontFamily: 'monospace' },
  page: { backgroundColor: '#f1f5f9', minHeight: '100vh', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' },
  mainTitle: { fontSize: '22px', fontWeight: '700', color: '#0072ff', margin: '0 0 6px 0' },
  subtitle: { fontSize: '13px', color: '#64748b', margin: 0 },
  refreshBtn: { backgroundImage: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0, 114, 255, 0.2)' },
  alertSuccess: { padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: '#ecfdf5', border: '1px solid #10b981', color: '#059669' },
  alertError: { padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#dc2626' },
  layoutGrid: { display: 'flex', width: '100%', gap: '24px', alignItems: 'flex-start' },
  leftColumn: { width: '55%', flexShrink: 0 },
  rightColumn: { width: '45%', flexGrow: 1, position: 'sticky', top: '20px' },
  tableWrapper: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '14px 16px', color: '#475569', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #e2e8f0', cursor: 'pointer' },
  tdId: { padding: '14px 16px', fontWeight: '700', color: '#64748b', fontFamily: 'monospace' },
  tdContent: { padding: '14px 16px', maxWidth: '240px' },
  ticketName: { fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  ticketTypeLabel: { color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' },
  td: { padding: '14px 16px' },
  tdUrgency: { padding: '14px 16px', color: '#475569' },
  statusBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-block' },
  emptyStateBox: { border: '2px dashed #e2e8f0', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', backgroundColor: '#ffffff', fontSize: '13px' },

  previewCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  previewTitle: { margin: '8px 0', color: '#0f172a', fontSize: '16px', fontWeight: '700' },
  previewMeta: { backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px', color: '#475569' },
  btnOpenModalGlobal: { width: '100%', backgroundImage: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)', border: 'none', color: '#ffffff', padding: '10px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 6px -1px rgba(0, 114, 255, 0.2)' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', width: '95%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' },
  modalTitle: { margin: '4px 0', color: '#0072ff', fontSize: '18px', fontWeight: '700' },
  cardDate: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  cardMetaTag: { fontSize: '11px', fontWeight: '700', color: '#0072ff', textTransform: 'uppercase', letterSpacing: '0.5px' },
  modalBody: { padding: '24px', overflowY: 'auto', flexGrow: 1 },
  
  metaDataGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  metaLabel: { fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  metaValue: { fontSize: '13px', color: '#0f172a', fontWeight: '500' },
  sectionBlock: { marginBottom: '16px' },
  sectionTitle: { fontSize: '12px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '8px', textTransform: 'uppercase' },
  descriptionBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#475569', whiteSpace: 'pre-line', maxHeight: '120px', overflowY: 'auto' },
  badgeContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  hardwareBadge: { backgroundColor: '#eff6ff', color: '#0072ff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', border: '1px solid #bfdbfe', fontWeight: '600' },
  emptyInlineText: { fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginTop: '4px', display: 'block' },

  costTableWrapper: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', overflowX: 'auto', marginTop: '6px' },
  costTable: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' },
  costThRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  costTh: { padding: '10px 12px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  costTr: { borderBottom: '1px solid #e2e8f0' },
  costTd: { padding: '10px 12px', color: '#475569', whiteSpace: 'nowrap', fontFamily: 'monospace' },
  costTotalRow: { backgroundColor: '#ecfdf5', borderTop: '2px solid #e2e8f0' },

  modalFooter: { padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '12px', backgroundColor: '#f8fafc', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' },
  btnDeleteActive: { backgroundImage: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' },
  btnDeleteDisabled: { backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', color: '#94a3b8', padding: '8px 16px', borderRadius: '6px', cursor: 'not-allowed', fontSize: '13px' },
  btnCloseModal: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }
};

export default TicketsList;