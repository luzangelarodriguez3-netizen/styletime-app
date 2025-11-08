// sw.js - Versión Final con Actualización Automática

// 1. Definimos el nombre y la versión de nuestro caché.
// ¡ESTA ES LA LÍNEA MÁS IMPORTANTE! CADA VEZ QUE HAGAS UN CAMBIO,
// INCREMENTA EL NÚMERO DE VERSIÓN (ej. v1.1, v1.2, etc.).
const CACHE_NAME = 'styletime-cache-v1.0';

// 2. Esta es la lista de archivos fundamentales de tu aplicación (el "App Shell").
// Asegúrate de que todas las rutas sean correctas.
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/registro.html',
  '/personalizacion.html',
  '/configuracion.html',
  '/agenda.html',
  '/servicios.html',
  '/horarios.html',
  '/reserva.html',
  '/css/main.css',
  '/js/main.js',
  '/js/login.js',
  '/js/registro.js',
  '/js/personalizacion.js',
  '/js/configuracion.js',
  '/js/agenda.js',
  '/supabaseClient.js',
  '/assets/logo.svg',
  '/assets/hojas.svg'
];

// 3. Evento 'install': Se dispara cuando el Service Worker se instala.
self.addEventListener('install', event => {
  console.log('✅ Service Worker: Instalando nueva versión...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Service Worker: Guardando App Shell en caché.');
        return cache.addAll(urlsToCache);
      })
      // ¡ORDEN CLAVE! Le decimos al nuevo SW que no espere y se prepare para activarse.
      .then(() => self.skipWaiting())
  );
});

// 4. Evento 'activate': Se dispara cuando el nuevo Service Worker se activa.
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activando nueva versión.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Si encontramos un caché con un nombre diferente al actual, lo borramos.
          if (cacheName !== CACHE_NAME) {
            console.log('✅ Service Worker: Limpiando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // ¡ORDEN CLAVE! Le dice al SW que tome el control de todas las pestañas abiertas inmediatamente.
  return self.clients.claim();
});

// 5. Evento 'fetch': Intercepta todas las peticiones de la aplicación.
self.addEventListener('fetch', event => {
  // Ignoramos las peticiones que no son GET.
  if (event.request.method !== 'GET') {
    return;
  }

  // Estrategia: Cache First (Primero intenta servir desde la caché).
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si el archivo está en la caché, lo devolvemos.
        if (cachedResponse) {
          return cachedResponse;
        }
        // Si no, vamos a la red a buscarlo.
        return fetch(event.request);
      })
  );
});