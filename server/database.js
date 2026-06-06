// database.js — backend import + GLPI sync
// NOTE: SQLite a été retiré pour cet usage (GLPI devient la source).

import { initSession, killSession, glpiRequest, glpiUploadDocument, glpiDeleteAll } from './glpiClient.js';
import { getOrCreateEntity, prepareAssetRefs } from './entityService.js';
import path from 'path';
import fs from 'fs';

// Image directory (set from index.js, or default)
let IMAGE_DIR = path.resolve('import', 'image');
export function setImageDir(dir) { IMAGE_DIR = dir; }

const IMG_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];

/**
 * Find an image file in IMAGE_DIR matching a given name (without extension).
 * Returns the full path or null.
 */
function findImageForName(name) {
  if (!name) return null;
  const baseName = name.trim();
  for (const ext of IMG_EXTENSIONS) {
    const candidate = path.join(IMAGE_DIR, baseName + ext);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Reset: delete all Computers, Monitors, Documents from GLPI.
 * Local files in /import are NOT deleted.
 */
export async function resetDatabase() {
  const sessionToken = await initSession();
  try {
    const deletedComputers = await glpiDeleteAll({ sessionToken, endpoint: 'Computer' });
    const deletedMonitors = await glpiDeleteAll({ sessionToken, endpoint: 'Monitor' });
    const deletedDocs = await glpiDeleteAll({ sessionToken, endpoint: 'Document' });
    return {
      message: `GLPI purgé : ${deletedComputers} ordinateur(s), ${deletedMonitors} moniteur(s), ${deletedDocs} document(s) supprimés.`,
      ok: true,
      deletedComputers,
      deletedMonitors,
      deletedDocs,
    };
  } finally {
    await killSession(sessionToken);
  }
}

export async function insertItemsBatch(rows, { syncToGlpi = true } = {}) {
  let glpiSessionToken = null;
  const cache = new Map();
  let uploadedImages = 0;

  try {
    if (syncToGlpi) {
      glpiSessionToken = await initSession();
    }

    if (syncToGlpi && glpiSessionToken) {
      for (const row of rows) {
        const refs = await prepareAssetRefs({ sessionToken: glpiSessionToken, row, cache });

        const computerName = row.Name || row.name || '';
        const inventory = row.Inventory_Number || row.inventory_number || '';
        const isComputer = String(row.Item_Type || '').toLowerCase().includes('computer');
        const endpoint = isComputer ? 'Computer' : 'Monitor';
        const modelKey = isComputer ? 'computermodels_id' : 'monitormodels_id';

        const itemId = await getOrCreateEntity({
          sessionToken: glpiSessionToken,
          endpoint,
          name: computerName || inventory,
          cache,
          createInput: (name) => ({
            name,
            locations_id: refs.locationId,
            manufacturers_id: refs.manufacturerId,
            [modelKey]: refs.modelId,
            otherserial: inventory,
            users_id: refs.userId,
          }),
        });

        // ── Upload image if found ──
        const imagePath = findImageForName(computerName);
        if (imagePath) {
          try {
            const fileName = path.basename(imagePath);
            const docId = await glpiUploadDocument({
              sessionToken: glpiSessionToken,
              filePath: imagePath,
              fileName,
              documentName: `Photo - ${computerName}`,
            });

            if (docId) {
              // Link document to the item
              await glpiRequest({
                sessionToken: glpiSessionToken,
                method: 'POST',
                path: '/Document_Item',
                body: {
                  input: {
                    documents_id: docId,
                    items_id: itemId,
                    itemtype: endpoint,
                  },
                },
              });
              uploadedImages++;
            }
          } catch (imgErr) {
            console.warn(`⚠️ Image upload failed for ${computerName}:`, imgErr.message);
          }
        }
      }
    }

    console.log(`✅ Import: ${rows.length} item(s) créés, ${uploadedImages} image(s) uploadées dans GLPI.`);
    return rows.length;
  } finally {
    if (syncToGlpi && glpiSessionToken) {
      await killSession(glpiSessionToken);
    }
  }
}

export async function insertTicketWithItems(t, itemNames) {
  // SQLite supprimé. Garder signature pour compat front/route.
  // La création de tickets GLPI est gérée dans server/index.js.
  return { ref: t?.ref_ticket ?? null, insertedItems: itemNames?.length ?? 0 };
}

export async function insertTicketCostsBatch(rows) {
  // SQLite supprimé. Garder signature pour compat.
  return rows.length;
}

export const insertBatch = insertItemsBatch;


