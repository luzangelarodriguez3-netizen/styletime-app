// 🟢 Service Worker básico para habilitar la instalación PWA
self.addEventListener('install', event => {
  console.log('✅ Service Worker: Instalado');
  // Hace que el SW se active de inmediato
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activado');
});

self.addEventListener('fetch', event => {
  // Este evento es necesario para que Chrome detecte la PWA
  // Más adelante aquí se puede agregar caché offline
});