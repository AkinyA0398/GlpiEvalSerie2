import React, { useState, useEffect } from 'react';
import { fetchGlpiTickets, deleteGlpiTicket } from '../services/CrudService'; 
import { apiGlpi } from '../api/apiGlpi';
import { apiLocalStatus } from '../api/configApi'; 

const TicketsListKanban = () => {
  const [tickets, setTickets] = useState([]);
  const [news, setNews] = useState([]);
  const [kanbanStatuses, setKanbanStatuses] = useState([]); 
  const [technicians, setTechnicians] = useState([]); 
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reouvertureMode, setReouvertureMode] = useState('1');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [ticketDetail, setTicketDetails] = useState([]);
  const [allLinks, setAllLinks] = useState([]);
  const [allCosts, setAllCosts] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ÉTATS POUR LA MODALE DE SÉLECTION DU TECHNICIEN
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [pendingDropData, setPendingDropData] = useState(null);

  // ÉTATS POUR LES POPUPS DE JUSTIFICATION
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalConfig, setActionModalConfig] = useState({ title: '', label: '', ticketId: null, targetStatusId: null, currentStatusId: null, draggedTicket: null, technicianId: null });
  const [actionReason, setActionReason] = useState({
    cost: '',
    category: '',
    comment: ''
  });

  const [newTicket, setNewTicket] = useState({
    name: '',
    content: '',
    type: '1',      
    urgency: '3',    
    status: 1       
  });

  const priorityLabels = { 1: 'Très basse', 2: 'Basse', 3: 'Moyenne', 4: 'Haute', 5: 'Très haute' };
  const typeLabels = { 1: 'Incident', 2: 'Demande' };

  const CURRENT_LANG = localStorage.getItem('kanban_lang') || 'fr'; 

  const STATUS_NEW = 1;
  const STATUS_IN_PROGRESS = 2; 
  const STATUS_CLOSED = 6;      

  useEffect(() => {
    loadAllTicketsData();
  }, []);

  const loadAllTicketsData = async () => {
    setLoading(true);
    try {
      const localStatuses = await apiLocalStatus(`status?lang=${CURRENT_LANG}`);
      
      const formattedStatuses = localStatuses.map(status => ({
        id: status.id, 
        label: status.name,
        color: status.couleur,
        border: status.couleur,
        bg: status.couleur.startsWith('#') ? `${status.couleur}0D` : 'rgba(0, 210, 255, 0.05)' 
      }));

      setKanbanStatuses(formattedStatuses);
      const validStatusIds = formattedStatuses.map(s => s.id);

      const [ticketsRes, linksRes, costsRes, usersRes] = await Promise.all([
        fetchGlpiTickets(), 
        apiGlpi('Item_Ticket'),
        apiGlpi('TicketCost'),
        apiGlpi('User') 
      ]);
      
      const cleanTickets = Array.isArray(ticketsRes) ? ticketsRes : [];
      const kanbanTickets = cleanTickets.filter(t => validStatusIds.includes(parseInt(t.status, 10)));
      kanbanTickets.sort((a, b) => b.id - a.id);
      
      setTickets(kanbanTickets);
      setAllLinks(Array.isArray(linksRes) ? linksRes : []);
      setAllCosts(Array.isArray(costsRes) ? costsRes : []);

      const cleanUsers = Array.isArray(usersRes) ? usersRes : [];
      setTechnicians(cleanUsers.map(u => ({ id: u.id, name: u.name || u.realname || u.name })));
      
    } catch (err) {
      console.error("Erreur d'initialisation Kanban:", err);
      setMessage({ text: "Impossible de charger le flux ou les configurations.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData('text/plain', ticketId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const Annuler = async (e, ticketId) => {
    e.preventDefault();
    try {
      await apiLocalStatus(`cost/${ticketId}`, {
        method: 'DELETE'
      });
      
      const { targetStatusId, currentStatusId, draggedTicket, technicianId } = actionModalConfig;
      processTicketUpdate(ticketId, targetStatusId, currentStatusId, draggedTicket, technicianId);
    } catch (err) {
      console.error("Erreur lors de l'annulation du coût :", err);
    }
  }; 

  const reouverturAnnuler = async (e) => {
    e.preventDefault();
    try {
      if (news && news.item) {
        const gp = Date.now();

        for (let listItem of news.item) {
          const url = `costLast?itemtype=${listItem.item_id}&id_ticket=${news.idTicket}`;
          const localStatuses = await apiLocalStatus(url);

          const statuses = Array.isArray(localStatuses) ? localStatuses : [];

          const lastCost = statuses.length > 0 ? Number(statuses[0].cost) || 0 : 0; // mode 1
          const firstCost = statuses.length > 0 ? Number(statuses[statuses.length - 1].cost) || 0 : 0; // mode 2
          const moyenneCost = statuses.length > 0 ? statuses.reduce((sum, s) => sum + (Number(s.cost) || 0), 0) / statuses.length : 0; // mode 3
          const sumCost = statuses.length > 0 ? statuses.reduce((sum, s) => sum + (Number(s.cost) || 0), 0) : 0; // mode 4

          let baseCost = 0;
          switch (reouvertureMode) {
            case '1':
              baseCost = lastCost;
              break;
            case '2':
              baseCost = firstCost;
              break;
            case '3':
              baseCost = moyenneCost;
              break;
            case '4':
              baseCost = sumCost;
              break;
            default:
              baseCost = lastCost;
          }

          let valiny = (baseCost * Number(actionReason.cost)) / 100;

          let editingStatus = { 
            item_id: listItem.item_id,
            cost: valiny || 0,
            ticket_id: news.idTicket,
            gp: gp,
            mode: reouvertureMode,
            pourcentage: Number(actionReason.cost)
          };
          
          await apiLocalStatus('costPrix', {
            method: 'POST',
            body: JSON.stringify(editingStatus)
          });
        }
      }
      
      const { ticketId, targetStatusId, currentStatusId, draggedTicket, technicianId } = actionModalConfig;
      processTicketUpdate(ticketId, targetStatusId, currentStatusId, draggedTicket, technicianId);
      
    } catch (err) {
      console.error("Erreur lors du recalcul de réouverture :", err);
    }
  };

  const handleDrop = async (e, targetStatusId) => {
    e.preventDefault();
    const ticketId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    const draggedTicket = tickets.find(t => t.id === ticketId);
    const linkedItems = allLinks.filter(item => parseInt(item.tickets_id, 10) === ticketId);
    const ilaina = { idTicket: ticketId, item: [] };

    for (const links of linkedItems) {
      let editingStatus = { item_id: links.itemtype };
      ilaina.item.push(editingStatus);
    }
    setNews(ilaina);
    if (!draggedTicket) return;

    const currentStatusId = parseInt(draggedTicket.status, 10);
    if (currentStatusId === targetStatusId) return;

    if (currentStatusId === STATUS_NEW && targetStatusId === STATUS_IN_PROGRESS) {
      if (technicians.length === 0) {
        alert("Aucun technicien disponible dans le système GLPI.");
        return;
      }
      setPendingDropData({ ticketId, targetStatusId, currentStatusId, draggedTicket });
      setSelectedTechId(technicians[0]?.id || '');
      setIsTechModalOpen(true);
      return; 
    }

    processTicketUpdate(ticketId, targetStatusId, currentStatusId, draggedTicket, null);
  };

  const handleTechSelectSubmit = (e) => {
    e.preventDefault();
    if (!selectedTechId) return;
    
    const { ticketId, targetStatusId, currentStatusId, draggedTicket } = pendingDropData;
    setIsTechModalOpen(false);
    processTicketUpdate(ticketId, targetStatusId, currentStatusId, draggedTicket, parseInt(selectedTechId, 10));
  };

  const processTicketUpdate = async (ticketId, targetStatusId, currentStatusId, draggedTicket, technicianId) => {
    if (targetStatusId === STATUS_CLOSED && !actionModalConfig.ticketId) {
      setActionReason({ cost: '', category: '', comment: '' });
      setActionModalConfig({
        title: `Clôture du ticket #${ticketId}`,
        label: "Informations de clôture :",
        ticketId, targetStatusId, currentStatusId, draggedTicket, technicianId
      });
      setIsActionModalOpen(true);
      return;
    } 
    
    if (currentStatusId === STATUS_CLOSED && targetStatusId !== STATUS_CLOSED && !actionModalConfig.ticketId) {
      setActionReason({ cost: '', category: '', comment: '' });
      setActionModalConfig({
        title: `Réouverture du ticket #${ticketId}`,
        label: "Raison de la réouverture obligatoire :",
        ticketId, targetStatusId, currentStatusId, draggedTicket, technicianId
      });
      setIsActionModalOpen(true);
      return;
    }

    let updatePayload = { input: { id: ticketId, status: targetStatusId } };
    let rawComment = ""; 
    const linkedItems = allLinks.filter(item => parseInt(item.tickets_id, 10) === ticketId);

    if (targetStatusId === STATUS_CLOSED) {
      const chosenCost = Number(actionReason.cost) || 0;
      const gp = Date.now();
      for (const links of linkedItems) {
        let editingStatus = { 
          ticket_id: ticketId,
          cost: chosenCost / linkedItems.length,
          item_id: links.itemtype,
          gp: gp
        };

        await apiLocalStatus('cost', {
          method: 'POST',
          body: JSON.stringify(editingStatus)   
        });
      }
      rawComment = `<b>[Clôture ticket] : terminer</b>`;

    } else if (currentStatusId === STATUS_CLOSED && targetStatusId !== STATUS_CLOSED) {
      const chosenComment = actionReason.comment.trim() || "Aucune raison spécifiée";
      rawComment = `<b>[Réouverture du ticket] :</b> ${chosenComment}`;
    }

    const previousTickets = [...tickets];
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: targetStatusId } : t));

    try {
      await apiGlpi(`Ticket/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });

      if (rawComment) {
        await apiGlpi(`Ticket/${ticketId}/ITILFollowup`, {
          method: 'POST',
          body: JSON.stringify({
            input: {
              items_id: ticketId,
              itemtype: 'Ticket',
              content: rawComment,
              is_private: 0        
            }
          })
        });
      }

      if (technicianId) {
        await apiGlpi(`Ticket/${ticketId}/Ticket_User`, {
          method: 'POST',
          body: JSON.stringify({
            input: {
              tickets_id: ticketId,
              users_id: technicianId,
              type: 2 
            }
          })
        });
      }

      setMessage({ text: `Ticket #${ticketId} mis à jour avec succès.`, type: 'success' });
      await loadAllTicketsData(); 
    } catch (err) {
      setTickets(previousTickets); 
      console.error(err);
      setMessage({ text: `Erreur de traitement GLPI : ${err.message}`, type: 'error' });
    } finally {
      setIsActionModalOpen(false);
      setActionModalConfig({ title: '', label: '', ticketId: null, targetStatusId: null, currentStatusId: null, draggedTicket: null, technicianId: null });
      setActionReason({ cost: '', category: '', comment: '' });
    }
  };  

  const handleActionModalSubmit = (e) => {
    e.preventDefault();
    const { ticketId, targetStatusId, currentStatusId, draggedTicket, technicianId } = actionModalConfig;
    processTicketUpdate(ticketId, targetStatusId, currentStatusId, draggedTicket, technicianId);
  };

  const openCreateModalForColumn = (statusId) => {
    setNewTicket({ name: '', content: '', type: '1', urgency: '3', status: statusId });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTicket.name.trim()) return;
    setActionLoading(true);
    try {
      const payload = {
        name: newTicket.name.trim(),
        content: newTicket.content.trim() || 'Aucune description fournie.',
        status: newTicket.status, 
        type: parseInt(newTicket.type, 10),
        urgency: parseInt(newTicket.urgency, 10)
      };
      await apiGlpi('Ticket', { method: 'POST', body: JSON.stringify({ input: payload }) });
      setMessage({ text: "Nouveau ticket injecté avec succès.", type: 'success' });
      setIsCreateModalOpen(false);
      await loadAllTicketsData();
    } catch (err) {
      setMessage({ text: `Erreur d'injection : ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Indexation et synchronisation du Kanban GLPI...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.mainTitle}>Tableau de Bord Kanban - Support</h2>
          <p style={styles.subtitle}>Glissez-déposez les cartes. Traduction active : {CURRENT_LANG.toUpperCase()}</p>
        </div>
        <button onClick={loadAllTicketsData} style={styles.refreshBtn}>Synchroniser</button>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <div style={styles.kanbanBoard}>
        {kanbanStatuses.map(column => {
          const columnTickets = tickets.filter(t => parseInt(t.status, 10) === column.id);

          return (
            <div 
              key={column.id} 
              style={{ ...styles.kanbanColumn, backgroundColor: column.bg }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div style={{ ...styles.columnHeader, borderTop: `3px solid ${column.border}` }}>
                <span style={{ color: column.color }}>{column.label}</span>
                <span style={styles.columnCounter}>{columnTickets.length}</span>
              </div>

              <div style={styles.cardsContainer}>
                {columnTickets.length === 0 ? (
                  <div style={styles.emptyColumnText}>Aucun ticket actif</div>
                ) : (
                  columnTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ticket.id)}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setIsModalOpen(true);
                      }}
                      style={styles.ticketCard}
                    >
                      <div style={styles.ticketCardName}>{ticket.name}</div>
                    </div>
                  ))
                )}
              </div>

              {column.id === 1 && (
                <button 
                  onClick={() => openCreateModalForColumn(column.id)} 
                  style={{ ...styles.addTicketColumnBtn, border: `1px dashed ${column.border}`, color: column.color }}
                >
                  ＋ Ajouter ({column.label})
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* POPUP DE RECOUVREMENT ADAPTATIF */}
      {isActionModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '450px' }}>
            <form onSubmit={handleActionModalSubmit}>
              <div style={styles.modalHeader}>
                <div>
                  <span style={styles.cardMetaTag}>Validation Flux Kanban</span>
                  <h3 style={styles.modalTitle}>{actionModalConfig.title}</h3>
                </div>
              </div>
              
              <div style={styles.modalBody}>
                <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '14px' }}>{actionModalConfig.label}</p>

                {/* CHAMP UNIQUE POUR LA CLÔTURE */}
                {actionModalConfig.targetStatusId === STATUS_CLOSED && (
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>SuperCost de résolution :</label>
                    <input 
                      type="number" 
                      value={actionReason.cost} 
                      onChange={(e) => setActionReason(prev => ({ ...prev, cost: e.target.value }))} 
                      style={styles.formInput}
                      required
                      autoFocus
                    />
                  </div>
                )}

                {/* CHAMP UNIQUE POUR LA RÉOUVERTURE AVEC LE POURCENTAGE */}
                {actionModalConfig.currentStatusId === STATUS_CLOSED && (
                  <div style={styles.formGroup}>
                    <select
                      style={styles.select}
                      value={reouvertureMode}
                      onChange={(e) => setReouvertureMode(e.target.value)}
                    >
                      <option value="1">Mode 1 (Dernier coût)</option>
                      <option value="2">Mode 2 (Premier coût)</option>
                      <option value="3">Mode 3 (Moyenne coût)</option>
                      <option value="4">Mode 4 (Somme coût)</option>
                    </select>
                      <label style={styles.formLabel}>Pourcentage de réouverture (%) :</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 50" 
                      value={actionReason.cost} 
                      onChange={(e) => setActionReason(prev => ({ ...prev, cost: e.target.value }))} 
                      style={styles.formInput}
                      required
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* PIED DE MODALE CORRIGÉ ET HARMONISÉ */}
              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  style={styles.btnCloseModal} 
                  onClick={() => {
                    setIsActionModalOpen(false);
                    setActionModalConfig({ title: '', label: '', ticketId: null, targetStatusId: null, currentStatusId: null, draggedTicket: null, technicianId: null });
                    setActionReason({ cost: '', category: '', comment: '' });
                  }}
                >
                  Fermer
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {actionModalConfig.targetStatusId === STATUS_CLOSED ? (
                    <button type="submit" style={styles.btnSubmitActive}>
                      Valider la Clôture
                    </button>
                  ) : (
                    <>
                      <button 
                        type="button"
                        style={styles.btnCancelAction}
                        onClick={(e) => {
                          Annuler(e, news.idTicket);
                          setIsActionModalOpen(false);
                        }}
                      >
                        Annulation
                      </button>
                      <button 
                        type="button"
                        style={styles.btnSubmitActive}
                        onClick={(e) => {
                          reouverturAnnuler(e); 
                          setIsActionModalOpen(false);
                        }}
                      >
                        Réouverture
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SÉLECTION DU TECHNICIEN */}
      {isTechModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '450px' }}>
            <form onSubmit={handleTechSelectSubmit}>
              <div style={styles.modalHeader}>
                <div>
                  <span style={styles.cardMetaTag}>Attribution Responsable</span>
                  <h3 style={styles.modalTitle}>Assigner un technicien</h3>
                </div>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Choisir dans la liste des techniciens GLPI :</label>
                  <select 
                    value={selectedTechId} 
                    onChange={(e) => setSelectedTechId(e.target.value)} 
                    style={styles.formSelect}
                    required
                  >
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} (ID: {tech.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnCloseModal} onClick={() => setIsTechModalOpen(false)}>
                  Annuler l'attribution
                </button>
                <button type="submit" style={styles.btnSubmitActive}>
                  Confirmer et Assigner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION TICKET */}
      {isCreateModalOpen &&  (
        <div style={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateSubmit}>
              <div style={styles.modalHeader}>
                <div>
                  <span style={styles.cardMetaTag}>Nouveau Ticket d'Assistance</span>
                  <h3 style={styles.modalTitle}>Initialiser</h3>
                </div>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Intitulé *</label>
                  <input type="text" required value={newTicket.name} onChange={(e) => setNewTicket(prev => ({ ...prev, name: e.target.value }))} style={styles.formInput}/>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnCloseModal} onClick={() => setIsCreateModalOpen(false)}>Annuler</button>
                <button type="submit" style={styles.btnSubmitActive}>Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TIROIR DÉTAILS */}
      {isModalOpen && selectedTicket && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>#{selectedTicket.id} - {selectedTicket.name}</h3>
              </div>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.sectionBlock}>
                <div style={styles.descriptionBox} dangerouslySetInnerHTML={{ __html: selectedTicket.content }} />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" style={styles.btnCloseModal} onClick={() => setIsModalOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  select: { 
    width: '100%', 
    padding: '12px', 
    fontSize: '14px', 
    backgroundColor: '#f8fafc', 
    border: '1px solid #334155', 
    borderRadius: '6px', 
    color: '#121212', 
    boxSizing: 'border-box', 
    outline: 'none' 
  },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8F9FC' },
  loadingText: { color: '#4338CA', fontSize: '14px', fontWeight: '600' },
  page: { backgroundColor: '#F8F9FC', minHeight: '100vh', color: '#1A1D2E', fontFamily: "'Inter', system-ui, sans-serif", padding: '30px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #E2E6EF', paddingBottom: '16px' },
  mainTitle: { fontSize: '24px', fontWeight: '800', color: '#1A1D2E', margin: '0 0 6px 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '14px', color: '#8B92A8', margin: 0 },
  refreshBtn: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#5A6178', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(26, 29, 46, 0.04)' },
  kanbanBoard: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'flex-start' },
  kanbanColumn: { borderRadius: '14px', border: '1px solid #E2E6EF', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content', backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(26, 29, 46, 0.04)' },
  columnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px 10px 4px', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1A1D2E' },
  columnCounter: { backgroundColor: '#F1F3F9', border: '1px solid #E2E6EF', color: '#5A6178', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  cardsContainer: { display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' },
  emptyColumnText: { textAlign: 'center', color: '#8B92A8', fontStyle: 'italic', fontSize: '13px', padding: '24px 0' },
  addTicketColumnBtn: { width: '100%', backgroundColor: 'rgba(67, 56, 202, 0.04)', color: '#4338CA', border: '1px dashed rgba(67, 56, 202, 0.3)', padding: '12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '10px' },
  ticketCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '10px', padding: '16px', cursor: 'grab', boxShadow: '0 1px 3px rgba(26, 29, 46, 0.04)', transition: 'box-shadow 0.2s' },
  ticketCardName: { fontSize: '14px', fontWeight: '600', color: '#1A1D2E' },
  formGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '12px', fontWeight: '600', color: '#5A6178', textTransform: 'uppercase', letterSpacing: '0.5px' },
  formInput: { backgroundColor: '#F8F9FC', border: '1px solid #E2E6EF', color: '#1A1D2E', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' },
  formSelect: { backgroundColor: '#F8F9FC', border: '1px solid #E2E6EF', color: '#1A1D2E', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', outline: 'none', transition: 'border-color 0.2s' },
  formTextarea: { backgroundColor: '#F8F9FC', border: '1px solid #E2E6EF', color: '#1A1D2E', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '100px', transition: 'border-color 0.2s' },
  btnSubmitActive: { backgroundColor: '#4338CA', border: 'none', color: '#FFFFFF', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s' },
  statusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-block' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(26, 29, 46, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '16px', width: '95%', maxWidth: '900px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(26, 29, 46, 0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px', borderBottom: '1px solid #E2E6EF', backgroundColor: '#F8F9FC', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' },
  modalTitle: { margin: '4px 0', color: '#1A1D2E', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.01em' },
  cardMetaTag: { fontSize: '11px', fontWeight: '800', color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.5px' },
  modalBody: { padding: '32px', overflowY: 'auto', flexGrow: 1 },
  sectionBlock: { marginBottom: '20px' },
  sectionTitle: { fontSize: '12px', color: '#5A6178', fontWeight: '700', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  descriptionBox: { backgroundColor: '#F8F9FC', border: '1px solid #E2E6EF', padding: '16px', borderRadius: '10px', fontSize: '14px', color: '#1A1D2E', maxHeight: '120px', overflowY: 'auto', lineHeight: '1.6' },
  modalFooter: { padding: '20px 24px', borderTop: '1px solid #E2E6EF', display: 'flex', justifyContent: 'space-between', gap: '12px', backgroundColor: '#F8F9FC', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' },
  btnCloseModal: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#5A6178', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  alertSuccess: { backgroundColor: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.25)', color: '#059669', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' },
  alertError: { backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }
};

export default TicketsListKanban;