// 주역점 앱 Service Worker
// TWA/PWA Lighthouse 품질 기준 충족용

const CACHE_NAME = 'juyeok-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/data.js',
  '/hyosa_data.js',
  '/img/logo.png',
  '/img/front.png',
  '/img/back.png',
  '/img/background.png',
  '/img/icons/icon-192.png',
  '/img/icons/icon-512.png'
];

// 설치: 정적 파일 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리: Network-first (Supabase API), Cache-first (정적 파일)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Supabase API, 외부 CDN은 항상 네트워크 우선
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('jsdelivr.net') ||
      url.hostname.includes('vercel.app')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 정적 파일: 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
