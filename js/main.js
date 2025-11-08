// --- INICIO: REGISTRO DE SERVICE WORKER CON ACTUALIZACIÓN AUTOMÁTICA ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Añadimos el parámetro de versión para romper la caché
    navigator.serviceWorker.register('/sw.js?v=1.1')
      .then(registration => {
        console.log('✅ Service Worker registrado.');
      })
      .catch(error => {
        console.error('❌ Error al registrar el Service Worker:', error);
      });

    // Esta parte es CRÍTICA: Recarga la página cuando el nuevo SW toma el control.
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      console.log('🔄 Nuevo Service Worker activado. Recargando página...');
      window.location.reload();
      refreshing = true;
    });
  });
}
// --- FIN: REGISTRO ---