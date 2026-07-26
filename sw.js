/* ==========================================================
   sw.js — cache-first service worker for the static app shell.
   Only caches same-origin static files (HTML/CSS/JS/assets/icons).
   Never caches anything from the user's chosen local folder
   (that data never leaves their disk).
   ========================================================== */

const CACHE_NAME = 'mimeo-data-v2';
const SHELL_FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/gate.js',
  './js/firebase-config.js',
  './js/cloudinary.js',
  './js/storage.js',
  './js/search.js',
  './js/ui.js',
  './js/app.js',
  './assets/khung.png',
  './assets/nut-list.png',
  './assets/nut-them-data.png',
  './assets/nut-luu-tru.png',
  './assets/nut-thoat.png',
  './assets/mimeovideo.mp4',
  './assets/backgroundmusic.mp3',
  './assets/Spinningsoundeffect.mp3',
  './icons/favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let Google Fonts etc pass through normally
  event.respondWith(
    fetch(event.request).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return res;
    }).catch(() => caches.match(event.request))
  );
});
