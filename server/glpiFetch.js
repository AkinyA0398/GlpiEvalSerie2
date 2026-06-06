import GLPI_CONFIG from './glpiConfig.js';

// Node 18+ has global fetch. Node 22+ should always provide it.
const fetchImpl = globalThis.fetch;
if (!fetchImpl) throw new Error('Global fetch not available in this Node version');


let sessionToken = null;

export const setSessionToken = (token) => {
    sessionToken = token;
};

export const getSessionToken = () => sessionToken;

export async function glpiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'App-Token': GLPI_CONFIG.appToken,
        ...(options.headers || {}),
    };

    if (sessionToken) {
        headers['Session-Token'] = sessionToken;
    }

    const res = await fetchImpl(`${GLPI_CONFIG.url}/${endpoint}`, {
        ...options,
        headers,
    });

    // GLPI often returns JSON; but we keep robust error parsing.
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
        const msg = (data && data.message) || (data && data.error) || (typeof data === 'string' ? data : 'Erreur GLPI');
        throw new Error(msg);
    }

    return data;
}

export async function initSession() {
    const token = GLPI_CONFIG.userToken;
    const authHeader = token.length < 30 ? `Basic ${Buffer.from(`${token}:${token}`).toString('base64')}` : `user_token ${token}`;

    const headers = {
        Authorization: authHeader,
    };
    if (GLPI_CONFIG.appToken && GLPI_CONFIG.appToken !== "none") {
        headers['App-Token'] = GLPI_CONFIG.appToken;
    }

    let url = `${GLPI_CONFIG.url}/initSession`;

    const data = await fetchImpl(url, {
        method: 'GET',
        headers,
    }).then(async (res) => {
        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`GLPI initSession failed: ${res.status} ${txt}`);
        }
        return res.json();
    });

    if (!data?.session_token) throw new Error('GLPI initSession: missing session_token');
    setSessionToken(data.session_token);
    return data.session_token;
}

export async function killSession() {
    if (!sessionToken) return;
    try {
        await fetchImpl(`${GLPI_CONFIG.url}/killSession`, {
            method: 'GET',
            headers: {
                'Session-Token': sessionToken,
                'App-Token': GLPI_CONFIG.appToken,
            },
        });
    } catch {
        // ignore
    } finally {
        sessionToken = null;
    }
}

