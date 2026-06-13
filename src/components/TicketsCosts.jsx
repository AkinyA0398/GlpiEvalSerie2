import { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { apiGlpi } from '../api/apiGlpi';

const styles = {
  page: { backgroundColor: '#f1f5f9', minHeight: '100vh', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '18px' },
  title: { fontSize: '22px', fontWeight: 900, margin: 0, color: '#0072ff' },
  subtitle: { margin: 0, color: '#64748b', fontSize: '13px' },
  btnPrimary: { backgroundImage: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 900, fontSize: '13px' },
  btnSecondary: { backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#334155', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 900, fontSize: '13px' },
  alertError: { padding: '12px 14px', borderRadius: '10px', margin: '0 0 14px 0', fontSize: '13px', fontWeight: 700, backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#dc2626' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContentSmall: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', width: '95%', maxWidth: '760px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px', borderBottom: '1px solid #e2e8f0', gap: '14px' },
  modalTag: { fontSize: '11px', fontWeight: 900, color: '#0072ff', textTransform: 'uppercase', letterSpacing: '0.5px' },
  modalTitle: { margin: '4px 0 0 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' },
  modalCloseBtn: { border: '1px solid #e2e8f0', backgroundColor: '#ffffff', width: '32px', height: '32px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', lineHeight: 1 },
  modalBody: { padding: '18px 20px', overflowY: 'auto' },
  modalFooter: { padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  card: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' },
  sectionTitle: { fontSize: '12px', color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '10px' },
  label: { fontSize: '12px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  row: { display: 'flex', justifyContent: 'space-between', gap: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' },
  rowLeft: { display: 'flex', flexDirection: 'column', gap: 4 },
  rowRight: { textAlign: 'right', fontFamily: 'monospace' },
};

// (Cette page ne fait plus aucun découpage par type: affichage résumé uniquement.)
// const TYPE_LABELS = { PC: 'PC', Monitor: 'Monitor', Phone: 'Phone' };

export default function TicketsCosts() {
  const navigate = useNavigate();
  const [ticketIdInput, setTicketIdInput] = useState('');
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [ticketCostsLines, setTicketCostsLines] = useState([]); // GLPI TicketCost lines
  const [recap, setRecap] = useState(null);

  // Modal: new price
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCostValue, setNewCostValue] = useState('');



  const loadTicketCosts = async (tId) => {
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // GLPI: TicketCost lines
      const lines = await apiGlpi(`TicketCost?tickets_id=${tId}`);
      setTicketCostsLines(Array.isArray(lines) ? lines : []);

      // Backend: recap (uses SQLite cost_tickets table for the “new price” lines)
      const apiBase = 'http://localhost:5000';
      const recapRes = await fetch(`${apiBase}/ticket-costs/recap?ticketId=${tId}`);
      if (!recapRes.ok) {
        const errText = await recapRes.text();
        throw new Error(errText || 'Erreur recap');
      }
      const recapJson = await recapRes.json();
      setRecap(recapJson);
    } catch (err) {
      setMessage({ text: `Erreur chargement coûts: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    if (!ticketId) {
      setMessage({ text: 'Entrez un ticketId pour calculer les coûts.', type: 'error' });
      return;
    }
    setIsModalOpen(true);
    setNewCostValue('');
  };

  const submitNewPrice = async () => {
    if (!ticketId) return;
    const costValue = parseFloat(newCostValue);
    if (Number.isNaN(costValue)) {
      setMessage({ text: 'costValue invalide', type: 'error' });
      return;
    }

    try {
      const apiBase = 'http://localhost:5000';
      const res = await fetch(`${apiBase}/ticket-costs/new-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, ticketCostLineId: null, costValue }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erreur POST new-price');
      }

      setIsModalOpen(false);
      setMessage({ text: 'Nouveau prix enregistré.', type: 'success' });
      await loadTicketCosts(ticketId);
    } catch (err) {
      setMessage({ text: `Enregistrement impossible: ${err.message}`, type: 'error' });
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Coûts Ticket</h2>
          <p style={styles.subtitle}>Saisie “nouveau prix” + récapitulatif par type (division auto si plusieurs lignes TicketCost).</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.btnSecondary} onClick={() => navigate('/front')}>Retour Kanban</button>
        </div>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? { ...styles.alertError, backgroundColor: '#ecfdf5', border: '1px solid #10b981', color: '#059669' } : styles.alertError}>
          {message.text}
        </div>
      )}

      <div className={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Sélection ticket</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div style={styles.label}>ticketId</div>
              <input
                style={styles.input}
                value={ticketIdInput}
                onChange={(e) => setTicketIdInput(e.target.value)}
                placeholder="ex: 12"
              />
            </div>
            <button
              style={styles.btnPrimary}
              disabled={loading}
              onClick={async () => {
                const tId = parseInt(ticketIdInput, 10);
                if (Number.isNaN(tId)) {
                  setMessage({ text: 'ticketId invalide', type: 'error' });
                  return;
                }
                setTicketId(tId);
                await loadTicketCosts(tId);
              }}
            >
              {loading ? 'Chargement...' : 'Charger'}
            </button>
          </div>

          <div style={{ height: 14 }} />

          <div style={styles.sectionTitle}>Récapitulatif (backend)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            {recap && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <div style={{ ...styles.row, alignItems: 'center' }}>
                  <div style={styles.rowLeft}>
                    <div style={{ fontWeight: 900 }}>Prix d’origine</div>
                  </div>
                  <div style={styles.rowRight}>{Number(recap.origin_total || 0).toFixed(2)} MGA</div>
                </div>

                <div style={{ ...styles.row, alignItems: 'center' }}>
                  <div style={styles.rowLeft}>
                    <div style={{ fontWeight: 900 }}>Ajout (Kanban)</div>
                  </div>
                  <div style={styles.rowRight}>{Number(recap.added_total || 0).toFixed(2)} MGA</div>
                </div>

                <div style={{ ...styles.row, alignItems: 'center' }}>
                  <div style={styles.rowLeft}>
                    <div style={{ fontWeight: 900 }}>Somme</div>
                  </div>
                  <div style={styles.rowRight}>{Number(recap.grand_total || 0).toFixed(2)} MGA</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ height: 14 }} />

          <button style={styles.btnPrimary} onClick={openModal} disabled={!ticketId}>
            Nouveau prix
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>TicketCost (GLPI)</div>
          {!ticketId ? (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>Entrez un ticketId pour charger ses lignes TicketCost.</div>
          ) : ticketCostsLines.length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>Aucune ligne TicketCost trouvée (GLPI).</div>
          ) : (
            <div style={styles.list}>
              {ticketCostsLines.map((line, idx) => {
                const fixed = parseFloat(line.cost_fixed) || 0;
                const material = parseFloat(line.cost_material) || 0;
                const hourly = parseFloat(line.cost_time) || 0;
                const minutes = parseInt(line.actiontime, 10) || 0;
                const lineTotal = fixed + material + hourly * (minutes / 60);

                return (
                  <div key={idx} style={styles.row}>
                    <div style={styles.rowLeft}>
                      <div style={{ fontWeight: 900 }}>{line.name || 'Coût analytique'}</div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                        minutes: {minutes}
                      </div>
                    </div>
                    <div style={styles.rowRight}>
                      {lineTotal.toFixed(2)} MGA
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContentSmall} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalTag}>Nouveau coût</span>
                <h3 style={styles.modalTitle}>Enregistrer un nouveau prix pour Ticket #{ticketId}</h3>
              </div>
              <button style={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.sectionTitle}>Prix à enregistrer</div>
              <div className={styles.label}>costValue (MGA)</div>
              <input
                style={styles.input}
                value={newCostValue}
                onChange={(e) => setNewCostValue(e.target.value)}
                placeholder="ex: 15000"
              />
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>
                Annuler
              </button>
              <button style={styles.btnPrimary} onClick={submitNewPrice}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


