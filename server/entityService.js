import { glpiRequest, withSession } from './glpiClient.js';

// Simple in-memory cache for the duration of a single import.
// key format: `${endpoint}:${name}`
function buildCacheKey(endpoint, name) {
    return `${endpoint}:${String(name).trim()}`;
}


/**
 * GLPI get-or-create for entities identified by a `name`.
 *
 * Important: GLPI error handling for duplicates is not consistent across
 * installations; we therefore use a "search first" approach and also a
 * fallback: if POST fails with an uniqueness error, we try to read the
 * already-existing entity.
 */
export async function createEntity({
    sessionToken,
    endpoint,
    name,
    createInput,
}) {
    if (!name || !String(name).trim()) {
        throw new Error('Nom obligatoire');
    }

    const trimmedName = String(name).trim();
    const input = createInput ? createInput(trimmedName) : { name: trimmedName };

    const tryFindIdByName = async () => {
        // GLPI REST API supports searching with `searchText` on many endpoints.
        // If not supported on a given endpoint, this will simply throw; caller
        // will ignore and proceed to create.
        // Prefer text search; note: for some endpoints this might not work.
        // We'll still parse any returned list and try to match exactly.
        const res = await glpiRequest({
            sessionToken,
            method: 'GET',
            path: `/${endpoint}`,
            query: {
                searchText: trimmedName,
                range: '0-50',
                forcedisplay: '*',
                expand_dropdowns: 'true',
            },
        });

        const arr = Array.isArray(res) ? res : (res?.data || []);
        if (!Array.isArray(arr) || !arr.length) return null;

        // Try match on `name` or `completename`
        const found = arr.find(it => {
            const n = String(it?.name ?? '').trim();
            const c = String(it?.completename ?? '').trim();
            return n === trimmedName || c === trimmedName;
        });

        return found?.id ?? null;
    };

    // Special-case Location: GLPI uniqueness for locations depends on hierarchy.
    // Your CSV provides only Location (name). In practice, the "Administration"
    // duplicate you see is the top-level location with locations_id=0.
    // We therefore override the search strategy for Location: we attempt to
    // find an existing Location by matching name and trying locations_id=0.
    const tryFindLocationId = async () => {
        const endpoints = [`Location`];
        if (!endpoints.includes(endpoint)) return null;

        // First try exact top-level location: locations_id = 0
        try {
            const res = await glpiRequest({
                sessionToken,
                method: 'GET',
                path: `/${endpoint}`,
                query: {
                    searchText: trimmedName,
                    range: '0-200',
                    forcedisplay: '*',
                    expand_dropdowns: 'true',
                },
            });

            const arr = Array.isArray(res) ? res : (res?.data || []);
            if (!Array.isArray(arr) || !arr.length) return null;

            const found = arr.find(it => {
                const n = String(it?.name ?? '').trim();
                const locId = String(it?.locations_id ?? it?.location_id ?? it?.locations?.[0]?.id ?? '').trim();
                // match name and top-level
                return n === trimmedName && (locId === '0' || locId === '' || locId === 'null');
            });

            return found?.id ?? null;
        } catch {
            return null;
        }
    };

    // 1) Try to find first

    try {
        const existingId = await tryFindIdByName();
        if (existingId) return existingId;
    } catch {
        // ignore search failure
    }

    // 2) Create
    try {
        const created = await glpiRequest({
            sessionToken,
            method: 'POST',
            path: `/${endpoint}`,
            body: { input },
        });

        const id = created?.id ?? created?.result?.id ?? created?.['id'];
        if (!id) {
            throw new Error(`createEntity: cannot extract id for ${endpoint} (${trimmedName})`);
        }
        return id;
    } catch (err) {
        const msg = String(err?.message || err);

        // 3) Duplicate fallback: try search again and return existing id
        if (/Duplicate entry/i.test(msg) || /unicity/i.test(msg) || /duplicate/i.test(msg)) {
            const existingId = await tryFindIdByName().catch(() => null);
            if (existingId) return existingId;
        }

        throw err;
    }
}


/**
 * Create dependencies for an asset import row (no get-or-create).
 */
export async function prepareAssetRefs({
    sessionToken,
    row,
}) {
    const locationId = await createEntity({
        sessionToken,
        endpoint: 'Location',
        name: row.Location,
    });

    const manufacturerId = await createEntity({
        sessionToken,
        endpoint: 'Manufacturer',
        name: row.Manufacturer,
    });

    const statusId = await createEntity({
        sessionToken,
        endpoint: 'Ticket', // NOTE: status entity varies by GLPI configuration.
        name: row.Status,
    }).catch(() => null);

    let userId = null;
    if (row.User && String(row.User).trim()) {
        userId = await createEntity({
            sessionToken,
            endpoint: 'User',
            name: row.User,
        }).catch(() => null);
    }

    const isComputer = String(row.Item_Type).toLowerCase().includes('computer');
    const modelEndpoint = isComputer ? 'ComputerModel' : 'MonitorModel';

    const modelId = await createEntity({
        sessionToken,
        endpoint: modelEndpoint,
        name: row.Model,
    });

    return { locationId, manufacturerId, modelId, statusId, userId };
}

/**
 * Convenience wrapper.
 */
export async function withGlpiRefs({ row, cache, fn }) {
    return withSession(async (sessionToken) => {
        return fn({ sessionToken, row, cache });
    });
}



