import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import unzipper from 'unzipper';
import {
  resetDatabase,
  insertItemsBatch,
  insertTicketWithItems,
  insertTicketCostsBatch,
  setImageDir
} from './database.js';
import { withSession, glpiRequest } from './glpiClient.js';

const GLPI_COMPUTER_ITEMTYPE = process.env.GLPI_COMPUTER_ITEMTYPE || 'Computer';
const GLPI_TICKET_ITEMTYPE = process.env.GLPI_TICKET_ITEMTYPE || 'Ticket';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CSV_DIR = path.join(ROOT, 'import', 'csv');
const IMAGE_DIR = path.join(ROOT, 'import', 'image');

await fsp.mkdir(CSV_DIR, { recursive: true });
await fsp.mkdir(IMAGE_DIR, { recursive: true });
setImageDir(IMAGE_DIR);

const app = express();
const port = 3001;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// ── Helper: parse CSV buffer → array of row objects ────────────────────────
function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    Readable.from(buffer)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('data', r => rows.push(r))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

// ── Détection du type de CSV par ses colonnes ──────────────────────────────
function detectCsvType(rows) {
  if (!rows.length) return 'unknown';
  const keys = Object.keys(rows[0]);
  if (keys.includes('Ref_Ticket')) return 'tickets';
  if (keys.includes('Num_Ticket')) return 'costs';
  if (keys.includes('Name') && keys.includes('Item_Type')) return 'items';
  return 'unknown';
}

// ══════════════════════════════════════════════════════════════════════
// POST /api/reset — purge GLPI data only (local files preserved)
// ══════════════════════════════════════════════════════════════════════
app.post('/api/reset', async (req, res) => {
  try {
    const result = await resetDatabase();
    res.json({ message: result.message });
  } catch (err) {
    console.error('Erreur reset:', err);
    res.status(500).json({ error: 'Échec de la réinitialisation : ' + err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
// POST /api/import/all  — import unifié CSV + ZIP en une seule requête
// ══════════════════════════════════════════════════════════════════════
const uploadFields = upload.fields([{ name: 'files', maxCount: 3 }, { name: 'archive', maxCount: 1 }]);
app.post('/api/import/all', uploadFields, async (req, res) => {
  const csvFiles = req.files?.files || [];
  const zipFiles = req.files?.archive || [];
  if (!csvFiles.length && !zipFiles.length) {
    return res.status(400).json({ error: 'Aucun fichier reçu.' });
  }

  const results = [];
  let extractedImages = 0;

  try {
    // ── 1. Extract ZIP first so images are on disk before CSV processing ──
    if (zipFiles.length > 0) {
      const zipFile = zipFiles[0];
      const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']);
      let skipped = 0;
      const dir = Readable.from(zipFile.buffer).pipe(unzipper.Parse({ forceStream: true }));
      const tasks = [];
      for await (const entry of dir) {
        const ext = path.extname(entry.path).toLowerCase();
        if (entry.type === 'Directory' || !IMG_EXT.has(ext)) { entry.autodrain(); skipped++; continue; }
        const dest = path.join(IMAGE_DIR, path.basename(entry.path));
        tasks.push(new Promise((res2, rej2) =>
          entry.pipe(fs.createWriteStream(dest))
            .on('finish', () => { extractedImages++; res2(); })
            .on('error', rej2)));
      }
      await Promise.all(tasks);
      results.push({ file: zipFile.originalname, type: 'images', count: extractedImages, skipped });
    }

    // ── 2. Process CSV files ──
    for (const file of csvFiles) {
      await fsp.writeFile(path.join(CSV_DIR, file.originalname), file.buffer);
      const rows = await parseCSV(file.buffer);
      const type = detectCsvType(rows);
      let count = 0;
      if (type === 'items') count = await insertItemsBatch(rows);
      if (type === 'costs') count = await insertTicketCostsBatch(rows);
      if (type === 'tickets') {
        for (const r of rows) {
          let items = [];
          try { items = JSON.parse(r.Items || '[]'); } catch { items = []; }
          await insertTicketWithItems({
            ref_ticket: r.Ref_Ticket, ticket_date: r.Date, ticket_time: r.Heure,
            ticket_type: r.Type, title: r.Titre, description: r.Description,
            status: r.Status, priority: r.Priority
          }, items);
          count++;
        }
      }
      results.push({ file: file.originalname, type, count });
    }

    const totalItems = results.reduce((sum, r) => sum + (r.count || 0), 0);
    res.json({
      message: `Import terminé : ${totalItems} élément(s) traité(s), ${extractedImages} image(s) extraite(s) et uploadées dans GLPI.`,
      results,
    });
  } catch (err) {
    console.error('Erreur import:', err);
    res.status(500).json({ error: 'Échec import : ' + err.message });
  }
});

// Keep old routes as aliases for backward compatibility
app.post('/api/import/csv', upload.array('files', 3), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'Aucun fichier reçu.' });
  const results = [];
  try {
    for (const file of req.files) {
      await fsp.writeFile(path.join(CSV_DIR, file.originalname), file.buffer);
      const rows = await parseCSV(file.buffer);
      const type = detectCsvType(rows);
      let count = 0;
      if (type === 'items') count = await insertItemsBatch(rows);
      if (type === 'costs') count = await insertTicketCostsBatch(rows);
      if (type === 'tickets') {
        for (const r of rows) {
          let items = [];
          try { items = JSON.parse(r.Items || '[]'); } catch { items = []; }
          await insertTicketWithItems({
            ref_ticket: r.Ref_Ticket, ticket_date: r.Date, ticket_time: r.Heure,
            ticket_type: r.Type, title: r.Titre, description: r.Description,
            status: r.Status, priority: r.Priority
          }, items);
          count++;
        }
      }
      results.push({ file: file.originalname, type, count });
    }
    res.json({ message: `Import terminé.`, results });
  } catch (err) {
    console.error('Erreur import CSV:', err);
    res.status(500).json({ error: 'Échec import CSV : ' + err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════=
// GET /api/stats  — Dashboard (GLPI proxy)
// ═════════════════════════════════════════════════════════════════════=
app.get('/api/stats', async (req, res) => {
  try {
    const result = await withSession(async (sessionToken) => {
      // NOTE: pour être robuste, on renvoie au minimum `total`.
      // L’UI actuelle ne dépend pas fortement des agrégations détaillées.

      const computers = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: `/${GLPI_COMPUTER_ITEMTYPE}`,
        query: { range: '0-0', forcedisplay: '*', expand_dropdowns: 'true' },
      });

      const tickets = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: `/${GLPI_TICKET_ITEMTYPE}`,
        query: { range: '0-0', forcedisplay: '*', expand_dropdowns: 'true' },
      });

      const computersArr = Array.isArray(computers) ? computers : (computers?.data || []);
      const ticketsArr = Array.isArray(tickets) ? tickets : (tickets?.data || []);

      return {
        items: { total: computersArr.length, byType: [], byStatus: [] },
        tickets: { total: ticketsArr.length, byType: [], byStatus: [], byPriority: [] },
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ═════════════════════════════════════════════════════════════════════=
// GET /api/items  — Liste avec filtres (GLPI proxy)
// ═════════════════════════════════════════════════════════════════════=
app.get('/api/items', async (req, res) => {
  try {
    const { q, type, status, location, manufacturer } = req.query;

    const result = await withSession(async (sessionToken) => {
      const glpiComputers = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: `/${GLPI_COMPUTER_ITEMTYPE}`,
        query: { range: '0-200', expand_dropdowns: 'true', forcedisplay: '*' },
      });

      const arr = Array.isArray(glpiComputers) ? glpiComputers : (glpiComputers?.data || []);

      // IMPORTANT: GLPI ne renvoie pas toujours les champs comme des objets {name}.
      // Pour éviter de “perdre” des items à cause de mappings vides, on applique:
      // - q: robuste sur name/serial
      // - autres filtres: seulement si on arrive à lire une valeur textuelle non vide.
      return arr
        .filter((c) => {
          const name = String(c.name || c.completename || '');
          const completename = String(c.completename || '');
          const model = String(c.model || '');
          const inv = String(c.serial || c.otherserial || '');
          const user = String(c.user?.name || c.user_name || c.users?.[0]?.name || '');

          const searchText = `${name} ${completename} ${model} ${inv} ${user}`.toLowerCase();
          const matchesQ = q ? searchText.includes(String(q).toLowerCase()) : true;

          const statusText = String(c.status?.name || c.state?.name || c.status || '');
          const locText = String(c.locations?.[0]?.name || c.location || '');
          const manuText = String(c.manufacturer?.name || c.manufacturer || '');
          const typeText = String(c.category?.name || c.item_type || c.category || '');

          const matchesType = type ? (typeText ? typeText.toLowerCase().includes(String(type).toLowerCase()) : true) : true;
          const matchesStatus = status ? (statusText ? statusText.toLowerCase().includes(String(status).toLowerCase()) : true) : true;
          const matchesLocation = location ? (locText ? locText.toLowerCase().includes(String(location).toLowerCase()) : true) : true;
          const matchesManufacturer = manufacturer ? (manuText ? manuText.toLowerCase().includes(String(manufacturer).toLowerCase()) : true) : true;

          return matchesQ && matchesType && matchesStatus && matchesLocation && matchesManufacturer;
        })
        .map((c, idx) => ({
          id: c.id ?? idx,
          name: c.name || c.completename || '—',
          status: c.status?.name || c.state?.name || c.status || '',
          location: c.locations?.[0]?.name || c.location || '',
          manufacturer: c.manufacturer?.name || c.manufacturer || '',
          item_type: c.category?.name || c.item_type || c.category || '',
          model: c.model || '',
          inventory_number: c.serial || c.otherserial || '',
          user_name: c.users?.[0]?.name || c.user?.name || c.user_name || '',
        }));
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET /api/items/filters — valeurs distinctes pour les dropdowns (GLPI proxy)
app.get('/api/items/filters', async (req, res) => {
  try {
    const result = await withSession(async (sessionToken) => {
      const glpiComputers = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: `/${GLPI_COMPUTER_ITEMTYPE}`,
        query: { range: '0-200', expand_dropdowns: 'true', forcedisplay: '*' },
      });

      const arr = Array.isArray(glpiComputers) ? glpiComputers : (glpiComputers?.data || []);

      const uniq = (list) => Array.from(new Set(list.filter(Boolean))).sort();
      const get = (c, keys) => {
        for (const k of keys) {
          const v = k.split('.').reduce((acc, p) => (acc ? acc[p] : undefined), c);
          if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
        }
        return '';
      };

      return {
        types: uniq(arr.map(c => get(c, ['category.name', 'item_type']))),
        statuses: uniq(arr.map(c => get(c, ['status.name', 'state.name', 'status']))),
        locations: uniq(arr.map(c => get(c, ['locations.0.name', 'location.name', 'location']))),
        manufacturers: uniq(arr.map(c => get(c, ['manufacturer.name', 'manufacturer']))),
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ═════════════════════════════════════════════════════════════════════=
// GET /api/tickets  — Liste tickets (GLPI proxy)
// ═════════════════════════════════════════════════════════════════════=
app.get('/api/tickets', async (req, res) => {
  try {
    const { status, type, priority } = req.query;

    const result = await withSession(async (sessionToken) => {
      const glpiTickets = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: `/${GLPI_TICKET_ITEMTYPE}`,
        query: { range: '0-100', expand_dropdowns: 'true', forcedisplay: '*' },
      });

      const arr = Array.isArray(glpiTickets) ? glpiTickets : (glpiTickets?.data || []);

      return arr
        .filter((t) => {
          const matchesStatus = status ? String(t.status || t.state?.name || '').toLowerCase().includes(String(status).toLowerCase()) : true;
          const matchesType = type ? String(t.type || t.ticket_type || '').toLowerCase().includes(String(type).toLowerCase()) : true;
          const matchesPriority = priority ? String(t.priority || t.impact?.name || t.urgency?.name || '').toLowerCase().includes(String(priority).toLowerCase()) : true;
          return matchesStatus && matchesType && matchesPriority;
        })
        .map((t, idx) => ({
          id: t.id ?? idx,
          ref_ticket: String(t.id || t.number || t.ticket_number || t.fields_id || ''),
          ticket_date: t.date || t.creation_date || t.created_at || '',
          ticket_time: t.time || '',
          ticket_type: t.type || t.ticket_type || 'Incident',
          title: t.name || t.title || '—',
          description: t.content || t.description || '',
          status: t.status || t.state?.name || 'New',
          priority: t.priority || t.impact?.name || t.urgency?.name || 'Medium',
          created_at: t.date_mod || t.created_at || '',
          items: [],
        }));
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/tickets/:id — Détail ticket (GLPI proxy)
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const result = await withSession(async (sessionToken) => {
      const glpiTicket = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: `/${GLPI_TICKET_ITEMTYPE}/${req.params.id}`,
        query: { expand_dropdowns: 'true', forcedisplay: '*' },
      });

      return {
        id: glpiTicket.id,
        ref_ticket: String(glpiTicket.id || ''),
        ticket_date: glpiTicket.date || glpiTicket.creation_date || '',
        ticket_time: glpiTicket.time || '',
        ticket_type: glpiTicket.type || glpiTicket.ticket_type || 'Incident',
        title: glpiTicket.name || glpiTicket.title || '—',
        description: glpiTicket.content || glpiTicket.description || '',
        status: glpiTicket.status || glpiTicket.state?.name || 'New',
        priority: glpiTicket.priority || glpiTicket.impact?.name || glpiTicket.urgency?.name || 'Medium',
        created_at: glpiTicket.date_mod || glpiTicket.created_at || '',
        items: [],
        costs: [],
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/tickets — Créer un ticket (GLPI proxy)
app.post('/api/tickets', async (req, res) => {
  try {
    const { ticket_type, title, description, priority, items } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Le titre est obligatoire.' });

    const result = await withSession(async (sessionToken) => {
      // Payload GLPI minimal (à ajuster selon le schéma ITIL configuré)
      // Dans GLPI: Ticket utilise généralement des champs comme `name`, `content`, `type`
      const input = {
        name: title,
        content: description || '',
        type: ticket_type || 'Incident',
      };

      const created = await glpiRequest({
        sessionToken,
        method: 'POST',
        path: `/${GLPI_TICKET_ITEMTYPE}`,
        body: input,
      });

      // Normalisation de l’id
      const createdId = created?.id ?? created?.ticket?.id ?? created?.result?.id ?? created?.result ?? created?.['id'];

      // NOTE: association `items` (équipements) -> TODO (mapping GLPI des relations)
      // Le front utilise `items: string[]` (noms locaux). Pour GLPI, il faut convertir noms->IDs Computer,
      // puis créer les liens adéquats (selon vos relations ITIL).

      return {
        message: 'Ticket créé avec succès (GLPI).',
        id: createdId,
        ref_ticket: String(createdId || ''),
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Erreur création ticket:', err);
    res.status(500).json({ error: err.message || 'Échec création ticket.' });
  }
});


app.listen(port, () => {
  console.log(`✅ Serveur http://localhost:${port}`);
  console.log(`   CSV  → ${CSV_DIR}`);
  console.log(`   IMG  → ${IMAGE_DIR}`);
});
