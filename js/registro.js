// js/registro.js (VERSIÓN CORREGIDA)
(() => { // Usamos una IIFE no-async para evitar problemas con 'await' al inicio
    const form = document.getElementById('signupForm');
    const nameInput = document.getElementById('full_name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm');
    const termsCheckbox = document.getElementById('termsCheck');
    const registerButton = document.getElementById('registerBtn');
    const msg = document.getElementById('signupMsg');
    const toast = document.getElementById('toast');

    function showToast(message, type = 'info', ms = 4000) {
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast toast--${type} is-visible`;
        toast.hidden = false;
        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => { toast.classList.remove('is-visible') }, ms);
    }

    // Lógica para habilitar/deshabilitar el botón
    registerButton.disabled = true;
    termsCheckbox.addEventListener('change', () => {
        registerButton.disabled = !termsCheckbox.checked;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // ¡Previene el refresco de página!

        registerButton.disabled = true;
        registerButton.textContent = 'Procesando...';

        try {
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPass = confirmInput.value;

            // VALIDACIONES ANTES de llamar a Supabase
            if (!name || !email || !password) throw new Error('Por favor, completa todos los campos.');
            if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
            if (password !== confirmPass) throw new Error('Las contraseñas no coinciden.');

            // Llamada a Supabase (con el nombre del usuario)
            const { data, error } = await sb.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { full_name: name }
                }
            });

            if (error) throw error;
// ÉXITO
// 1. Mostramos la notificación flotante (toast), que es la que se ve bien.
showToast('¡Listo! Revisa tu correo para confirmar la cuenta.', 'success', 6000); 

// 2. Limpiamos el formulario.
form.reset(); 
termsCheckbox.checked = false;

// 3. ¡AQUÍ ESTÁ EL CAMBIO! Limpiamos el mensaje de abajo para que no muestre nada.
msg.textContent = ''; // Esto limpia cualquier mensaje de error anterior.

        } catch (err) {
            console.error('Error en el registro:', err);
            let friendlyMessage = 'No pudimos crear tu cuenta.';
            if (err.message.includes('already registered')) {
                friendlyMessage = 'Este correo electrónico ya tiene una cuenta. Intenta iniciar sesión.';
            } else {
                friendlyMessage = err.message;
            }
            showToast(friendlyMessage, 'error');
            
            
            // Reactivamos el botón SOLO si hubo un error
            registerButton.disabled = false;
            registerButton.textContent = 'Crear cuenta';
        }
        // No hay 'finally' para que el botón se quede en 'Procesando...' si el registro es exitoso.
    });
})();