// Le nom du cache derive du ?v= avec lequel index.html enregistre ce worker (APP_VERSION) :
// une seule source de version pour toute l'app.
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const PREFIX = 'legato-';
const CACHE = PREFIX + 'v' + VERSION;
// polices Google (Noto Music dessine les clés) : gardées d'une version à l'autre, pour marcher hors ligne
const FONTS = PREFIX + 'fonts', FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(
    ASSETS.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => console.warn('[sw] precache ignore', u)))
  )));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Ne supprimer que NOS anciens caches : l'origine github.io est partagee avec les autres applis.
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method === 'GET' && FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }))));
    return;
  }
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
      return r;
    }).catch(() => caches.match('./index.html', { cacheName: CACHE })));
    return;
  }
  e.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then(hit => hit || fetch(req)));
});
