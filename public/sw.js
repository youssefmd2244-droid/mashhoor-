// Offline-first service worker.
//
// Strategy: "network-with-timeout, falling back to cache" for same-origin
// GET requests, plus a small allow-list of safe cross-origin static assets
// (Google Fonts) so the site still looks right — correct fonts, no
// layout shift — when the visitor has no connection at all.
//
// GOAL (per owner request): the very first time someone opens the site
// they need an internet connection, but every visit after that should
// keep working even with no connection — no spinner, no blank page, no
// "freeze" waiting on a dead network call.
//
// How that's achieved:
//   1. On install, we eagerly pre-cache the app shell (the HTML entry
//      point + manifest) so there is always *something* to fall back to,
//      even if the visitor's first-ever visit never fully finished
//      loading every asset.
//   2. Every other same-origin file (JS/CSS bundles, images you host,
//      etc.) gets cached opportunistically the first time it's
//      requested — which happens automatically the first time the site
//      loads successfully. From then on it's available offline too.
//   3. On repeat visits we race the network against a short timeout, so
//      a slow/dead connection can never block the page for more than
//      NETWORK_TIMEOUT_MS — we just serve the cached copy instead and
//      quietly update the cache in the background if/when the network
//      call does eventually finish.
//   4. If a page navigation isn't cached for some reason (e.g. very
//      first visit, offline, mid-way through), we fall back to the
//      cached app shell ("/") so the visitor still sees the site shell
//      instead of the browser's own offline error page.
const CACHE_NAME = 'restaurant-site-v2';
const NETWORK_TIMEOUT_MS = 5000; // repeat visits: never wait longer than this for the network
const FIRST_LOAD_TIMEOUT_MS = 5000; // first visit: no cache to fall back to, but still capped at 5s max

// Known ahead of time, safe to cache unconditionally on install.
const APP_SHELL = ['/', '/manifest.webmanifest'];

// Cross-origin hosts it's safe to cache (static, content-hashed or
// long-lived — won't go stale in a way that matters). Everything else
// cross-origin (WhatsApp links, Supabase/Firebase calls, etc.) is left
// alone and always goes straight to the network, same as before.
const CACHEABLE_CROSS_ORIGIN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function fetchWithTimeout(req, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(req, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function handleRequest(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);

  const networkPromise = fetchWithTimeout(req, cached ? NETWORK_TIMEOUT_MS : FIRST_LOAD_TIMEOUT_MS)
    .then((res) => {
      // Only cache genuinely OK responses (skip opaque/error responses).
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });

  if (!cached) {
    // Nothing to fall back to — network is the only option, capped
    // at FIRST_LOAD_TIMEOUT_MS so it fails fast instead of hanging.
    try {
      return await networkPromise;
    } catch {
      // Totally offline on a first-ever visit: hand back the app shell
      // if we managed to precache it, instead of a bare connection error.
      return (await cache.match('/')) || Response.error();
    }
  }

  // We have a cached copy: race it against the network so a slow
  // connection never blocks the page for more than NETWORK_TIMEOUT_MS.
  const timeoutFallback = new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT_MS));
  return Promise.race([networkPromise.catch(() => cached), timeoutFallback]);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  const isSameOrigin = url.origin === self.location.origin;
  const isCacheableCrossOrigin = CACHEABLE_CROSS_ORIGIN_HOSTS.includes(url.hostname);
  if (!isSameOrigin && !isCacheableCrossOrigin) return; // let the browser handle it normally

  // SPA navigation fallback: if this is a page navigation and everything
  // above fails to produce a usable response, still try the cached shell
  // as a last resort so the visitor sees the app instead of a dead tab.
  if (req.mode === 'navigate') {
    event.respondWith(
      handleRequest(req).catch(async () => (await caches.match('/')) || Response.error())
    );
    return;
  }

  event.respondWith(handleRequest(req));
});
