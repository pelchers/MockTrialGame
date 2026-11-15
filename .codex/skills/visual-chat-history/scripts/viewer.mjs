#!/usr/bin/env node
// viewer.mjs: the visual chat history viewer.
//
// A small local web page over .chat-history/: a tab per session, sort, filters, fuzzy search,
// deep links, and live updates (Server-Sent Events) while the conversation goes on.
//
// - Node built-ins only (http, fs, path, os, crypto, child_process). No install step, no CDN,
//   works offline. Runs from the root of any repo that has a .chat-history/ folder.
// - Binds to 127.0.0.1 only. Default port 4700 (override: --port N or VISUAL_CHAT_HISTORY_PORT).
// - Read only: it never writes the history. The only file it writes is an export you ask for.
// - Parsing and the session grouping rule come from the chat-history-convention skill's
//   split-sessions.mjs, so the viewer's tabs and the .chat-history/sessions/ files always agree.
//
// Commands (run from the repo root):
//   node .claude/skills/visual-chat-history/scripts/viewer.mjs serve   [--port N] [--root DIR]
//   node .claude/skills/visual-chat-history/scripts/viewer.mjs start   [--port N] [--root DIR]
//   node .claude/skills/visual-chat-history/scripts/viewer.mjs stop    [--port N]
//   node .claude/skills/visual-chat-history/scripts/viewer.mjs status  [--port N]
//   node .claude/skills/visual-chat-history/scripts/viewer.mjs export  [--out FILE] [--root DIR]
//   node .claude/skills/visual-chat-history/scripts/viewer.mjs summary [--root DIR]
// Other flags: --dir <chat-history dir> (default .chat-history), --source <file>[,<file>]
// (view only these files), --open (open the browser after serve/start).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = 'visual-chat-history';
const DEFAULT_PORT = 4700;
const HOST = '127.0.0.1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SELF = fileURLToPath(import.meta.url);
const APP_DIR = path.join(HERE, 'app');
const SOURCE_RE = /^user-messages[\w.-]*\.(md|log)$/;

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 0) out[a.slice(2, eq)] = a.slice(eq + 1);
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) out[a.slice(2)] = argv[++i];
      else out[a.slice(2)] = true;
    } else out._.push(a);
  }
  return out;
}

function findRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, '.chat-history')) || fs.existsSync(path.join(dir, '.git'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return path.resolve(start);
    dir = up;
  }
}

function resolveConfig(args) {
  const root = path.resolve(args.root || process.env.VISUAL_CHAT_HISTORY_ROOT || findRoot(process.cwd()));
  const chatDir = path.resolve(root, args.dir || process.env.VISUAL_CHAT_HISTORY_DIR || '.chat-history');
  const portRaw = args.port || process.env.VISUAL_CHAT_HISTORY_PORT || DEFAULT_PORT;
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail(`Not a valid port: ${portRaw}`);
  const only = args.source ? String(args.source).split(',').map((s) => path.resolve(root, s.trim())).filter(Boolean) : null;
  return { root, chatDir, port, only, open: !!args.open };
}

function fail(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

// ---------------------------------------------------------------- parser (shared with split-sessions.mjs)

async function loadParser(root) {
  const candidates = [
    path.resolve(HERE, '../../chat-history-convention/scripts/split-sessions.mjs'),
    path.join(root, '.claude/skills/chat-history-convention/scripts/split-sessions.mjs'),
    path.join(root, '.codex/skills/chat-history-convention/scripts/split-sessions.mjs'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return import(pathToFileURL(c).href);
  }
  fail('visual-chat-history needs the chat-history-convention skill\'s scripts/split-sessions.mjs ' +
    '(looked next to this skill and under .claude/ and .codex/). Sync chat-history-convention into this repo first.');
}

// ---------------------------------------------------------------- data

function listSources(cfg) {
  if (cfg.only) {
    return cfg.only.filter((p) => fs.existsSync(p)).map((p) => ({ path: p, name: path.relative(cfg.chatDir, p).split(path.sep).join('/') || path.basename(p), kind: 'history', device: null }));
  }
  const out = [];
  if (!fs.existsSync(cfg.chatDir)) return out;
  const names = fs.readdirSync(cfg.chatDir).filter((n) => SOURCE_RE.test(n)).sort((a, b) => rankName(a) - rankName(b) || (a < b ? -1 : 1));
  for (const n of names) {
    const p = path.join(cfg.chatDir, n);
    if (!fs.statSync(p).isFile()) continue;
    const seg = /^user-messages\.([A-Za-z0-9][\w-]*)\.md$/.exec(n);
    out.push({ path: p, name: n, kind: n === 'user-messages.md' || n === 'user-messages.log' ? 'history' : seg ? 'segment' : 'other', device: seg ? seg[1] : null });
  }
  const sdir = path.join(cfg.chatDir, 'sessions');
  if (fs.existsSync(sdir)) {
    for (const n of fs.readdirSync(sdir).filter((x) => x.endsWith('.md') && x !== 'README.md').sort()) {
      out.push({ path: path.join(sdir, n), name: `sessions/${n}`, kind: 'session', device: null });
    }
  }
  return out;
}

function rankName(n) {
  if (n === 'user-messages.md') return 0;
  if (n === 'user-messages.log') return 1;
  if (/^user-messages\.[A-Za-z0-9][\w-]*\.md$/.test(n)) return 2;
  return 3;
}

function sigOf(cfg) {
  const parts = [];
  for (const dir of [cfg.chatDir, path.join(cfg.chatDir, 'sessions')]) {
    if (!fs.existsSync(dir)) { parts.push(`${dir}:none`); continue; }
    for (const n of fs.readdirSync(dir).sort()) {
      if (!SOURCE_RE.test(n) && !(dir.endsWith('sessions') && n.endsWith('.md'))) continue;
      try { const st = fs.statSync(path.join(dir, n)); parts.push(`${n}:${st.size}:${st.mtimeMs}`); } catch { /* gone */ }
    }
  }
  if (cfg.only) for (const p of cfg.only) { try { const st = fs.statSync(p); parts.push(`${p}:${st.size}:${st.mtimeMs}`); } catch { parts.push(`${p}:none`); } }
  return parts.join('|');
}

function buildData(P, cfg) {
  const sources = listSources(cfg);
  const byKey = new Map();
  const entries = [];
  const warnings = [];
  const sourceInfo = [];
  sources.forEach((src, rank) => {
    let text;
    try { text = fs.readFileSync(src.path, 'utf8'); } catch (e) { warnings.push(`Could not read ${src.name}: ${e.message}`); return; }
    let res;
    try { res = P.parseHistoryText(text, { file: src.name, device: src.device }); } catch (e) { warnings.push(`Could not parse ${src.name}: ${e.message}`); return; }
    const occ = new Map();
    let added = 0;
    for (const e of res.entries) {
      const n = (occ.get(e.key) || 0) + 1;
      occ.set(e.key, n);
      const k = `${e.key}#${n}`;
      const have = byKey.get(k);
      if (have) { have.sources.push(src.name); continue; }
      e.rank = rank;
      e.sources = [src.name];
      byKey.set(k, e);
      entries.push(e);
      added++;
    }
    sourceInfo.push({ name: src.name, kind: src.kind, entries: res.entries.length, added });
  });
  const sessions = P.groupSessions(entries);
  const used = new Map();
  const outEntries = [];
  for (const s of sessions) {
    for (const e of s.entries) {
      let id = e.ts ? 'e' + e.ts.replace(/[-:]/g, '') : `undated-${e.order + 1}`;
      const n = (used.get(id) || 0) + 1;
      used.set(id, n);
      if (n > 1) id += `-${n}`;
      e.id = id;
      outEntries.push({
        id, session: s.id, ts: e.ts, tsRaw: e.tsRaw, date: e.date, hasTime: e.hasTime, role: e.role,
        author: e.author, machine: e.machine, sessionMachine: e.sessionMachine || null, device: e.device,
        host: e.host, commit: e.commit, sources: e.sources, raw: e.raw,
      });
    }
  }
  const sdir = path.join(cfg.chatDir, 'sessions');
  const outSessions = sessions.map((s) => ({
    id: s.id, file: s.file, hasFile: fs.existsSync(path.join(sdir, s.file)), date: s.date,
    machine: s.machine, start: s.start, end: s.end, count: s.count, entries: s.entries.map((e) => e.id),
  }));
  // Is the sessions/ folder behind the history? (Only checked when the folder exists.)
  let sessionsFolder = { exists: fs.existsSync(sdir), stale: false };
  if (sessionsFolder.exists && !cfg.only && typeof P.buildSessionFiles === 'function') {
    try {
      const built = P.buildSessionFiles(cfg.chatDir);
      for (const [name, content] of built.files) {
        const p = path.join(sdir, name);
        if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== content) { sessionsFolder.stale = true; break; }
      }
    } catch { /* not fatal */ }
  }
  const core = { sessions: outSessions, entries: outEntries };
  const version = crypto.createHash('sha1').update(JSON.stringify(core)).digest('hex').slice(0, 16);
  return {
    app: APP,
    version,
    repo: path.basename(cfg.root),
    chatDir: path.relative(cfg.root, cfg.chatDir).split(path.sep).join('/') || '.',
    gapHours: P.GAP_HOURS,
    sources: sourceInfo,
    sessionsFolder,
    warnings,
    ...core,
  };
}

// ---------------------------------------------------------------- page

function readApp(name) {
  return fs.readFileSync(path.join(APP_DIR, name), 'utf8');
}

function pageHtml(mode, data, rawBase) {
  let html = readApp('index.html');
  const boot = JSON.stringify({ mode, rawBase });
  if (mode === 'export') {
    const css = readApp('app.css');
    const js = readApp('app.js');
    const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    const csp = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'";
    html = html
      .replace('<!--CSP-->', () => `<meta http-equiv="Content-Security-Policy" content="${csp}">`)
      .replace('<link rel="stylesheet" href="app.css">', () => `<style>\n${css}\n</style>`)
      .replace('<script src="app.js" defer></script>', () =>
        `<script id="vch-boot" type="application/json">${boot.replace(/</g, '\\u003c')}</script>\n` +
        `<script id="vch-data" type="application/json">${json}</script>\n<script>\n${js}\n</script>`);
  } else {
    html = html
      .replace('<!--CSP-->', '')
      .replace('<script src="app.js" defer></script>', () =>
        `<script id="vch-boot" type="application/json">${boot.replace(/</g, '\\u003c')}</script>\n<script src="app.js" defer></script>`);
  }
  return html;
}

// ---------------------------------------------------------------- server

const SERVER_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

function send(res, status, type, body, extra = {}) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...extra,
  });
  res.end(body);
}

async function serve(cfg) {
  const P = await loadParser(cfg.root);
  let data = buildData(P, cfg);
  let sig = sigOf(cfg);
  const clients = new Set();
  const allowedHosts = new Set([`${HOST}:${cfg.port}`, `localhost:${cfg.port}`]);
  const startedAt = new Date().toISOString();

  const server = http.createServer((req, res) => {
    if (!allowedHosts.has(String(req.headers.host || '').toLowerCase())) return send(res, 403, 'text/plain; charset=utf-8', 'Forbidden host');
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'text/plain; charset=utf-8', 'Method not allowed', { Allow: 'GET, HEAD' });
    let url;
    try { url = new URL(req.url, `http://${HOST}:${cfg.port}`); } catch { return send(res, 400, 'text/plain; charset=utf-8', 'Bad request'); }
    const p = url.pathname;
    try {
      if (p === '/' || p === '/index.html') return send(res, 200, 'text/html; charset=utf-8', pageHtml('live', null, 'raw/'), { 'Content-Security-Policy': SERVER_CSP });
      if (p === '/app.js') return send(res, 200, 'text/javascript; charset=utf-8', readApp('app.js'));
      if (p === '/app.css') return send(res, 200, 'text/css; charset=utf-8', readApp('app.css'));
      if (p === '/api/data') return send(res, 200, 'application/json; charset=utf-8', JSON.stringify(data));
      if (p === '/api/health') {
        return send(res, 200, 'application/json; charset=utf-8', JSON.stringify({
          app: APP, pid: process.pid, port: cfg.port, root: cfg.root, chatDir: cfg.chatDir, version: data.version,
          entries: data.entries.length, sessions: data.sessions.length, clients: clients.size, startedAt,
        }));
      }
      if (p === '/api/events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Content-Type-Options': 'nosniff' });
        res.write(`retry: 2000\nevent: hello\ndata: ${JSON.stringify({ version: data.version })}\n\n`);
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
      }
      if (p.startsWith('/raw/')) {
        // only files the viewer itself lists as sources can be read (no paths, no traversal)
        let name = '';
        try { name = decodeURIComponent(p.slice(5)); } catch { /* bad escape: 404 below */ }
        const known = listSources(cfg).find((s) => s.name === name);
        if (!known) return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
        return send(res, 200, 'text/plain; charset=utf-8', fs.readFileSync(known.path));
      }
      if (p === '/favicon.ico') return send(res, 204, 'text/plain', '');
      return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
    } catch (e) {
      return send(res, 500, 'text/plain; charset=utf-8', 'Server error: ' + e.message);
    }
  });

  const rebuild = () => {
    const s = sigOf(cfg);
    if (s === sig) return;
    sig = s;
    try {
      const next = buildData(P, cfg);
      if (next.version !== data.version) {
        data = next;
        const msg = `event: update\ndata: ${JSON.stringify({ version: data.version, entries: data.entries.length })}\n\n`;
        for (const c of clients) c.write(msg);
        console.log(`[${new Date().toISOString()}] history changed: ${data.entries.length} entries, ${data.sessions.length} sessions, sent to ${clients.size} page(s)`);
      }
    } catch (e) {
      console.error(`[${new Date().toISOString()}] rebuild failed, keeping the last good data: ${e.message}`);
    }
  };
  let timer = null;
  const soon = () => { clearTimeout(timer); timer = setTimeout(rebuild, 200); };
  const watchers = [];
  const attach = () => {
    for (const dir of [cfg.chatDir, path.join(cfg.chatDir, 'sessions')]) {
      if (watchers.some((w) => w.dir === dir) || !fs.existsSync(dir)) continue;
      try { const w = fs.watch(dir, soon); w.on('error', () => {}); watchers.push({ dir, w }); } catch { /* polling covers it */ }
    }
  };
  attach();
  setInterval(() => { attach(); rebuild(); }, 1500);
  setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 20000);

  server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
      const h = await probe(cfg.port);
      if (h.state === 'ours') fail(`The viewer is already running on http://${HOST}:${cfg.port}/ (pid ${h.info.pid}, root ${h.info.root}).`, 3);
      fail(`Port ${cfg.port} is already in use by another program. Pick a free one: --port <n> or set VISUAL_CHAT_HISTORY_PORT.`, 2);
    }
    fail(`Server error: ${err.message}`);
  });
  server.listen(cfg.port, HOST, () => {
    const url = `http://${HOST}:${cfg.port}/`;
    console.log(`visual-chat-history: ${url}`);
    console.log(`  root ${cfg.root}`);
    console.log(`  ${data.entries.length} entries in ${data.sessions.length} sessions from ${data.sources.map((s) => s.name).join(', ') || '(no history files yet)'}`);
    console.log('  watching for changes; Ctrl+C to stop');
    writePidFile(cfg, url);
    if (cfg.open) openBrowser(url);
  });
  const shutdown = () => {
    for (const c of clients) { try { c.end(); } catch { /* closing */ } }
    removePidFile(cfg);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGBREAK', shutdown);
}

function pidFile(port) {
  return path.join(os.tmpdir(), `${APP}-${port}.json`);
}

function writePidFile(cfg, url) {
  try { fs.writeFileSync(pidFile(cfg.port), JSON.stringify({ pid: process.pid, port: cfg.port, url, root: cfg.root })); } catch { /* optional */ }
}

function removePidFile(cfg) {
  try {
    const j = JSON.parse(fs.readFileSync(pidFile(cfg.port), 'utf8'));
    if (j.pid === process.pid) fs.unlinkSync(pidFile(cfg.port));
  } catch { /* optional */ }
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    else if (process.platform === 'darwin') spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    else spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  } catch { /* the URL is printed anyway */ }
}

// ---------------------------------------------------------------- start / stop / status

function probe(port, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const req = http.get({ host: HOST, port, path: '/api/health', timeout: timeoutMs, headers: { Host: `${HOST}:${port}` } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { body += d; if (body.length > 65536) req.destroy(); });
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          if (j && j.app === APP && Number.isInteger(j.pid)) return resolve({ state: 'ours', info: j });
        } catch { /* not ours */ }
        resolve({ state: 'other' });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ state: 'other' }); });
    req.on('error', (e) => resolve({ state: e.code === 'ECONNREFUSED' ? 'free' : 'other' }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function psQuote(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function winArg(s) {
  const t = String(s);
  return /[\s"]/.test(t) ? `"${t.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, '$1$1')}"` : t;
}

function spawnHidden(args, logFile, cwd) {
  if (process.platform === 'win32') {
    // Same pattern as the "Dev Server Persistence" convention: an OS-detached, hidden process
    // started by Start-Process, outside the calling shell's process tree.
    // The pid comes back through a temp file and PowerShell runs with no pipes attached: the
    // hidden child would otherwise inherit a pipe handle and keep this command waiting.
    const argLine = args.map(winArg).join(' ');
    const pidOut = path.join(os.tmpdir(), `${APP}-start-${process.pid}-${Date.now()}.pid`);
    const ps = "$ProgressPreference = 'SilentlyContinue'; " +
      `$p = Start-Process -FilePath ${psQuote(process.execPath)} -ArgumentList ${psQuote(argLine)} ` +
      `-WorkingDirectory ${psQuote(cwd)} -WindowStyle Hidden -RedirectStandardOutput ${psQuote(logFile)} ` +
      `-RedirectStandardError ${psQuote(logFile + '.err')} -PassThru; ` +
      `Set-Content -LiteralPath ${psQuote(pidOut)} -Value $p.Id -Encoding ascii`;
    const enc = Buffer.from(ps, 'utf16le').toString('base64');
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', enc], { stdio: 'ignore', windowsHide: true });
    let pid = NaN;
    try { pid = Number(fs.readFileSync(pidOut, 'utf8').trim()); fs.unlinkSync(pidOut); } catch { /* checked by the health probe */ }
    return pid;
  }
  const fd = fs.openSync(logFile, 'a');
  const child = spawn(process.execPath, args, { cwd, detached: true, stdio: ['ignore', fd, fd] });
  child.unref();
  return child.pid;
}

async function start(cfg) {
  const before = await probe(cfg.port);
  if (before.state === 'ours') {
    console.log(`Already running: http://${HOST}:${cfg.port}/ (pid ${before.info.pid}, root ${before.info.root}).`);
    return 0;
  }
  if (before.state === 'other') fail(`Port ${cfg.port} is already in use by another program. Pick a free one: --port <n> or set VISUAL_CHAT_HISTORY_PORT.`, 2);
  const logFile = path.join(os.tmpdir(), `${APP}-${cfg.port}.log`);
  const args = [SELF, 'serve', '--port', String(cfg.port), '--root', cfg.root, '--dir', cfg.chatDir];
  if (cfg.only) args.push('--source', cfg.only.join(','));
  const pid = spawnHidden(args, logFile, cfg.root);
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    const h = await probe(cfg.port, 500);
    if (h.state === 'ours') {
      console.log(`Started in the background: http://${HOST}:${cfg.port}/ (pid ${h.info.pid}).`);
      console.log(`  log: ${logFile}`);
      const rel = path.relative(process.cwd(), SELF);
      const shown = rel.startsWith('..') || path.isAbsolute(rel) ? SELF : rel.split(path.sep).join('/');
      console.log(`  stop: node "${shown}" stop --port ${cfg.port}`);
      if (cfg.open) openBrowser(`http://${HOST}:${cfg.port}/`);
      return 0;
    }
  }
  let tail = '';
  try { tail = fs.readFileSync(logFile + '.err', 'utf8').slice(-800) || fs.readFileSync(logFile, 'utf8').slice(-800); } catch { /* none */ }
  fail(`The viewer (pid ${pid}) did not answer on port ${cfg.port} within 10 seconds.${tail ? '\n' + tail : ''}\nLog: ${logFile}`, 1);
}

async function stop(cfg) {
  const h = await probe(cfg.port);
  if (h.state === 'free') { console.log(`Nothing is running on port ${cfg.port}.`); return 0; }
  if (h.state === 'other') {
    fail(`Port ${cfg.port} is held by a program that is not this viewer, so it was left alone.`, 2);
  }
  try { process.kill(h.info.pid); } catch (e) { fail(`Could not stop pid ${h.info.pid}: ${e.message}`, 1); }
  for (let i = 0; i < 20; i++) {
    await sleep(200);
    if ((await probe(cfg.port, 400)).state === 'free') {
      try { fs.unlinkSync(pidFile(cfg.port)); } catch { /* already gone */ }
      console.log(`Stopped the viewer on port ${cfg.port} (pid ${h.info.pid}).`);
      return 0;
    }
  }
  fail(`Sent a stop to pid ${h.info.pid}, but port ${cfg.port} is still answering.`, 1);
}

async function status(cfg) {
  const h = await probe(cfg.port);
  if (h.state === 'ours') {
    const i = h.info;
    console.log(`Running: http://${HOST}:${cfg.port}/ (pid ${i.pid}) root ${i.root}, ${i.entries} entries, ${i.sessions} sessions, ${i.clients} open page(s), since ${i.startedAt}.`);
    return 0;
  }
  if (h.state === 'other') { console.log(`Port ${cfg.port} is in use by another program (not this viewer).`); return 2; }
  console.log(`Not running on port ${cfg.port}.`);
  return 1;
}

// ---------------------------------------------------------------- export / summary

async function exportHtml(cfg, args) {
  const P = await loadParser(cfg.root);
  const data = buildData(P, cfg);
  data.generatedAt = new Date().toISOString();
  const defaultDir = path.join(cfg.chatDir, 'exports');
  const out = args.out && args.out !== true ? path.resolve(process.cwd(), String(args.out)) : path.join(defaultDir, 'chat-history.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (path.dirname(out) === defaultDir) {
    // Exports are generated files with the whole history inside: keep them out of git.
    const gi = path.join(defaultDir, '.gitignore');
    if (!fs.existsSync(gi)) fs.writeFileSync(gi, '# generated by visual-chat-history: exports stay local\n*\n');
  }
  const rawBase = path.relative(path.dirname(out), cfg.chatDir).split(path.sep).join('/');
  fs.writeFileSync(out, pageHtml('export', data, rawBase ? rawBase + '/' : ''), 'utf8');
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`Wrote ${out} (${kb} KB): ${data.entries.length} entries in ${data.sessions.length} sessions. Open it in a browser; no server needed.`);
  return 0;
}

async function summary(cfg) {
  const P = await loadParser(cfg.root);
  const data = buildData(P, cfg);
  console.log(`root ${cfg.root}`);
  console.log(`chat dir ${cfg.chatDir}`);
  for (const s of data.sources) console.log(`  source ${s.name} (${s.kind}): ${s.entries} entries, ${s.added} new after dedupe`);
  console.log(`${data.entries.length} entries in ${data.sessions.length} sessions`);
  for (const s of data.sessions) console.log(`  ${s.id}: ${s.count} (${s.start || 'undated'} to ${s.end || ''})${s.hasFile ? '' : ' [no session file]'}`);
  if (data.sessionsFolder.exists) console.log(`sessions/ folder ${data.sessionsFolder.stale ? 'is OUT OF DATE (run split-sessions.mjs)' : 'is up to date'}`);
  for (const w of data.warnings) console.log(`warning: ${w}`);
  return 0;
}

// ---------------------------------------------------------------- main

const HELP = `visual-chat-history: a local web viewer for .chat-history/

  serve    run in this terminal (Ctrl+C stops it)
  start    run in the background, windowless (Windows: Start-Process -WindowStyle Hidden)
  stop     stop the viewer on --port (only if that port is this viewer)
  status   is it running, and where
  export   write one self-contained HTML file (default .chat-history/exports/chat-history.html)
  summary  print what the viewer would show

  --port N (default ${DEFAULT_PORT}, env VISUAL_CHAT_HISTORY_PORT)   --root DIR   --dir DIR
  --source FILE[,FILE]   --out FILE (export)   --open (serve/start)`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'serve';
  if (args.help || cmd === 'help') { console.log(HELP); return 0; }
  const cfg = resolveConfig(args);
  switch (cmd) {
    case 'serve': await serve(cfg); return null;
    case 'start': return start(cfg);
    case 'stop': return stop(cfg);
    case 'status': return status(cfg);
    case 'export': return exportHtml(cfg, args);
    case 'summary': return summary(cfg);
    default: console.error(`Unknown command: ${cmd}\n\n${HELP}`); return 2;
  }
}

main().then((code) => { if (typeof code === 'number') process.exitCode = code; }, (e) => { console.error(e && e.stack || e); process.exitCode = 1; });
