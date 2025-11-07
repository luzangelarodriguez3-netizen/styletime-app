// js/login.js (VERSIÓN CORREGIDA)
(() => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPass');
    const submitButton = form.querySelector('button[type="submit"]');
    const toast = document.getElementById('toast');

    function showToast(message, type = 'info', ms = 4000) {
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast toast--${type} is-visible`;
        toast.hidden = false;
        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => { toast.classList.remove('is-visible') }, ms);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        submitButton.disabled = true;
        submitButton.textContent = 'Ingresando...';

        try {
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) throw new Error('Por favor, ingresa tu correo y contraseña.');

            const { data, error } = await sb.auth.signInWithPassword({ email, password });

            if (error) throw error; // ¡Lanza el error para que lo capture el catch!

            // ÉXITO: signInWithPassword fue exitoso. Ahora verificamos el perfil.
            const { data: userResponse } = await sb.auth.getUser();
            const { data: biz } = await sb.from('businesses').select('user_id').eq('user_id', userResponse.user.id).single();

            showToast('¡Bienvenid@!', 'success', 1500);
            // Redirige a personalización si no tiene perfil, si no, a la agenda.
            window.location.href = biz ? '/agenda.html' : '/personalizacion.html';

        } catch (err) {
            console.error('Error en el inicio de sesión:', err);
            let friendlyMessage = 'Hubo un problema al iniciar sesión.';
            
            if (err.message.includes('Invalid login credentials')) {
                friendlyMessage = 'Correo o contraseña incorrectos.';
            } else if (err.message.includes('Email not confirmed')) {
                friendlyMessage = 'Tu cuenta no ha sido verificada. Por favor, revisa tu correo.';
            } else {
                friendlyMessage = err.message;
            }
            showToast(friendlyMessage, 'error');

        } finally {
            // Se ejecuta siempre, para reactivar el botón en caso de error.
            submitButton.disabled = false;
            submitButton.textContent = 'Iniciar sesión';
        }
    });
})();