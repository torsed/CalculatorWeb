/* Minimal service worker for offline calculator use.
 *
 * Cache version bumped on every change to `ASSET_PATHS`. Bumping `CACHE_NAME`
 * forces the browser to drop the old cache and re-fetch the current
 * index.html, so new pages/files appear without manual cache wipe.
 *
 * Пути заданы относительно scope воркера, а не от корня домена: так приложение
 * работает и по адресу http://localhost:8787/, и в подпапке GitHub Pages
 * (https://<user>.github.io/<repo>/).
 */
const CACHE_NAME = 'cw-v8';
const ASSET_PATHS = [
  '.',
  'index.html',
  'manifest.json',
  'src/icons/icon-192.png',
  'src/icons/icon-512.png',
  'src/styles/app.css',
  'src/styles/tokens.css',
  'src/core/format.js',
  'src/core/parser.js',
  'src/core/numtheory.js',
  'src/core/stats.js',
  'src/core/matrix.js',
  'src/core/solver.js',
  'src/core/polynomial.js',
  'src/core/analysis.js',
  'src/core/datetime.js',
  'src/core/probdist.js',
  'src/core/prog.js',
  'src/core/linsystem.js',
  'src/i18n/i18n.js',
  'src/i18n/locales/common.js',
  'src/i18n/locales/units.js',
  'src/i18n/locales/calc.js',
  'src/i18n/locales/graph.js',
  'src/i18n/locales/conv.js',
  'src/i18n/locales/stats.js',
  'src/i18n/locales/matrix.js',
  'src/i18n/locales/numtheory.js',
  'src/i18n/locales/solver.js',
  'src/i18n/locales/analysis.js',
  'src/i18n/locales/date.js',
  'src/i18n/locales/phys.js',
  'src/i18n/locales/chem.js',
  'src/i18n/locales/geom.js',
  'src/i18n/locales/finance.js',
  'src/i18n/locales/util.js',
  'src/i18n/locales/prob.js',
  'src/i18n/locales/prog.js',
  'src/i18n/locales/gen.js',
  'src/i18n/locales/core-parser.js',
  'src/i18n/locales/core-numtheory.js',
  'src/i18n/locales/core-matrix.js',
  'src/i18n/locales/core-polynomial.js',
  'src/i18n/locales/core-solver.js',
  'src/i18n/locales/core-stats.js',
  'src/i18n/locales/core-analysis.js',
  'src/i18n/locales/core-datetime.js',
  'src/i18n/locales/core-linsystem.js',
  'src/state/history.js',
  'src/ui/calcState.js',
  'src/ui/calcView.js',
  'src/ui/graphView.js',
  'src/ui/app.js',
  'src/ui/pages/helpers.js',
  'src/ui/pages/conv.js',
  'src/ui/pages/stats.js',
  'src/ui/pages/matrix.js',
  'src/ui/pages/numtheory.js',
  'src/ui/pages/solver.js',
  'src/ui/pages/analysis.js',
  'src/ui/pages/date.js',
  'src/ui/pages/phys.js',
  'src/ui/pages/chem.js',
  'src/ui/pages/geom.js',
  'src/ui/pages/finance.js',
  'src/ui/pages/util.js',
  'src/ui/pages/prob.js',
  'src/ui/pages/prog.js',
  'src/ui/pages/gen.js',
  'src/ui/bootstrap.js',
  'src/ui/sw-register.js',
];
// scope заканчивается на «/», поэтому new URL('.', scope) даёт корень подпапки.
const ASSETS = ASSET_PATHS.map(p => new URL(p, self.registration.scope).href);

self.addEventListener('install', e => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      // Кэшируем по одному файлу: один недоступный ассет не должен ломать
      // всю установку service worker (base для приложения некритичен).
      .then(cache => Promise.all(ASSETS.map(url => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting())
  );
});

// Drop caches from older versions so a renamed/moved file stops being served.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e => {
  // OWASP / PWA best practice: only cache same-origin assets + allowed external APIs
  const url = new URL(e.request.url);
  const allowedExternal = ['open.er-api.com'];
  const isSameOrigin = url.origin === self.location.origin;
  const isAllowedExternal = allowedExternal.some(host => url.hostname === host);
  if (!isSameOrigin && !isAllowedExternal) {
    return; // do not intercept or cache unexpected external requests
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Cache-first for assets, network-first for navigation (HTML) so the
      // latest index.html wins.
      const isHtml =
        e.request.mode === 'navigate' ||
        (e.request.headers.get('accept') || '').includes('text/html');
      if (cached && !isHtml) {
        // stale-while-revalidate: отдаём кэш сразу, а свежую копию
        // подтягиваем в фоне для следующего запуска.
        const refresh = fetch(e.request)
          .then(resp => {
            if (resp && resp.ok) {
              const copy = resp.clone();
              return caches
                .open(CACHE_NAME)
                .then(cache => cache.put(e.request, copy))
                .catch(() => undefined);
            }
          })
          .catch(() => undefined);
        e.waitUntil(refresh);
        return cached;
      }
      return fetch(e.request)
        .then(resp => {
          const copy = resp.clone();
          caches
            .open(CACHE_NAME)
            .then(cache => cache.put(e.request, copy))
            .catch(() => undefined);
          return resp;
        })
        .catch(() => cached || new Response('', { status: 504 }));
    })
  );
});
