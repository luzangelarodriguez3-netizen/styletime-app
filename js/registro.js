
(async () => {
    await sb.auth.signOut();



// ===== NUEVA LÓGICA PARA EL CHECKBOX Y EL BOTÓN =====
    const termsCheckbox = document.getElementById('termsCheck');
    const registerButton = document.getElementById('registerBtn');
    
    // Deshabilitamos el botón al inicio
    registerButton.disabled = true;

    // Escuchamos los cambios en el checkbox
    termsCheckbox.addEventListener('change', () => {
      registerButton.disabled = !termsCheckbox.checked;
    });
    // =======================================================

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

    function prettyError(err){
      const m = (err?.message || '').toLowerCase();
      if (m.includes('already registered')) return 'Ese correo ya tiene una cuenta.';
      if (m.includes('password')) return 'La contraseña es muy corta (mínimo 6).';
      if (m.includes('invalid email')) return 'El correo no es válido.';
      return err?.message || 'No pudimos crear tu cuenta.';
    }

    const form = document.getElementById('signupForm');
    const msg  = document.getElementById('signupMsg');

 // ===== REEMPLAZA TU addEventListener CON ESTA VERSIÓN SIMPLIFICADA =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const registerButton = document.getElementById('registerBtn');
  registerButton.disabled = true;
  registerButton.textContent = 'Procesando...';

  const email = document.getElementById('email').value.trim();
  const pass  = document.getElementById('password').value;
  // ... (mantén tus validaciones de contraseña, etc. aquí si quieres) ...

  try {
    const { error } = await sb.auth.signUp({ email, password: pass });
    if (error) throw error;

    // ÉXITO: Mostramos el mensaje y dejamos el botón desactivado.
    msg.textContent = '¡Listo! Revisa tu bandeja de entrada y haz clic en el enlace de confirmación para continuar.';
    showToast('Correo de confirmación enviado', 'success', 5000);

  } catch (err) {
    const m = prettyError(err);
    showToast(m, 'error', 3600);
    msg.textContent = m;
    registerButton.disabled = false; // Reactivamos el botón solo si hay un error
    registerButton.textContent = 'Crear cuenta';
  }
});

    })();