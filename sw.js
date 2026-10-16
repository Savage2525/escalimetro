/* Escalímetro: guarda a app no dispositivo para funcionar sem rede.
   Para publicar uma versão nova, mude o número em VERSAO. */
const VERSAO = 'escalimetro-v2';
const FICHEIROS = [
  './', 'index.html', 'manifest.webmanifest',
  'pdf.min.js', 'pdf.worker.min.js', 'pdf-lib.min.js',
  'jost-300.woff2', 'jost-400.woff2', 'jost-500.woff2',
  'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO)
    .then(c => c.addAll(FICHEIROS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    /* abre logo a cópia guardada; com rede, atualiza-a em segundo plano */
    e.respondWith(caches.open(VERSAO).then(async c => {
      const guardada = (await c.match('index.html')) || (await c.match('./'));
      const rede = fetch(req).then(r => { if (r && r.ok) c.put('index.html', r.clone()); return r; }).catch(() => null);
      if (guardada) { e.waitUntil(rede); return guardada; }
      return (await rede) || new Response('<h1>Sem ligação</h1><p>Abra o Escalímetro uma vez com internet.</p>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
