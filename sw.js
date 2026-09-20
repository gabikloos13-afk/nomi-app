const CACHE_NAME='nomi-shell-v2-2';
const STATIC_ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest',
  './offline.html',
  './nomi-192-v2.png',
  './nomi-512-v2.png',
  './nomi-maskable-512-v2.png'
];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(STATIC_ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith('nomi-')&&k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/config.js')||url.pathname.endsWith('/index.html')||request.mode==='navigate'){
    event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>caches.match('./offline.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});
