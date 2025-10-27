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

// --- Lógica para el Registro del Service Worker ---
// Esto debe hacerse siempre, independientemente del botón de instalar.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.error('❌ Error al registrar el Service Worker:', error);
      });
  });
}

// --- Evento opcional para saber cuándo la app fue instalada ---
window.addEventListener('appinstalled', () => {
    console.log('✅ ¡Gracias por instalar nuestra aplicación!');
    // Aquí podrías, por ejemplo, ocultar el botón de instalar si aún fuera visible.
    const installButton = document.getElementById('btnInstalar');
    if (installButton) {
        installButton.style.display = 'none';
    }
})