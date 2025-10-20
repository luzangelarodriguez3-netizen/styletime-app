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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const businessName = document.getElementById('full_name').value.trim();
      const email = document.getElementById('email').value.trim();
      const pass  = document.getElementById('password').value;
      const pass2 = document.getElementById('confirm').value;

      if (!email || !pass) {
        const m = 'Completa correo y contraseña.';
        showToast(m, 'error', 3000);
        msg.textContent = m;
        return;
      }
      if (pass !== pass2) {
        const m = 'Las contraseñas no coinciden.';
        showToast(m, 'error', 3000);
        msg.textContent = m;
        return;
      }

      try {
        const { error: signUpError } = await sb.auth.signUp({ email, password: pass });
        if (signUpError) {
          const m = prettyError(signUpError);
          showToast(m, 'error', 3600);
          msg.textContent = m;
          return;
        }

        const { data: { session } } = await sb.auth.getSession();
        if (!session) {
          const m = 'Te enviamos un correo para confirmar tu cuenta. Ábrelo y vuelve a iniciar sesión.';
          showToast(m, 'info', 4200);
          msg.textContent = m;
          return;
        }

        // REEMPLAZA EL BLOQUE ANTERIOR CON ESTE:

const { user } = session;

// Calculamos la fecha de fin de la prueba: hoy + 15 días
const trialEndDate = new Date();
trialEndDate.setDate(trialEndDate.getDate() + 15);

const { error: upsertErr } = await sb
  .from('businesses')
  .upsert({
    user_id: user.id,
    business_name: businessName || 'Mi negocio',
    brand: '#DD338B',
    bg_pastel: '#FBE7F1',
    
    // --- NUEVOS CAMPOS AÑADIDOS ---
    subscription_status: 'trial',
    current_period_ends_at: trialEndDate.toISOString()
    // ----------------------------

  }, { onConflict: 'user_id' });

if (upsertErr) throw upsertErr;

        showToast('¡Cuenta creada! Ahora personaliza tu agenda.', 'success', 1400);
        setTimeout(() => location.href = 'personalizacion.html', 1000);
      } catch (err) {
        const m = prettyError(err);
        showToast(m, 'error', 3600);
        msg.textContent = m;
      }
    });