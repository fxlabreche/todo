const C = 'todo-v2';
const FILES = ['./', 'index.html', 'supabase.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'fonts/selawk.woff2', 'fonts/selawkl.woff2', 'fonts/selawksl.woff2', 'fonts/selawksb.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Fichiers de l'appli : cache d'abord, mise à jour en arrière-plan.
// Les appels à Supabase (autre domaine) ne passent pas par ici.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request)
        .then(r => {
          if (r && r.ok) { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); }
          return r;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
