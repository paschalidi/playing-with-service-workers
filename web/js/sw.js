"use strict";

const version = 16;
const cacheName = `tversionName-${version}`;

const urlsToCache = {
  loggedOut: [
    "/",
    "/about",
    "/contact",
    "/404",
    "/login",
    "/offline",
    "/css/style.css",
    "/js/blog.js",
    "/js/home.js",
    "/js/login.js",
    "/js/add-post.js",
    "/js/external/idb-keyval-iife.min.js",
    "/images/logo.gif",
    "/images/offline.png"
  ]
};

self.addEventListener("install", () => {
  console.log(`version is ${version}. ISNTALLING`);
  self.skipWaiting();
});

self.addEventListener("activate", async e => {
  await clearCaches();
  await cacheLoggedFiles(/*forceReload=*/ true);
  await clients.claim();
  console.log(`Service Worker (v${version}) activated`);
});

self.addEventListener("message", onMessage);
self.addEventListener("fetch", e => {
  e.respondWith(router(e.request));
});

async function router(request) {
  console.log("@@@@@FETCHING");
  console.log(request);
  var url = new URL(request.url);
  var requestURL = url.pathname;
  var cache = await caches.open(cacheName);
  let res;

  // here is where we define the fetch fallbacks.
  if (url.origin == location.origin) {
    try {
      let options = {
        method: request.method,
        headers: request.headers,
        credentials: "omit",
        cache: "no-store"
      };
      res = await fetch(request.url, options);
      await cache.put(requestURL, res.clone());
      if (res && res.ok) {
        return res;
      }
    } catch (e) { console.error(e); }

    res = await cache.match(requestURL);
    if (res) {
      return res.clone();
    }
  }
  // todo figure out cors requests
}

main().catch(console.error);

async function main() {
  console.log(`version is ${version}. STARTING`);
  await sendMessage({ requestStatusUpdate: true });
  await cacheLoggedFiles();
}

async function sendMessage(message) {
  var allClients = await clients.matchAll({ includeUncontrolled: true });
  return Promise.all([
    allClients.map(client => {
      var channel = new MessageChannel();
      channel.port1.onmessage = onMessage;
      return client.postMessage(message, [channel.port2]);
    })
  ]);
}

function onMessage({ data }) {
  if ("statusUpdate" in data) {
    const { isOnline, isLoggedIn } = data.statusUpdate;

    console.log(
      `SERVIE WORKER ${version} STATUS UPDATE. isOnline:${isOnline}, isLoggedIn:${isLoggedIn}`
    );
  }
}

async function clearCaches() {
  var cacheNames = await caches.keys();
  var oldCacheNames = cacheNames.filter(function matchOldCache(cacheName) {
    var [, cacheNameVersion] = cacheName.match(/^tversionName-(\d+)$/) || [];
    cacheNameVersion =
      cacheNameVersion != null ? Number(cacheNameVersion) : cacheNameVersion;
    return cacheNameVersion > 0 && version !== cacheNameVersion;
  });
  await Promise.all(
    oldCacheNames.map(function deleteCache(cacheName) {
      return caches.delete(cacheName);
    })
  );
}

async function cacheLoggedFiles(forceReload = false) {
  const cache = await caches.open(cacheName);

  return Promise.all([
    urlsToCache.loggedOut.map(async url => {
      try {
        let res;
        if (!forceReload) {
          res = await cache.match(url);
          if (res) {
            return;
          }
        }

        let options = {
          method: "GET",
          credentials: "omit",
          cache: "no-cache"
        };

        res = await fetch(url, options);
        if (res.ok) {
          await cache.put(url, res);
        }
      } catch (error) {}
    })
  ]);
}
