const CACHE_NAME = 'controle-despesas-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Só leituras (GET) passam pelo cache; envios e o OneSignal (notificações) seguem direto pra rede.
  if (e.request.method !== 'GET' || url.hostname.includes('onesignal')) return;
  // Nunca cachear as chamadas à planilha (Apps Script) — sempre buscar dados frescos da rede.
  if (url.hostname.includes('script.google.com')) return;
  // Para o resto (a casca do app), tenta a rede primeiro e cai pro cache se estiver offline.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
