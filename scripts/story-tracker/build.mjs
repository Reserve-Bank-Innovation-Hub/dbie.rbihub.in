// Builds the story tracker, docs/story-tracker/index.html, from the registry (stories.json), the owners
// (owners.json), the guide (guide.html, slate-sections.json), git history on dev and main, open pull requests
// and the code of every story on dev.
//
//   node scripts/story-tracker/build.mjs            uses origin/dev and origin/main (run `git fetch` first)
//   DEV_REF=HEAD node scripts/story-tracker/build.mjs   in CI, with dev checked out
//   GITHUB_TOKEN=... adds open pull requests (WIP); without it, WIP comes only from the registry.
//
// Status, in order of precedence: Merged (the registry names a story it joined), Live (the story's folder is on
// main), On dev (on dev), WIP (an open pull request to dev touches the story's folder or processor), Planned.
// "First on dev" is the first first-parent commit on dev touching the folder; each later one is an update, credited
// to the authors of the pull request it merged. What the story shows is read from the code: page.tsx metadata, the
// headers in its components, the comment above each export in data.gen.ts and the processor's header.
//
// Writes docs/story-tracker/tracker.json and docs/story-tracker/index.html. Uses node built-ins only.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO      = path.join(__dirname, '../..');
const DIR       = path.join(REPO, 'docs/story-tracker');
const DEV       = process.env.DEV_REF  || 'origin/dev';
const MAIN      = process.env.MAIN_REF || 'origin/main';
const STORIES   = 'src/app/stories';

const git = (...args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 << 20 }).trim();
const tryGit = (...args) => { try { return git(...args); } catch { return ''; } };
const show = (ref, file) => tryGit('show', `${ref}:${file}`);
const read = (file) => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));

const registry = read('stories.json');
const owners   = read('owners.json');
const sections = read('slate-sections.json');
const guide    = fs.readFileSync(path.join(DIR, 'guide.html'), 'utf8');

// ---- Slugs on a ref, and redirects (renamed stories keep their history)
const slugsOn = (ref) => tryGit('ls-tree', '-d', '--name-only', `${ref}:${STORIES}`).split('\n').filter(s => s && !s.startsWith('('));
const devSlugs  = slugsOn(DEV);
const mainSlugs = slugsOn(MAIN);
const redirects = {};
for (const m of show(DEV, 'next.config.js').matchAll(/source\s*:\s*"\/stories\/([^"]+)"\s*,\s*destination\s*:\s*"\/stories\/([^"]+)"/g)) redirects[m[1]] = m[2];
const current = (slug) => { let s = slug, n = 0; while (redirects[s] && n++ < 10) s = redirects[s]; return s; };
const aliasesOf = (slug) => [slug, ...Object.keys(redirects).filter(k => current(k) === slug)];

// ---- History of a story on a ref: first-parent commits touching its folder (and former folders)
function history(ref, slug) {
    const paths = aliasesOf(slug).map(s => `${STORIES}/${s}`);
    const log = tryGit('log', ref, '--first-parent', '--reverse', '--format=%H|%P|%cI|%an|%s', '--', ...paths);
    if (!log) return [];
    return log.split('\n').map(line => {
        const [sha, parents, date, author, ...subj] = line.split('|');
        const subject = subj.join('|');
        const ps = parents.split(' ');
        let authors = [author], pr = null, branch = null;
        const m = subject.match(/Merge pull request #(\d+) from [^/]+\/(\S+)/);
        if (m) { pr = +m[1]; branch = m[2]; }
        if (ps.length > 1) {
            const a = tryGit('log', `${ps[0]}..${ps[1]}`, '--format=%an', '--', ...paths).split('\n').filter(Boolean);
            if (a.length) authors = [...new Set(a)];
            const body = tryGit('log', '-1', '--format=%b', sha).split('\n')[0];
            if (body) branch = body;
        }
        return { sha: sha.slice(0, 7), date: date.slice(0, 10), authors, pr, title: branch || subject };
    });
}

// ---- What a story on dev shows, read from its code
function capture(slug) {
    const base = `${STORIES}/${slug}`;
    const files = tryGit('ls-tree', '-r', '--name-only', DEV, base).split('\n').filter(Boolean);
    const page = show(DEV, `${base}/page.tsx`);
    const meta = (k) => { const m = page.match(new RegExp(`${k}\\s*:\\s*(["\`])([\\s\\S]*?)\\1`)); return m ? m[2].replace(/\s*\|\s*Stories[^|]*$/, '').trim() : null; };
    const headers = [];
    for (const f of files.filter(f => /\.tsx$/.test(f))) {
        const src = show(DEV, f);
        for (const m of src.matchAll(/<h([1-3])\b[^>]*>([^<{]{6,220})<\/h\1>/g)) headers.push(m[2].replace(/\s+/g, ' ').trim());
        for (const m of src.matchAll(/\b(?:title|heading|header|head)\s*:\s*"([^"]{12,220})"/g)) headers.push(m[1]);
    }
    const gen = show(DEV, `${base}/data.gen.ts`);
    const shows = [];
    let series = '';
    if (gen) {
        const lines = gen.split('\n');
        series = lines.filter(l => l.startsWith('//')).slice(0, 4).map(l => l.replace(/^\/\/\s?/, '')).join(' ');
        for (let i = 1; i < lines.length; i++) if (/^export const/.test(lines[i]) && /^\/\//.test(lines[i - 1]) && i > 4) {
            const c = lines[i - 1].replace(/^\/\/\s?/, '').trim(); if (c && !shows.includes(c)) shows.push(c);
        }
    }
    const proc = series.match(/data\/processors\/(story-[\w-]+)\.mjs/);
    let processor = null, codes = [];
    if (proc) {
        processor = `data/processors/${proc[1]}.mjs`;
        const head = show(DEV, processor).split('\n').filter(l => l.startsWith('//')).map(l => l.slice(2)).join('\n');
        codes = [...new Set([...head.matchAll(/\b([A-Z][A-Z0-9_]{3,}_RN)\b/g)].map(m => m[1]))];
    }
    return { title: meta('title'), description: meta('description'), headers: [...new Set(headers)].slice(0, 40),
             shows: shows.slice(0, 40), series, processor, seriesCodes: codes, files: files.length };
}

// ---- What the deployed dev page says: its headers (the story's action titles) and description, in page order.
// The page is rendered on the server, so its HTML carries the text a reader sees. A deploy takes a few minutes after
// a merge; the scheduled run picks up what the push-time run could not.
const decode = (t) => t.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
async function livePage(slug) {
    if (process.env.CAPTURE_PAGES === '0') return null;
    try {
        const res = await fetch(`${registry.devSite}/stories/${slug}`, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'dbie-story-tracker' } });
        if (!res.ok) return null;
        const html = await res.text();
        const headers = [...html.matchAll(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map(m => decode(m[2])).filter(t => t.length > 3);
        const d = html.match(/<meta name="description" content="([^"]*)"/);
        return { headers: [...new Set(headers)].slice(0, 60), description: d ? decode(d[1]) : null };
    } catch { return null; }
}

// ---- Open pull requests to dev (WIP)
async function openPrs() {
    const token = process.env.GITHUB_TOKEN; if (!token) return [];
    const api = (u) => fetch(`https://api.github.com/repos/${registry.repo}${u}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }).then(r => r.ok ? r.json() : []);
    const prs = await api('/pulls?state=open&base=dev&per_page=100');
    const out = [];
    for (const p of prs) {
        const files = await api(`/pulls/${p.number}/files?per_page=300`);
        const slugs = new Set();
        for (const f of files) {
            let m = f.filename.match(/^src\/app\/stories\/([^/(][^/]*)\//); if (m) slugs.add(m[1]);
            m = f.filename.match(/^data\/processors\/story-([\w-]+)\.mjs$/); if (m) slugs.add(m[1]);
        }
        if (slugs.size) out.push({ pr: p.number, title: p.title, author: p.user?.login, draft: p.draft, updated: (p.updated_at || '').slice(0, 10), branch: p.head?.ref, slugs: [...slugs] });
    }
    return out;
}

// ---- Assemble
const prs = await openPrs();
const pages = new Map();
await Promise.all(devSlugs.map(async (slug) => { const p = await livePage(current(slug)); if (p && p.headers.length) pages.set(current(slug), p); }));
const known = new Map();
for (const s of registry.stories) for (const sl of [s.slug, ...(s.formerSlugs || [])].filter(Boolean)) known.set(current(sl), s);
let next = Math.max(...registry.stories.map(s => +s.id.slice(1))) + 1;
const added = [];
for (const slug of [...devSlugs, ...prs.flatMap(p => p.slugs)]) {
    const c = current(slug);
    if (!known.has(c)) { const s = { id: `S${next++}`, title: null, slug: c, section: null, auto: true }; known.set(c, s); added.push(s); }
}
const all = [...registry.stories, ...added];
const out = all.map(s => {
    const slug = s.slug ? current(s.slug) : null;
    const onDev = slug && devSlugs.includes(slug);
    const onMain = slug && mainSlugs.map(current).includes(slug);
    const wip = prs.filter(p => slug && p.slugs.map(current).includes(slug));
    const devHist = onDev ? history(DEV, slug) : [];
    const mainHist = onMain ? history(MAIN, slug) : [];
    const status = s.mergedInto ? 'merged' : onMain ? 'live' : onDev ? 'dev' : wip.length ? 'wip' : 'planned';
    const cap = onDev ? capture(slug) : null;
    if (cap) { const live = pages.get(slug); if (live) { cap.headers = live.headers; if (live.description) cap.description = live.description; cap.fromPage = true; } }
    return {
        id: s.id, slug, status, mergedInto: s.mergedInto || null,
        title: (cap && cap.title) || s.title, plannedTitle: s.title, section: s.section,
        firstOnDev: devHist[0] || null, updates: devHist.slice(1).reverse(), live: mainHist[0] || null,
        wip, captured: cap, auto: !!s.auto,
    };
});
const meta = { generated: new Date().toISOString(), dev: tryGit('rev-parse', '--short', DEV), main: tryGit('rev-parse', '--short', MAIN), prsChecked: !!process.env.GITHUB_TOKEN };
// Write only when something other than the timestamp changed, so scheduled runs do not commit empty updates.
const inputs = ['stories.json', 'owners.json', 'guide.html', 'slate-sections.json'].map(f => fs.readFileSync(path.join(DIR, f), 'utf8')).join('') + fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const digest = (await import('node:crypto')).createHash('sha256').update(JSON.stringify(out) + meta.dev + meta.main + inputs).digest('hex').slice(0, 16);
meta.digest = digest;
let prev = null; try { prev = JSON.parse(fs.readFileSync(path.join(DIR, 'tracker.json'), 'utf8')); } catch {}
if (prev && prev.meta && prev.meta.digest === digest && !process.argv.includes('--force')) { console.log('story tracker: no change'); process.exit(0); }
fs.writeFileSync(path.join(DIR, 'tracker.json'), JSON.stringify({ meta, stories: out }, null, 1) + '\n');

const data = { meta, repo: registry.repo, devSite: registry.devSite, registry: all, tracker: out, owners, sections, guide };
const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const json = JSON.stringify(data).replace(/</g, '\\u003c');
fs.writeFileSync(path.join(DIR, 'index.html'), tpl.replace('/*__DATA__*/null', json));
const counts = out.reduce((a, s) => (a[s.status] = (a[s.status] || 0) + 1, a), {});
console.log(`story tracker: ${out.length} stories`, counts, added.length ? `(${added.length} new from the repo)` : '', meta.prsChecked ? '' : '(no GITHUB_TOKEN: pull requests not checked)');
