// Nyquist service worker, generated at build time by tools/sw-integration.mjs.
// It precaches the whole site, so every TP page, report and Mode DS works
// offline once the site has been opened. Pages: network first (fresh when
// online, cached copy after 3 s or offline); other files: cache first.
const VERSION = '__VERSION__'
const BASE = __BASE__
const FILES = __FILES__
const CACHE = `nyquist-${VERSION}`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('nyquist-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

/** "/a/b" and "/a/b/" are the same page; files keep their name. */
function pageKey(pathname) {
  return pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(pathname) ? pathname : `${pathname}/`
}

function fromCache(key) {
  return caches.match(key, { ignoreSearch: true }).then((hit) => hit || caches.match(BASE))
}

function networkFirst(request, key) {
  return new Promise((resolve) => {
    let settled = false
    const settle = (response) => {
      if (!settled && response) {
        settled = true
        resolve(response)
      }
    }
    const timer = setTimeout(() => fromCache(key).then(settle), 3000)
    fetch(request)
      .then((response) => {
        clearTimeout(timer)
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(key, copy))
        }
        settle(response)
      })
      .catch(() => {
        clearTimeout(timer)
        fromCache(key).then((hit) => settle(hit || Response.error()))
      })
  })
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, pageKey(url.pathname)))
    return
  }
  event.respondWith(caches.match(request, { ignoreSearch: true }).then((hit) => hit || fetch(request)))
})
