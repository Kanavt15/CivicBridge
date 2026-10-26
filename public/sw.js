/* Cache only the generic offline screen and public app icons. Never cache
   accounts, API responses, RSC payloads, documents, or submitted form data. */
const CACHE = "civicbridge-public-shell-v1";
const PUBLIC_ASSETS = ["/offline.html", "/icons/app-192.png", "/icons/app-512.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PUBLIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("civicbridge-public-shell-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.search && PUBLIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  } else if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        async () =>
          (await caches.match("/offline.html")) ||
          new Response("Reconnect to use CivicBridge.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          }),
      ),
    );
  }
});
