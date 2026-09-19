// SAP BusinessObjects "Raylight" REST client for the DBIE report tables.
//
// The Publication/Statistics *report* pages (as opposed to the SDMX Data Query
// wizard) are SAP BusinessObjects Web Intelligence documents. The portal opens
// them in a viewer whose SAPUI5 front end talks to the BusinessObjects RESTful
// web services through a proxy mounted inside the OpenDocument web app:
//
//   https://data.rbi.org.in/BOE/OpenDocument/<build>/biprwsproxy/biprws/...
//
// `/biprws/` and `/BOE/biprws/` are both 404 — the proxy path is the only way in.
//
// Authentication: the BOE enterprise logon token that the DBIE gateway already
// hands out in the `token=` query parameter of the (decrypted) `sapLink` from
// dbie_getReportLink is accepted verbatim as the X-SAP-LogonToken header. No
// OpenDocument session, no cookies, no browser. Note that the `sapToken` and
// `sapLogonToken` fields of login_getSapToken's response are always null — the
// usable token is only ever in the link.
//
// Per document the sequence is:
//   1. POST /v1/cmsquery                          → CUID to SI_ID (and SI_KIND)
//   2. POST /raylight/v1/documents/<id>/occurrences → private working copy
//      (the shared document is read-only for guest_user, so input-control
//      changes only stick on an occurrence)
//   3. PUT  <occ>/parameters?...&prepare=true     → refresh; WITHOUT this the
//      export returns the table skeleton with no data rows
//   4. GET  <occ>/reports                         → the document's tabs
//   5. PUT  <occ>/reports/<rid>/inputcontrols/<ic>/selection → pick periods.
//      The `/selection` sub-resource is load-bearing: a PUT on the input control
//      itself always answers "has not been modified" and silently does nothing.
//   6. GET  <occ>/reports/<rid> with an export Accept header → the file
//   7. POST /logoff                               → release the guest session
//
// Verified 17-09-2026 against build 2409211840. The build number is discovered
// at run time from the OpenDocument bootstrap page, so a BOE upgrade is fine.
//
// Politeness: guest SAP sessions are rationed and the gateway sits behind an F5
// WAF that answers HTTP 418 for ~20 minutes once it decides you are too eager.
// Every call goes through a Pacer, and 418/429/503 back off hard (see Raylight).

export const BOE_HOST      = 'https://data.rbi.org.in';
export const DEFAULT_BUILD = '2409211840';
export const DEFAULT_UA    = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

/** Accept headers for the viewer's export formats. All six verified end to end. */
export const EXPORT_MIME = {
    csv : 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls : 'application/vnd.ms-excel',
    pdf : 'application/pdf',
    html: 'text/html',
    txt : 'text/plain',
};

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Serialises calls so that consecutive requests are at least `minGapMs` apart. */
export class Pacer {
    constructor(minGapMs) { this.minGapMs = minGapMs; this.next = 0; }
    async wait() {
        const now = Date.now();
        const at  = Math.max(now, this.next);
        this.next = at + this.minGapMs;
        if (at > now) await sleep(at - now);
    }
}

export class RaylightError extends Error {
    constructor(message, { status, code, body, path } = {}) {
        super(message);
        this.name = 'RaylightError';
        this.status = status; this.code = code; this.body = body; this.path = path;
    }
}

/** Thrown after the retry budget for 418/429/503 is spent. Callers should stop the run. */
export class ThrottledError extends RaylightError {
    constructor(message, info) { super(message, info); this.name = 'ThrottledError'; }
}

const arr = x => x == null ? [] : (Array.isArray(x) ? x : [x]);

/**
 * Read the deployed BOE build number out of the OpenDocument bootstrap page.
 * `sapLink` is the decrypted dbie_getReportLink URL (it carries the logon token,
 * so this is a normal authenticated GET and costs no extra session).
 */
export async function discoverBuild(sapLink, { userAgent = DEFAULT_UA, pacer = null } = {}) {
    try {
        if (pacer) await pacer.wait();
        const res  = await fetch(sapLink, { headers: { 'user-agent': userAgent, accept: 'text/html' } });
        const html = (await res.text()).replace(/&#x2f;/gi, '/');
        const m = html.match(/OpenDocument\/(\d{6,})\/OpenDocument/);
        if (m) return m[1];
    } catch { /* fall through to the known-good default */ }
    return DEFAULT_BUILD;
}

/** Pull the CUID and the BOE logon token out of a decrypted sapLink. */
export function parseSapLink(sapLink) {
    const url = new URL(sapLink.startsWith('/') ? BOE_HOST + sapLink : sapLink);
    return {
        cuid : url.searchParams.get('iDocID'),
        token: decodeURIComponent(url.searchParams.get('token') || ''),
    };
}

export class Raylight {
    /**
     * @param {string} token   BOE enterprise logon token (from parseSapLink)
     * @param {object} o
     * @param {string} o.build            OpenDocument build number
     * @param {number} o.gapMs            minimum gap between BOE requests (default 1000)
     * @param {number} o.throttlePauseMs  pause after 418/429/503 (default 180000)
     * @param {number} o.throttleRetries  retries before giving up (default 3)
     * @param {Function} o.onUnauthorized async () => newToken, called once on a 401
     */
    constructor(token, {
        build = DEFAULT_BUILD, gapMs = 1000, userAgent = DEFAULT_UA,
        throttlePauseMs = 180_000, throttleRetries = 3,
        onUnauthorized = null, log = () => {}, verbose = false,
    } = {}) {
        this.token = token;
        this.build = build;
        this.userAgent = userAgent;
        this.pacer = new Pacer(gapMs);
        this.throttlePauseMs = throttlePauseMs;
        this.throttleRetries = throttleRetries;
        this.onUnauthorized = onUnauthorized;
        this.log = log;
        this.verbose = verbose;
        this.calls = 0;
    }

    get base() { return `${BOE_HOST}/BOE/OpenDocument/${this.build}/biprwsproxy/biprws`; }

    /**
     * One paced request. Retries 418/429/503 after a long pause (the WAF's penalty
     * box is measured in minutes) and throws ThrottledError once the budget is gone.
     */
    async call(method, path, { accept = 'application/json', body = null, ctype = 'application/json', timeoutMs = 300_000 } = {}) {
        let unauthorizedRetried = false;
        for (let attempt = 0; ; attempt++) {
            await this.pacer.wait();
            const headers = {
                'X-SAP-LogonToken' : this.token,
                'X-SAP-PVL'        : 'en_IN',
                'X-Requested-With' : 'XMLHttpRequest',
                accept,
                'user-agent'       : this.userAgent,
            };
            if (body != null) headers['content-type'] = ctype;

            const ctrl  = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), timeoutMs);
            let res, buf;
            try {
                res = await fetch(this.base + path, {
                    method, headers, signal: ctrl.signal,
                    body: body == null ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
                });
                buf = Buffer.from(await res.arrayBuffer());
            } finally { clearTimeout(timer); }
            this.calls++;

            const ct  = res.headers.get('content-type') || '';
            const out = { status: res.status, ct, buf, len: buf.length, path };
            if (/json|xml|text|html/.test(ct)) out.text = buf.toString('utf8');
            if (/json/.test(ct)) { try { out.json = JSON.parse(out.text); } catch { /* not JSON after all */ } }
            if (this.verbose) this.log(`    ${method} ${path.slice(0, 110)} -> ${res.status} ${ct.slice(0, 40)} ${buf.length}B`);

            if (res.status === 418 || res.status === 429 || res.status === 503) {
                if (attempt >= this.throttleRetries) {
                    throw new ThrottledError(`throttled: HTTP ${res.status} after ${attempt} retries`, { status: res.status, path, body: (out.text || '').slice(0, 200) });
                }
                this.log(`    HTTP ${res.status} (throttled) — pausing ${Math.round(this.throttlePauseMs / 1000)}s [retry ${attempt + 1}/${this.throttleRetries}]`);
                await sleep(this.throttlePauseMs);
                continue;
            }
            if (res.status === 401 && this.onUnauthorized && !unauthorizedRetried) {
                unauthorizedRetried = true;
                this.log('    HTTP 401 — logon token expired, re-acquiring');
                const fresh = await this.onUnauthorized();
                if (fresh) { this.token = fresh; continue; }
            }
            return out;
        }
    }

    get(p, o)  { return this.call('GET', p, o); }
    put(p, o)  { return this.call('PUT', p, o); }
    post(p, o) { return this.call('POST', p, o); }

    /** Sanity check: does this token have a live enterprise session? */
    async session() {
        const r = await this.get('/raylight/v1/session');
        if (r.status !== 200) throw new RaylightError(`session check failed: HTTP ${r.status}`, { status: r.status, body: (r.text || '').slice(0, 200) });
        return r.json?.session?.user || null;
    }

    /** CUID → { id, name, kind }. SI_KIND tells Webi documents from PDF attachments. */
    async resolveDocument(cuid) {
        const q = await this.post('/v1/cmsquery?pagesize=5', {
            body : { query: `SELECT SI_ID, SI_NAME, SI_KIND FROM CI_INFOOBJECTS WHERE SI_CUID='${cuid}'` },
            ctype: 'application/json;odata=verbose',
        });
        const e = q.json?.entries?.[0];
        if (!e?.SI_ID) throw new RaylightError(`cmsquery could not resolve CUID ${cuid}`, { status: q.status, body: (q.text || '').slice(0, 200) });
        return { id: String(e.SI_ID), name: e.SI_NAME, kind: e.SI_KIND };
    }

    /** Resolve, then open a private occurrence. Returns a RaylightDocument handle. */
    async open(cuid) {
        const info = await this.resolveDocument(cuid);
        if (info.kind !== 'Webi') return new RaylightDocument(this, info, null);
        const occ = await this.post(`/raylight/v1/documents/${info.id}/occurrences`, { body: '' });
        if (occ.status !== 200) throw new RaylightError(`could not open an occurrence of ${info.id}: HTTP ${occ.status}`, { status: occ.status, body: (occ.text || '').slice(0, 200) });
        return new RaylightDocument(this, info, occ.json?.success?.id ?? '0');
    }

    /** Release the guest BOE session. Always do this: the pool is shared with real users. */
    async logoff() {
        try { return (await this.post('/logoff', { body: '' })).status; }
        catch { return null; }
    }
}

/** One open document (occurrence). All paths hang off the occurrence, as the viewer's do. */
export class RaylightDocument {
    constructor(ray, info, occurrenceId) {
        this.ray = ray;
        this.id = info.id; this.name = info.name; this.kind = info.kind;
        this.occurrenceId = occurrenceId;
    }

    get isWebi() { return this.kind === 'Webi' && this.occurrenceId != null; }
    get base()   { return `/raylight/v1/documents/${this.id}/occurrences/${this.occurrenceId}`; }

    /** Document prompts, with their lists of values. Most DBIE tables have none. */
    async prompts() {
        const r = await this.ray.get(`${this.base}/parameters?lovInfo=true`);
        const plain = v => (typeof v === 'object' && v !== null ? v.$ : v);
        return arr(r.json?.parameters?.parameter).map(p => ({
            id          : p.id,
            name        : p.name,
            cardinality : p.answer?.info?.['@cardinality'] || 'Single',
            optional    : p['@optional'] === 'true',
            type        : p.answer?.['@type'] || null,
            constrained : p.answer?.['@constrained'] === 'true',
            // Values offered by the prompt's list. Unconstrained prompts (free text, a date
            // typed in by hand) have no list at all, which is why `values` can be empty.
            values      : arr(p.answer?.info?.lov?.values?.value).map(plain),
            // The answer the document already carries. The only thing to send back for a
            // prompt with no list, since Raylight rejects an empty answer outright.
            current     : arr(p.answer?.values?.value).map(plain),
        }));
    }

    /**
     * Run every data provider's query. Mandatory — the export is an empty skeleton
     * without it. `answers` is [{ id, values: [...] }] for prompted documents.
     */
    async refresh(answers = null) {
        const body = answers?.length
            ? { parameters: { parameter: answers.map(a => ({ id: a.id, answer: { values: { value: a.values } } })) } }
            : '';
        const r = await this.ray.put(`${this.base}/parameters?dataproviderScope=accessible&lovInfo=false&prepare=true`, { body });
        // Carry the server's explanation in the message: the caller logs `e.message`, and
        // "HTTP 400" on its own says nothing about which rule was broken.
        if (r.status !== 200) {
            const why = r.json?.error?.message || (r.text || '').replace(/\s+/g, ' ').slice(0, 200);
            throw new RaylightError(`refresh failed: HTTP ${r.status}${why ? ` — ${why}` : ''}`, { status: r.status, body: why });
        }
        // A 200 does not always mean "refreshed". When prompts are still unanswered the
        // server replies with the parameter list again — now with the lists that the
        // answers just given have unlocked — instead of a success envelope.
        if (r.json?.parameters) return { refreshed: false, pending: true, parameters: r.json.parameters };
        const props = r.json?.success?.details?.property;
        const allRefreshed = Array.isArray(props) ? props.some(p => p['@key'] === 'allDataprovidersRefreshed' && p.$ === 'true') : true;
        return { refreshed: true, pending: false, allDataprovidersRefreshed: allRefreshed };
    }

    async dataproviders() {
        const r = await this.ray.get(`${this.base}/dataproviders`);
        return arr(r.json?.dataproviders?.dataprovider).map(d => ({ id: d.id, name: d.name, rowCount: Number(d.rowCount ?? 0) }));
    }

    /** The document's tabs. */
    async reports() {
        const r = await this.ray.get(`${this.base}/reports`);
        return arr(r.json?.reports?.report).map(x => ({ id: x.id, name: x.name }));
    }

    /** Input controls; omit `reportId` for the document-level ones (e.g. "Amount Unit"). */
    async inputControls(reportId = null) {
        const p = reportId == null ? `${this.base}/inputcontrols?allInfo=true` : `${this.base}/reports/${reportId}/inputcontrols?allInfo=true`;
        const r = await this.ray.get(p);
        return arr(r.json?.inputcontrols?.inputcontrol).map(ic => {
            const [kind, spec] = controlSpec(ic);
            return {
                id          : ic.id,
                name        : ic.name,
                dataType    : ic.assignedDataObject?.['@dataType'] || null,
                kind,
                // Absent on the single-valued kinds (radio buttons, entry fields), which is
                // itself the signal: those reject any selection of more than one value.
                cardinality : spec?.['@cardinality'] || null,
                allowAll    : spec?.['@allowAllValuesSelection'] === 'true',
                custom      : arr(spec?.custom?.value),
                selected    : arr(ic.selection?.value),
                selectedAll : ic.selection?.['@all'] === 'true',
            };
        });
    }

    async lov(icId, reportId = null) {
        const p = reportId == null ? `${this.base}/inputcontrols/${icId}/lov` : `${this.base}/reports/${reportId}/inputcontrols/${icId}/lov`;
        const r = await this.ray.get(p);
        return arr(r.json?.lov?.values?.value).map(v => (typeof v === 'object' ? v.$ : v));
    }

    /**
     * Set a selection without throwing. Pass `{ values }` for explicit values, or
     * `{ all: true }` for the control's "All values" form — which is the only way to
     * take the whole history from a single-valued control (radio buttons, entry
     * fields), since those answer HTTP 400 "Argument /selection/value/count() must
     * be equal to 1" to anything longer than one value.
     * @returns {{ok: boolean, status: number, message: string}}
     */
    async trySelect(icId, { values = null, all = false } = {}, reportId = null) {
        const p = reportId == null ? `${this.base}/inputcontrols/${icId}/selection` : `${this.base}/reports/${reportId}/inputcontrols/${icId}/selection`;
        const body = all ? { selection: { '@all': 'true' } } : { selection: { value: values || [] } };
        const r = await this.ray.put(p, { body });
        const message = r.json?.error?.message || r.json?.success?.message || (r.text || '').replace(/\s+/g, ' ').slice(0, 200);
        return { ok: r.status === 200, status: r.status, message };
    }

    /** Set a selection. The `/selection` sub-resource is the only one that takes effect. */
    async select(icId, values, reportId = null) {
        const r = await this.trySelect(icId, { values }, reportId);
        if (!r.ok) throw new RaylightError(`selection on ${icId} failed: HTTP ${r.status}`, { status: r.status, body: r.message });
        return true;
    }

    /** One tab, in the given format. */
    async exportReport(reportId, format) {
        return this.#download(`${this.base}/reports/${reportId}`, format);
    }

    /** Every tab in one file (a single workbook for xlsx/xls). */
    async exportDocument(format) {
        return this.#download(this.base, format);
    }

    /**
     * Export a data provider's own result set — the microcube the tabs are built from,
     * with the universe's column names rather than the report layout. This is the way
     * to get data out of a document whose only tabs are charts.
     *
     * Not every format is served here (the flow endpoint is happiest with text/csv), so
     * this returns a result object instead of throwing.
     * @returns {{ok: boolean, status: number, ct: string, buf: Buffer|null, message: string}}
     */
    async exportDataProvider(dpId, format, { flow = 0 } = {}) {
        const accept = EXPORT_MIME[format];
        if (!accept) throw new RaylightError(`unknown export format: ${format}`);
        const r = await this.ray.get(`${this.base}/dataproviders/${dpId}/flows/${flow}`, { accept });
        const message = r.json?.error?.message || (r.status === 200 ? 'ok' : (r.text || '').replace(/\s+/g, ' ').slice(0, 200));
        return { ok: r.status === 200 && r.len > 0, status: r.status, ct: r.ct, buf: r.status === 200 ? r.buf : null, message };
    }

    async #download(path, format) {
        const accept = EXPORT_MIME[format];
        if (!accept) throw new RaylightError(`unknown export format: ${format}`);
        const r = await this.ray.get(path, { accept });
        if (r.status !== 200) throw new RaylightError(`export ${format} failed: HTTP ${r.status}`, { status: r.status, body: (r.text || '').slice(0, 200), path });
        return r.buf;
    }
}

/**
 * An input control's kind is the name of its one descriptor sub-object: comboBox,
 * listBox, radioButtons, checkBoxes, entryField, spinner, slider, calendar… Raylight
 * does not label it, so find the sub-object carrying the control attributes.
 * @returns {[string, object|null]} [kind, spec]
 */
export function controlSpec(ic) {
    for (const [k, v] of Object.entries(ic || {})) {
        if (v && typeof v === 'object' && !Array.isArray(v) && ('@operator' in v || '@resetSelectionOnRefresh' in v)) return [k, v];
    }
    return ['other', null];
}

/**
 * Is this input control the document's period selector? DBIE uses a DateTime-typed
 * control on the publication tables; a few tabs name it without typing it.
 */
export const isPeriodControl = ic =>
    ic?.dataType === 'DateTime' || /\b(quarter|month|year|period|date|week|fortnight|as on)\b/i.test(ic?.name || '');

/** Both "2026-03-31T00:00:00.000Z" and "2026-27:Q1" order correctly as plain strings. */
export const newestValue = values => (values.length ? values.slice().sort()[values.length - 1] : null);
