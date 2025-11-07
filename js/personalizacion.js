// js/personalizacion.js (VERSIÓN FINAL Y ESTRUCTURADA)

// 1. Envolvemos todo en una función principal async para controlar el flujo.
async function initializePage() {

    // 2. PRIMERA BARRERA: Verificamos la sesión. Nada ocurre hasta que esto termine.
    const user = await protectPage();
    if (!user) return; // Si no hay usuario, el script se detiene aquí.
    const userId = user.id;

    // --- 3. Referencias a TODOS los elementos del DOM ---
    const form = document.querySelector('form.form');
    const logoInput = document.getElementById('logoInput');
    const logoPreview = document.getElementById('logoPreview');
    const bgInput = document.getElementById('bgInput');
    const bgThumb = document.getElementById('bgThumb');
    const bizNameEl = document.getElementById('bizName');
    const colorPicker = document.getElementById('colorPicker');
    const hexInput = document.getElementById('hexInput');
    const saveButton = form.querySelector('button'); // Botón dentro del form
    const logoPicker = document.querySelector('.logo-picker');
    const toast = document.getElementById('toast');
    
    // --> ¡CLAVE! Deshabilitamos el botón hasta que todo esté cargado y listo.
    saveButton.disabled = true;
    saveButton.textContent = 'Cargando...';

    // --- 4. Definición de TODAS las funciones de ayuda ---
    // Estas funciones ahora están disponibles para todo el script.
    function showToast(msg, type = 'info', ms = 3000) {
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `toast toast--${type} is-visible`;
        toast.hidden = false;
        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => { toast.classList.remove('is-visible') }, ms);
    }
    function hexToRgb(hex) { const n = hex.replace('#', ''); const big = parseInt(n.length === 3 ? n.split('').map(c => c + c).join('') : n.slice(0, 6), 16); return { r: (big >> 16) & 255, g: (big >> 8) & 255, b: big & 255 }; }
    function mixWithWhite(hex, t = 0.88) { const { r, g, b } = hexToRgb(hex); const rr = Math.round(r + (255 - r) * t), gg = Math.round(g + (255 - g) * t), bb = Math.round(b + (255 - b) * t); function toHex(n) { return n.toString(16).padStart(2, '0'); } return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`; }
    function validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const MAX_SIZE_MB = 2;
        if (!allowedTypes.includes(file.type)) { showToast('Tipo de archivo no permitido.', 'error'); return false; }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) { showToast(`El archivo es demasiado grande (máx ${MAX_SIZE_MB} MB).`, 'error'); return false; }
        return true;
    }
    const setThemeColor = (hex) => {
        if (!/^#([0-9a-f]{3,6})$/i.test(hex)) return;
        document.documentElement.style.setProperty('--brand', hex);
        const rgb = hexToRgb(hex);
        document.documentElement.style.setProperty('--brand-rgb', `${rgb.r} ${rgb.g} ${rgb.b}`);
        document.documentElement.style.setProperty('--bg', mixWithWhite(hex));
    };

    // --- 5. Cargamos los datos del negocio y poblamos el formulario ---
    let biz = null;
    try {
        let { data: existingBiz, error } = await sb.from('businesses').select('*').eq('user_id', userId).single();
        if (existingBiz) {
            biz = existingBiz;
        } else if (error && error.code === 'PGRST116') {
            const trialEndDate = new Date(); trialEndDate.setDate(trialEndDate.getDate() + 15);
            const { data: newBiz, error: createError } = await sb.from('businesses').insert({ user_id: userId, business_name: 'Mi negocio', brand: '#DD338B', bg_pastel: '#FBE7F1', subscription_status: 'trial', current_period_ends_at: trialEndDate.toISOString() }).select().single();
            if (createError) throw createError;
            biz = newBiz;
            showToast('¡Tu cuenta ha sido activada!', 'success');
        } else {
            throw error;
        }

        // --- 6. POBLAMOS el formulario DESPUÉS de tener los datos ---
        bizNameEl.value = biz.business_name || '';
        const brand = biz.brand || '#DD338B';
        colorPicker.value = brand;
        hexInput.value = brand;
        setThemeColor(brand); // <-- Aplicamos el color INICIAL
        if (biz.logo_url) logoPreview.src = biz.logo_url;
        if (biz.cover_url) {
            bgThumb.style.backgroundImage = `url('${biz.cover_url}')`;
            bgThumb.textContent = '';
        }
        
        // --> ¡CLAVE! Habilitamos el botón SOLO cuando todo está listo.
        saveButton.disabled = false;
        saveButton.textContent = 'Guardar y continuar';

    } catch (err) {
        console.error("Error al cargar el perfil:", err);
        showToast('Error crítico al cargar tu perfil. Refresca la página.', 'error');
        saveButton.textContent = 'Error al Cargar';
    }

    // --- 7. REGISTRAMOS los event listeners DESPUÉS de que todo ha cargado ---
    logoPicker?.addEventListener('click', () => logoInput.click());
    logoInput?.addEventListener('change', e => { const file = e.target.files?.[0]; if (!file || !validateFile(file)) { e.target.value = ''; return; } logoPreview.src = URL.createObjectURL(file); });
    bgInput?.addEventListener('change', e => { const file = e.target.files?.[0]; if (!file || !validateFile(file)) { e.target.value = ''; return; } bgThumb.style.backgroundImage = `url('${URL.createObjectURL(file)}')`; bgThumb.textContent = ''; });
    colorPicker.addEventListener('input', e => { const v = e.target.value.toUpperCase(); hexInput.value = v; setThemeColor(v); });
    hexInput.addEventListener('input', e => { const v = e.target.value.trim(); if (/^#([0-9a-f]{3,6})$/i.test(v)) { colorPicker.value = v; setThemeColor(v); } });

    saveButton.addEventListener('click', async (ev) => {
        ev.preventDefault();
        if (saveButton.disabled) return;
        saveButton.disabled = true;
        saveButton.textContent = 'Guardando...';

        try {
            let logo_url = biz?.logo_url ?? null;
            let cover_url = biz?.cover_url ?? null;

            if (logoInput?.files?.[0]) {
                const file = logoInput.files[0];
                const path = `${userId}/logo_${Date.now()}`;
                await sb.storage.from('logos').upload(path, file, { upsert: true });
                logo_url = sb.storage.from('logos').getPublicUrl(path).data.publicUrl;
            }

            if (bgInput?.files?.[0]) {
                const file = bgInput.files[0];
                const path = `${userId}/cover_${Date.now()}`;
                await sb.storage.from('covers').upload(path, file, { upsert: true });
                cover_url = sb.storage.from('covers').getPublicUrl(path).data.publicUrl;
            }

            const brand = (hexInput.value || '#DD338B').toUpperCase();
            const payload = { user_id: userId, business_name: bizNameEl.value.trim() || 'Mi negocio', brand, bg_pastel: mixWithWhite(brand), logo_url, cover_url, updated_at: new Date().toISOString() };
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
}

// 8. Se llama a la función principal para iniciar todo el proceso.
initializePage();