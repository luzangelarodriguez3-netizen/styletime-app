// --- INICIO: LISTENER PARA ACTIVACIÓN INMEDIATA BAJO DEMANDA ---
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});



// sw.js - Versión con Caching

// 1. Definimos el nombre y la versión de nuestro caché.
// CADA VEZ QUE HAGAS UN CAMBIO IMPORTANTE EN TU APP, CAMBIA EL NÚMERO (v1.1, v1.2, etc.)
const CACHE_NAME = 'styletime-cache-v1.0';

// 2. Esta es la lista de archivos fundamentales de tu aplicación (el "App Shell").
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

// 3. Evento 'install': Se dispara cuando el Service Worker se instala por primera vez.
self.addEventListener('install', event => {
  console.log('✅ Service Worker: Instalando...');
  // Esperamos hasta que todos nuestros archivos estén en el caché.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Service Worker: Abriendo caché y guardando el App Shell.');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
    // Ya no hacemos nada aquí, solo esperamos
  })
  );
});

// 4. Evento 'activate': Se dispara cuando el nuevo Service Worker se activa.
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activado.');
  // Limpiamos los cachés viejos que no coincidan con el CACHE_NAME actual.
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('✅ Service Worker: Limpiando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Le dice al SW que tome el control de la página inmediatamente.
  return self.clients.claim();
});

// 5. Evento 'fetch': Se dispara CADA VEZ que la app pide un recurso (una página, una imagen, etc.).
self.addEventListener('fetch', event => {
  // Ignoramos las peticiones que no son GET (como las de Supabase para guardar datos).
  if (event.request.method !== 'GET') {
    return;
  }

  // Estrategia: Cache First (Primero Caché)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si encontramos el archivo en el caché, lo devolvemos INMEDIATAMENTE.
        if (cachedResponse) {
          return cachedResponse;
        }
        // Si no está en el caché, vamos a la red a buscarlo.
        return fetch(event.request);
      })
  );
});