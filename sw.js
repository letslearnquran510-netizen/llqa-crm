/* LLQA CRM (v82) — keeps the CRM's own files on this computer so the page opens without waiting for the network.
   The page comes from here at once and is fetched again in the background; when it has changed (a new version), the
   page is told and loads it as before. Files with a version in their address (src/...?v=...) never change, so they
   are kept. Google, the libraries and everything else are left alone. A page published with the words
   "llqa-sw-off" in it switches this off (the files are dropped and this worker removes itself). */
const CACHE = "llqa-app-v1";
const SCOPE = new URL(self.registration.scope);
const PAGE = SCOPE.href;
const stamps = (html) => new Set((String(html).match(/\?v=(\d+)/g) || []).map((m) => m.slice(3)));
let dead = false; // switched off: everything goes to the network, nothing is kept
const off = async () => {
  dead = true;
  (await self.clients.matchAll({ type: "window" })).forEach((w) => w.postMessage({ llqa: "off" }));
  await caches.delete(CACHE);
  await self.registration.unregister();
};
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      const r = await fetch(PAGE, { cache: "no-store" });
      if (!r.ok) return;
      const html = await r.clone().text();
      if (/llqa-sw-off/.test(html)) return;
      await c.put(PAGE, r);
      const files = [...new Set((html.match(/src="(src\/[^"]+\?v=\d+)"/g) || []).map((m) => m.slice(5, -1)))];
      await Promise.all(files.map((f) => { const u = new URL(f, SCOPE).href; return fetch(u, { cache: "no-store" }).then((x) => (x.ok ? c.put(u, x) : null)).catch(() => null); }));
    })()
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
const page = async (e, url) => {
  const c = await caches.open(CACHE);
  const net = (async () => {
    const r = await fetch(PAGE, { cache: "no-store" });
    if (!r.ok) return r;
    const html = await r.clone().text();
    if (/llqa-sw-off/.test(html)) {
      await off();
      return r;
    }
    const old = await c.match(PAGE);
    const was = old ? await old.text() : "";
    await c.put(PAGE, r.clone());
    if (was && was !== html) (await self.clients.matchAll({ type: "window" })).forEach((w) => w.postMessage({ llqa: "new" }));
    return r;
  })();
  if (!url.searchParams.has("fresh")) {
    const hit = await c.match(PAGE);
    if (hit) {
      e.waitUntil(net.catch(() => {}));
      return hit;
    }
  }
  try {
    return await net;
  } catch (x) {
    const hit = await c.match(PAGE);
    if (hit) return hit;
    throw x;
  }
};
const file = async (req) => {
  if (dead) return fetch(req);
  const c = await caches.open(CACHE);
  const hit = await c.match(req.url);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok) c.put(req.url, r.clone());
  return r;
};
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (dead || req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  if (url.searchParams.has("vc")) return; // the new-version check: always the network
  if (req.mode === "navigate" && (url.pathname === SCOPE.pathname || url.pathname === SCOPE.pathname + "index.html")) return e.respondWith(page(e, url));
  if (url.searchParams.has("v") && url.pathname.startsWith(SCOPE.pathname + "src/")) return e.respondWith(file(req));
});
// a page has loaded: files of versions the kept page no longer names are dropped
self.addEventListener("message", (e) => {
  if (!e.data || e.data.llqa !== "loaded") return;
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      const pg = await c.match(PAGE);
      if (!pg) return;
      const keep = stamps(await pg.text());
      for (const k of await c.keys()) {
        const u = new URL(k.url);
        if (u.searchParams.has("v") && !keep.has(u.searchParams.get("v"))) await c.delete(k);
      }
    })().catch(() => {}),
  );
});
