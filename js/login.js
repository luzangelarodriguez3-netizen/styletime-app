 // Avisos reutilizables (usa tus estilos .toast del CSS)
  function showToast(msg, type = 'info', ms = 2600){
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast toast--${type} is-visible`;
    t.hidden = false;
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      t.classList.remove('is-visible');
      t.hidden = true;
    }, ms);
  }

  // Usa los IDs REALES del formulario y campos
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;

    if (!email || !password) {
      showToast('Escribe tu correo y contraseña.', 'error', 2800);
      return;
    }

    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        showToast('Credenciales inválidas. Revisa tu correo/contraseña.', 'error', 3200);
        return;
      }

      // Sesión OK ⇒ ¿tiene negocio?
      const { data: u } = await sb.auth.getUser();
      const { data: biz } = await sb
        .from('businesses')
        .select('*')
        .eq('user_id', u.user.id)
        .maybeSingle();

      showToast('¡Bienvenido! Redirigiendo…', 'success', 1000);
      setTimeout(() => {
        location.href = biz ? 'agenda.html' : 'personalizacion.html';
      }, 900);

    } catch (err) {
      showToast(err?.message || 'No pudimos iniciar sesión. Intenta de nuevo.', 'error', 3600);
    }
  });