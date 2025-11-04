

// --- INICIO: REGISTRO INTELIGENTE DE SERVICE WORKER CON ACTUALIZACIÓN ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ Service Worker registrado inicialmente.');
        // Esta función se ejecuta cada vez que la página carga.
        reg.addEventListener('updatefound', () => {
          // Se ha encontrado una nueva versión del Service Worker en el servidor.
          const newWorker = reg.installing;
          console.log('ℹ️ Service Worker: Nueva versión encontrada, instalando...');
          
          newWorker.addEventListener('statechange', () => {
            // El estado del nuevo worker ha cambiado.
            // Si ya está instalado y esperando, es hora de notificar al usuario.
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ Service Worker: Nueva versión lista para activar.');
              
              // ¡HAY UNA ACTUALIZACIÓN! Mostramos un mensaje simple.
              const confirmUpdate = confirm('¡Hay una nueva versión de StyleTime disponible! ¿Actualizar ahora?');
              
              if (confirmUpdate) {
                // Le enviamos un mensaje al nuevo Service Worker para que se active sin esperar.
                newWorker.postMessage({ action: 'skipWaiting' });
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ Error al registrar el Service Worker:', error);
      });

    // Esta parte es CRÍTICA: Recarga la página cuando el nuevo SW toma el control.
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Evita un bucle infinito de recargas.
      if (refreshing) return;
      console.log('🔄 Service Worker: Controlador cambiado, recargando página...');
      window.location.reload();
      refreshing = true;
    });
  });
}
// --- FIN: REGISTRO INTELIGENTE ---
