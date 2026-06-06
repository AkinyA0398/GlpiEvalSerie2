import React, { useEffect, useState } from 'react';
import { fetchTickets } from '../services/api';

interface Ticket {
  id: number; ref_ticket: string; ticket_date: string; ticket_time: string;
  ticket_type: string; title: string; description: string;
  status: string; priority: string; created_at: string; items: string[];
}

const STATUS_COLOR: Record<string,string> = {
  'New':'#6366f1','En cours':'#f59e0b','Résolu':'#22c55e','Fermé':'#6b7280',
};
const PRIO_COLOR: Record<string,string> = {
  'Very High':'#ef4444','High':'#f97316','Medium':'#f59e0b','Low':'#6366f1',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="tkt-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
      {label}
    </span>
  );
}

export const TicketsAdminPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const load = () => {
    setLoading(true);
    const f: Record<string,string> = {};
    if (filterStatus) f.status = filterStatus;
    if (filterType)   f.type   = filterType;
    fetchTickets(f).then(setTickets).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterType]);

  return (
    <div className="bo-page">
      <div className="bo-page-header">
        <div>
          <h1 className="bo-page-title">Tickets</h1>
          <p className="bo-page-sub">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} trouvé{tickets.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="tkt-filters">
        <select className="bo-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {['New','En cours','Résolu','Fermé'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="bo-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          {['Incident','Demande'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="bo-btn bo-btn-ghost" onClick={load}>↻ Actualiser</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="dash-loading">Chargement…</div>
      ) : tickets.length === 0 ? (
        <div className="dash-empty-state">Aucun ticket trouvé.</div>
      ) : (
        <div className="tkt-table-wrap">
          <table className="tkt-table">
            <thead>
              <tr>
                <th>Réf.</th><th>Titre</th><th>Type</th>
                <th>Statut</th><th>Priorité</th><th>Date</th><th>Éléments</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} onClick={() => setSelected(t)} className={selected?.id === t.id ? 'row-active' : ''}>
                  <td><span className="tkt-ref">#{t.ref_ticket}</span></td>
                  <td className="tkt-title-cell">{t.title}</td>
                  <td><Badge label={t.ticket_type} color="#6366f1" /></td>
                  <td><Badge label={t.status} color={STATUS_COLOR[t.status] || '#6b7280'} /></td>
                  <td><Badge label={t.priority} color={PRIO_COLOR[t.priority] || '#6b7280'} /></td>
                  <td className="tkt-date">{t.ticket_date} {t.ticket_time}</td>
                  <td>
                    {t.items?.length ? (
                      <span className="tkt-item-count">{t.items.length} élément{t.items.length > 1 ? 's' : ''}</span>
                    ) : <span className="tkt-item-none">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Fiche ticket (panneau latéral) ── */}
      {selected && (
        <div className="tkt-panel-overlay" onClick={() => setSelected(null)}>
          <div className="tkt-panel" onClick={e => e.stopPropagation()}>
            <div className="tkt-panel-head">
              <span className="tkt-panel-ref">Ticket #{selected.ref_ticket}</span>
              <button className="tkt-panel-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <h2 className="tkt-panel-title">{selected.title}</h2>

            <div className="tkt-panel-badges">
              <Badge label={selected.ticket_type} color="#6366f1" />
              <Badge label={selected.status}      color={STATUS_COLOR[selected.status] || '#6b7280'} />
              <Badge label={selected.priority}    color={PRIO_COLOR[selected.priority] || '#6b7280'} />
            </div>

            <div className="tkt-panel-meta">
              <div className="tkt-meta-row"><span>Date</span><span>{selected.ticket_date} à {selected.ticket_time}</span></div>
            </div>

            {selected.description && (
              <div className="tkt-panel-section">
                <div className="tkt-panel-section-title">Description</div>
                <p className="tkt-panel-desc">{selected.description}</p>
              </div>
            )}

            {selected.items?.length > 0 && (
              <div className="tkt-panel-section">
                <div className="tkt-panel-section-title">Éléments associés ({selected.items.length})</div>
                <div className="tkt-panel-items">
                  {selected.items.map(item => (
                    <span key={item} className="tkt-panel-item-tag">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                      </svg>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
