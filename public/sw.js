self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', () => {
  // Pass-through directo para garantizar datos financieros y votos en tiempo real
  return;
});