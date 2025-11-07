// js/auth-guard.js
async function protectPage() {
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) {
    // Si hay error o no hay usuario, redirigir al login.
    // Nos aseguramos de no crear un bucle infinito si ya estamos en esas páginas.
    if (!window.location.pathname.includes('/login.html') && !window.location.pathname.includes('/registro.html')) {
      window.location.replace('/login.html');
    }
    return null;
  }
  // ¡Éxito! Hay un usuario válido. Lo devolvemos.
  return data.user;
}