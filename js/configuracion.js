 (async () => {

              


    const $ = (id)=>document.getElementById(id);
    function hexToRgb(hex){const n=hex.replace('#','');const big=parseInt(n.length===3?n.split('').map(c=>c+c).join(''):n.slice(0,6),16);return{r:(big>>16)&255,g:(big>>8)&255,b:big&255};}
    function toast(msg,type='info',ms=2200){const t=$('toast');if(!t)return;t.textContent=msg;t.className=`toast toast--${type} is-visible`;t.hidden=false;clearTimeout(window._to);window._to=setTimeout(()=>{t.classList.remove('is-visible');t.hidden=true;},ms);}
    
    
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

     document.querySelector('main.phone').style.opacity = '1'; 

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
const wompiLink = "https://checkout.wompi.co/l/ZtpXFr"; // <-- ¡RECUERDA PONER TU LINK AQUÍ!

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

  if (p1.length < 8) { toast('La contraseña debe tener al menos 8 caracteres','error'); return; }
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

// --- Eliminar cuenta (modal con borrado suave) ---
const delBackdrop = $('delBackdrop');
const delConfirmBtn = $('delConfirm'); // Guardamos una referencia al botón

$('delBtn').addEventListener('click', () => delBackdrop.style.display = 'flex');
$('delCancel').addEventListener('click', () => delBackdrop.style.display = 'none');
delBackdrop.addEventListener('click', (e) => {
    if (e.target === delBackdrop) delBackdrop.style.display = 'none';
});

delConfirmBtn.addEventListener('click', async () => {
  // Deshabilitar el botón para evitar dobles clics
  delConfirmBtn.disabled = true;
  delConfirmBtn.textContent = 'Eliminando...';

  // 1. Llamamos a la función que creamos en Supabase
  const { error: rpcError } = await sb.rpc('soft_delete_user');

  if (rpcError) {
    // Si la función de Supabase falla, mostramos un error claro
    console.error("Error al ejecutar soft_delete_user:", rpcError);
    toast('No se pudo eliminar la cuenta. Inténtalo de nuevo.', 'error');
    
    // Reactivamos el botón
    delConfirmBtn.disabled = false;
    delConfirmBtn.textContent = 'Confirmar';

  } else {
    // 2. Si la función tuvo éxito, ahora SÍ cerramos la sesión
    toast('Cuenta eliminada. Serás redirigido.', 'ok', 2000);
    
    const { error: signOutError } = await sb.auth.signOut();
    if (signOutError) {
        console.error("Error al cerrar sesión tras eliminar la cuenta:", signOutError);
    }
    
    // 3. Finalmente, redirigimos al usuario, pase lo que pase.
    // Usamos un pequeño delay para que el usuario alcance a leer el toast.
    setTimeout(() => {
      location.href = 'registro.html';
    }, 1500);
  }
});


// ==========================================================
// ===== LÓGICA RESTAURADA PARA EL CENTRO DE AYUDA =====
// ==========================================================
const helpBackdrop = document.getElementById('helpBackdrop');
const helpBtn = document.getElementById('helpBtn');
const helpCancel = document.getElementById('helpCancel');
const helpSend = document.getElementById('helpSend');
const helpEmailInput = document.getElementById('helpEmail');
const helpMsgInput = document.getElementById('helpMsg');

// 1. Abrir el modal
if (helpBtn) {
  helpBtn.addEventListener('click', () => {
    if (helpEmailInput) helpEmailInput.value = userEmail; // Autocompleta con el correo del usuario
    if (helpMsgInput) helpMsgInput.value = ''; // Limpia el mensaje anterior
    if (helpBackdrop) helpBackdrop.style.display = 'flex';
  });
}

// 2. Cerrar el modal (con el botón de cancelar o haciendo clic fuera)
if (helpCancel) {
  helpCancel.addEventListener('click', () => {
    if (helpBackdrop) helpBackdrop.style.display = 'none';
  });
}
if (helpBackdrop) {
  helpBackdrop.addEventListener('click', (e) => {
    if (e.target === helpBackdrop) {
      helpBackdrop.style.display = 'none';
    }
  });
}

// 3. Lógica para el botón de "Enviar"
if (helpSend) {
  helpSend.addEventListener('click', () => {
    const email = helpEmailInput ? helpEmailInput.value.trim() : '';
    const msg = helpMsgInput ? helpMsgInput.value.trim() : '';

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        toast('Escribe un correo válido', 'error');
        return;
    }
    if (msg.length < 10) {
        toast('Cuéntanos con más detalle (mín. 10 caracteres)', 'error');
        return;
    }

    const tuCorreoDeSoporte = 'luzantienda@gmail.com'; 

    const subject = encodeURIComponent(`Solicitud de Soporte - ${email}`);
    const body = encodeURIComponent(
        `Un usuario ha enviado una solicitud de soporte desde la app StyleTime:\n\n` +
        `----------------------------------\n` +
        `Correo del Usuario: ${email}\n` +
        `ID de Usuario: ${userId}\n` +
        `----------------------------------\n\n` +
        `Mensaje:\n${msg}`
    );

    window.location.href = `mailto:${tuCorreoDeSoporte}?subject=${subject}&body=${body}`;

    toast('Se abrirá tu aplicación de correo para que envíes el mensaje.', 'ok', 3000);
    
    setTimeout(() => {
        if (helpBackdrop) helpBackdrop.style.display = 'none';
    }, 800);
  });
}
// ==========================================================

     
  })();