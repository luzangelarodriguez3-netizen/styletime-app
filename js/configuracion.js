 (async () => {
    const $ = (id)=>document.getElementById(id);
    function hexToRgb(hex){const n=hex.replace('#','');const big=parseInt(n.length===3?n.split('').map(c=>c+c).join(''):n.slice(0,6),16);return{r:(big>>16)&255,g:(big>>8)&255,b:big&255};}
    function toast(msg,type='info',ms=2200){const t=$('toast');if(!t)return;t.textContent=msg;t.className=`toast toast--${type} is-visible`;t.hidden=false;clearTimeout(window._to);window._to=setTimeout(()=>{t.classList.remove('is-visible');t.hidden=true;},ms);}
    // sesión
    const { data: u } = await sb.auth.getUser();
    if(!u?.user){ location.href='login.html'; return; }
    const userId = u.user.id;
    const userEmail = u.user.email || '';

    // tema/negocio
    const { data: biz } = await sb.from('businesses').select('*, subscription_status, current_period_ends_at').eq('user_id', userId).order('updated_at',{ascending:false}).limit(1).maybeSingle();
    if(!biz){ location.href='personalizacion.html'; return; }
    const brand=(biz.brand||'#DD338B').toUpperCase(); const {r,g,b}=hexToRgb(brand);
    const root=document.documentElement; root.style.setProperty('--brand',brand); root.style.setProperty('--brand-rgb',`${r} ${g} ${b}`); root.style.setProperty('--bg',biz.bg_pastel||'#FAE9F2');
    $('bizName').textContent=biz.business_name||'Mi negocio';
    const logoEl=$('bizLogo'); logoEl.src=biz.logo_url||'./assets/logo.svg'; logoEl.onerror=()=>{logoEl.src='./assets/logo.svg';};
    if(biz.cover_url){ $('pageCover').style.backgroundImage=`url('${biz.cover_url}')`; const banner=$('banner'); banner.style.setProperty('--cover-url',`url('${biz.cover_url}')`); banner.classList.add('banner--with-cover'); }



    // PEGA ESTE BLOQUE JUSTO DESPUÉS DE LA VERIFICACIÓN DE 'biz'

// ==========================================================
// ===== LÓGICA PARA LA TARJETA DE SUSCRIPCIÓN =====
// ==========================================================
const subscriptionCard = document.getElementById('subscriptionCard');
const subscriptionTitle = document.getElementById('subscriptionTitle');
const subscriptionStatus = document.getElementById('subscriptionStatus');
const subscriptionAction = document.getElementById('subscriptionAction');

// Hacemos visible la tarjeta
subscriptionCard.style.display = 'block';

const status = biz.subscription_status;
const endDate = new Date(biz.current_period_ends_at);
const now = new Date();
const formattedEndDate = endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const wompiLink = "https://checkout.wompi.co/l/test_Gx9681"; // <-- ¡RECUERDA PONER TU LINK AQUÍ!

subscriptionAction.href = wompiLink;

if (status === 'trial') {
    subscriptionTitle.textContent = "Estás en tu Periodo de Prueba";
    if (now < endDate) {
        subscriptionStatus.innerHTML = `Tu acceso completo termina el <b>${formattedEndDate}</b>.`;
        subscriptionAction.textContent = "Activar Plan Completo";
    } else {
        subscriptionCard.classList.add('subscription-card--expired');
        subscriptionTitle.textContent = "Tu prueba ha terminado";
        subscriptionStatus.textContent = "Activa un plan para seguir usando todas las funciones.";
        subscriptionAction.textContent = "Activar mi Plan Ahora";
    }
} else if (status === 'active') {
    if (now < endDate) {
        subscriptionTitle.textContent = "Tu Plan está Activo";
        subscriptionStatus.innerHTML = `Tu próximo pago es el <b>${formattedEndDate}</b>.`;
        subscriptionAction.textContent = "Gestionar Suscripción";
    } else {
        subscriptionCard.classList.add('subscription-card--expired');
        subscriptionTitle.textContent = "Tu Plan ha Expirado";
        subscriptionStatus.textContent = "Renueva tu plan para no detener tu negocio.";
        subscriptionAction.textContent = "Renovar Ahora";
    }
} else {
    // Por si acaso hay otro estado, mostramos la opción de activar
    subscriptionCard.classList.add('subscription-card--expired');
    subscriptionTitle.textContent = "Activa tu Plan";
    subscriptionStatus.textContent = "Empieza a disfrutar de todos los beneficios de StyleTime.";
    subscriptionAction.textContent = "Ver Planes y Pagar";
}
// ========================================================
// ===== FIN DE LA LÓGICA DE LA TARJETA =====
// ========================================================

    // menú tres puntos
    const menuBtn=$('menuBtn'), menuPanel=$('menuPanel');
    function closeMenu(){ if(menuPanel.hidden) return; menuPanel.hidden=true; menuBtn.setAttribute('aria-expanded','false'); }
    menuBtn.addEventListener('click',(e)=>{ e.stopPropagation(); const open=menuPanel.hidden; menuPanel.hidden=!open; menuBtn.setAttribute('aria-expanded',String(open)); });
    document.addEventListener('click',(e)=>{ if(!menuPanel.hidden && !menuPanel.contains(e.target) && e.target!==menuBtn){ closeMenu(); }});
    document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeMenu(); });
    menuPanel.addEventListener('click', async (e)=>{ if(e.target?.dataset?.action==='logout'){ try{ await sb.auth.signOut(); location.href='login.html'; }catch(err){ console.error(err); }}});

    // ===== PEGA ESTE NUEVO CÓDIGO EN SU LUGAR =====
// --- Cambiar contraseña (modal) ---
const pwBtn = document.getElementById('pwBtn');
const pwBackdrop = document.getElementById('pwBackdrop');
const pwCancel = document.getElementById('pwCancel');
const pwSave = document.getElementById('pwSave');

pwBtn.addEventListener('click', () => {
  document.getElementById('newPw').value = '';
  document.getElementById('newPw2').value = '';
  pwBackdrop.style.display = 'flex';
});

pwCancel.addEventListener('click', () => {
  pwBackdrop.style.display = 'none';
});

pwBackdrop.addEventListener('click', (e) => {
  if (e.target === pwBackdrop) pwBackdrop.style.display = 'none';
});

pwSave.addEventListener('click', async () => {
  const p1 = document.getElementById('newPw').value.trim();
  const p2 = document.getElementById('newPw2').value.trim();

  if (p1.length < 6) { toast('La contraseña debe tener al menos 6 caracteres','error'); return; }
  if (p1 !== p2) { toast('Las contraseñas no coinciden','error'); return; }

  try {
    const { error } = await sb.auth.updateUser({ password: p1 });
    if (error) throw error;
    toast('Contraseña actualizada','ok',1400);
    pwBackdrop.style.display = 'none';
  } catch (err) {
    console.error(err);
    toast('No se pudo actualizar la contraseña','error');
  }
});
// ============================================

    // --- Eliminar cuenta (modal) ---
    // PEGA ESTE NUEVO BLOQUE EN SU LUGAR:

// --- Eliminar cuenta (modal con borrado suave) ---
const delBackdrop = $('delBackdrop');
$('delBtn').addEventListener('click', () => delBackdrop.style.display = 'flex');
$('delCancel').addEventListener('click', () => delBackdrop.style.display = 'none');
delBackdrop.addEventListener('click', (e) => {
    if (e.target === delBackdrop) delBackdrop.style.display = 'none';
});

$('delConfirm').addEventListener('click', async () => {
  try {
    // 1. Borramos todos los datos del usuario de nuestras tablas.
    const tables = ['appointments', 'services', 'working_hours', 'day_blocks', 'businesses'];
    for (const t of tables) {
      const { error } = await sb.from(t).delete().eq('user_id', userId);
      if (error) console.warn(`No se pudo borrar en ${t}:`, error.message);
    }

    // 2. "Corrompemos" el email en Supabase Auth para liberarlo.
    const deletedEmail = `${userEmail}#deleted_${Date.now()}`;
    const { error: updateError } = await sb.auth.updateUser({ email: deletedEmail });
    if (updateError) throw updateError;
    
    // 3. Cerramos la sesión y redirigimos a la página de registro.
    toast('Cuenta eliminada permanentemente. Serás redirigido.', 'ok', 2000);
    
    setTimeout(async () => {
      await sb.auth.signOut();
      location.href = 'registro.html';
    }, 2000);

  } catch (err) {
    console.error("Error al eliminar la cuenta:", err);
    toast('No se pudo completar la eliminación de la cuenta.', 'error');
  } finally {
    delBackdrop.style.display = 'none';
  }
});

   // PEGA ESTE NUEVO BLOQUE EN LUGAR DEL ANTERIOR

// --- Centro de ayuda (modal con mailto:) ---
const helpBackdrop = $('helpBackdrop');
$('helpBtn').addEventListener('click', () => {
    $('helpEmail').value = userEmail; // Autocompleta con el correo del usuario
    $('helpMsg').value = '';
    helpBackdrop.style.display = 'flex';
});

$('helpCancel').addEventListener('click', () => helpBackdrop.style.display = 'none');
helpBackdrop.addEventListener('click', (e) => {
    if (e.target === helpBackdrop) helpBackdrop.style.display = 'none';
});

$('helpSend').addEventListener('click', () => {
    const email = $('helpEmail').value.trim();
    const msg = $('helpMsg').value.trim();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        toast('Escribe un correo válido', 'error');
        return;
    }
    if (msg.length < 10) {
        toast('Cuéntanos con más detalle (mín. 10 caracteres)', 'error');
        return;
    }

    // ===== ¡¡¡ IMPORTANTE: PON TU CORREO DE SOPORTE AQUÍ !!! =====
    const tuCorreoDeSoporte = 'luzantienda@gmail.com'; 
    // ===============================================================

    const subject = encodeURIComponent(`Solicitud de Soporte - ${email}`);
    const body = encodeURIComponent(
        `Un usuario ha enviado una solicitud de soporte desde la app StyleTime:\n\n` +
        `----------------------------------\n` +
        `Correo del Usuario: ${email}\n` +
        `ID de Usuario: ${userId}\n` +
        `----------------------------------\n\n` +
        `Mensaje:\n${msg}`
    );

    // Creamos y abrimos el enlace mailto:
    window.location.href = `mailto:${tuCorreoDeSoporte}?subject=${subject}&body=${body}`;

    toast('Se abrirá tu aplicación de correo para que envíes el mensaje.', 'ok', 3000);
    
    // Cerramos el modal después de un momento
    setTimeout(() => {
        helpBackdrop.style.display = 'none';
    }, 800);
});
     document.getElementById('loader').classList.add('hidden');
  })();