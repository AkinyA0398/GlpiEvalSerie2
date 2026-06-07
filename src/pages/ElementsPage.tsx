import React, { useEffect, useState, useCallback, useRef } from 'react';

import { fetchItems, fetchItemFilters, fetchItem } from '../services/api';


interface Item {
  id: number; name: string; status: string; location: string;
  manufacturer: string; item_type: string; model: string;
  inventory_number: string; user_name: string;
}

const STATUS_COLOR: Record<string, string> = {
  'En production': '#22c55e', 'Maintenance': '#f59e0b', 'En panne': '#ef4444', 'En stock': '#6366f1',
};

function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLOR[status] || '#6b7280';
  return <span className="status-dot" style={{ background: color }} title={status} />;
}

export const ElementsPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [filters, setFilters] = useState<{ types: string[]; statuses: string[]; locations: string[]; manufacturers: string[] }>
    ({ types: [], statuses: [], locations: [], manufacturers: [] });
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [selType, setSelType] = useState('');
  const [selStatus, setSelStatus] = useState('');
  const [selLocation, setSelLocation] = useState('');
  const [selManu, setSelManu] = useState('');

  // Charger les valeurs de filtre + les items au montage
  useEffect(() => {
    fetchItemFilters().then(setFilters).catch(console.error);
    fetchItems({})
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);


  // Abort d’une requête précédente (anti “réponses en retard”)
  const abortRef = useRef<AbortController | null>(null);


  const runSearch = useCallback((next?: { force?: boolean }) => {
    const p: Record<string, string> = {};
    if (q) p.q = q;
    if (selType) p.type = selType;
    if (selStatus) p.status = selStatus;
    if (selLocation) p.location = selLocation;
    if (selManu) p.manufacturer = selManu;

    // Si rien à rechercher, on charge quand même la liste complète
    if (!next?.force && !q && !selType && !selStatus && !selLocation && !selManu) {
      // Continuer quand même pour être cohérent (on évite juste un double trigger)
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    fetchItems(p, { signal: controller.signal })
      .then(setItems)
      .catch((err) => {
        if (String(err?.name) !== 'AbortError') console.error(err);
      })
      .finally(() => {
        // Éviter de casser si une requête a été annulée
        if (!controller.signal.aborted) setLoading(false);
      });
  }, [q, selType, selStatus, selLocation, selManu]);

  const search = useCallback(() => {
    runSearch({ force: true });
  }, [runSearch]);

  // Debounce pour la recherche en live
  useEffect(() => {
    const t = window.setTimeout(() => {
      runSearch();
    }, 350);

    return () => {
      window.clearTimeout(t);
    };
  }, [q, selType, selStatus, selLocation, selManu, runSearch]);





  const handleReset = () => {
    setQ('');
    setSelType('');
    setSelStatus('');
    setSelLocation('');
    setSelManu('');
    // recharger la liste complète tout de suite
    runSearch({ force: true });
  };


  // ── Détails item (overlay) ───────────────────────────────
  const [selectedItem, setSelectedItem] = useState<null | Record<string, unknown>>(null);
  const fetchItemDetail = async (id: number) => {
    try {
      const d = await fetchItem(id);
      setSelectedItem(d);
    } catch {
      // on ignore pour le moment
    }

  };



  return (
    <div className="front-page">
      <div className="front-page-header">
        <div>
          <h1 className="front-page-title">Éléments</h1>
          <p className="front-page-sub">{items.length} élément{items.length !== 1 ? 's' : ''} trouvé{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Barre de recherche multi-critères ── */}
      <div className="front-filter-bar">
        <div className="front-search-wrap">
          <svg className="front-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="input-search-elements"
            type="text"
            placeholder="Nom, modèle, n° inventaire, utilisateur…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="front-search-input"
          />
          <button className="front-search-btn" onClick={search} id="btn-search" disabled={loading}>
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>

        </div>

        <div className="front-selects">
          <select id="filter-type" className="bo-select" value={selType} onChange={e => setSelType(e.target.value)}>
            <option value="">Tous les types</option>
            {filters.types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select id="filter-status" className="bo-select" value={selStatus} onChange={e => setSelStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            {filters.statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select id="filter-location" className="bo-select" value={selLocation} onChange={e => setSelLocation(e.target.value)}>
            <option value="">Tous les emplacements</option>
            {filters.locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select id="filter-manufacturer" className="bo-select" value={selManu} onChange={e => setSelManu(e.target.value)}>
            <option value="">Tous les fabricants</option>
            {filters.manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {(q || selType || selStatus || selLocation || selManu) && (
            <button className="bo-btn bo-btn-ghost" onClick={handleReset} id="btn-reset-filters">✕ Réinitialiser</button>
          )}
        </div>
      </div>

      {/* ── Grille d'éléments ── */}
      {loading ? (
        <div className="dash-loading">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="dash-empty-state">Aucun élément ne correspond aux critères.</div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div
              key={item.id}
              className="item-card"
              id={`item-${item.id}`}
              role="button"
              tabIndex={0}
              onClick={() => fetchItemDetail(item.id)}
              onKeyDown={(e) => e.key === 'Enter' && fetchItemDetail(item.id)}
            >

              <div className="item-card-top">
                <div className="item-type-chip">{item.item_type || '—'}</div>
                <StatusDot status={item.status} />
              </div>
              <div className="item-name">{item.name}</div>
              <div className="item-model">{item.manufacturer} — {item.model}</div>

              {/* petite debug/overlay basique: évite “unused state” */}
              {selectedItem && String(selectedItem?.id) === String(item.id) && (
                <div className="item-detail-mini" aria-label="Détail">
                  {String(selectedItem?.inventory_number ?? '—')}
                </div>
              )}

              <div className="item-details">
                <div className="item-detail-row">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  {item.location || '—'}
                </div>
                <div className="item-detail-row">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  {item.user_name || 'Non assigné'}
                </div>
                <div className="item-detail-row">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" /></svg>
                  {item.inventory_number || '—'}
                </div>
              </div>
              <div className="item-status-row">
                <span className="item-status-badge" style={{ color: STATUS_COLOR[item.status] || '#6b7280', background: `${STATUS_COLOR[item.status] || '#6b7280'}22` }}>
                  {item.status || '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
