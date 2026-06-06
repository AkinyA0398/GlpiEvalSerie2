import React, { useEffect, useState } from 'react';
import { fetchStats } from '../services/api';

interface Stats {
  items:   { total: number; byType: {item_type:string;count:number}[]; byStatus: {status:string;count:number}[] };
  tickets: { total: number; byType: {ticket_type:string;count:number}[]; byStatus: {status:string;count:number}[]; byPriority: {priority:string;count:number}[] };
}

const STATUS_COLOR: Record<string,string> = {
  'En production':'#22c55e','Maintenance':'#f59e0b','En panne':'#ef4444','En stock':'#6366f1',
  'New':'#6366f1','En cours':'#f59e0b','Résolu':'#22c55e','Fermé':'#6b7280',
};
const PRIO_COLOR: Record<string,string> = {
  'Very High':'#ef4444','High':'#f97316','Medium':'#f59e0b','Low':'#6366f1',
};

function BarGroup({ label, value, max, color }: { label:string; value:number; max:number; color?:string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color || 'var(--accent)' }} />
      </div>
      <span className="bar-count">{value}</span>
    </div>
  );
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,  setError]  = useState('');

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="bo-page"><div className="dash-loading">Chargement des statistiques…</div></div>;
  if (error)   return <div className="bo-page"><div className="bo-alert alert-error">❌ {error}</div></div>;
  if (!stats)  return null;

  const maxItemType   = Math.max(...stats.items.byType.map(r => r.count),   1);
  const maxItemStatus = Math.max(...stats.items.byStatus.map(r => r.count), 1);
  const maxTktType    = Math.max(...stats.tickets.byType.map(r => r.count), 1);
  const maxTktStatus  = Math.max(...stats.tickets.byStatus.map(r => r.count), 1);

  return (
    <div className="bo-page">
      <div className="bo-page-header">
        <div>
          <h1 className="bo-page-title">Dashboard</h1>
          <p className="bo-page-sub">Vue d'ensemble des données importées</p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dash-kpi-row">
        <div className="dash-kpi">
          <div className="dash-kpi-icon kpi-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <div className="dash-kpi-num">{stats.items.total}</div>
            <div className="dash-kpi-label">Éléments total</div>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon kpi-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
            </svg>
          </div>
          <div>
            <div className="dash-kpi-num">{stats.tickets.total}</div>
            <div className="dash-kpi-label">Tickets total</div>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon kpi-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div className="dash-kpi-num">
              {stats.items.byStatus.find(s => s.status === 'En production')?.count ?? 0}
            </div>
            <div className="dash-kpi-label">En production</div>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon kpi-red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div className="dash-kpi-num">
              {stats.items.byStatus.find(s => s.status === 'En panne')?.count ?? 0}
            </div>
            <div className="dash-kpi-label">En panne</div>
          </div>
        </div>
      </div>

      {/* ── Détails éléments ── */}
      <div className="dash-section-title">Éléments</div>
      <div className="dash-grid-2">
        <div className="bo-card">
          <h2 className="bo-card-title">Par type</h2>
          <div className="bar-list">
            {stats.items.byType.map(r => (
              <BarGroup key={r.item_type} label={r.item_type || '—'} value={r.count} max={maxItemType} />
            ))}
            {!stats.items.byType.length && <p className="dash-empty">Aucune donnée</p>}
          </div>
        </div>
        <div className="bo-card">
          <h2 className="bo-card-title">Par statut</h2>
          <div className="bar-list">
            {stats.items.byStatus.map(r => (
              <BarGroup key={r.status} label={r.status || '—'} value={r.count} max={maxItemStatus} color={STATUS_COLOR[r.status]} />
            ))}
            {!stats.items.byStatus.length && <p className="dash-empty">Aucune donnée</p>}
          </div>
        </div>
      </div>

      {/* ── Détails tickets ── */}
      <div className="dash-section-title" style={{ marginTop: 32 }}>Tickets</div>
      <div className="dash-grid-3">
        <div className="bo-card">
          <h2 className="bo-card-title">Par type</h2>
          <div className="bar-list">
            {stats.tickets.byType.map(r => (
              <BarGroup key={r.ticket_type} label={r.ticket_type || '—'} value={r.count} max={maxTktType} />
            ))}
            {!stats.tickets.byType.length && <p className="dash-empty">Aucune donnée</p>}
          </div>
        </div>
        <div className="bo-card">
          <h2 className="bo-card-title">Par statut</h2>
          <div className="bar-list">
            {stats.tickets.byStatus.map(r => (
              <BarGroup key={r.status} label={r.status || '—'} value={r.count} max={maxTktStatus} color={STATUS_COLOR[r.status]} />
            ))}
            {!stats.tickets.byStatus.length && <p className="dash-empty">Aucune donnée</p>}
          </div>
        </div>
        <div className="bo-card">
          <h2 className="bo-card-title">Par priorité</h2>
          <div className="bar-list">
            {stats.tickets.byPriority.map(r => (
              <BarGroup key={r.priority} label={r.priority || '—'} value={r.count} max={stats.tickets.total} color={PRIO_COLOR[r.priority]} />
            ))}
            {!stats.tickets.byPriority.length && <p className="dash-empty">Aucune donnée</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
