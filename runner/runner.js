#!/usr/bin/env node
// LLQA CRM — 24/7 runner (for the VPS).
//
// 1. Keeps one Super Admin tab of the CRM open around the clock
//    (index.html?runner=1), so the automatic work — teacher-leave cover,
//    Fee Status, clock changes, leave starts — happens with nobody signed in.
//    The CRM tab writes a heartbeat; people's own tabs see it and leave that
//    work to the runner (and show what it did).
// 2. Watches itself: signs in again if signed out, reloads if the heartbeat
//    stops or saving keeps failing, restarts the browser if it crashes or
//    hangs, and starts fresh once a day.
// 3. Receives inquiries from the website (POST /lead) and puts them into the
//    CRM as Leads. An inquiry is written to a small queue on disk first, so
//    none is lost while the CRM tab is (re)starting.
//
// Run:  node runner.js            (config.json next to this file)
// Health: GET http://127.0.0.1:8787/health
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const HERE = __dirname;
const CFG_FILE = process.env.LLQA_RUNNER_CONFIG || path.join(HERE, 'config.json');
const CFG = Object.assign(
  {
    crmUrl: 'https://letslearnquran510-netizen.github.io/llqa-crm/index.html',
    adminPassword: '', // the Super Admin password (blank while it is unchanged)
    port: 8787,
    host: '127.0.0.1', // Caddy / nginx in front for HTTPS; '0.0.0.0' to expose directly
    allowedOrigins: ['https://letslearnquran.net', 'https://www.letslearnquran.net'],
    leadToken: '', // optional: other servers post with header X-LLQA-Token
    checkEverySec: 60,
    freshStartHours: 24,
    headless: true,
    dataDir: path.join(HERE, 'data'),
  },
  fs.existsSync(CFG_FILE) ? JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')) : {},
);
fs.mkdirSync(CFG.dataDir, { recursive: true });
const QUEUE = path.join(CFG.dataDir, 'leads-queue.json');
const log = (...a) => console.log(new Date().toISOString(), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error((what || 'step') + ' took over ' + ms / 1000 + ' s')), ms))]);

/* ---------------- the CRM tab ---------------- */
let browser = null;
let page = null;
let startedAt = 0;
let opening = null;
let saveErrorSince = 0;
const status = { state: 'starting', since: new Date().toISOString(), restarts: 0, leadsIn: 0, leadsSaved: 0 };

async function signIn() {
  const role = await withTimeout(page.evaluate(() => (typeof LLQAApp !== 'undefined' && LLQAApp.ctx.user && LLQAApp.ctx.user.role) || ''), 20000, 'reading the user');
  if (role === 'superadmin') return;
  await page.getByText('Super Admin', { exact: true }).first().click({ timeout: 30000 });
  await sleep(800);
  if (CFG.adminPassword) await page.locator('input[type="password"]').first().fill(String(CFG.adminPassword));
  await page.getByText('Sign In as Super Admin').click({ timeout: 15000 });
  await page.waitForFunction(() => LLQAApp.ctx.user && LLQAApp.ctx.user.role === 'superadmin', null, { timeout: 30000 });
  log('signed in as Super Admin');
}

async function open(why) {
  if (opening) return opening;
  opening = (async () => {
    if (why) log('opening the CRM — ' + why);
    try {
      if (browser) await withTimeout(browser.close(), 15000, 'closing the browser').catch(() => {});
    } catch (e) {}
    browser = await chromium.launch({ headless: CFG.headless, args: ['--disable-dev-shm-usage', '--no-first-run'] });
    browser.on('disconnected', () => {
      if (status.state !== 'stopping') {
        status.state = 'browser closed';
        log('browser closed — it will be restarted');
      }
    });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    page = await ctx.newPage();
    page.on('pageerror', (e) => log('CRM error:', String(e.message || e).slice(0, 300)));
    page.on('crash', () => {
      status.state = 'crashed';
      log('CRM tab crashed — it will be restarted');
    });
    page.on('dialog', (d) => d.accept().catch(() => {})); // a confirm() in automatic work is answered "OK"
    page.on('popup', (p) => p.close().catch(() => {})); // never leave WhatsApp / print windows open
    const url = CFG.crmUrl + (CFG.crmUrl.includes('?') ? '&' : '?') + 'runner=1&nc=' + Date.now();
    await page.goto(url, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => typeof LLQAApp !== 'undefined' && typeof LLQA_RUNNER !== 'undefined', null, { timeout: 90000 });
    const isRunner = await page.evaluate(() => LLQA_RUNNER === true);
    if (!isRunner) throw new Error('this CRM version has no runner mode (v67.3 or newer is needed)');
    await sleep(5000);
    await signIn();
    startedAt = Date.now();
    saveErrorSince = 0;
    status.state = 'ok';
    status.restarts++;
    status.version = await page.evaluate(() => window.__LLQA_VERSION__);
    log('CRM open: ' + status.version);
  })();
  try {
    await opening;
  } finally {
    opening = null;
  }
}

async function check() {
  try {
    if (!browser || !browser.isConnected() || !page || page.isClosed() || status.state === 'crashed' || status.state === 'browser closed') throw new Error(status.state || 'no CRM tab');
    const st = await withTimeout(
      page.evaluate(() => {
        const s = (typeof LLQASync !== 'undefined' && LLQASync.get && LLQASync.get()) || {};
        const r = (LLQAApp.ctx && LLQAApp.ctx.runnerInfo) || {};
        return { version: window.__LLQA_VERSION__, role: (LLQAApp.ctx.user && LLQAApp.ctx.user.role) || '', mode: s.mode || '', waiting: s.pending || 0, saveError: s.writeError || '', beat: r.at || '', stale: (typeof LLQAUI !== 'undefined' && LLQAUI.stale) || '' };
      }),
      30000,
      'the health check',
    );
    if (st.role !== 'superadmin') await signIn();
    const up = Date.now() - startedAt;
    const beatAge = st.beat ? Date.now() - Date.parse(st.beat) : null;
    // the tab writes a heartbeat every 2 minutes
    if (up > 7 * 60e3 && (beatAge == null || beatAge > 7 * 60e3)) throw new Error('no heartbeat for 7 minutes');
    if (st.saveError) {
      if (!saveErrorSince) saveErrorSince = Date.now();
      if (Date.now() - saveErrorSince > 15 * 60e3) throw new Error('saving has failed for 15 minutes (' + st.saveError + ')');
    } else saveErrorSince = 0;
    if (up > CFG.freshStartHours * 3600e3) {
      await open('daily fresh start');
      return;
    }
    Object.assign(status, { state: 'ok', ...st, beatAgeSec: beatAge == null ? null : Math.round(beatAge / 1000), checkedAt: new Date().toISOString() });
  } catch (e) {
    log('check failed: ' + e.message + ' — restarting');
    status.state = 'restarting';
    status.lastError = e.message;
    try {
      await open('restart');
    } catch (e2) {
      log('restart failed: ' + e2.message);
      status.state = 'down';
    }
  }
}

/* ---------------- website inquiries → Leads ---------------- */
const readQueue = () => {
  try {
    return JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
  } catch (e) {
    return [];
  }
};
const writeQueue = (q) => {
  fs.writeFileSync(QUEUE + '.tmp', JSON.stringify(q));
  fs.renameSync(QUEUE + '.tmp', QUEUE);
};
let draining = false;
async function drain() {
  if (draining || status.state !== 'ok' || !page) return;
  draining = true;
  try {
    for (;;) {
      const item = readQueue()[0];
      if (!item) break;
      const r = await withTimeout(page.evaluate((x) => (typeof llqaLeadIntake === 'function' ? llqaLeadIntake(x) : { error: 'old CRM version' }), item.lead), 20000, 'saving a lead').catch((e) => ({ error: e.message }));
      // (the queue is read again: the website may have added inquiries meanwhile)
      const q = readQueue();
      if (!r || !r.ok) {
        if (!q.length) break;
        q[0].tries = (q[0].tries || 0) + 1;
        q[0].lastError = (r && r.error) || 'unknown';
        if (q[0].tries < 200) {
          writeQueue(q);
          break; // tried again on the next round
        }
        log('lead given up after 200 tries: ' + JSON.stringify(q[0].lead).slice(0, 200));
      } else {
        status.leadsSaved++;
        log('lead saved' + (r.duplicate ? ' (a note on the open lead)' : '') + ': ' + (item.lead.parent || item.lead.name) + (r.family ? ' — already a family: ' + r.family : ''));
      }
      q.shift();
      writeQueue(q);
    }
  } finally {
    draining = false;
  }
}
const hits = new Map(); // ip → recent post times
const limited = (ip) => {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60e3);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 6; // at most 6 inquiries per 10 minutes from one address
};
const FIELDS = ['name', 'parent', 'phone', 'email', 'country', 'state', 'course', 'message', 'source', 'wantDay', 'wantTime', 'referredBy'];
const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  const allowed = CFG.allowedOrigins.includes(origin);
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (allowed) Object.assign(headers, { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-LLQA-Token' });
  const send = (code, obj) => {
    res.writeHead(code, headers);
    res.end(JSON.stringify(obj));
  };
  const url = (req.url || '').split('?')[0];
  if (req.method === 'OPTIONS') return send(allowed ? 204 : 403, {});
  if (req.method === 'GET' && url === '/health') return send(status.state === 'ok' ? 200 : 503, { ok: status.state === 'ok', ...status, queued: readQueue().length });
  if (req.method !== 'POST' || url !== '/lead') return send(404, { error: 'not found' });
  const tokenOk = !!CFG.leadToken && req.headers['x-llqa-token'] === CFG.leadToken;
  if (!allowed && !tokenOk) return send(403, { error: 'not allowed' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (!tokenOk && limited(ip)) return send(429, { error: 'too many requests — please try again later' });
  let body = '';
  req.on('data', (c) => {
    body += c;
    if (body.length > 16384) req.destroy();
  });
  req.on('end', () => {
    let x = {};
    try {
      x = /json/i.test(req.headers['content-type'] || '') ? JSON.parse(body || '{}') : Object.fromEntries(new URLSearchParams(body));
    } catch (e) {
      return send(400, { error: 'unreadable' });
    }
    if (x.website) return send(200, { ok: true }); // the hidden field only robots fill in
    const lead = {};
    FIELDS.forEach((k) => {
      if (x[k] != null) lead[k] = String(x[k]).slice(0, k === 'message' ? 1000 : 120);
    });
    const digits = String(lead.phone || '').replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return send(400, { error: 'Please enter a WhatsApp / phone number with the country code.' });
    if (!lead.name && !lead.parent) return send(400, { error: "Please enter the student's or parent's name." });
    const q = readQueue();
    q.push({ at: new Date().toISOString(), ip, lead });
    writeQueue(q);
    status.leadsIn++;
    send(200, { ok: true });
    drain().catch(() => {});
  });
});

/* ---------------- start ---------------- */
(async () => {
  log('LLQA runner starting — ' + CFG.crmUrl);
  server.listen(CFG.port, CFG.host, () => log('listening on ' + CFG.host + ':' + CFG.port + ' (/lead, /health)'));
  for (;;) {
    try {
      await open('start');
      break;
    } catch (e) {
      log('could not open the CRM: ' + e.message + ' — trying again in 60 s');
      await sleep(60000);
    }
  }
  setInterval(() => check().then(drain).catch(() => {}), CFG.checkEverySec * 1000);
  setInterval(() => drain().catch(() => {}), 15000);
  const stop = async () => {
    status.state = 'stopping';
    log('stopping');
    try {
      if (browser) await browser.close();
    } catch (e) {}
    process.exit(0);
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
})();
