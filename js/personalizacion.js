// js/personalizacion.js (VERSIÓN FINAL Y ROBUSTA)

(async () => {
    // 1. VERIFICACIÓN DE SESIÓN CON GUARDIÁN (Como ya lo tenías, perfecto)
    const user = await protectPage();
    if (!user) return; // Si no hay usuario, el guardián ya nos redirigió.
    const userId = user.id;

    // --- Referencias a los elementos del DOM (Asegúrate de que los IDs coincidan con tu HTML) ---
    const form = document.querySelector('form.form'); // Usamos un selector más genérico por si no tienes ID
    const logoInput = document.getElementById('logoInput');
    const logoPreview = document.getElementById('logoPreview');
    const bgInput = document.getElementById('bgInput');
    const bgThumb = document.getElementById('bgThumb');
    const bizNameEl = document.getElementById('bizName');
    const colorPicker = document.getElementById('colorPicker');
    const hexInput = document.getElementById('hexInput');
    const saveButton = document.querySelector('.actions .btn'); // Seleccionamos el botón de guardar
    const logoPicker = document.querySelector('.logo-picker');

    // --- Funciones de Ayuda (reutilizadas) ---
    function showToast(msg, type = 'info', ms = 3000) { /* ... tu código de showToast ... */ }
    function hexToRgb(hex) { /* ... tu código de hexToRgb ... */ }
    function toHex(n) { /* ... tu código de toHex ... */ }
    function mixWithWhite(hex, t = 0.88) { /* ... tu código de mixWithWhite ... */ }

    // --- Lógica de la página ---
    let biz = null; // Variable para guardar los datos del negocio

    // Conectar clic del logo al input
    if (logoPicker) {
        logoPicker.addEventListener('click', () => logoInput.click());
    }
    
    // Función para validar archivos
    function validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const MAX_SIZE_MB = 2;
        if (!allowedTypes.includes(file.type)) {
            showToast('Tipo de archivo no permitido.', 'error');
            return false;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            showToast(`El archivo es demasiado grande (máx ${MAX_SIZE_MB} MB).`, 'error');
            return false;
        }
        return true;
    }

    // Lógica para las vistas previas de imágenes
    logoInput?.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (!file || !validateFile(file)) return;
        logoPreview.src = URL.createObjectURL(file);
    });

    bgInput?.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (!file || !validateFile(file)) return;
        bgThumb.style.backgroundImage = `url('${URL.createObjectURL(file)}')`;
        bgThumb.textContent = '';
    });

    // Lógica para el selector de color
    const setThemeColor = (hex) => {
        if (!/^#([0-9a-f]{3,8})$/i.test(hex)) return;
        document.documentElement.style.setProperty('--brand', hex);
        const rgb = hexToRgb(hex);
        document.documentElement.style.setProperty('--brand-rgb', `${rgb.r} ${rgb.g} ${rgb.b}`);
        document.documentElement.style.setProperty('--bg', mixWithWhite(hex, 0.88));
    };
    colorPicker.addEventListener('input', e => { const v = e.target.value.toUpperCase(); hexInput.value = v; setThemeColor(v); });
    hexInput.addEventListener('input', e => { const v = e.target.value.trim(); setThemeColor(v); if (/^#([0-9a-f]{3,8})$/i.test(v)) colorPicker.value = v; });

    // --- FUNCIÓN PRINCIPAL PARA CARGAR O CREAR EL PERFIL ---
    async function initializeProfile() {
        // 1. Intentamos cargar el perfil existente
        let { data: existingBiz, error } = await sb.from('businesses').select('*').eq('user_id', userId).single();

        if (existingBiz) {
            biz = existingBiz; // Si existe, lo guardamos
        } else if (error && error.code === 'PGRST116') {
            // 2. Si NO existe, lo creamos con valores por defecto
            console.log('Perfil no encontrado, creando uno nuevo...');
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 15);
            const { data: newBiz, error: createError } = await sb
                .from('businesses')
                .insert({
                    user_id: userId,
                    business_name: 'Mi negocio',
                    brand: '#DD338B',
                    bg_pastel: '#FBE7F1',
                    subscription_status: 'trial',
                    current_period_ends_at: trialEndDate.toISOString()
                }).select().single();

            if (createError) throw new Error("No pudimos crear tu perfil. Contacta a soporte.");
            
            biz = newBiz; // Guardamos el nuevo perfil
            showToast('¡Tu cuenta ha sido activada!', 'success');
        } else {
            // Cualquier otro error es grave
            throw error;
        }

        // 3. Rellenamos el formulario con los datos de 'biz' (ya sea el cargado o el nuevo)
        bizNameEl.value = biz.business_name || '';
        const brand = biz.brand || '#DD338B';
        colorPicker.value = brand; hexInput.value = brand; setThemeColor(brand);
        if (biz.logo_url) logoPreview.src = biz.logo_url;
        if (biz.cover_url) {
            bgThumb.style.backgroundImage = `url('${biz.cover_url}')`;
            bgThumb.textContent = '';
        }
    }

    // --- LÓGICA PARA GUARDAR LOS CAMBIOS ---
    saveButton.addEventListener('click', async (ev) => {
        ev.preventDefault();
        saveButton.disabled = true;
        saveButton.textContent = 'Guardando...';

        try {
            let logo_url = biz?.logo_url ?? null;
            let cover_url = biz?.cover_url ?? null;

            // Subir logo (ahora usa 'userId' en lugar de 'u.user.id')
            if (logoInput?.files?.[0]) {
                const file = logoInput.files[0];
                const path = `${userId}/logo_${Date.now()}`;
                const { error: upErr } = await sb.storage.from('logos').upload(path, file, { upsert: true });
                if (upErr) throw upErr;
                const { data: pub } = sb.storage.from('logos').getPublicUrl(path);
                logo_url = pub.publicUrl;
            }

            // Subir fondo (ahora usa 'userId')
            if (bgInput?.files?.[0]) {
                const file = bgInput.files[0];
                const path = `${userId}/cover_${Date.now()}`;
                const { error: upErr } = await sb.storage.from('covers').upload(path, file, { upsert: true });
                if (upErr) throw upErr;
                const { data: pub } = sb.storage.from('covers').getPublicUrl(path);
                cover_url = pub.publicUrl;
            }

            const brand = (hexInput.value || '#DD338B').toUpperCase();
            const payload = {
                user_id: userId,
                business_name: bizNameEl.value.trim() || 'Mi negocio',
                brand,
                bg_pastel: mixWithWhite(brand, 0.88),
                logo_url,
                cover_url,
                updated_at: new Date().toISOString()
            };

            const { error: dbErr } = await sb.from('businesses').upsert(payload, { onConflict: 'user_id' });
            if (dbErr) throw dbErr;

            showToast('¡Perfil guardado!', 'success', 1500);
            setTimeout(() => location.href = 'agenda.html', 1200);

        } catch (err) {
            console.error("Error al guardar:", err);
            showToast(err.message || 'No se pudo guardar.', 'error');
            saveButton.disabled = false;
            saveButton.textContent = 'Guardar y continuar';
        }
    });

    // --- EJECUCIÓN INICIAL ---
    // Llamamos a la función principal para cargar los datos en cuanto la página esté lista.
    initializeProfile().catch(err => {
        console.error("Error al inicializar el perfil:", err);
        showToast('Error crítico al cargar el perfil.', 'error', 5000);
    });

})();