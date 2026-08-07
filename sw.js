const CACHE='lcexpress-v10-auth-20260807';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const EXTERNAL=[
'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js',
'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(CORE);for(const u of EXTERNAL){try{await c.add(u)}catch{}}await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith((async()=>{const cached=await caches.match(e.request);if(cached)return cached;try{const resp=await fetch(e.request);const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp}catch{return (await caches.match('./index.html'))||Response.error()}})())});
