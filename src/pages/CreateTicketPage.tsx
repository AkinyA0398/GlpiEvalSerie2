import React, { useEffect, useState } from 'react';
import { fetchItems, createTicket } from '../services/api';

interface Item { id: number; name: string; item_type: string; status: string; location: string; }

const TYPES     = ['Incident', 'Demande'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Very High'];

export const CreateTicketPage: React.FC = () => {
  // Champs du ticket
  const [ticketType,  setTicketType]  = useState('Incident');
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [priority,    setPriority]    = useState('Medium');

  // Sélection d'éléments
  const [allItems,      setAllItems]      = useState<Item[]>([]);
  const [itemSearch,    setItemSearch]    = useState('');
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);

  // État
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');

  useEffect(() => {
    fetchItems().then(setAllItems).catch(console.error);
  }, []);

  const filteredItems = allItems.filter(i =>
    !selectedItems.find(s => s.id === i.id) &&
    (i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
     i.item_type?.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  const addItem    = (item: Item) => setSelectedItems(prev => [...prev, item]);
  const removeItem = (id: number) => setSelectedItems(prev => prev.filter(i => i.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Le titre est obligatoire.'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await createTicket({
        ticket_type: ticketType, title, description, priority,
        items: selectedItems.map(i => i.name),
      });
      setSuccess(`✅ Ticket #${res.ref_ticket} créé avec succès !`);
      setTitle(''); setDescription(''); setSelectedItems([]); setItemSearch('');
      setPriority('Medium'); setTicketType('Incident');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="front-page">
      <div className="front-page-header">
        <div>
          <h1 className="front-page-title">Créer un ticket</h1>
          <p className="front-page-sub">Décrivez votre incident ou demande</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="crt-form">
        {/* ── Colonne gauche : champs du ticket ── */}
        <div className="crt-left">
          <div className="bo-card">
            <h2 className="bo-card-title">Informations</h2>

            <div className="crt-field">
              <label>Type de ticket</label>
              <div className="crt-radio-group">
                {TYPES.map(t => (
                  <label key={t} className={`crt-radio ${ticketType === t ? 'selected' : ''}`} id={`radio-${t}`}>
                    <input type="radio" name="type" value={t} checked={ticketType === t}
                      onChange={() => setTicketType(t)} />
                    {t === 'Incident' ? '🔴' : '🔵'} {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="crt-field">
              <label htmlFor="crt-title">Titre <span className="required">*</span></label>
              <input id="crt-title" type="text" placeholder="Résumé court du problème"
                value={title} onChange={e => setTitle(e.target.value)}
                className={`crt-input ${!title && error ? 'input-error' : ''}`} />
            </div>

            <div className="crt-field">
              <label htmlFor="crt-description">Description</label>
              <textarea id="crt-description" placeholder="Décrivez le problème en détail…"
                value={description} onChange={e => setDescription(e.target.value)}
                className="crt-textarea" rows={5} />
            </div>

            <div className="crt-field">
              <label>Priorité</label>
              <div className="crt-priority-group">
                {PRIORITIES.map(p => {
                  const colors: Record<string,string> = { Low:'#6366f1',Medium:'#f59e0b',High:'#f97316','Very High':'#ef4444' };
                  return (
                    <button type="button" key={p} id={`prio-${p}`}
                      className={`crt-prio-btn ${priority === p ? 'selected' : ''}`}
                      style={priority === p ? { borderColor: colors[p], background: `${colors[p]}22`, color: colors[p] } : {}}
                      onClick={() => setPriority(p)}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {(success || error) && (
            <div className={`bo-alert ${success ? 'alert-success' : 'alert-error'}`}>
              {success || error}
            </div>
          )}

          <button type="submit" className="bo-btn bo-btn-primary crt-submit" id="btn-submit-ticket" disabled={submitting}>
            {submitting
              ? <><span className="spinner" />Envoi en cours…</>
              : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>Créer le ticket</>}
          </button>
        </div>

        {/* ── Colonne droite : sélection d'éléments ── */}
        <div className="crt-right">
          <div className="bo-card" style={{ height: '100%' }}>
            <h2 className="bo-card-title">
              Éléments associés
              {selectedItems.length > 0 && <span className="bo-badge" style={{ marginLeft: 8 }}>{selectedItems.length}</span>}
            </h2>
            <p className="bo-card-desc">Recherchez et ajoutez les équipements concernés</p>

            {/* Selected tags */}
            {selectedItems.length > 0 && (
              <div className="crt-selected-tags">
                {selectedItems.map(item => (
                  <div key={item.id} className="crt-tag" id={`tag-${item.id}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                    </svg>
                    <span>{item.name}</span>
                    <button type="button" onClick={() => removeItem(item.id)} className="crt-tag-remove">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Recherche */}
            <div className="crt-item-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input id="input-item-search" type="text" placeholder="Rechercher un élément…"
                value={itemSearch} onChange={e => setItemSearch(e.target.value)}
                className="crt-item-search-input" />
            </div>

            {/* Liste des éléments disponibles */}
            <div className="crt-item-list">
              {filteredItems.slice(0, 20).map(item => (
                <div key={item.id} className="crt-item-row" onClick={() => addItem(item)} id={`item-pick-${item.id}`}>
                  <div className="crt-item-row-left">
                    <span className="item-type-chip" style={{ fontSize: '0.7rem' }}>{item.item_type}</span>
                    <span className="crt-item-name">{item.name}</span>
                  </div>
                  <span className="crt-item-location">{item.location}</span>
                  <button type="button" className="crt-add-btn">+</button>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <p className="crt-item-empty">
                  {allItems.length === 0 ? 'Aucun élément en base (importez des CSV).' : 'Aucun élément ne correspond.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
