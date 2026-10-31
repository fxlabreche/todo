const C = 'todo-v4';
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

// La page elle-même (index.html) : toujours la version la plus récente quand il y a du réseau,
// la copie en cache seulement hors ligne. Autres fichiers (polices, icônes, librairie) : cache d'abord.
// Les appels à Supabase (autre domaine) ne passent pas par ici.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html');
  if (isPage) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(r => {
          if (r && r.ok) { const copy = r.clone(); caches.open(C).then(c => c.put('index.html', copy)); }
          return r;
        })
        .catch(() => caches.match('index.html').then(h => h || caches.match('./')))
    );
    return;
  }
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
