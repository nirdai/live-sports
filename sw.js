// Service Worker בסיסי - מטרתו היחידה היא לאפשר התקנה כאפליקציה (PWA)
// ולתת מסך פתיחה בסיסי גם ללא אינטרנט. הנתונים החיים (ESPN וכו') תמיד
// נשלפים ישירות מהרשת ולא נשמרים כאן, כדי שלא יוצגו נתונים ישנים.

const CACHE_NAME = 'live-sports-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
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
  const req = event.request;

  // רק בקשות GET מאותו מקור (הפורטל עצמו) - לא נוגעים בקריאות API חיצוניות
  // (ESPN, 365scores וכו') כדי שנתוני הספורט תמיד יהיו עדכניים.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
