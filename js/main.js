if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ Service Worker registrado:', reg))
      .catch(err => console.error('❌ Error registrando SW:', err));
  });
}

//Registrar el service worker//

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.querySelector('#btnInstalar');
  btn.style.display = 'block';

  btn.addEventListener('click', async () => {
    btn.style.display = 'none';
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    console.log('Instalación:', result.outcome);
    deferredPrompt = null;
  });
});

window.addEventListener('appinstalled', () => {
  console.log('✅ Aplicación instalada correctamente');
});