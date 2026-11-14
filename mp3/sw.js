const C='mp3star-v1';
const scope=new URL(self.registration.scope);
const norm=u=>{const x=new URL(u);x.search='';x.hash='';if(x.pathname.endsWith('/index.html'))x.pathname=x.pathname.slice(0,-10);return x.href};
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c=>c.add(new Request(norm(scope.href),{cache:'reload'}))).catch(()=>{}));
});
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==location.origin||!u.pathname.startsWith(scope.pathname))return;
  e.respondWith((async()=>{
    const c=await caches.open(C),key=norm(r.url);
    try{
      const res=await Promise.race([fetch(r.url,{cache:'no-store'}),new Promise((_,j)=>setTimeout(()=>j(0),4000))]);
      if(res&&res.ok&&res.type==='basic')c.put(key,res.clone());
      return res;
    }catch(_){
      return (await c.match(key))||(r.mode==='navigate'?await c.match(norm(scope.href)):null)||Response.error();
    }
  })());
});
