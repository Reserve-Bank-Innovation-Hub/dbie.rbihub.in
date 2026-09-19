// Minimal HTTP client for the DBIE gateway (https://data.rbi.org.in/CIMS_Gateway_DBIE).
//
// The Angular SPA encrypts most request fields with a static AES key before
// posting them; responses come back as HTML-entity-encoded JSON envelopes.
// Both halves are reproduced here so the data pipeline needs no browser.
//
// Cipher (from the SPA bundle, main.*.js — the class holding `this.token`,
// `this.tokenStatus`, `this.tokenResponse`):
//   key = PBKDF2-SHA1(token, hex(tokenStatus), 1000 iterations, 256 bit)
//   AES-256-CBC, IV = hex(tokenResponse), PKCS7, ciphertext as base64.
// Deterministic (fixed IV), so a captured request replays verbatim.
// Verified 17-09-2026. If every "Enhanced" call starts failing, the
// constants have probably rotated: grep the current bundle for
// `this.tokenResponse=` and update the three values below.

import crypto from 'node:crypto';

export const GATEWAY       = 'https://data.rbi.org.in/CIMS_Gateway_DBIE/GATEWAY/SERVICES';
export const LOGIN_GATEWAY = 'https://data.rbi.org.in/CIMS_Gateway_LOGIN/GATEWAY/SERVICES';
export const DEFAULT_UA    = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

const TOKEN = '48d6b976d7135745b47b407cd8e659a45d8ebaca4ee95f87d5d939604f472268';
const SALT  = Buffer.from('577bd45a17977269694908d80905c32a', 'hex');
const IV    = Buffer.from('dc0da04af8fee58593442bf834b30739', 'hex');
const KEY   = crypto.pbkdf2Sync(TOKEN, SALT, 1000, 32, 'sha1');

/** Encrypt a scalar the way the SPA's encryptPipe does. null/undefined → ''. */
export function enc(value) {
    const c = crypto.createCipheriv('aes-256-cbc', KEY, IV);
    return Buffer.concat([c.update(String(value ?? ''), 'utf8'), c.final()]).toString('base64');
}

/** Decrypt a base64 ciphertext produced by enc() (or by the SPA). */
export function dec(b64) {
    if (b64 == null) return null;
    const d = crypto.createDecipheriv('aes-256-cbc', KEY, IV);
    return Buffer.concat([d.update(Buffer.from(b64, 'base64')), d.final()]).toString('utf8');
}

/** Encrypt every key and value of a flat object (the shape used for rule / label-detail entries). */
export const encObject = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [enc(k), enc(v)]));

/** Gateway responses are JSON with HTML entities in place of quotes etc. */
export const decodeEnvelope = raw => raw
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

export class GatewayError extends Error {
    constructor(message, { service, status, body } = {}) {
        super(message);
        this.name = 'GatewayError';
        this.service = service;
        this.status = status;
        this.body = body;
    }
}

export class Gateway {
    constructor({ userAgent = DEFAULT_UA } = {}) {
        this.userAgent = userAgent;
        this.token = null;           // bearer from security_generateSessionToken (Authorization response header)
    }

    headers(json = true) {
        const h = {
            accept     : 'application/json, text/plain, */*',
            channelkey : 'key2',
            referer    : 'https://data.rbi.org.in/DBIE/',
            'user-agent': this.userAgent,
        };
        if (json) { h['content-type'] = 'application/json'; h.datatype = 'application/json'; }
        if (this.token) h.authorization = this.token;
        return h;
    }

    /** Open a guest session; must be called before anything else. */
    async openSession() {
        // A stale bearer on this call makes the gateway answer HTTP 500: start clean.
        this.token = null;
        await this.post('security_generateSessionToken', { body: {} });
        if (!this.token) throw new GatewayError('security_generateSessionToken returned no Authorization header');
        return this.token;
    }

    /** POST a JSON body to a gateway service; returns the envelope's `body`. Throws on non-success. */
    async post(service, body, { base = GATEWAY, timeoutMs = 120_000 } = {}) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
            const res = await fetch(`${base}/${service}`, {
                method: 'POST', headers: this.headers(true), body: JSON.stringify(body), signal: ctrl.signal,
            });
            const auth = res.headers.get('authorization');
            if (auth) this.token = auth;
            const text = decodeEnvelope(await res.text());
            if (!res.ok) throw new GatewayError(`${service}: HTTP ${res.status}`, { service, status: res.status, body: text.slice(0, 300) });
            let env;
            try { env = JSON.parse(text); } catch { throw new GatewayError(`${service}: non-JSON response`, { service, status: res.status, body: text.slice(0, 300) }); }
            if (env.header?.status !== 'success') throw new GatewayError(`${service}: ${env.header?.errorMessage || JSON.stringify(env.header)}`, { service, status: res.status, body: JSON.stringify(env.header) });
            return env.body;
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * POST a multipart `requestMessage` to a /download/ endpoint and return the raw bytes.
     * The caller decides whether the bytes are the expected file (the servlet answers
     * HTTP 200 with an HTML error page when the export fails).
     */
    async download(service, requestMessage, { base = GATEWAY, timeoutMs = 600_000 } = {}) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
            const form = new FormData();
            form.append('requestMessage', requestMessage);
            const res = await fetch(`${base}/${service}`, { method: 'POST', headers: this.headers(false), body: form, signal: ctrl.signal });
            const auth = res.headers.get('authorization');
            if (auth) this.token = auth;
            const buf = Buffer.from(await res.arrayBuffer());
            return { status: res.status, contentType: res.headers.get('content-type') || '', buf };
        } finally {
            clearTimeout(timer);
        }
    }
}
