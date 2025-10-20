(async () => {
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) { location.href = 'login.html'; return; }

    function hexToRgb(hex){const n=hex.replace('#','');const big=parseInt(n.length===3?n.split('').map(c=>c+c).join(''):n.slice(0,6),16);return{r:(big>>16)&255,g:(big>>8)&255,b:big&255};}
    function toHex(n){return n.toString(16).padStart(2,'0');}
    function mixWithWhite(hex,t=0.88){const{r,g,b}=hexToRgb(hex);const rr=Math.round(r+(255-r)*t),gg=Math.round(g+(255-g)*t),bb=Math.round(b+(255-b)*t);return`#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;}
    function showToast(msg, type='info', ms=2600){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.className=`toast toast--${type} is-visible`;t.hidden=false;clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>{t.classList.remove('is-visible');t.hidden=true;},ms);}


    // PEGA ESTA NUEVA FUNCIÓN AL PRINCIPIO DE TU SCRIPT

// ==========================================================
// ===== FUNCIÓN DE SEGURIDAD PARA VALIDAR ARCHIVOS =====
// ==========================================================
function validateFile(file) {
  // Regla 1: Definimos los tipos de archivo permitidos (tipos MIME)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  // Regla 2: Definimos el tamaño máximo en Megabytes (MB)
  const MAX_SIZE_MB = 2;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; // Convertimos a bytes

  // Verificación de Tipo
  if (!allowedTypes.includes(file.type)) {
    toast(`Tipo de archivo no permitido. Solo se aceptan imágenes.`, 'error');
    return false; // El archivo es rechazado
  }

  // Verificación de Tamaño
  if (file.size > MAX_SIZE_BYTES) {
    toast(`El archivo es demasiado grande. El máximo es de ${MAX_SIZE_MB} MB.`, 'error');
    return false; // El archivo es rechazado
  }

  // Si pasa todas las pruebas, es aceptado
  return true; 
}
// ==========================================================

    const logoInput   = document.getElementById('logoInput');
    const logoPreview = document.getElementById('logoPreview');
    const bgInput     = document.getElementById('bgInput');
    const bgThumb     = document.getElementById('bgThumb');
    const bizNameEl   = document.getElementById('bizName');
    const colorPicker = document.getElementById('colorPicker');
    const hexInput    = document.getElementById('hexInput');

    const { data: biz } = await sb.from('businesses').select('*').eq('user_id', u.user.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();

    if (biz) {
      bizNameEl.value = biz.business_name || '';
      const brand = biz.brand || '#DD338B';
      colorPicker.value = brand; hexInput.value = brand;
      document.documentElement.style.setProperty('--brand', brand);
      const rgb = hexToRgb(brand);
      document.documentElement.style.setProperty('--brand-rgb', `${rgb.r} ${rgb.g} ${rgb.b}`);
      const pastel = biz.bg_pastel || mixWithWhite(brand,0.88);
      document.documentElement.style.setProperty('--bg', pastel);
      if (biz.logo_url)  logoPreview.src = biz.logo_url;
      if (biz.cover_url) {
        bgThumb.style.backgroundImage = `url('${biz.cover_url}')`;
        bgThumb.textContent = '';
      }
    }

    // CÓDIGO CORREGIDO PARA EL LOGO
logoInput?.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;

  // --- ¡LÍNEAS DE SEGURIDAD AÑADIDAS! ---
  if (!validateFile(file)) {
    e.target.value = null; // Limpia el input si el archivo es inválido
    logoPreview.src = biz?.logo_url || './assets/logo.svg'; // Revierte a la imagen anterior o por defecto
    return; 
  }
  // ------------------------------------

  // Si el archivo es válido, mostramos la vista previa
  logoPreview.src = URL.createObjectURL(file);
});

    // CÓDIGO CORREGIDO PARA EL FONDO
bgInput?.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) {
    bgThumb.style.backgroundImage = biz?.cover_url ? `url('${biz.cover_url}')` : '';
    bgThumb.textContent = biz?.cover_url ? '' : 'Sin imagen';
    return;
  }
  
  // --- ¡LÍNEAS DE SEGURIDAD AÑADIDAS! ---
  if (!validateFile(file)) {
    e.target.value = null; // Limpia el input si el archivo es inválido
    // Revierte a la imagen anterior o por defecto
    bgThumb.style.backgroundImage = biz?.cover_url ? `url('${biz.cover_url}')` : '';
    bgThumb.textContent = biz?.cover_url ? '' : 'Sin imagen';
    return;
  }
  // ------------------------------------
  
  // Si el archivo es válido, mostramos la vista previa
  bgThumb.style.backgroundImage = `url('${URL.createObjectURL(file)}')`; 
  bgThumb.textContent = ''; 
});

    const setThemeColor = (hex) => {
      if (!/^#([0-9a-f]{3,8})$/i.test(hex)) return;
      document.documentElement.style.setProperty('--brand', hex);
      const rgb = hexToRgb(hex);
      document.documentElement.style.setProperty('--brand-rgb', `${rgb.r} ${rgb.g} ${rgb.b}`);
      document.documentElement.style.setProperty('--bg', mixWithWhite(hex, 0.88));
    };
    colorPicker.addEventListener('input', e=>{ const v=e.target.value.toUpperCase(); hexInput.value=v; setThemeColor(v); });
    hexInput.addEventListener('input', e=>{ const v=e.target.value.trim(); setThemeColor(v); if(/^#([0-9a-f]{3,8})$/i.test(v)) colorPicker.value=v; });

    // GUARDAR
    document.querySelector('.actions .btn').addEventListener('click', async (ev) => {
      ev.preventDefault();

      let logo_url  = biz?.logo_url  ?? null;
      let cover_url = biz?.cover_url ?? null;

      // Subir logo si hay archivo nuevo
      if (logoInput?.files?.[0]) {
        const file = logoInput.files[0];
        const path = `${u.user.id}/logo_${Date.now()}_${file.name}`;
        const { error: upErr } = await sb.storage.from('logos').upload(path, file, { upsert: true });
        if (!upErr) {
          const { data: pub } = sb.storage.from('logos').getPublicUrl(path);
          logo_url = pub.publicUrl;
        } else { console.error('Error uploading logo:', upErr); }
      }

      // Subir cover si hay archivo nuevo
      if (bgInput?.files?.[0]) {
        const file = bgInput.files[0];
        const path = `${u.user.id}/cover_${Date.now()}_${file.name}`;
        const { error: upErr } = await sb.storage.from('covers').upload(path, file, { upsert: true });
        if (!upErr) {
          const { data: pub } = sb.storage.from('covers').getPublicUrl(path);
          cover_url = pub.publicUrl;
        } else { console.error('Error uploading cover:', upErr); }
      }

      const brand  = (hexInput.value || '#DD338B').toUpperCase();
      const pastel = mixWithWhite(brand, 0.88);

      try {
        const payload = {
          user_id: u.user.id,
          business_name: bizNameEl.value.trim() || 'Mi negocio',
          brand,
          bg_pastel: pastel,
          logo_url,
          cover_url,
          updated_at: new Date().toISOString()
        };

        const { error: dbErr } = await sb.from('businesses').upsert(payload, { onConflict: 'user_id' });
        if (dbErr) throw dbErr;

        showToast('¡Tu agenda se guardó con éxito!', 'success', 1200);
        setTimeout(() => location.href = 'agenda.html', 900);
      } catch (err) {
        console.error(err);
        showToast(err.message || 'No pudimos guardar tu agenda.', 'error', 3600);
      }
    });

    document.getElementById('loader').classList.add('hidden');
  })();