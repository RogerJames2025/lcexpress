/* LCexpress: correccion de arranque 10.11.1; no modifica almacenamiento de datos. */
const CACHE = 'lcexpress-v10.11.1-integral-1';
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/lc-config.js'];
const EXTERNAL = [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];
async function network(request, timeout = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(request, {cache:'no-store', signal:controller.signal}); }
  finally { clearTimeout(timer); }
}
async function previousMatch(request) {
  for (const name of (await caches.keys()).reverse()) {
    if (!name.startsWith('lcexpress-') || name === CACHE) continue;
    const response = await (await caches.open(name)).match(request);
    if (response) return response;
  }
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const manifest = await network('/lc-assets.json');
  if (!manifest.ok) throw new Error('Inventario de recursos no disponible');
  const assets = await manifest.json();
  if (!Array.isArray(assets) || !assets.length || assets.some(x => typeof x !== 'string' || !x.startsWith('assets/') || x.includes('..'))) throw new Error('Inventario de recursos invalido');
  // La instalacion no se activa hasta tener el conjunto local completo.
  await cache.addAll([...CORE, ...assets.map(x => '/' + x)].map(x => new Request(new URL(x, self.location.origin), {cache:'reload'})));
  // Un CDN temporalmente inaccesible no debe impedir reparar el arranque online.
  await Promise.allSettled(EXTERNAL.map(async url => {
    const request = new Request(url, {mode:'no-cors'});
    let response;
    try { response = await network(request, 8000); } catch { response = await previousMatch(request); }
    if (response && (response.ok || response.type === 'opaque')) await cache.put(request, response);
  }));
  // Activacion automatica de este parche de reparacion; no borra datos locales.
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting()); });
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || request.headers.has('authorization')) return;
  if (EXTERNAL.includes(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await network(request);
        if (response.ok || response.type === 'opaque') await cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch { return (await previousMatch(request)) || Response.error(); }
    })());
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await network(request);
        if (response.ok || response.status < 500) return response;
      } catch { /* utilizar la copia instalada */ }
      const cache = await caches.open(CACHE);
      return (await cache.match('/index.html')) || new Response('LCexpress: conectese a Internet para cargar la aplicacion.', {status:503, headers:{'Content-Type':'text/plain; charset=utf-8'}});
    })());
    return;
  }
  if (!CORE.includes(url.pathname) && !url.pathname.startsWith('/assets/')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Los assets de Vite tienen nombres versionados. No sustituirlos por HTML.
    if (url.pathname.startsWith('/assets/')) {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await network(request);
        if (response.ok && !response.headers.get('content-type')?.includes('text/html')) {
          await cache.put(request, response.clone()).catch(() => {});
          return response;
        }
        return (await previousMatch(request)) || response;
      } catch { return (await previousMatch(request)) || Response.error(); }
    }
    try { const response = await network(request); if (response.ok) return response; } catch {}
    return (await cache.match(request, {ignoreSearch:true})) || (await previousMatch(request)) || Response.error();
  })());
});
