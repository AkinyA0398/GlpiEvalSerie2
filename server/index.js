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

  // IMPORTANT: validation stricte ligne par ligne (évite champs vides)
  // Si un champ obligatoire est vide, on stoppe l'import.
  const REQUIRED_ITEMS = ['Name', 'Status', 'Location', 'Manufacturer', 'Item_Type', 'Model', 'Inventory_Number'];
  const REQUIRED_TICKETS = ['Ref_Ticket', 'Date', 'Heure', 'Type', 'Titre', 'Description', 'Status', 'Priority', 'Items'];
  const REQUIRED_COSTS = ['Num_Ticket', 'Duration_second', 'Time_Cost', 'Fixed_Cost'];

  function assertRequiredFields(row, required, context) {
    const missing = required.filter(k => !String(row[k] ?? '').trim());
    if (missing.length) {
      throw new Error(`${context}: champs manquants [${missing.join(', ')}]`);
    }
  }

  function assertRequiredFieldsStrict({
    row,
    required,
    context,
    fileName,
    lineNumber,
  }) {
    const missing = required.filter((k) => !String(row[k] ?? '').trim());
    if (!missing.length) return;
    // Message explicit: fichier + ligne + champs manquants
    throw new Error(`${context} — fichier "${fileName}", ligne ${lineNumber}: champs manquants [${missing.join(', ')}]`);
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

      // Validation AVANT insertion (ligne par ligne)
      if (type === 'items') {
        for (let idx = 0; idx < rows.length; idx++) {
          const r = rows[idx];
          const lineNumber = idx + 2; // header=1
          assertRequiredFieldsStrict({
            row: r,
            required: REQUIRED_ITEMS,
            context: 'items',
            fileName: file.originalname,
            lineNumber,
          });
        }
        count = await insertItemsBatch(rows);
      } else if (type === 'costs') {
        for (let idx = 0; idx < rows.length; idx++) {
          const r = rows[idx];
          const lineNumber = idx + 2;
          assertRequiredFieldsStrict({
            row: r,
            required: REQUIRED_COSTS,
            context: 'costs',
            fileName: file.originalname,
            lineNumber,
          });
        }
        count = await insertTicketCostsBatch(rows);
      } else if (type === 'tickets') {
        for (let idx = 0; idx < rows.length; idx++) {
          const r = rows[idx];
          const lineNumber = idx + 2;

          assertRequiredFieldsStrict({
            row: r,
            required: REQUIRED_TICKETS,
            context: 'tickets',
            fileName: file.originalname,
            lineNumber,
          });

          let items = null;
          try { items = JSON.parse(r.Items); } catch { items = null; }
          if (!Array.isArray(items) || items.length === 0) {
            throw new Error(`tickets — fichier "${file.originalname}", ligne ${lineNumber}: champs manquants [Items]`);
          }

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

  // Re-define required fields here too to keep consistent behaviour
  const REQUIRED_ITEMS = ['Name', 'Status', 'Location', 'Manufacturer', 'Item_Type', 'Model', 'Inventory_Number'];
  const REQUIRED_TICKETS = ['Ref_Ticket', 'Date', 'Heure', 'Type', 'Titre', 'Description', 'Status', 'Priority', 'Items'];
  const REQUIRED_COSTS = ['Num_Ticket', 'Duration_second', 'Time_Cost', 'Fixed_Cost'];

  function assertRequiredFieldsStrict({
    row,
    required,
    context,
    fileName,
    lineNumber,
  }) {
    const missing = required.filter((k) => !String(row[k] ?? '').trim());
    if (!missing.length) return;
    throw new Error(`${context} — fichier "${fileName}", ligne ${lineNumber}: champs manquants [${missing.join(', ')}]`);
  }

  try {
    for (const file of req.files) {
      await fsp.writeFile(path.join(CSV_DIR, file.originalname), file.buffer);
      const rows = await parseCSV(file.buffer);
      const type = detectCsvType(rows);
      let count = 0;

      if (type === 'items') {
        for (let idx = 0; idx < rows.length; idx++) {
          assertRequiredFieldsStrict({
            row: rows[idx],
            required: REQUIRED_ITEMS,
            context: 'items',
            fileName: file.originalname,
            lineNumber: idx + 2,
          });
        }
        count = await insertItemsBatch(rows);
      } else if (type === 'costs') {
        for (let idx = 0; idx < rows.length; idx++) {
          assertRequiredFieldsStrict({
            row: rows[idx],
            required: REQUIRED_COSTS,
            context: 'costs',
            fileName: file.originalname,
            lineNumber: idx + 2,
          });
        }
        count = await insertTicketCostsBatch(rows);
      } else if (type === 'tickets') {
        for (let idx = 0; idx < rows.length; idx++) {
          const r = rows[idx];
          const lineNumber = idx + 2;

          assertRequiredFieldsStrict({
            row: r,
            required: REQUIRED_TICKETS,
            context: 'tickets',
            fileName: file.originalname,
            lineNumber,
          });

          let items = null;
          try { items = JSON.parse(r.Items); } catch { items = null; }
          if (!Array.isArray(items) || items.length === 0) {
            throw new Error(`tickets — fichier "${file.originalname}", ligne ${lineNumber}: champs manquants [Items]`);
          }

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
    res.status(400).json({ error: 'Échec import CSV : ' + err.message });
  }
});


// ═════════════════════════════════════════════════════════════════════=
// GET /api/stats  — Dashboard (GLPI proxy)
// ═════════════════════════════════════════════════════════════════════=
app.get('/api/stats', async (req, res) => {
  try {
    const result = await withSession(async (sessionToken) => {
      // GLPI endpoints (Computer + Monitor + Ticket)
      const [computers, monitors, tickets] = await Promise.all([
        glpiRequest({
          sessionToken,
          method: 'GET',
          path: '/Computer',
          query: { range: '0-200', forcedisplay: '*', expand_dropdowns: 'true' },
        }),
        glpiRequest({
          sessionToken,
          method: 'GET',
          path: '/Monitor',
          query: { range: '0-200', forcedisplay: '*', expand_dropdowns: 'true' },
        }),
        glpiRequest({
          sessionToken,
          method: 'GET',
          path: `/${GLPI_TICKET_ITEMTYPE}`,
          query: { range: '0-200', forcedisplay: '*', expand_dropdowns: 'true' },
        }),
      ]);

      const computersArr = Array.isArray(computers) ? computers : (computers?.data || []);
      const monitorsArr = Array.isArray(monitors) ? monitors : (monitors?.data || []);
      const ticketsArr = Array.isArray(tickets) ? tickets : (tickets?.data || []);

      const computersNormalized = Array.isArray(computersArr) ? computersArr : [];
      const monitorsNormalized = Array.isArray(monitorsArr) ? monitorsArr : [];
      const ticketsNormalized = Array.isArray(ticketsArr) ? ticketsArr : [];

      const itemsByType = [
        { item_type: 'Computer', count: computersNormalized.length },
        { item_type: 'Monitor', count: monitorsNormalized.length },
      ].filter(r => r.count > 0);

      const byStatus = (arr) => {
        const m = new Map();
        for (const x of arr) {
          const s = String(x?.status?.name || x?.state?.name || x?.status || '').trim();
          const k = s || '—';
          m.set(k, (m.get(k) || 0) + 1);
        }
        return Array.from(m.entries()).map(([status, count]) => ({ status, count }));
      };

      const itemsByStatus = byStatus([...computersNormalized, ...monitorsNormalized]);

      const ticketsByType = Array.from(
        ticketsNormalized.reduce((acc, t) => {
          const label = String(t?.type?.name || t?.ticket_type || 'Incident').trim() || 'Incident';
          acc.set(label, (acc.get(label) || 0) + 1);
          return acc;
        }, new Map())
      ).map(([ticket_type, count]) => ({ ticket_type, count }));

      const ticketsByStatus = Array.from(
        ticketsNormalized.reduce((acc, t) => {
          const label = String(t?.status?.name || t?.state?.name || t?.status || 'New').trim() || 'New';
          acc.set(label, (acc.get(label) || 0) + 1);
          return acc;
        }, new Map())
      ).map(([status, count]) => ({ status, count }));

      const ticketsByPriority = Array.from(
        ticketsNormalized.reduce((acc, t) => {
          const label = String(t?.priority?.name || t?.impact?.name || t?.urgency?.name || t?.priority || 'Medium').trim() || 'Medium';
          acc.set(label, (acc.get(label) || 0) + 1);
          return acc;
        }, new Map())
      ).map(([priority, count]) => ({ priority, count }));

      // IMPORTANT: GLPI peut renvoyer le statut sous des clés différentes.
      // On applique le même mapping que /api/items.
      const getStatusForStats = (x) => {
        const v = String(
          x?.status?.name ||
          x?.state?.name ||
          x?.states?.[0]?.name ||
          x?.status ||
          x?.state?.name ||
          x?.states_id?.name ||
          x?.states_id ||
          x?.computertstates_id?.name ||
          x?.computertstates_id ||
          x?.states_name ||
          x?.states ||
          ''
        ).trim();
        return v || '—';
      };

      const itemsByStatusFixed = (() => {
        const m = new Map();
        for (const x of [...computersNormalized, ...monitorsNormalized]) {
          const k = getStatusForStats(x);
          m.set(k, (m.get(k) || 0) + 1);
        }
        return Array.from(m.entries()).map(([status, count]) => ({ status, count }));
      })();

      return {
        items: {
          total: computersNormalized.length + monitorsNormalized.length,
          byType: itemsByType,
          byStatus: itemsByStatusFixed,
        },
        tickets: {
          total: ticketsNormalized.length,
          byType: ticketsByType,
          byStatus: ticketsByStatus,
          byPriority: ticketsByPriority,
        },
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
      // Fusion Computer + Monitor (les Monitors importés n'apparaissent sinon jamais)
      const [glpiComputers, glpiMonitors] = await Promise.all([
        glpiRequest({
          sessionToken,
          method: 'GET',
          path: `/${GLPI_COMPUTER_ITEMTYPE}`,
          query: { range: '0-200', expand_dropdowns: 'true', forcedisplay: '*' },
        }),
        glpiRequest({
          sessionToken,
          method: 'GET',
          path: '/Monitor',
          query: { range: '0-200', expand_dropdowns: 'true', forcedisplay: '*' },
        }),
      ]);

      const computersArr = Array.isArray(glpiComputers) ? glpiComputers : (glpiComputers?.data || []);
      const monitorsArr = Array.isArray(glpiMonitors) ? glpiMonitors : (glpiMonitors?.data || []);
      const arr = [...computersArr, ...monitorsArr];

      // On enrichit parfois mal selon les endpoints; pour éviter d'obtenir des valeurs vides,
      // on utilise un lookup de détail uniquement quand nécessaire.
      const getStatusOrIdFallback = (c) => {
        const s = getStatusText(c);
        if (s && s !== '—') return s;
        // fallback: si status/state est un id (ex: "0"), on renvoie "—".
        return '—';
      };

      // IMPORTANT: GLPI ne renvoie pas toujours les champs comme des objets {name}.
      // Pour éviter de “perdre” des items à cause de mappings vides, on applique:
      // - q: robuste sur name/serial
      // - autres filtres: seulement si on arrive à lire une valeur textuelle non vide.
      const firstNonEmpty = (...vals) => {
        for (const v of vals) {
          const s = v === null || v === undefined ? '' : String(v).trim();
          if (s) return s;
        }
        return '';
      };

      // Note: sur ton GLPI, les champs relations (locations_id/manufacturers_id/computermodels_id/users_id/states_id)
      // sont souvent déjà renvoyés comme texte (pas comme objets). On ajoute donc ces clés aux fallbacks.

      const getStatusText = (c) => {
        const raw = firstNonEmpty(
          // common GLPI patterns
          c?.status?.name,
          c?.state?.name,
          c?.states?.[0]?.name,
          c?.status,
          c?.state,
          c?.states_id?.name,
          c?.states_id,
          c?.computertstates_id?.name,
          c?.computertstates_id,
          c?.states_name,
          c?.states,
          // sometimes API returns numeric ids as string "0" / "1" etc.
          c?.states_id?.toString?.(),
          c?.computertstates_id?.toString?.(),
        );

        const s = String(raw ?? '').trim();
        // If GLPI returns numeric state ids (often "0"), map them to labels.
        if (/^0+$/.test(s)) return '—';
        if (/^-?\d+$/.test(s)) return String(s);
        return s;
      };

      const getLocationText = (c) => firstNonEmpty(
        c?.locations?.[0]?.name,
        c?.location?.name,
        c?.locations?.[0]?.locations_id?.name,
        c?.location,
        c?.locations_id?.name,
        c?.locations_id,
      );

      const getManufacturerText = (c) => firstNonEmpty(
        c?.manufacturer?.name,
        c?.manufacturers_id?.name,
        c?.manufacturer,
        c?.manufacturers_id,
      );

      const getTypeText = (c) => firstNonEmpty(
        c?.category?.name,
        c?.category?.completename,
        c?.item_type,
        c?.computertypes_id,
        c?.computertype_id,
        c?.computertype,
        c?.monitortypes_id,
      );

      const getModelText = (c) => firstNonEmpty(
        c?.model,
        c?.computermodels_id?.name,
        c?.monitormodels_id?.name,
        c?.model?.name,
        c?.computermodels_id,
        c?.monitormodels_id,
      );

      const getUserText = (c) => firstNonEmpty(
        c?.users?.[0]?.name,
        c?.users?.[0]?.realname,
        c?.user?.name,
        c?.user_name,
        c?.users_id?.name,
        c?.users_id,
        c?.user,
        c?.users,
      );


      // Pour remplir les champs relationnels (statut/localisation/manufacturer/type/modèle/user)
      // on passe par un endpoint “détail” par item.
      const filtered = arr.filter((c) => {
        const name = String(c.name || c.completename || '');
        const completename = String(c.completename || '');
        const model = String(c.model || '');
        const inv = String(c.serial || c.otherserial || '');
        const user = String(c.user?.name || c.user_name || c.users?.[0]?.name || '');

        const searchText = `${name} ${completename} ${model} ${inv} ${user}`.toLowerCase();
        const matchesQ = q ? searchText.includes(String(q).toLowerCase()) : true;

        const statusText = getStatusText(c);
        const locText = getLocationText(c);
        const manuText = getManufacturerText(c);
        const typeText = getTypeText(c);

        const matchesType = type
          ? (typeText ? typeText.toLowerCase().includes(String(type).toLowerCase()) : true)
          : true;
        const matchesStatus = status
          ? (statusText ? statusText.toLowerCase().includes(String(status).toLowerCase()) : true)
          : true;
        const matchesLocation = location
          ? (locText ? locText.toLowerCase().includes(String(location).toLowerCase()) : true)
          : true;
        const matchesManufacturer = manufacturer
          ? (manuText ? manuText.toLowerCase().includes(String(manufacturer).toLowerCase()) : true)
          : true;

        return matchesQ && matchesType && matchesStatus && matchesLocation && matchesManufacturer;
      });

      const MAX_DETAIL = 80; // garde-fou performance
      const subset = filtered.slice(0, MAX_DETAIL);

      const mapped = [];
      for (const c of subset) {
        // On essaye d'obtenir les libellés via un endpoint détail (Computer/Monitor).
        // Sur certaines réponses GLPI, la liste renvoie des ids bruts => status="0".
        const candidates = ['Computer', 'Monitor'];
        let detailed = null;
        for (const ep of candidates) {
          try {
            detailed = await glpiRequest({
              sessionToken,
              method: 'GET',
              path: `/${ep}/${c.id}`,
              query: { expand_dropdowns: 'true', forcedisplay: '*' },
            });
            if (detailed && (detailed.id || detailed.name || detailed.completename)) {
              break;
            }
          } catch { }
        }

        const d = detailed || c;

        // fallback robuste: si status est vide/0, on tente d'utiliser la version "liste" avant de retourner —.
        const statusText = (() => {
          const s = getStatusText(d);
          if (s && s !== '—') return s;
          return getStatusOrIdFallback(c);
        })();

        mapped.push({
          id: d.id ?? c.id,
          name: d.name || d.completename || '—',
          status: statusText,
          location: getLocationText(d) || getLocationText(c),
          manufacturer: getManufacturerText(d) || getManufacturerText(c),
          item_type: getTypeText(d) || getTypeText(c),
          model: getModelText(d) || getModelText(c),
          inventory_number: d.serial || d.otherserial || c.serial || c.otherserial || '',
          user_name: getUserText(d) || getUserText(c),
        });
      }

      return mapped;
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
      const [glpiComputers, glpiMonitors] = await Promise.all([
        glpiRequest({
          sessionToken,
          method: 'GET',
          path: `/${GLPI_COMPUTER_ITEMTYPE}`,
          query: { range: '0-200', expand_dropdowns: 'true', forcedisplay: '*' },
        }),
        glpiRequest({
          sessionToken,
          method: 'GET',
          path: '/Monitor',
          query: { range: '0-200', expand_dropdowns: 'true', forcedisplay: '*' },
        }),
      ]);

      const computersArr = Array.isArray(glpiComputers) ? glpiComputers : (glpiComputers?.data || []);
      const monitorsArr = Array.isArray(glpiMonitors) ? glpiMonitors : (glpiMonitors?.data || []);
      const arr = [...computersArr, ...monitorsArr];


      const uniq = (list) => Array.from(new Set(list.filter(Boolean))).sort();
      const get = (c, keys) => {
        for (const k of keys) {
          const v = k.split('.').reduce((acc, p) => (acc ? acc[p] : undefined), c);
          if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
        }
        return '';
      };

      const statuses = arr.map(c => get(c, ['status.name', 'state.name', 'status', 'state', 'states_id', 'computertstates_id']));
      // normalize numeric "0" (often missing/unmapped) away
      const cleanedStatuses = statuses.map(s => String(s ?? '').trim()).filter(s => s && s !== '0' && s !== '—');

      return {
        types: uniq(arr.map(c => get(c, ['category.name', 'item_type']))),
        statuses: uniq(cleanedStatuses),
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
// GET /api/items/:id  — Détail item (GLPI proxy)
// ═════════════════════════════════════════════════════════════════════=
app.get('/api/items/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const result = await withSession(async (sessionToken) => {
      // best-effort: try Computer then Monitor
      const candidates = ['Computer', 'Monitor'];

      for (const ep of candidates) {
        try {
          const it = await glpiRequest({
            sessionToken,
            method: 'GET',
            path: `/${ep}/${id}`,
            query: { expand_dropdowns: 'true', forcedisplay: '*', id: id },
          });

          const location = String(it?.locations?.[0]?.name || it?.location?.name || it?.location || '').trim();
          const manufacturer = String(it?.manufacturer?.name || it?.manufacturer || '').trim();
          const status = String(it?.status?.name || it?.state?.name || it?.status || '').trim();
          const itemType = String(it?.category?.name || it?.item_type || ep).trim();
          const model = String(it?.model || it?.computermodels_id?.name || it?.monitormodels_id?.name || '').trim();
          const user = String(it?.users?.[0]?.name || it?.user?.name || it?.user_name || '').trim();

          return {
            id: Number(it?.id ?? id),
            name: String(it?.name || it?.completename || '').trim(),
            item_type: itemType,
            status,
            location,
            manufacturer,
            model,
            inventory_number: String(it?.serial || it?.otherserial || '').trim(),
            user_name: user,
            serial: String(it?.serial || '').trim(),
            otherserial: String(it?.otherserial || '').trim(),
            created_at: String(it?.date_creation || it?.created_at || it?.date_mod || '').trim(),
          };
        } catch {
          // next candidate
        }
      }

      throw new Error('Item introuvable');
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
    const includeItems = String(req.query.includeItems || '').toLowerCase() === 'true';
    const maxTicketsWithItems = Number(req.query.maxTicketsWithItems || 20);

    const result = await withSession(async (sessionToken) => {
      const glpiTickets = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: `/${GLPI_TICKET_ITEMTYPE}`,
        query: { range: '0-100', expand_dropdowns: 'true', forcedisplay: '*' },
      });

      const arr = Array.isArray(glpiTickets) ? glpiTickets : (glpiTickets?.data || []);

      const filtered = arr.filter((t) => {
        const matchesStatus = status ? String(t.status || t.state?.name || '').toLowerCase().includes(String(status).toLowerCase()) : true;
        const matchesType = type ? String(t.type || t.ticket_type || '').toLowerCase().includes(String(type).toLowerCase()) : true;
        const matchesPriority = priority ? String(t.priority || t.impact?.name || t.urgency?.name || '').toLowerCase().includes(String(priority).toLowerCase()) : true;
        return matchesStatus && matchesType && matchesPriority;
      });

      // Base mapping sans items (perf)
      const mapped = filtered.map((t, idx) => ({
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

      if (!includeItems) return mapped;

      // Enrichissement best-effort, avec limite.
      const limit = Math.max(0, Number.isFinite(maxTicketsWithItems) ? maxTicketsWithItems : 20);
      const toEnrich = mapped.slice(0, limit);

      for (const t of toEnrich) {
        try {
          t.items = await glpiGetTicketLinkedItems({ sessionToken, ticketId: t.id });
        } catch {
          t.items = [];
        }
      }

      return mapped;
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
        items: await glpiGetTicketLinkedItems({ sessionToken, ticketId: glpiTicket.id }),
        costs: [],
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Helpers tickets/items (GLPI) -----------------------------------------
async function glpiFindItemIdsByName({ sessionToken, names }) {
  const wanted = Array.from(new Set((names || []).map(String).map(s => s.trim()).filter(Boolean)));
  if (!wanted.length) return [];

  // GLPI: Computer + Monitor (selon vos imports)
  const endpoints = [GLPI_COMPUTER_ITEMTYPE, 'Monitor'].filter(Boolean);

  // Fetch a limited set (range) to keep perf acceptable.
  // If your GLPI is bigger, we can paginate later.
  const results = new Map(); // name -> id

  for (const ep of endpoints) {
    const arr = await glpiRequest({
      sessionToken,
      method: 'GET',
      path: `/${ep}`,
      query: { range: '0-500', forcedisplay: '*', expand_dropdowns: 'true' },
    });
    const items = Array.isArray(arr) ? arr : (arr?.data || []);

    const index = new Map(); // lowerName -> id
    for (const it of items) {
      const n1 = String(it?.name || '').trim();
      const n2 = String(it?.completename || '').trim();
      const key1 = n1.toLowerCase();
      const key2 = n2.toLowerCase();
      if (key1) index.set(key1, it.id);
      if (key2) index.set(key2, it.id);
    }

    for (const w of wanted) {
      const id = index.get(String(w).toLowerCase());
      if (id && !results.has(w)) results.set(w, id);
    }
  }

  return wanted.map((w) => ({ name: w, id: results.get(w) ?? null })).filter(x => x.id !== null);
}

async function glpiTestTicketLinkEndpoints({ sessionToken, ticketId }) {
  const candidates = [
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Computer?range=0-200`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Monitor?range=0-200`,
  ];

  const tests = [];

  for (const p of candidates) {
    try {
      const data = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: p,
        query: { range: '0-200', forcedisplay: '*', expand_dropdowns: 'true' },
      });
      const arr = Array.isArray(data) ? data : (data?.data || data || []);
      tests.push({ endpoint: p, ok: true, arrLen: Array.isArray(arr) ? arr.length : null });
    } catch (e) {
      tests.push({ endpoint: p, ok: false, error: e?.message || String(e) });
    }
  }

  return tests;
}

async function glpiGetTicketLinkedItems({ sessionToken, ticketId }) {
  // Best-effort: try GLPI endpoints that list computers/monitors linked to a ticket.
  const candidates = [
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Computer`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Monitor`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Computer?range=0-200`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Monitor?range=0-200`,
  ];

  for (const p of candidates) {
    try {
      const data = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: p,
        query: { range: '0-200', forcedisplay: '*', expand_dropdowns: 'true' },
      });
      const arr = Array.isArray(data) ? data : (data?.data || data || []);

      if (Array.isArray(arr) && arr.length) {
        const names = arr
          .map(x => String(x?.name || x?.completename || x?.title || ''))
          .filter(Boolean);
        if (names.length) return Array.from(new Set(names));
      }
    } catch {
      // try next
    }
  }

  return [];
}

async function glpiLinkTicketItems({ sessionToken, ticketId, itemIds }) {
  if (!itemIds?.length) return { linked: 0, attempted: 0 };

  // Best-effort: try a few plausible endpoints to attach computers to ticket.
  // We keep it conservative: if your GLPI uses a different relation model,
  // you can adjust these endpoints.
  const endpoints = [
    // Some GLPI installs use bulk link endpoints under Ticket
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Computer`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/addComputer`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/link/Computer`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/items`,
  ];

  const body = { input: itemIds, items: itemIds };

  for (const ep of endpoints) {
    try {
      await glpiRequest({
        sessionToken,
        method: 'POST',
        path: ep,
        body: body,
      });
      return { linked: itemIds.length, attempted: itemIds.length, usedEndpoint: ep };
    } catch {
      // try next
    }
  }

  return { linked: 0, attempted: itemIds.length };
}

// POST /api/tickets — Créer un ticket (GLPI proxy)
app.post('/api/tickets', async (req, res) => {
  try {
    const { ticket_type, title, description, priority, items } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Le titre est obligatoire.' });

    const result = await withSession(async (sessionToken) => {
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

      const createdId = created?.id ?? created?.ticket?.id ?? created?.result?.id ?? created?.result ?? created?.['id'];

      // Associate selected equipment to the ticket
      const found = await glpiFindItemIdsByName({ sessionToken, names: items });
      const itemIds = found.map(x => x.id);

      const linkRes = await glpiLinkTicketItems({ sessionToken, ticketId: createdId, itemIds });

      return {
        message: 'Ticket créé avec succès (GLPI).',
        id: createdId,
        ref_ticket: String(createdId || ''),
        linked_items: found.map(x => x.name),
        link_result: linkRes,
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
