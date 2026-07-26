/* ==========================================================
   sw.js — Mimeo Data
   Strategy:
   - Network First: luôn ưu tiên tải file mới từ server.
   - Nếu mất mạng thì mới dùng cache.
   - Tự xóa cache cũ khi cập nhật phiên bản.
   ========================================================== */

const CACHE_NAME = "mimeo-data-v4";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.css",

  "./js/gate.js",
  "./js/firebase-config.js",
  "./js/cloudinary.js",
  "./js/storage.js",
  "./js/search.js",
  "./js/ui.js",
  "./js/app.js",

  "./assets/khung.png",
  "./assets/nut-list.png",
  "./assets/nut-them-data.png",
  "./assets/nut-luu-tru.png",
  "./assets/nut-thoat.png",
  "./assets/mimeovideo.mp4",

  "./icons/favicon.ico",
  "./icons/icon-192.png",
  "./icons/icon-512.png",

  "./manifest.json"
];

/* ---------- INSTALL ---------- */

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

/* ---------- ACTIVATE ---------- */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

/* ---------- FETCH ---------- */

self.addEventListener("fetch", (event) => {

  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== location.origin) return;

  event.respondWith(

    fetch(request)
      .then((response) => {

        if (response && response.status === 200) {

          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });

        }

        return response;

      })
      .catch(() => {

        return caches.match(request);

      })

  );

});
