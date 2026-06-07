import { withSession, glpiRequest } from './glpiClient.js';

export async function debugTicketLinks({ ticketId, sessionToken, GLPI_TICKET_ITEMTYPE }) {
  const candidates = [
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Computer`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Monitor`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Computer?range=0-200`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Monitor?range=0-200`,
  ];

  const out = [];

  for (const p of candidates) {
    try {
      const data = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: p,
        query: { range: '0-200', forcedisplay: '*', expand_dropdowns: 'true' },
      });
      const arr = Array.isArray(data) ? data : (data?.data || data || []);
      const len = Array.isArray(arr) ? arr.length : 0;

      const names = Array.isArray(arr)
        ? Array.from(
            new Set(arr.map(x => String(x?.name || x?.completename || x?.title || '').trim()).filter(Boolean))
          )
        : [];

      out.push({ endpoint: p, ok: true, len, sample: names.slice(0, 10) });
    } catch (e) {
      out.push({ endpoint: p, ok: false, error: e?.message || String(e) });
    }
  }

  return out;
}

export function registerDebugRoutes(app) {
  app.get('/api/debug/ticket-links', async (req, res) => {
    const ticketId = req.query.ticketId;
    if (!ticketId) return res.status(400).json({ error: 'ticketId required' });

    const GLPI_TICKET_ITEMTYPE = process.env.GLPI_TICKET_ITEMTYPE || 'Ticket';

    try {
      const result = await withSession(async (sessionToken) => {
        return debugTicketLinks({ ticketId, sessionToken, GLPI_TICKET_ITEMTYPE });
      });
      res.json({ ticketId, results: result });
    } catch (e) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  });
}

