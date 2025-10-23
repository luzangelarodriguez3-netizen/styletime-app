// =======================================
// ✅ REGISTRO DEL SERVICE WORKER
// =======================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js') // ← usa ruta absoluta
      .then(reg => console.log('Service Worker registrado con éxito:', reg))
      .catch(err => console.log('Error al registrar SW:', err));
  });
}

// =======================================
// ✅ LÓGICA DE INSTALACIÓN PWA
// =======================================
let deferredPrompt;
const btnInstalar = document.getElementById('btnInstalar');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('✅ Evento beforeinstallprompt detectado');
  if (btnInstalar) btnInstalar.style.display = 'block';
});

if (btnInstalar) {
  btnInstalar.addEventListener('click', async () => {
    if (!deferredPrompt) {
      alert('⏳ Espera unos segundos y vuelve a intentarlo.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`El usuario respondió: ${outcome}`);

    if (outcome === 'accepted') {
      alert('🎉 ¡App instalada correctamente!');
    } else {
      alert('Instalación cancelada.');
    }

    deferredPrompt = null;
    btnInstalar.style.display = 'none';
  });
}

window.addEventListener('appinstalled', () => {
  console.log('🎊 App instalada');
  if (btnInstalar) btnInstalar.style.display = 'none';
});