// Service Worker for ISU Routine App - Offline-Only Fallback
const CACHE_NAME = "isu-routine-cache-v4";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log("Precache error:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Immediately wipe all old or obsolete caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("Deleting old service worker cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. NEVER intercept or cache backend API calls (always query live database)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. NEVER cache Vite internal or dynamic development source files
  if (
    url.pathname.includes("/src/") ||
    url.pathname.includes("/@vite/") ||
    url.pathname.includes("/@id/") ||
    url.pathname.includes("/node_modules/")
  ) {
    return;
  }

  // 3. Network-First strategy: Always fetch live if internet is available.
  // Only fall back to offline cache if network completely fails (no internet).
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If response is valid, update the static cache in background
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Internet is unavailable - retrieve from offline cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html");
          }
          return new Response("Offline - No internet connection", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain" }
          });
        });
      })
  );
});
