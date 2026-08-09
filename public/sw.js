// Minimal hand-rolled service worker (no Workbox/next-pwa dependency —
// Next.js 16 builds with Turbopack by default and fails on a custom webpack
// config, which is how most PWA plugins inject themselves; a plain SW file
// avoids that conflict entirely).
//
// Every route in this app is dynamic and per-tenant (auth-gated, scoped to
// the signed-in user's property via RLS) — there is no HTML/RSC payload
// that's ever safe to cache-and-reuse across requests, let alone across
// users on a shared browser. An earlier version of this file cache-first'd
// *all* GET requests, including Next.js's client-side RSC navigation
// fetches, and it served genuinely wrong pages as a result (e.g. landing
// on /rooms after navigating to /guests) — caught by live testing, not by
// the build passing. Lesson: "the build succeeded" says nothing about
// runtime caching correctness.
//
// Strategy now: only content-hashed static assets are cached (cache-first,
// safe because their URL changes when their content does). Everything else
// — every page navigation, every RSC data fetch — is network-only. Offline
// support is limited to: the static shell can still render, and a failed
// navigation falls back to /offline. True offline *usage* (reading cached
// data, queuing writes) is unbuilt — see PROJECT.md §5.

const CACHE_NAME = "stay-static-cache-v2";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.webmanifest", "/icons/icon.svg"];

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else — RSC data fetches, any future API calls — network
  // only. Do not cache, do not fall back to a stale response.
});
