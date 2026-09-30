/* Tempero: service worker para funcionar sem internet */
const VERSION = 'tempero-v3'
const IMAGES = 'tempero-img'
const VOICE = 'tempero-voz'
const SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== IMAGES && k !== VOICE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Páginas: rede primeiro, cópia em cache para abrir offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  // Fotos das receitas: cache primeiro
  if (url.hostname === 'images.unsplash.com') {
    event.respondWith(
      caches.open(IMAGES).then(async (c) => {
        const hit = await c.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok || res.type === 'opaque') c.put(req, res.clone())
        return res
      }),
    )
    return
  }

  // Motor da voz (WebAssembly): cache primeiro, para a leitura funcionar sem internet
  if (
    (url.hostname === 'cdnjs.cloudflare.com' && url.pathname.includes('/onnxruntime-web/')) ||
    (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/piper-wasm'))
  ) {
    event.respondWith(
      caches.open(VOICE).then(async (c) => {
        const hit = await c.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) c.put(req, res.clone())
        return res
      }),
    )
    return
  }

  // JS, CSS, fontes e ícones do próprio site
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(VERSION).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
  }
})
