
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

// 1. Declarar una variable para guardar el evento de instalación
let deferredPrompt; 

// 2. Escuchar el evento 'beforeinstallprompt'
window.addEventListener('beforeinstallprompt', (e) => {
  // Previene que Chrome 67 y anteriores muestren el prompt automáticamente
  e.preventDefault();
  
  // Guarda el evento para que pueda ser disparado más tarde.
  deferredPrompt = e;
  
  // Muestra nuestro botón de instalación personalizado
  const btnInstalar = document.getElementById('btnInstalar');
  if (btnInstalar) {
    btnInstalar.style.display = 'block'; // O 'flex', 'inline-block', etc., según tu CSS
  }
});

// 3. Añadir un listener al clic de nuestro botón
const btnInstalar = document.getElementById('btnInstalar');
if (btnInstalar) {
  btnInstalar.addEventListener('click', async () => {
    // Asegurarnos de que el evento de instalación esté disponible
    if (deferredPrompt) {
      // Muestra el prompt de instalación
      deferredPrompt.prompt();
      
      // Espera a que el usuario responda al prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`El usuario respondió al prompt: ${outcome}`);
      
      // Ya no necesitaremos el evento guardado, lo limpiamos
      deferredPrompt = null;
      
      // Ocultamos el botón porque ya no se puede usar
      btnInstalar.style.display = 'none';
    }
  });
}

// (Aquí puede ir el resto de tu código, como el registro del Service Worker)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('Service Worker registrado con éxito:', registration))
      .catch(registrationError => console.log('Fallo en el registro del Service Worker:', registrationError));
  });
}