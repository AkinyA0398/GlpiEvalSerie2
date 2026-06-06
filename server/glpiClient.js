import GLPI_CONFIG from './glpiConfig.js';
import fs from 'fs';

const fetchFn = globalThis.fetch;
if (!fetchFn) throw new Error('Global fetch not available in this Node version');

const withBase = (path) => {
    const GLPI_URL = GLPI_CONFIG.url;
    // GLPI_URL is already .../apirest.php
    if (!path.startsWith('/')) path = '/' + path;
    return GLPI_URL + path;
};

export async function initSession() {

    const token = GLPI_CONFIG.userToken;
    // Prefer API user_token auth.
    // If userToken is short (fallback like 'glpi'), GLPI will reject it.
    // In that case, try Basic auth with <token:token> as a fallback.
    const authHeader = token && token.length >= 20
      ? `user_token ${token}`
      : `Basic ${Buffer.from(`${token}:${token}`).toString('base64')}`;

    // App-Token optionnel : certains setups GLPI/versions n'attendent pas App-Token.
    // Pour éviter ERROR_WRONG_APP_TOKEN_PARAMETER, on l'envoie uniquement si défini explicitement.
    const headers = {
        'Authorization': authHeader,
    };
    if (process.env.GLPI_APP_TOKEN && GLPI_CONFIG.appToken && GLPI_CONFIG.appToken !== "none") {
        headers['App-Token'] = GLPI_CONFIG.appToken;
    }

    let url = withBase('/initSession');

    const res = await fetch(url, {
        method: 'GET',
        headers,
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`GLPI initSession failed: ${res.status} ${txt}`);
    }
    const data = await res.json();
    if (!data?.session_token) throw new Error('GLPI initSession: missing session_token');
    return data.session_token;
}

export async function killSession(sessionToken) {
    const url = withBase('/killSession');
    // killSession uses GET
    try {
        await fetch(url, {
            method: 'GET',
            headers: {
                'Session-Token': sessionToken,
                'App-Token': GLPI_CONFIG.appToken,
            },
        });
    } catch {
        // ignore
    }
}

export async function glpiRequest({ sessionToken, method, path, body, query }) {
    let url = withBase(path);
    if (query && typeof query === 'object') {
        const qs = new URLSearchParams(query);
        url += (url.includes('?') ? '&' : '?') + qs.toString();
    }

    const headers = {
        'Session-Token': sessionToken,
    };
    if (GLPI_CONFIG.appToken && GLPI_CONFIG.appToken !== "none") {
        headers['App-Token'] = GLPI_CONFIG.appToken;
    };

    let payload;
    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    const res = await fetch(url, { method, headers, body: payload });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`GLPI request failed: ${method} ${path} → ${res.status} ${txt}`);
    }

    // GLPI returns JSON in most cases
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
}

/**
 * Upload a file to GLPI as a Document (multipart/form-data).
 * Returns the created document id.
 */
export async function glpiUploadDocument({ sessionToken, filePath, fileName, documentName }) {
    const url = withBase('/Document');
    const fileBuffer = fs.readFileSync(filePath);

    const boundary = '----GLPIFormBoundary' + Date.now();

    const manifest = JSON.stringify({
        input: {
            name: documentName || fileName,
            _filename: [fileName],
        },
    });

    // Build multipart body manually
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="uploadManifest"\r\n`;
    body += `Content-Type: application/json\r\n\r\n`;
    body += manifest + '\r\n';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="filename[]"; filename="${fileName}"\r\n`;
    body += `Content-Type: application/octet-stream\r\n\r\n`;

    const bodyStart = Buffer.from(body, 'utf-8');
    const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const fullBody = Buffer.concat([bodyStart, fileBuffer, bodyEnd]);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Session-Token': sessionToken,
            'App-Token': GLPI_CONFIG.appToken,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: fullBody,
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`GLPI upload failed: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return data?.id ?? data?.[0]?.id ?? null;
}

/**
 * Delete all items of a given GLPI itemtype.
 * Fetches pages of IDs then sends batch DELETEs.
 */
export async function glpiDeleteAll({ sessionToken, endpoint }) {
    // Fetch all items (paginated)
    let allIds = [];
    let start = 0;
    const pageSize = 50;

    while (true) {
        try {
            const items = await glpiRequest({
                sessionToken,
                method: 'GET',
                path: `/${endpoint}`,
                query: { range: `${start}-${start + pageSize - 1}` },
            });
            const arr = Array.isArray(items) ? items : (items?.data || []);
            if (arr.length === 0) break;
            allIds.push(...arr.map(i => i.id).filter(Boolean));
            if (arr.length < pageSize) break;
            start += pageSize;
        } catch {
            break; // no more items or error
        }
    }

    // Delete each item
    let deleted = 0;
    for (const id of allIds) {
        try {
            await glpiRequest({
                sessionToken,
                method: 'DELETE',
                path: `/${endpoint}/${id}`,
                query: { force_purge: 'true' },
            });
            deleted++;
        } catch {
            // continue on error
        }
    }

    return deleted;
}

export async function withSession(fn) {
    const sessionToken = await initSession();
    try {
        return await fn(sessionToken);
    } finally {
        await killSession(sessionToken);
    }
}

