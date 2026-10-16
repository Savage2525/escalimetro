/* Escalímetro: guarda a app no dispositivo para funcionar sem rede.
   Para publicar uma versão nova, mude o número em VERSAO. */
const VERSAO = 'escalimetro-v1';
const FICHEIROS = [
  './', 'index.html', 'manifest.webmanifest',
  'pdf.min.js', 'pdf.worker.min.js', 'pdf-lib.min.js',
  'jost-300.woff2', 'jost-400.woff2', 'jost-500.woff2',
  'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(FICHEIROS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    /* página: tenta a rede (para receber atualizações) e cai para a cópia guardada */
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put('index.html', c)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
