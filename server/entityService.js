import { glpiRequest, withSession } from './glpiClient.js';

// Simple in-memory cache for the duration of a single import.
// key format: `${endpoint}:${name}`
function buildCacheKey(endpoint, name) {
    return `${endpoint}:${String(name).trim()}`;
}

/**
 * Generic GLPI get-or-create for entities that are identified by a `name`.
 *
 * IMPORTANT:
 * - The GLPI search endpoint/params may vary by version.
 * - We use the common pattern: GET /<endpoint>?searchText=...
 * - If the entity type uses a different field than `name`, adapt `createInput`.
 */
export async function getOrCreateEntity({
    sessionToken,
    endpoint,
    name,
    cache,
    createInput,
    searchParams = { searchText: name },
}) {
    if (!name || !String(name).trim()) {
        throw new Error('Nom obligatoire');
    }

    const cacheKey = cache ? buildCacheKey(endpoint, name) : null;
    if (cache && cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    const search = await glpiRequest({
        sessionToken,
        method: 'GET',
        path: `/${endpoint}`,
        query: searchParams,
    });

    // GLPI typically returns an array for these endpoints, but we guard defensively.
    const arr = Array.isArray(search) ? search : (search?.data && Array.isArray(search.data) ? search.data : []);

    if (arr.length > 0) {
        const id = arr[0].id;
        if (cache) cache.set(cacheKey, id);
        return id;
    }

    const input = createInput ? createInput(name) : { name };

    const created = await glpiRequest({
        sessionToken,
        method: 'POST',
        path: `/${endpoint}`,
        body: { input },
    });

    const id = created?.id ?? created?.result?.id ?? created?.['id'];
    if (!id) {
        throw new Error(`getOrCreateEntity: cannot extract id for ${endpoint} (${name})`);
    }

    if (cache) cache.set(cacheKey, id);
    return id;
}

/**
 * Create or reuse the basic dependencies for an asset import row.
 * Your CSV fields are expected to be in the format:
 * - Location, Manufacturer, Status, User, Item_Type, Model, Inventory_Number, Name
 */
export async function prepareAssetRefs({
    sessionToken,
    row,
    cache,
}) {
    const locationId = await getOrCreateEntity({
        sessionToken,
        endpoint: 'Location',
        name: row.Location,
        cache,
    });

    const manufacturerId = await getOrCreateEntity({
        sessionToken,
        endpoint: 'Manufacturer',
        name: row.Manufacturer,
        cache,
    });

    const statusId = await getOrCreateEntity({
        sessionToken,
        endpoint: 'Ticket', // NOTE: status entity varies by GLPI configuration.
        // If you have an explicit Status endpoint (e.g. ComputerState), replace this.
        name: row.Status,
        cache,
    }).catch(() => null);

    let userId = null;
    if (row.User && String(row.User).trim()) {
        userId = await getOrCreateEntity({
            sessionToken,
            endpoint: 'User',
            name: row.User,
            cache,
        }).catch(() => null);
    }

    const isComputer = String(row.Item_Type).toLowerCase().includes('computer');
    const modelEndpoint = isComputer ? 'ComputerModel' : 'MonitorModel';

    const modelId = await getOrCreateEntity({
        sessionToken,
        endpoint: modelEndpoint,
        name: row.Model,
        cache,
    });

    return { locationId, manufacturerId, modelId, statusId, userId };
}

/**
 * Convenience wrapper: runs getOrCreateEntity with its own session.
 * Most imports will call these helpers using `withSession` externally,
 * but this is useful for isolated usages.
 */
export async function withGlpiRefs({ row, cache, fn }) {
    return withSession(async (sessionToken) => {
        return fn({ sessionToken, row, cache });
    });
}

