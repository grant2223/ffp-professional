/* FFP PROFESSIONAL — Service Worker (v2)
   Was a verbatim copy of the Passport worker: it precached icons that do not exist on this
   domain and sent notification taps to /ffp-member-dashboard.html, a page that is not here.
   Deliberately CONSERVATIVE. Its only jobs are (a) make the app installable (Android/Chrome require a SW
   with a fetch handler) and (b) cache the static home-screen icons. It NEVER caches HTML or JS, so a Netlify
   deploy is always served fresh — no stale-page bugs. Offline support is intentionally minimal. */
const CACHE = 'ffp-pro-static-v2';
const PRECACHE = [
  '/assets/icons/ffp-pro-192.png',
  '/assets/icons/ffp-pro-512.png',
  '/assets/icons/ffp-pro-180.png',
  '/ffp-pro.webmanifest'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }).catch(function () {}));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  // Cache-first ONLY for our own immutable icon files. Everything else (HTML, JS, CSS, API, images) falls
  // through to the network untouched — guarantees fresh deploys.
  if (url.origin === self.location.origin && url.pathname.indexOf('/assets/icons/') === 0) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          try { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); } catch (e) {}
          return res;
        });
      }).catch(function () { return fetch(req); })
    );
  }
});

/* ── WEB PUSH (v2) ─────────────────────────────────────────────────────────────────────────────
   Show a notification when the backend sends a push, and focus/open the app when it's tapped. The
   payload is JSON: { title, body, url, icon }. Works even when the app is fully closed. */
self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { try { data = { body: event.data && event.data.text() }; } catch (e2) {} }
  var title = data.title || 'FFP Professional';
  var options = {
    body: data.body || '',
    icon: data.icon || '/assets/icons/ffp-pro-192.png',
    badge: '/assets/icons/ffp-pro-32.png',
    data: { url: data.url || '/app' }
  };
  if (data.tag) { options.tag = data.tag; options.renotify = true; }
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/app';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if ('focus' in c) { try { c.navigate(url); } catch (e) {} return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
