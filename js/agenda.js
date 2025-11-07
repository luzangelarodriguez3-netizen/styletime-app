(async () => {

  


 // ===== VERIFICACIÓN DE SESIÓN CON GUARDIÁN =====
const user = await protectPage();
if (!user) return; // Si no hay usuario, el guardián ya redirigió. Detenemos la ejecución.
const userId = user.id;
  

  const daysGrid = document.getElementById('daysGrid');
  const apptList = document.getElementById('apptList');
  const dayTitle = document.getElementById('dayTitle');

  // ===== Helpers =====
  function hexToRgb(hex){ const n=hex.replace('#',''); const big=parseInt(n.length===3?n.split('').map(c=>c+c).join(''):n.slice(0,6),16); return{r:(big>>16)&255,g:(big>>8)&255,b:big&255};}
  function showToast(msg, type='info', ms=2200){ const t=document.getElementById('toast'); if(!t)return; t.textContent=msg; t.className=`toast toast--${type} is-visible`; t.hidden=false; clearTimeout(window._toastTimer); window._toastTimer=setTimeout(()=>{t.classList.remove('is-visible');t.hidden=true;},ms);}






  // Menú
  const menuBtn = document.getElementById('menuBtn');
  const menuPanel = document.getElementById('menuPanel');
  function closeMenu(){ if(menuPanel.hidden) return; menuPanel.hidden = true; menuBtn.setAttribute('aria-expanded','false'); }
  menuBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const open = menuPanel.hidden; menuPanel.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('click', (e)=>{ if(!menuPanel.hidden && !menuPanel.contains(e.target) && e.target !== menuBtn){ closeMenu(); }});
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeMenu(); });
  menuPanel.addEventListener('click', async (e)=>{ if(e.target?.dataset?.action === 'logout'){ try{ await sb.auth.signOut(); location.href='login.html'; } catch(err){ console.error(err); }}});

    

// PEGA ESTE NUEVO BLOQUE EN SU LUGAR:

// ===================================================================
// ===== SUPERVISOR DE SUSCRIPCIÓN (VERSIÓN 4.0 - BASADO EN RPC) =====
// ===================================================================
let isSubscriptionActive = false;
let userAccessStatus = 'LOADING';
let biz = null; // Declaramos 'biz' aquí para que sea accesible en todo el script

try {
  // 1. Llamamos a la función RPC de la base de datos
  const { data: status, error: rpcError } = await sb.rpc('check_subscription_status');

  if (rpcError) throw rpcError;
  if (status.startsWith('ERROR')) {
      // Si la función devuelve un error conocido (como que no hay perfil), redirigimos.
      location.href = 'personalizacion.html';
      return;
  }

  // 2. Recibimos la respuesta 100% segura del servidor
  userAccessStatus = status;
  
  if (userAccessStatus === 'ACTIVE' || userAccessStatus === 'RENEWAL_WARNING') {
    isSubscriptionActive = true;
  }

  // 3. Ahora que sabemos que la suscripción es válida, obtenemos los datos del negocio para la UI.
  const { data: bizData, error: bizError } = await sb
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (bizError) throw bizError;
  biz = bizData;

} catch (err) {
  console.error("Error crítico al verificar la suscripción:", err);
  // Si algo sale muy mal, por seguridad lo mandamos al login.
  location.href = 'login.html';
  return;
}
// ==================================================================
// ===== FIN DEL SUPERVISOR =====
// ==================================================================

// ===== Negocio / tema (Ahora usando el 'biz' que ya cargamos de forma segura) =====
document.querySelector('.fab').href = `./reserva.html?b=${encodeURIComponent(userId)}`;
const nameEl = document.getElementById('bizName');
nameEl.textContent = biz.business_name || 'Mi negocio';
document.title = `${nameEl.textContent} · Mi agenda`;
const root=document.documentElement; const brand=(biz.brand||'#DD338B').toUpperCase();
const {r,g,b} = hexToRgb(brand);
root.style.setProperty('--brand',brand);
root.style.setProperty('--brand-rgb',`${r} ${g} ${b}`);
root.style.setProperty('--bg',biz.bg_pastel||'#FAE9F2');
const logoEl=document.getElementById('bizLogo'); logoEl.src=biz.logo_url||'./assets/logo.svg'; logoEl.onerror=()=>{logoEl.src='./assets/logo.svg';};
const pageCover=document.getElementById('pageCover'); const banner=document.getElementById('banner'); if(biz.cover_url){pageCover.style.backgroundImage=`url('${biz.cover_url}')`; banner.style.setProperty('--cover-url',`url('${biz.cover_url}')`); banner.classList.add('banner--with-cover');}

document.querySelector('main.phone.fade-in-content').style.opacity = '1';





// ===============================================
// ===== LÓGICA DEL LINK DE DIVULGACIÓN (RESTAURADA) =====
// ===============================================
const shareInput = document.getElementById('shareInput');
const copyBtn = document.getElementById('copyBtn');
const base = location.origin + location.pathname.replace(/\/[^/]*$/, '/');
shareInput.value = `${base}reserva.html?b=${encodeURIComponent(userId)}`;
copyBtn.onclick = async () => {
    try {
        await navigator.clipboard.writeText(shareInput.value);
        showToast('Link copiado', 'success', 1200);
    } catch {
        showToast('No se pudo copiar', 'error', 2200);
    }
};
// ===============================================










// ===== Utilidades de tiempo / dinero =====
  const fmtMoney = n => Number(n||0).toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0});
  const addMinutes = (hhmm, mins) => {
    const [h,m] = (hhmm||'00:00').split(':').map(Number);
    const d = new Date(0,0,0, h||0, m||0, 0);
    d.setMinutes(d.getMinutes() + (mins||0));
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };
  const to12h = hhmm => {
    const [h,m] = (hhmm||'00:00').split(':').map(Number);
    return new Date(0,0,0,h||0,m||0).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}).toUpperCase();
  };

  // ¿Ya venció? (usa la fecha del día mostrado)
  function isExpired(dayISO, endHHMM){
    if(!endHHMM) return false;
    const end = new Date(`${dayISO}T${endHHMM}:00`);
    const now = new Date();
    return end.getTime() <= now.getTime();
  }

  async function loadAppointmentsOfDay(dayISO) {
  // --- PASO 1: MOSTRAR EL ESQUELETO INMEDIATAMENTE ---
  apptList.innerHTML = ''; // Limpiamos la lista anterior
  for (let i = 0; i < 3; i++) { // Creamos 3 tarjetas de esqueleto
    const skeletonCard = document.createElement('div');
    skeletonCard.className = 'card appt is-skeleton';
    skeletonCard.innerHTML = `
      <div>
        <div class="appt__name skeleton"></div>
        <div class="appt__meta">
          <span class="skeleton"></span>
        </div>
      </div>
      <div class="appt__time skeleton"></div>
    `;
    apptList.appendChild(skeletonCard);
  }

  // --- PASO 2: PEDIR LOS DATOS REALES A SUPABASE ---
  const { data, error } = await sb
    .from('appointments')
    .select('id, customer_name, service_name, price, time, duration_minutes, notes, whatsapp, status')
    .eq('user_id', userId)
    .eq('date', dayISO)
    .order('time', { ascending: true });


  

  if (error) {
    console.error("Error cargando citas del día:", error);
    apptList.innerHTML = '<div class="card empty">Error al cargar las citas.</div>';
    return;
  }
  if (!data || !data.length) {
    apptList.innerHTML = '<div class="card empty">No hay citas reservadas para este día.</div>';
    return;
  }




  apptList.innerHTML = ''; // Limpiamos el esqueleto JUSTO ANTES de añadir las tarjetas reales.

    // REEMPLAZA TU BUCLE 'for' ACTUAL CON ESTA VERSIÓN CORREGIDA

for (const a of data) {
    const start = a.time;
    const end = addMinutes(start, (a.duration_minutes ?? 60));
    const timeRange = `${to12h(start)}–${to12h(end)}`;

    const card = document.createElement('div');
    card.className = 'card appt';
    card.dataset.id = a.id;
    card.dataset.status = a.status || 'confirmed';

    // --- LÓGICA DE LA CAMPANITA ---
    const appointmentDateTime = new Date(`${dayISO}T${start}`);
    const now = new Date();
    const minutesDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);

    let reminderButtonHtml = '';
    // ===== AQUÍ ESTÁ LA CORRECCIÓN CLAVE =====
    // Ahora solo se activa si la cita NO está cancelada Y está próxima.
    if (a.status !== 'cancelled' && minutesDifference <= 180 && minutesDifference > 0) {
        card.classList.add('is-due');
        if (a.whatsapp) {
            reminderButtonHtml = `
              <div class="appt__actions">
                <button class="btn-reminder" 
                        data-wa="${a.whatsapp}" 
                        data-name="${a.customer_name}" 
                        data-service="${a.service_name}"
                        data-time="${to12h(start)}">
                  🔔 Enviar Recordatorio
                </button>
              </div>
            `;
        }
    }
   // ===== Lógica de clases visuales (PRIORIDAD CORRECTA) =====
if (a.status === 'done') {
  card.classList.add('appt--done');
} else if (a.status === 'cancelled') {
  card.classList.add('appt--cancelled');
} else {
  // Solo marcar como expirada si no es realizada ni cancelada
  if (isExpired(dayISO, end)) {
    card.classList.add('appt--expired');
  }
}
    card.innerHTML = `
      <div>
        <div class="appt__name">${a.customer_name || ''}</div>
        <div class="appt__meta">
          <span>${a.service_name || ''}</span>
          <span class="appt__price">${fmtMoney(a.price)}</span>
        </div>
      </div>
      <div class="appt__time">${timeRange}</div>
      ${a.notes ? `<div class="appt__note">${a.notes}</div>` : ''}
      ${reminderButtonHtml} 
    `;

    card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-reminder')) return;
        
        const currentStatus = card.dataset.status || a.status || 'confirmed';
        // CORRECCIÓN IMPORTANTE: Asegúrate de pasar 'date' a la función del modal
        const dateForModal = a.date || dayISO;
        openApptDialog({ ...a, date: dateForModal, status: currentStatus }, timeRange, card);
    });

    apptList.appendChild(card);
}
  }

  // ===== Panel flotante =====
  function openApptDialog(appt, timeRange, cardEl){
    const backdrop = document.createElement('div');
    backdrop.className = 'appt-backdrop';
    const dialog = document.createElement('div');
    dialog.className = 'appt-dialog';

    const money = fmtMoney(appt.price);
    const whatsappHtml = appt.whatsapp ? `<div class="appt-field">whatsapp: ${appt.whatsapp}</div>` : '';
    const notesHtml = appt.notes ? `<div class="appt-field appt-note">${appt.notes}</div>` : '';

    dialog.innerHTML = `
      <div class="appt-dialog__head">
        <div class="appt-dialog__name">
          ${appt.customer_name || ''}<br>
          <small>${appt.service_name || ''}</small>
        </div>
        <div class="appt-dialog__time">${timeRange}</div>
      </div>

      <div class="appt-dialog__body">
        <div class="appt-chip">${money}</div>
        ${whatsappHtml}
        ${notesHtml}
      </div>

      <div class="appt-dialog__actions">
        
        <button class="btn-status btn-done" data-status="done">realizada</button>
        <button class="btn-status btn-cancelled" data-status="cancelled">cancelada</button>
      </div>

      <div class="appt-dialog__footer">
        <button class="appt-close">Cerrar</button>
      </div>
    `;

    // resaltar el estado real guardado
    const setActive = (s)=>{
      dialog.querySelectorAll('.btn-status').forEach(b=>{
        b.classList.toggle('is-active', b.dataset.status === s);
      });
    };
    setActive(appt.status || 'confirmed');

    // ===== REEMPLAZA CON ESTE BLOQUE MEJORADO =====
dialog.querySelectorAll('.btn-status').forEach(btn => {
  btn.addEventListener('click', async () => {
    
    // Obtenemos el estado actual REAL de la cita
    const currentStatus = appt.status || 'confirmed';
    // Obtenemos el estado al que se quiere cambiar
    const targetStatus = btn.dataset.status;

    // --- ¡NUEVA LÓGICA DE REVERSIÓN! ---
    // Si el usuario hace clic en el botón del estado que ya está activo,
    // revertimos la cita al estado 'confirmed'.
    // Si no, procedemos a cambiar al nuevo estado (targetStatus).
    const newStatus = (currentStatus === targetStatus) ? 'confirmed' : targetStatus;
    
    // --- LÓGICA DE CANCELACIÓN (Regla de 2 horas) ---
    // Esta lógica solo se ejecuta si estamos INTENTANDO cancelar, no al revertir.
    if (newStatus === 'cancelled' && currentStatus !== 'cancelled') {
      const MIN_HOURS_BEFORE_CANCELLATION = 2;
      const appointmentDateTime = new Date(`${appt.date}T${appt.time}`);
      const now = new Date();
      const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < MIN_HOURS_BEFORE_CANCELLATION && hoursDifference >= 0) {
        const confirmLateCancellation = confirm(
          "ADVERTENCIA: Faltan menos de 2 horas para esta cita.\n\n" +
          "Si continúas, la cita se marcará como cancelada y el horario se liberará.\n\n" +
          "¿Estás seguro de que quieres cancelarla?"
        );
        if (!confirmLateCancellation) {
          return; 
        }
      }
    }
    // --- FIN LÓGICA CANCELACIÓN ---

    // Actualizamos visualmente el botón activo de forma optimista
    setActive(newStatus);

    try {
      // Enviamos la actualización a Supabase
      const { error } = await sb
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appt.id)
        .eq('user_id', userId);

      if (error) throw error;
      
    // Actualizamos el estado en memoria y en la tarjeta de la agenda
      appt.status = newStatus;
      if (cardEl) {
        cardEl.dataset.status = newStatus;
        
        // --- ¡AQUÍ ESTÁ LA MAGIA! ---
        // 1. Quita todas las clases de estado para empezar de cero.
        cardEl.classList.remove('appt--cancelled', 'appt--done');

        // 2. Añade la clase correcta según el nuevo estado.
        if (newStatus === 'cancelled') {
          cardEl.classList.add('appt--cancelled');
        } else if (newStatus === 'done') {
          cardEl.classList.add('appt--done');
        }
        // Si es 'confirmed', no se añade ninguna clase de color.
      }
      showToast('Estado actualizado', 'success', 1200);

    } catch(err) {
      console.error("Error al actualizar estado:", err);
      // Si la actualización falla, revertimos el cambio visual al estado original
      setActive(currentStatus); 
      showToast('No se pudo actualizar', 'error', 1800);
    }
  });
});
    // Cerrar
    dialog.querySelector('.appt-close').addEventListener('click', ()=> document.body.removeChild(backdrop));
    backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) document.body.removeChild(backdrop); });

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
  }

  // ===== Calendario =====
  const monthName = document.getElementById('monthName');
  const yearNum = document.getElementById('yearNum');
  const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth()+1).padStart(2,'0')}-${String(todayObj.getDate()).padStart(2,'0')}`;

  let current = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);

  function renderMonth(d) {
    monthName.textContent = MONTHS[d.getMonth()];
    yearNum.textContent = d.getFullYear();
    daysGrid.innerHTML = '';

    const firstDow = (new Date(d.getFullYear(), d.getMonth(), 1).getDay() + 6) % 7;
    const lastDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

    for (let i = 0; i < firstDow; i++) {
      const e = document.createElement('div'); e.className = 'day is-empty'; daysGrid.appendChild(e);
    }

    for (let day = 1; day <= lastDate; day++) {
      const e = document.createElement('div');
      e.className = 'day';
      e.textContent = day;

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = `${y}-${m}-${String(day).padStart(2, '0')}`;
      e.dataset.date = dayStr;

      if (dayStr < todayStr) e.classList.add('is-past');
      if (dayStr === todayStr) e.classList.add('is-today');

      daysGrid.appendChild(e);
    }
  }

  async function markMonthAppointments(year, month) {
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const { data: appointments, error } = await sb
      .from('appointments')
      .select('date')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (error) { console.error("Error al obtener las citas del mes:", error); return; }

    const daysWithAppointments = new Set((appointments || []).map(a => a.date));

    daysGrid.querySelectorAll('.day').forEach(el => {
      const dayStr = el.dataset.date;
      el.classList.remove('has-appt-future', 'has-appt-past');

      if (daysWithAppointments.has(dayStr)) {
        if (dayStr < todayStr) {
          el.classList.add('has-appt-past');    // puntico (pasado con cita)
        } else {
          el.classList.add('has-appt-future');  // casilla llena (hoy/futuro con cita)
        }
      }
    });
  }

  // Navegación
  document.getElementById('prevMonth').onclick = async () => {
    current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    renderMonth(current);
    await markMonthAppointments(current.getFullYear(), current.getMonth());
  };
  document.getElementById('nextMonth').onclick = async () => {
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    renderMonth(current);
    await markMonthAppointments(current.getFullYear(), current.getMonth());
  };

  // Click día (YA permite pasados)
  daysGrid.addEventListener('click', async (e) => {
    const box = e.target.closest('.day');
    if (!box || box.classList.contains('is-empty')) return;

    daysGrid.querySelectorAll('.day.is-selected').forEach(d => d.classList.remove('is-selected'));
    box.classList.add('is-selected');

    const dateStr = box.dataset.date;
    const d = new Date(`${dateStr}T00:00:00`);
    const fmt = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    dayTitle.textContent = `Citas del ${fmt}`;
    await loadAppointmentsOfDay(dateStr);
  });

  // PEGA ESTE NUEVO BLOQUE EN SU LUGAR:

// ===== Carga inicial (Versión Progresiva) =====
// 1. Dibuja la estructura del calendario INMEDIATAMENTE.
renderMonth(current);

// 2. Selecciona el día de hoy en el calendario.
const todayElement = daysGrid.querySelector(`[data-date="${todayStr}"]`);
if (todayElement) {
  todayElement.classList.add('is-selected');
  dayTitle.textContent = `Citas de hoy (${todayObj.toLocaleDateString('es-ES', {day:'numeric', month:'long'})})`;
}

// 3. Ahora, pide los datos "pesados" (citas del mes y del día)
//    y deja que se carguen en segundo plano sin bloquear la página.
await Promise.all([
    markMonthAppointments(current.getFullYear(), current.getMonth()),
    loadAppointmentsOfDay(todayStr)
]);
 

  // PEGA ESTE BLOQUE JUSTO ANTES DE LA LÍNEA FINAL '})();'

// ===== Lógica para el Botón de Recordatorio de WhatsApp =====
apptList.addEventListener('click', (e) => {
    const reminderButton = e.target.closest('.btn-reminder');
    
    // Si no se hizo clic en un botón de recordatorio, no hacemos nada
    if (!reminderButton) return;

    const clientName = reminderButton.dataset.name;
    const clientWa = reminderButton.dataset.wa;
    const serviceName = reminderButton.dataset.service;
    const time12h = reminderButton.dataset.time;
    const businessName = nameEl.textContent; // Usamos el nombre del negocio ya cargado

    // Mensaje de recordatorio (¡puedes personalizarlo!)
    const message = `¡Hola ${clientName}! 👋 Te recordamos tu cita en *${businessName}* para un servicio de *${serviceName}* hoy a las *${time12h}*. ¡Te esperamos! 😊`;

    // Creamos el enlace de WhatsApp
    // Asegúrate de que el número no incluya '+' o espacios. Si es necesario, añade el código de país.
    const whatsappUrl = `https://wa.me/57${clientWa}?text=${encodeURIComponent(message)}`;

    // Abrimos la URL en una nueva pestaña
    window.open(whatsappUrl, '_blank');
});


// =================================================================
// ===== LÓGICA DE ACCIÓN DE SUSCRIPCIÓN (VERSIÓN FINAL) =====
// =================================================================
const paymentModal = document.getElementById('paymentModalBackdrop');
const renewalBanner = document.getElementById('renewalBanner');

// Función única para gestionar la visibilidad de los avisos
function manageSubscriptionUI(status) {
  // 1. Primero, nos aseguramos de que todo esté oculto por defecto
  if (paymentModal) paymentModal.style.display = 'none';
  if (renewalBanner) renewalBanner.style.display = 'none';


  // ===== AÑADE ESTE BLOQUE PARA DESBLOQUEAR LOS BOTONES =====
const fabButton = document.querySelector('.fab');
if (fabButton) {
  fabButton.onclick = null; // Restaura el comportamiento normal del enlace
}
const copyBtn = document.getElementById('copyBtn');
if (copyBtn) {
  copyBtn.disabled = false;
  copyBtn.style.cursor = 'pointer';
  copyBtn.style.opacity = '1';
}
// ========================================================

  // 2. Ahora, actuamos según el estado
  switch (status) {
    case 'RENEWAL_WARNING':
      // Mostramos solo el banner de renovación
      const dateEl = document.getElementById('renewalDate');
      if (renewalBanner && dateEl) {
        dateEl.textContent = new Date(biz.current_period_ends_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        renewalBanner.style.display = 'block';
      }
      break;
      
    case 'EXPIRED':
      // Mostramos solo el modal de pago y aplicamos los bloqueos funcionales
      if (paymentModal) paymentModal.classList.add('is-visible');
      
      const fabButton = document.querySelector('.fab');
      if (fabButton) {
        fabButton.onclick = (e) => {
          e.preventDefault();
          if (paymentModal) paymentModal.classList.remove('is-visible');
        };
      }
      const copyBtn = document.getElementById('copyBtn');
      if (copyBtn) {
        copyBtn.disabled = true;
        copyBtn.style.cursor = 'not-allowed';
        copyBtn.style.opacity = '0.5';
      }
      break;

    case 'ACTIVE':
      // Si el plan está activo, no hacemos nada. Todo se queda oculto.
      break;
  }
}

// Llamamos a nuestra nueva función centralizada con el estado que calculó el Supervisor
manageSubscriptionUI(userAccessStatus);

// Evento para el botón de cerrar del modal de pago
const paymentModalCloseBtn = document.getElementById('paymentModalClose');
if (paymentModalCloseBtn) {
  paymentModalCloseBtn.addEventListener('click', () => {
    if (paymentModal) {
      paymentModal.classList.remove('is-visible');
      document.body.classList.remove('modal-open');
    }
  });
}
// ===============================================================
// ===============================================================
// ===== FIN DE LA LÓGICA DE ACCIÓN =====
// ===============================================================



})();