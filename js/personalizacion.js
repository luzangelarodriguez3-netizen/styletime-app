(async () => {

  

   // ===== VERIFICACIÓN DE SESIÓN CON GUARDIÁN =====
const user = await protectPage();
if (!user) return; // Si no hay usuario, el guardián ya redirigió.

// Si tu código de personalización necesita el userId, lo defines así:
const userId = user.id;

    function hexToRgb(hex){const n=hex.replace('#','');const big=parseInt(n.length===3?n.split('').map(c=>c+c).join(''):n.slice(0,6),16);return{r:(big>>16)&255,g:(big>>8)&255,b:big&255};}
    function toHex(n){return n.toString(16).padStart(2,'0');}
    function mixWithWhite(hex,t=0.88){const{r,g,b}=hexToRgb(hex);const rr=Math.round(r+(255-r)*t),gg=Math.round(g+(255-g)*t),bb=Math.round(b+(255-b)*t);return`#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;}
    function showToast(msg, type='info', ms=2600){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.className=`toast toast--${type} is-visible`;t.hidden=false;clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>{t.classList.remove('is-visible');t.hidden=true;},ms);}


// ===== NUEVA FUNCIÓN DE LOADER INTELIGENTE =====
    function manageLoader() {
      const loader = document.getElementById('loader');
      if (!loader) return { show: () => {}, hide: () => {} };

      // Creamos un temporizador. El loader solo aparecerá si la carga
      // tarda más de 300ms, evitando parpadeos en conexiones rápidas.
      let timer;
      
      const show = () => {
        timer = setTimeout(() => {
          loader.classList.add('is-visible');
        }, 300); // 300ms de retraso
      };

      const hide = () => {
        clearTimeout(timer); // Anulamos el temporizador si la carga fue rápida
        loader.classList.remove('is-visible');
      };

      return { show, hide };
    }




    // PEGA ESTA NUEVA FUNCIÓN AL PRINCIPIO DE TU SCRIPT

// ==========================================================
// ===== FUNCIÓN DE SEGURIDAD PARA VALIDAR ARCHIVOS =====
// ==========================================================
// ===== FUNCIÓN DE SEGURIDAD PARA VALIDAR ARCHIVOS (CORREGIDA) =====
function validateFile(file) {
  // Regla 1: Definimos los tipos de archivo permitidos (tipos MIME)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  // Regla 2: Definimos el tamaño máximo en Megabytes (MB)
  const MAX_SIZE_MB = 2;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; // Convertimos a bytes

  // Verificación de Tipo
  if (!allowedTypes.includes(file.type)) {
    // CORREGIDO: Ahora se llama a showToast()
    showToast(`Tipo de archivo no permitido. Solo se aceptan imágenes.`, 'error');
    return false; // El archivo es rechazado
  }

  // Verificación de Tamaño
  if (file.size > MAX_SIZE_BYTES) {
    // CORREGIDO: Ahora se llama a showToast()
    showToast(`El archivo es demasiado grande. El máximo es de ${MAX_SIZE_MB} MB.`, 'error');
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


    // ===== FIX: CONECTAR CLIC DEL LOGO AL INPUT (UBICACIÓN CORRECTA) =====
const logoPicker = document.querySelector('.logo-picker');
if (logoPicker) {
  logoPicker.addEventListener('click', () => {
    logoInput.click();
  });
}

  // ===== NUEVA LÓGICA DE CREACIÓN/CARGA DE PERFIL =====

// 1. Intentamos obtener los datos del negocio del usuario.
let { data: biz, error: bizError } = await sb.from('businesses').select('*').eq('user_id', u.user.id).single();

if (bizError && bizError.code === 'PGRST116') {
  // ERROR 'PGRST116' significa "No se encontró la fila". ¡Perfecto!
  // Esto nos indica que es la PRIMERA VEZ que el usuario entra aquí.
  console.log('Perfil de negocio no encontrado, creando uno nuevo...');

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 15);

  const { data: newBiz, error: createError } = await sb
    .from('businesses')
    .insert({
      user_id: u.user.id,
      business_name: 'Mi negocio', // Un nombre por defecto
      brand: '#DD338B',
      bg_pastel: '#FBE7F1',
      subscription_status: 'trial',
      current_period_ends_at: trialEndDate.toISOString()
    })
    .select()
    .single();

  if (createError) {
    // Si falla la creación, es un error grave.
    console.error("Error al crear el perfil de negocio:", createError);
    showToast('No pudimos crear tu perfil. Contacta a soporte.', 'error', 5000);
    // Podríamos incluso cerrar su sesión aquí para que no se quede en un estado roto.
    // await sb.auth.signOut();
    // location.href = 'login.html';
  } else {
    // ¡Éxito! Asignamos el perfil recién creado a nuestra variable 'biz'.
    biz = newBiz;
    showToast('¡Tu cuenta ha sido activada!', 'success');
  }
}

// 2. A partir de aquí, el resto del código funciona igual, porque la variable 'biz' ya existe,
//    ya sea porque la cargamos o porque la acabamos de crear.

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

   
  })();