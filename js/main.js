
    if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => console.log('Service Worker registrado con éxito:', registration))
      .catch(error => console.log('Fallo en el registro del Service Worker:', error));
  });
}


// ------------------------------
// Botón para instalar la PWA
// ------------------------------

let deferredPrompt; // Variable global

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Evita que aparezca el aviso automático
  deferredPrompt = e; // Guarda el evento para usarlo después
  const installBtn = document.getElementById('installBtn');
  installBtn.style.display = 'block'; // Muestra el botón

  installBtn.addEventListener('click', async () => {
    installBtn.style.display = 'none';
    deferredPrompt.prompt(); // Muestra el diálogo nativo de instalación
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`El usuario eligió: ${outcome}`);
    deferredPrompt = null;
  });
});

// Oculta el botón si la app ya está instalada
window.addEventListener('appinstalled', () => {
  console.log('La app ha sido instalada correctamente 🎉');
  const installBtn = document.getElementById('installBtn');
  if (installBtn) installBtn.style.display = 'none';
});