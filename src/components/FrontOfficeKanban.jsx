import { useEffect, useMemo, useState } from 'react';
import { apiGlpi, initGlpiSession } from '../api/apiGlpi';

import { fetchGlpiTicketDetails } from '../services/CrudService';

const STATUSES = [
  { id: 1, key: 'nouveau', label: 'Nouveau', color: '#0072ff', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 2, key: 'encours', label: 'En cours', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { id: 3, key: 'termine', label: 'Terminé', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
];

function applyKanbanConfigToStatuses(configList, langMode) {
  // configList: [ {status_id, bg, color, border, label_mg}, ... ]
  const map = new Map(configList.map((c) => [Number(c.status_id), c]));
  return STATUSES.map((s) => {
    const c = map.get(s.id);
    if (!c) return s;

    // si fr: garder la label française par défaut
    // si mg: utiliser label_mg
    const label = langMode === 'fr' ? s.label : (c.label_mg || s.label);

    return {
      ...s,
      color: c.color,
      bg: c.bg,
      border: c.border,
      label,
    };
  });
}



const PRIORITY_LABELS = {
  1: 'Très basse',
  2: 'Basse',
  3: 'Moyenne',
  4: 'Haute',
  5: 'Très haute',
};

const TYPE_LABELS = { 1: 'Incident', 2: 'Demande' };

function getStatusConfig(statusId, statusesSource = STATUSES) {
  return statusesSource.find((s) => s.id === Number(statusId));
}


async function updateTicketStatus(ticketId, newStatusId, extraPayload = {}) {
  // GLPI: Ticket/{id} PUT avec input.status
  // Si GLPI exige un champ supplémentaire, on le passe dans input.
  const payload = {
    input: {
      status: Number(newStatusId),
      ...extraPayload,
    },
  };

  return await apiGlpi(`Ticket/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export default function FrontOfficeKanban() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Backoffice kanban config
  const [kanbanStatuses, setKanbanStatuses] = useState(STATUSES);
  const [isKanbanConfigOpen, setIsKanbanConfigOpen] = useState(false);
  const [kanbanConfigDraft, setKanbanConfigDraft] = useState(null); // list payload


  const defaultKanbanConfig = [
    { status_id: 1, bg: STATUSES.find((s) => s.id === 1)?.bg || '#eff6ff', color: STATUSES.find((s) => s.id === 1)?.color || '#0072ff', border: STATUSES.find((s) => s.id === 1)?.border || '#bfdbfe', label_mg: 'vaovao' },
    { status_id: 2, bg: STATUSES.find((s) => s.id === 2)?.bg || '#f0f9ff', color: STATUSES.find((s) => s.id === 2)?.color || '#0284c7', border: STATUSES.find((s) => s.id === 2)?.border || '#bae6fd', label_mg: 'efa manao' },
    { status_id: 3, bg: STATUSES.find((s) => s.id === 3)?.bg || '#ecfdf5', color: STATUSES.find((s) => s.id === 3)?.color || '#059669', border: STATUSES.find((s) => s.id === 3)?.border || '#a7f3d0', label_mg: 'vita' },
  ];








  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Modal when transition requires extra info
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingDrag, setPendingDrag] = useState(null); // { ticket, fromStatusId, toStatusId }
  const [extraNote, setExtraNote] = useState('');

  const dragDataRef = useMemo(() => ({ current: null }), []);

  const columns = useMemo(() => {
    return kanbanStatuses.map((s) => ({
      ...s,
      tickets: tickets.filter((t) => Number(t.status) === s.id),
    }));
  }, [tickets, kanbanStatuses]);





  const ensureSession = async () => {
    const hasToken = localStorage.getItem('glpi_session_token');
    if (hasToken) return;
    await initGlpiSession();
  };

  const loadKanbanConfig = async () => {
    try {
      const apiBase = 'http://localhost:5000';
      const res = await fetch(`${apiBase}/kanban/config`);
      if (!res.ok) return;

      const config = await res.json();
      if (!Array.isArray(config) || config.length === 0) return;

      // lecture locale au moment de chargement
      const savedLang = localStorage.getItem('kanban_lang');
      const langMode = savedLang === 'fr' ? 'fr' : 'mg';

      setKanbanStatuses(applyKanbanConfigToStatuses(config, langMode));
    } catch {
      // ignore => keep default colors/labels
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await ensureSession();
      const res = await apiGlpi('Ticket');
      const clean = Array.isArray(res) ? res : [];
      // Order: newest first
      clean.sort((a, b) => Number(b.id) - Number(a.id));
      setTickets(clean);
    } catch (err) {
      setMessage({ text: `Impossible de charger les tickets: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (cancelled) return;
        await loadKanbanConfig();
        await loadTickets();
      } catch {
        // errors are handled inside loadTickets / loadKanbanConfig
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const refreshAfterUpdate = async () => {
    await loadTickets();
  };

  const loadKanbanConfigAndDraft = async () => {
    try {
      const apiBase = 'http://localhost:5000';
      const res = await fetch(`${apiBase}/kanban/config`);
      if (!res.ok) return;
      const config = await res.json();
      if (!Array.isArray(config) || config.length === 0) return;
      setKanbanConfigDraft(config);
      // applique avec langue courante
      const savedLang = localStorage.getItem('kanban_lang');
      const langMode = savedLang === 'fr' ? 'fr' : 'mg';
      setKanbanStatuses(applyKanbanConfigToStatuses(config, langMode));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isKanbanConfigOpen) return;
    // chargement asynchrone propre
    (async () => {
      await loadKanbanConfigAndDraft();
    })();
  }, [isKanbanConfigOpen]);




  const requiresExtraInfoForTransition = (fromStatusId, toStatusId) => {

    // Contrainte demandée : une boîte de dialogue dès qu’un changement de statut
    // nécessite des informations supplémentaires.
    // Ici, on applique une règle "clôture" : toute transition vers "Terminé" (3)
    // requiert une note/justificatif.
    // (Les autres transitions ne requièrent rien.)
    return Number(toStatusId) === 3 && Number(fromStatusId) !== 3;
  };

  const openDetails = async (ticketId) => {
    setSelectedTicketId(ticketId);
    setIsDetailsOpen(true);
    setDetailsLoading(true);
    setTicketDetails(null);
    try {
      await ensureSession();
      const details = await fetchGlpiTicketDetails(ticketId);
      setTicketDetails(details);
    } catch (err) {
      setMessage({ text: `Echec chargement détails ticket #${ticketId}: ${err.message}`, type: 'error' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedTicketId(null);
    setTicketDetails(null);
    setExtraNote('');
  };

  const handleDragStart = (ticket, fromStatusId) => (e) => {
    const data = { ticket, fromStatusId };
    dragDataRef.current = data;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(data));
  };

  const handleDropOnColumn = (toStatusId) => async (e) => {
    e.preventDefault();
    let data = dragDataRef.current;
    if (!data) {
      try {
        data = JSON.parse(e.dataTransfer.getData('application/json'));
      } catch {
        return;
      }
    }

    if (!data?.ticket) return;

    const { ticket, fromStatusId } = data;
    const fromId = Number(fromStatusId);
    const toId = Number(toStatusId);

    if (fromId === toId) return;

    if (requiresExtraInfoForTransition(fromId, toId)) {
      setPendingDrag({ ticket, fromStatusId: fromId, toStatusId: toId });
      setExtraNote('');
      setIsStatusModalOpen(true);
      return;
    }

    try {
      await updateTicketStatus(ticket.id, toId);
      setMessage({ text: `Ticket #${ticket.id} déplacé vers ${getStatusConfig(toId)?.label || toId}.`, type: 'success' });
      await refreshAfterUpdate();
    } catch (err) {
      setMessage({ text: `Echec changement statut: ${err.message}`, type: 'error' });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const confirmStatusChangeWithExtraInfo = async () => {
    if (!pendingDrag) return;

    // minimal validation
    if (!extraNote.trim()) {
      setMessage({ text: 'Champ requis: note/justificatif.', type: 'error' });
      return;
    }

    try {
      // GLPI champ: content (ou eventualmente comment). Ici on utilise content comme note.
      // Si GLPI refuse ce champ en PUT sur Ticket, on ajustera.
      await updateTicketStatus(pendingDrag.ticket.id, pendingDrag.toStatusId, { content: extraNote.trim() });
      setIsStatusModalOpen(false);
      setPendingDrag(null);
      setExtraNote('');
      setMessage({ text: `Ticket #${pendingDrag.ticket.id} déplacé vers ${getStatusConfig(pendingDrag.toStatusId)?.label || pendingDrag.toStatusId}.`, type: 'success' });
      await refreshAfterUpdate();
    } catch (err) {
      setMessage({ text: `Echec changement statut: ${err.message}`, type: 'error' });
    }
  };

  const cancelStatusModal = () => {
    setIsStatusModalOpen(false);
    setPendingDrag(null);
    setExtraNote('');
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingCard}>Chargement des tickets...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>FrontOffice - Tickets (Kanban)</h2>
          <p style={styles.subtitle}>Glissez-déposez pour changer de statut. Cliquez sur un ticket pour voir tous les détails.</p>
        </div>

        <div style={styles.actions}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Langue :</label>
            <select
              value={localStorage.getItem('kanban_lang') === 'fr' ? 'fr' : 'mg'}
              onChange={(e) => {
                localStorage.setItem('kanban_lang', e.target.value);
                // Recharger sans reload brutal
                loadKanbanConfig();
              }}
              style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
            >
              <option value="mg">Malgache</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <button
            onClick={() => {
              // ouverture pop-up pour config couleurs/libellés
              setIsKanbanConfigOpen(true);
            }}
            style={styles.refreshBtn}
          >
            Couleurs & libellés
          </button>


          <button
            onClick={() => {
              window.location.href = '/ticket';
            }}
            style={styles.addBtn}
          >
            Ajouter 1 ticket
          </button>

          <button onClick={loadTickets} style={styles.refreshBtn}>Rafraîchir</button>
        </div>
      </div>


      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>{message.text}</div>
      )}

      <div style={styles.columns}>
        {columns.map((col) => (
          <div
            key={col.id}
            style={{ ...styles.column, borderColor: col.border, backgroundColor: col.bg }}
            onDrop={handleDropOnColumn(col.id)}
            onDragOver={handleDragOver}
          >
            <div style={styles.columnHeader}>
              <div style={styles.columnTitle}>
                {col.label}
                <span style={{ ...styles.countBadge, borderColor: col.border, color: col.color }}>{col.tickets.length}</span>
              </div>
            </div>

            <div style={styles.ticketList}>
              {col.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  draggable
                  onDragStart={handleDragStart(ticket, col.id)}
                  onClick={() => openDetails(ticket.id)}
                  style={styles.ticketCard}
                  title={ticket.content ? String(ticket.content).slice(0, 120) : ''}
                >
                  <div style={styles.ticketTopRow}>
                    <div style={styles.ticketId}>#{ticket.id}</div>
                    <div style={{ ...styles.statusPill, backgroundColor: col.bg, borderColor: col.border, color: col.color }}>
                      {col.label}
                    </div>
                  </div>
                  <div style={styles.ticketName}>{ticket.name}</div>
                  <div style={styles.ticketMetaRow}>
                    <span style={styles.ticketType}>{TYPE_LABELS[ticket.type] || 'Ticket'}</span>
                    <span style={styles.ticketPriority}>{PRIORITY_LABELS[ticket.urgency] || 'Moyenne'}</span>
                  </div>
                </div>
              ))}

              {col.tickets.length === 0 && (
                <div style={styles.emptyCol}>Aucun ticket dans cette colonne.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isDetailsOpen && selectedTicketId && (
        <div style={styles.modalOverlay} onClick={closeDetails}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalTag}>Détails Ticket</span>
                <h3 style={styles.modalTitle}>#{selectedTicketId} - {ticketDetails?.name || '...'}</h3>
              </div>
              <button style={styles.modalCloseBtn} onClick={closeDetails}>&times;</button>
            </div>

            <div style={styles.modalBody}>
              {detailsLoading ? (
                <div style={styles.loadingInline}>Chargement des détails...</div>
              ) : ticketDetails ? (
                <div>
                  <div style={styles.metaGrid}>
                    <div style={styles.metaItem}>
                      <div style={styles.metaLabel}>Statut</div>
                      <div style={styles.metaValue}>{getStatusConfig(ticketDetails.status, kanbanStatuses)?.label || ticketDetails.status}</div>

                    </div>
                    <div style={styles.metaItem}>
                      <div style={styles.metaLabel}>Type</div>
                      <div style={styles.metaValue}>{TYPE_LABELS[ticketDetails.type] || ticketDetails.type}</div>
                    </div>
                    <div style={styles.metaItem}>
                      <div style={styles.metaLabel}>Urgence</div>
                      <div style={styles.metaValue}>{PRIORITY_LABELS[ticketDetails.urgency] || ticketDetails.urgency}</div>
                    </div>
                    <div style={styles.metaItem}>
                      <div style={styles.metaLabel}>Ref externe</div>
                      <div style={{ ...styles.metaValue, fontFamily: 'monospace' }}>{ticketDetails.externalid || '-'}</div>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>Description</div>
                    <div style={styles.descriptionBox} dangerouslySetInnerHTML={{ __html: ticketDetails.content || '' }} />
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>Résumé (fields bruts)</div>
                    <pre style={styles.pre}>{JSON.stringify(ticketDetails, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div style={styles.emptyInline}>Aucun détail disponible.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isKanbanConfigOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsKanbanConfigOpen(false)}>
          <div style={styles.modalContentSmall} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalTag}>Backoffice</span>
                <h3 style={styles.modalTitle}>Configurer les 3 statuts Kanban</h3>
              </div>
              <button style={styles.modalCloseBtn} onClick={() => setIsKanbanConfigOpen(false)}>&times;</button>
            </div>

            <div style={styles.modalBody}>
              {(kanbanConfigDraft || defaultKanbanConfig).map((item) => (
                <div key={item.status_id} style={{ ...styles.configBlock, borderColor: item.border }}>
                  <div style={styles.configTitleRow}>
                    <div style={{ fontWeight: 900 }}>
                      Statut #{item.status_id}
                    </div>
                    <div
                      style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: item.bg, border: `1px solid ${item.border}` }}
                      title={item.bg}
                    />
                  </div>

                  <div style={styles.configGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Couleur texte</label>
                      <input
                        value={item.color}
                        onChange={(e) =>
                          setKanbanConfigDraft(
                            (prev) =>
                              (prev || defaultKanbanConfig).map((x) =>
                                x.status_id === item.status_id ? { ...x, color: e.target.value } : x
                              )
                          )
                        }
                        style={styles.inputColor}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Couleur fond</label>

                      {/* Carré cliquable + color picker */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(`bg-picker-${item.status_id}`);
                            if (el) el.click();
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            backgroundColor: item.bg,
                            border: `1px solid ${item.border}`,
                            cursor: 'pointer',
                          }}
                          title={`Clique pour choisir (${item.bg})`}
                        />

                        <input
                          id={`bg-picker-${item.status_id}`}
                          type="color"
                          value={/^#([0-9a-fA-F]{6})$/.test(item.bg) ? item.bg : '#ffffff'}
                          onChange={(e) =>
                            setKanbanConfigDraft((prev) =>
                              (prev || defaultKanbanConfig).map((x) =>
                                x.status_id === item.status_id ? { ...x, bg: e.target.value } : x
                              )
                            )
                          }
                          style={{
                            width: 36,
                            height: 36,
                            padding: 0,
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        />

                        <input
                          value={item.bg}
                          onChange={(e) =>
                            setKanbanConfigDraft(
                              (prev) =>
                                (prev || defaultKanbanConfig).map((x) =>
                                  x.status_id === item.status_id ? { ...x, bg: e.target.value } : x
                                )
                            )
                          }
                          style={styles.inputColor}
                        />
                      </div>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Couleur bordure</label>
                      <input
                        value={item.border}
                        onChange={(e) =>
                          setKanbanConfigDraft(
                            (prev) =>
                              (prev || defaultKanbanConfig).map((x) =>
                                x.status_id === item.status_id ? { ...x, border: e.target.value } : x
                              )
                          )
                        }
                        style={styles.inputColor}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Libellé malgache</label>
                      <input
                        value={item.label_mg}
                        onChange={(e) =>
                          setKanbanConfigDraft(
                            (prev) =>
                              (prev || defaultKanbanConfig).map((x) =>
                                x.status_id === item.status_id ? { ...x, label_mg: e.target.value } : x
                              )
                          )
                        }
                        style={styles.inputText}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  setIsKanbanConfigOpen(false);
                }}
                style={styles.btnSecondary}
              >
                Annuler
              </button>

              <button
                onClick={async () => {
                  try {
                    const payload = (kanbanConfigDraft || defaultKanbanConfig).map((x) => ({
                      status_id: Number(x.status_id),
                      bg: x.bg,
                      color: x.color,
                      border: x.border,
                      label_mg: x.label_mg,
                    }));

                    const apiBase = 'http://localhost:5000';
                    const res = await fetch(`${apiBase}/kanban/config`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });

                    if (!res.ok) {
                      setMessage({ text: 'Echec sauvegarde config kanban', type: 'error' });
                      return;
                    }

                    // recharge et applique
                    const savedLang = localStorage.getItem('kanban_lang');
                    const langMode = savedLang === 'fr' ? 'fr' : 'mg';
                    setKanbanConfigDraft(payload);
                    setKanbanStatuses(applyKanbanConfigToStatuses(payload, langMode));
                    setIsKanbanConfigOpen(false);
                    setMessage({ text: 'Config kanban enregistrée', type: 'success' });
                  } catch {
                    setMessage({ text: 'Echec sauvegarde config kanban', type: 'error' });
                  }
                }}
                style={styles.btnPrimary}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {isStatusModalOpen && pendingDrag && (
        <div style={styles.modalOverlay} onClick={cancelStatusModal}>

          <div style={styles.modalContentSmall} onClick={(e) => e.stopPropagation()}>


            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalTag}>Information requise</span>
                <h3 style={styles.modalTitle}>Changement de statut</h3>
              </div>
              <button style={styles.modalCloseBtn} onClick={cancelStatusModal}>&times;</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.infoLine}>
                Passage de <strong>{getStatusConfig(pendingDrag.fromStatusId, kanbanStatuses)?.label}</strong> vers <strong>{getStatusConfig(pendingDrag.toStatusId, kanbanStatuses)?.label}</strong>.
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Note / justificatif (obligatoire)</label>
                <textarea
                  rows={5}
                  value={extraNote}
                  onChange={(e) => setExtraNote(e.target.value)}
                  style={styles.textarea}
                  placeholder="Décrivez brièvement la clôture / actions effectuées..."
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={cancelStatusModal} style={styles.btnSecondary}>Annuler</button>
              <button onClick={confirmStatusChangeWithExtraInfo} style={styles.btnPrimary}>Valider le changement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { backgroundColor: '#F8F9FC', minHeight: '100vh', color: '#1A1D2E', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: '30px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', borderBottom: '1px solid #E2E6EF', paddingBottom: '16px', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: '#1A1D2E', letterSpacing: '-0.02em' },
  subtitle: { margin: 0, color: '#8B92A8', fontSize: '14px' },
  actions: { display: 'flex', gap: '10px', alignItems: 'center' },
  addBtn: { backgroundColor: '#4338CA', border: 'none', color: '#FFFFFF', padding: '12px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(67, 56, 202, 0.2)' },
  refreshBtn: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#5A6178', padding: '12px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(26, 29, 46, 0.04)' },

  alertSuccess: { padding: '14px', borderRadius: '10px', margin: '0 0 20px 0', fontSize: '13px', fontWeight: 600, backgroundColor: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.25)', color: '#059669' },
  alertError: { padding: '14px', borderRadius: '10px', margin: '0 0 20px 0', fontSize: '13px', fontWeight: 600, backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626' },

  columns: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  column: { backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E6EF', padding: '20px', minHeight: '420px', boxShadow: '0 2px 12px rgba(26, 29, 46, 0.04)', display: 'flex', flexDirection: 'column', gap: '14px' },
  columnHeader: { padding: '2px 4px 10px 4px', borderBottom: '1px solid #F1F3F9', marginBottom: '10px' },
  columnTitle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontWeight: 800, color: '#1A1D2E', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  countBadge: { fontSize: '12px', fontWeight: 700, backgroundColor: '#F1F3F9', color: '#5A6178', padding: '4px 10px', borderRadius: '20px', border: '1px solid #E2E6EF' },
  ticketList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  ticketCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '10px', padding: '16px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(26, 29, 46, 0.04)', transition: 'box-shadow 0.2s, transform 0.2s' },
  ticketTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  ticketId: { fontFamily: "'JetBrains Mono', monospace", color: '#8B92A8', fontWeight: 600, fontSize: '12px' },
  statusPill: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
  ticketName: { fontWeight: 700, color: '#1A1D2E', fontSize: '14px', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  ticketMetaRow: { display: 'flex', justifyContent: 'space-between', gap: '10px', color: '#5A6178', fontSize: '12px' },
  ticketType: { fontWeight: 600 },
  ticketPriority: { fontWeight: 600 },
  emptyCol: { border: '1px dashed #E2E6EF', backgroundColor: '#F8F9FC', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#8B92A8', fontStyle: 'italic', fontSize: '13px' },

  loadingWrap: { backgroundColor: '#F8F9FC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loadingCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '14px', padding: '24px', color: '#4338CA', fontWeight: 700, boxShadow: '0 2px 12px rgba(26, 29, 46, 0.05)' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(26, 29, 46, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '16px', width: '95%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(26, 29, 46, 0.15)' },
  modalContentSmall: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '16px', width: '95%', maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(26, 29, 46, 0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px', borderBottom: '1px solid #E2E6EF', gap: '14px', backgroundColor: '#F8F9FC', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' },
  modalTag: { fontSize: '11px', fontWeight: 800, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.5px' },
  modalTitle: { margin: '6px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#1A1D2E', letterSpacing: '-0.01em' },
  modalCloseBtn: { border: 'none', backgroundColor: 'transparent', color: '#8B92A8', cursor: 'pointer', fontSize: '28px', lineHeight: 1, padding: '0 4px', transition: 'color 0.2s' },
  modalBody: { padding: '32px', overflowY: 'auto' },
  modalFooter: { padding: '20px 24px', borderTop: '1px solid #E2E6EF', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#F8F9FC', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' },

  loadingInline: { color: '#5A6178', fontStyle: 'italic', fontWeight: 500 },
  emptyInline: { color: '#8B92A8', fontStyle: 'italic' },

  metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' },
  metaItem: { backgroundColor: '#F8F9FC', border: '1px solid #E2E6EF', borderRadius: '10px', padding: '16px' },
  metaLabel: { fontSize: '11px', color: '#5A6178', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  metaValue: { fontSize: '14px', fontWeight: 600, color: '#1A1D2E' },

  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '12px', color: '#5A6178', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', borderBottom: '1px solid #E2E6EF', paddingBottom: '8px' },
  descriptionBox: { backgroundColor: '#F8F9FC', border: '1px solid #E2E6EF', borderRadius: '10px', padding: '16px', fontSize: '14px', color: '#1A1D2E', whiteSpace: 'pre-line', lineHeight: '1.6' },
  pre: { backgroundColor: '#F1F3F9', color: '#1A1D2E', padding: '16px', borderRadius: '10px', border: '1px solid #E2E6EF', fontSize: '13px', overflowX: 'auto', fontFamily: "'JetBrains Mono', monospace" },

  infoLine: { marginBottom: '16px', color: '#5A6178', fontSize: '14px', fontWeight: 500 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: 700, color: '#5A6178', textTransform: 'uppercase', letterSpacing: '0.5px' },
  textarea: { width: '100%', padding: '12px 14px', border: '1px solid #E2E6EF', borderRadius: '10px', fontSize: '14px', color: '#1A1D2E', resize: 'vertical', backgroundColor: '#F8F9FC', outline: 'none', transition: 'border-color 0.2s', minHeight: '120px' },

  btnPrimary: { backgroundColor: '#4338CA', border: 'none', color: '#FFFFFF', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '14px', transition: 'background-color 0.2s' },
  btnSecondary: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#5A6178', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s' },
};

