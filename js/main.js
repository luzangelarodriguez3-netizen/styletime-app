// main.js - VERSIÓN FINAL Y LIMPIA

// --- Lógica para el Botón de "Instalar" (PWA) ---
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenimos que el navegador muestre el banner de instalación por defecto
  e.preventDefault();
  // Guardamos el evento para poder usarlo más tarde
  deferredPrompt = e;
  
  // Buscamos tu botón de instalar y lo hacemos visible
  const installButton = document.getElementById('btnInstalar'); // Asegúrate de que tu botón tenga este ID
  if (installButton) {
    installButton.style.display = 'block';

    // Añadimos el evento de clic al botón
    installButton.addEventListener('click', async () => {
      // Ocultamos nuestro botón, ya que el prompt se va a mostrar
      installButton.style.display = 'none';
      // Mostramos el prompt de instalación nativo del navegador
      deferredPrompt.prompt();
      // Esperamos a que el usuario tome una decisión
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Resultado de la instalación: ${outcome}`);
      // Limpiamos el prompt, ya que solo se puede usar una vez
      deferredPrompt = null;
    });
  }
});

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
// --- Evento opcional para saber cuándo la app fue instalada ---
window.addEventListener('appinstalled', () => {
    console.log('✅ ¡Gracias por instalar nuestra aplicación!');
    // Aquí podrías, por ejemplo, ocultar el botón de instalar si aún fuera visible.
    const installButton = document.getElementById('btnInstalar');
    if (installButton) {
        installButton.style.display = 'none';
    }
})