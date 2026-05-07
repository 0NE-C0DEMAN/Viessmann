// Lightweight service worker for the Viessmann PWA.
// Network-first for API and HTML; cache-first for static assets.
const CACHE = "viessmann-v1";
const STATIC = ["/", "/login", "/signup", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API: network-first, no cache
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Static assets (next chunks, fonts, images): cache-first
  if (url.pathname.startsWith("/_next/") || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2?)$/)) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }),
      ),
    );
    return;
  }

  // HTML: stale-while-revalidate
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req)),
  );
});
