const BASE = '/api';

// ── Items ──────────────────────────────────────────────────────────────────
export const fetchItems = async (filters: Record<string, string> = {}) => {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${BASE}/items?${params}`);
  if (!res.ok) throw new Error('Erreur chargement éléments');
  return res.json();
};

export const fetchItemFilters = async () => {
  const res = await fetch(`${BASE}/items/filters`);
  if (!res.ok) throw new Error('Erreur chargement filtres');
  return res.json();
};

// ── Tickets ────────────────────────────────────────────────────────────────
export const fetchTickets = async (filters: Record<string, string> = {}) => {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${BASE}/tickets?${params}`);
  if (!res.ok) throw new Error('Erreur chargement tickets');
  return res.json();
};

export const fetchTicket = async (id: number | string) => {
  const res = await fetch(`${BASE}/tickets/${id}`);
  if (!res.ok) throw new Error('Ticket introuvable');
  return res.json();
};

export const createTicket = async (data: {
  ticket_type: string; title: string; description: string;
  priority: string; items: string[];
}) => {
  const res = await fetch(`${BASE}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur création'); }
  return res.json();
};

// ── Stats ──────────────────────────────────────────────────────────────────
export const fetchStats = async () => {
  const res = await fetch(`${BASE}/stats`);
  if (!res.ok) throw new Error('Erreur stats');
  return res.json();
};

// ── Reset ──────────────────────────────────────────────────────────────────
export const resetData = async () => {
  const res = await fetch(`${BASE}/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('Échec réinitialisation');
  return res.json();
};

// ── Import Unifié ──────────────────────────────────────────────────────────
export const importAll = async (csvFiles: File[], zipFile?: File | null) => {
  const fd = new FormData();
  csvFiles.forEach(f => fd.append('files', f));
  if (zipFile) {
    fd.append('archive', zipFile);
  }
  const res = await fetch(`${BASE}/import/all`, { method: 'POST', body: fd });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error || 'Erreur import unifié'); }
  return res.json();
};
