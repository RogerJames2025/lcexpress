const CACHE='lcexpress-v10.9.6';
const CORE=['/','/index.html','/manifest.webmanifest','/icon-192.png','/icon-512.png'];
const EXTERNAL=[
'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js',
'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];
async function cacheBuiltAssets(cache){
  try{
    const r=await fetch('/index.html',{cache:'reload'});
    if(r.ok){
      await cache.put('/index.html',r.clone());
      const text=await r.text(),urls=new Set();
      for(const m of text.matchAll(/(?:src|href)=["']([^"'#]+)["']/g)){
        try{const u=new URL(m[1],self.location.origin);if(u.origin===self.location.origin)urls.add(u.pathname+u.search)}catch{}
      }
      for(const u of urls){try{const a=await fetch(u,{cache:'reload'});if(a.ok)await cache.put(u,a.clone())}catch{}}
    }
  }catch{}
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  for(const u of CORE){try{await cache.add(u)}catch{}}
  for(const u of EXTERNAL){try{await cache.add(u)}catch{}}
  await cacheBuiltAssets(cache);
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  const cache=await caches.open(CACHE);await cacheBuiltAssets(cache);await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request,isNav=req.mode==='navigate';
  if(isNav){
    event.respondWith((async()=>{try{const fresh=await fetch(req,{cache:'reload'}),cache=await caches.open(CACHE);if(fresh.ok)cache.put('/index.html',fresh.clone());return fresh}catch{return(await caches.match('/index.html'))||Response.error()}})());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(req);
    const net=fetch(req).then(async r=>{if(r&&r.ok){const cache=await caches.open(CACHE);cache.put(req,r.clone())}return r}).catch(()=>null);
    return cached||await net||Response.error();
  })());
});