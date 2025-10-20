(async () => {
    // ===============================================
    // ===== 1. CONFIGURACIÓN Y FUNCIONES DE AYUDA =====
    // ===============================================
    const SLOT_STEP_MIN = 15;
    const LEAD_MINUTES  = 30;
    const FALLBACK_START_MIN = 8 * 60;
    const FALLBACK_END_MIN   = 18 * 60;

    const $ = (id) => document.getElementById(id);
    const toast = (msg, kind='info', ms=3000) => {
      const t = $('toast'); if (!t) return;
      t.textContent = msg; t.className = `toast toast--${kind} is-visible`;
      clearTimeout(window._t); window._t = setTimeout(()=> t.classList.remove('is-visible'), ms);
    };
    const money = n => Number.isFinite(+n) ? (+n).toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}) : '--';
    const pad = n => String(n).padStart(2,'0');
    const minToHM = m => `${pad(Math.floor(m/60))}:${pad(m%60)}`;
    $('custName').addEventListener('input', e => e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]/g,''));
    $('wa').addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g,'').slice(0,10));

    // ===============================================
// ===== 2. INICIALIZACIÓN Y CARGA DE DATOS (CORREGIDO) =====
// ===============================================
function hexToRgb(hex){ const n=hex.replace('#',''); const big=parseInt(n.length===3?n.split('').map(c=>c+c).join(''):n.slice(0,6),16); return{r:(big>>16)&255,g:(big>>8)&255,b:big&255};}

// 🔹 CORRECCIÓN CLAVE: Obtener el ID del negocio únicamente desde el parámetro 'b' en la URL.
const url = new URL(location.href);
const ownerId = url.searchParams.get('b');

// Si no hay un ID de negocio en la URL, el link es inválido. Detenemos todo.
if (!ownerId) {
    toast('El link de la agenda es inválido o está incompleto.', 'error', 5000);
    document.getElementById('loader').classList.add('hidden');
    $('bookingForm').style.display = 'none'; // Ocultamos el formulario para evitar confusiones.
    return; // Detiene la ejecución del script.
}

// Usamos el 'ownerId' de la URL para cargar los datos del negocio.
const { data: biz, error: bizError } = await sb.from('businesses').select('*, subscription_status, current_period_ends_at').eq('user_id', ownerId).limit(1).single();
if (bizError || !biz) {
    console.error('Error al cargar el negocio:', bizError);
    toast('No se encontró el negocio. Verifica que el link sea correcto.', 'error');
    return;
}

// PEGA ESTE BLOQUE JUSTO DESPUÉS DEL CÓDIGO ANTERIOR

// ==========================================================
// ===== INICIO: SUPERVISOR DE SUSCRIPCIÓN (en reserva.html) =====
// ==========================================================
let isSubscriptionActive = false;
const status = biz.subscription_status;
const endDate = new Date(biz.current_period_ends_at);
const now = new Date();

if (status === 'active' || (status === 'trial' && now < endDate)) {
  isSubscriptionActive = true;
}

if (!isSubscriptionActive) {
  // Si la suscripción no está activa, bloqueamos todo el formulario.
  const formCard = document.querySelector('.form-card');
  formCard.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <h3 style="color: #b91c1c; font-size: 20px; font-weight: 700; margin-bottom: 12px;">Agenda no disponible</h3>
      <p style="color: #4b5563; line-height: 1.6;">Este negocio no puede recibir nuevas citas en este momento. Por favor, contacta directamente con ellos.</p>
    </div>
  `;
  // Detenemos la ejecución del script para que no intente cargar nada más.
  document.getElementById('loader').classList.add('hidden');
  return; 
}
// ========================================================
// ===== FIN DEL SUPERVISOR =====
// ========================================================

// A partir de aquí, el resto del código carga la información del negocio como antes.
const root = document.documentElement; const brand = (biz.brand || '#DD338B').toUpperCase(); const {r,g,b} = hexToRgb(brand); root.style.setProperty('--brand', brand); root.style.setProperty('--brand-rgb', `${r} ${g} ${b}`); root.style.setProperty('--bg', biz.bg_pastel || '#FAE9F2');
$('bizName').textContent = biz.business_name || 'Mi negocio';
const logoEl = $('bizLogo'); logoEl.src = biz.logo_url || './assets/logo.svg'; logoEl.onerror = ()=>{logoEl.src='./assets/logo.svg';};
if (biz.cover_url) $('pageCover').style.backgroundImage = `url('${biz.cover_url}')`;

const { data: services } = await sb.from('services').select('id,name,price,duration_min').eq('user_id', ownerId).order('name');
const serviceSel = $('serviceSel'), priceEl = $('price'), durEl = $('duration');
const svcInfo = $('svcInfo'), slotGrid = $('slotGrid'), slotHint = $('slotHint'), timeVal = $('timeVal');
const svcById = new Map();
(services||[]).forEach(s=>{ svcById.set(String(s.id), s); const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; serviceSel.appendChild(opt); });

function updateSvcInfo(){
  const s = svcById.get(serviceSel.value);
  if (!s) { svcInfo.textContent = 'Precio: -- • Duración: -- min'; priceEl.value=''; durEl.value=''; return; }
  svcInfo.textContent = `Precio: ${money(s.price)} • Duración: ${s.duration_min} min`;
  priceEl.value = money(s.price);
  durEl.value = `${s.duration_min} min`;
}
serviceSel.addEventListener('change', ()=>{ updateSvcInfo(); renderSlots(); });
$('date').addEventListener('change', renderSlots);
updateSvcInfo();

    

    // ====================================================
    // ===== 3. LÓGICA DE HORARIOS Y DISPONIBILIDAD (CORREGIDA) =====
    // ====================================================
    async function getDayConfig(dayStr) {
  // 🔹 Corregido: buscar bloqueos del negocio (ownerId), no del usuario actual
  const { data: block, error: blockErr } = await sb
    .from('day_blocks')
    .select('date')
    .eq('user_id', ownerId)
    .eq('date', dayStr)
    .maybeSingle();

  if (blockErr) {
    console.error('Error al verificar bloqueo:', blockErr);
    return { blocked: false };
  }

  if (block) {
    return { blocked: true };
  }

  // 🔹 Si no hay bloqueo, seguimos con el horario normal
  const d = new Date(`${dayStr}T00:00:00`);
  const dow = d.getDay() === 0 ? 7 : d.getDay();

  const { data: wh } = await sb
    .from('working_hours')
    .select('enabled,start_min,end_min')
    .eq('user_id', ownerId)
    .eq('dow', dow)
    .maybeSingle();

  if (wh) {
    if (!wh.enabled) return { enabled: false };
    return {
      enabled: true,
      startMin: Number(wh.start_min || 0),
      endMin: Number(wh.end_min || 0)
    };
  }

  if (dow === 6 || dow === 7) return { enabled: false };
  return { enabled: true, startMin: FALLBACK_START_MIN, endMin: FALLBACK_END_MIN };
}

    async function renderSlots(){
      timeVal.value = ''; slotGrid.innerHTML = '';
      const s = svcById.get(serviceSel.value);
      const dayStr = $('date').value;
      if (!s || !dayStr) { slotHint.textContent = 'Elige un servicio y una fecha para ver horarios.'; return; }
      const duration = Number(s.duration_min || 0);
      if (!duration) { slotHint.textContent = 'Duración de servicio inválida.'; return; }
      slotHint.textContent = 'Buscando horarios...';

      const cfg = await getDayConfig(dayStr);
      if (cfg.blocked) { slotHint.textContent = 'Esta fecha está bloqueada.'; return; }
      if (!cfg.enabled) { slotHint.textContent = 'Este día el negocio no trabaja.'; return; }

     // REEMPLAZA EL BLOQUE ANTERIOR CON ESTE:

let startMin = cfg.startMin;
const endMin = cfg.endMin;

// Obtenemos las fechas sin la hora para una comparación segura
const today = new Date();
today.setHours(0, 0, 0, 0); // La medianoche de hoy

// Necesitamos ajustar la fecha seleccionada por problemas de zona horaria
const [year, month, day] = dayStr.split('-').map(Number);
const selectedDate = new Date(year, month - 1, day);
selectedDate.setHours(0, 0, 0, 0); // La medianoche del día seleccionado

// La lógica de "minutos de antelación" SOLO se aplica si el día seleccionado es HOY.
if (selectedDate.getTime() === today.getTime()) {
  const now = new Date();
  const nowInMinutes = now.getHours() * 60 + now.getMinutes();
  startMin = Math.max(startMin, nowInMinutes + LEAD_MINUTES);
} else if (selectedDate < today) {
  // Si el día seleccionado es en el pasado, no mostramos horarios.
  slotHint.textContent = 'No se puede reservar en una fecha pasada.';
  slotGrid.innerHTML = '';
  return;
}

// Redondeamos al siguiente intervalo disponible
startMin = Math.ceil(startMin / SLOT_STEP_MIN) * SLOT_STEP_MIN;
      // CÓDIGO NUEVO (EL QUE DEBES PEGAR):
const { data: appts, error } = await sb.from('appointments').select('time, duration_minutes').eq('user_id', ownerId).eq('date', dayStr).neq('status', 'cancelled');
      
      if (error) {
        console.error("Error al buscar citas existentes:", error);
        toast(error.message, 'error');
        slotHint.textContent = 'Error al cargar la agenda.';
        return;
      }

      const busy = (appts || []).map(a => {
        const [h, m] = a.time.split(':').map(Number);
        const stMin = h * 60 + m;
        const enMin = stMin + Number(a.duration_minutes || 0);
        return [stMin, enMin];
      });

      const slotsMin = [];
      for (let m = startMin; m <= endMin - duration; m += SLOT_STEP_MIN) {
        const st = m, en = m + duration;
        const overlap = busy.some(([bst, ben]) => st < ben && en > bst);
        if (!overlap) slotsMin.push(m);
      }

      slotGrid.innerHTML = '';
      if (!slotsMin.length) { slotHint.textContent = 'No hay horarios disponibles para esta fecha.'; return; }
      slotsMin.forEach(m => {
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'slot';
        btn.textContent = minToHM(m);
        btn.addEventListener('click', () => { timeVal.value = btn.textContent; slotGrid.querySelectorAll('.slot').forEach(x => x.classList.remove('is-selected')); btn.classList.add('is-selected'); });
        slotGrid.appendChild(btn);
      });
      slotHint.textContent = 'Selecciona un horario.';
    }

   // ===== 4. GUARDAR CITA Y MOSTRAR RECIBO (CORREGIDO) =====
$('bookingForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const s = svcById.get(serviceSel.value);
  const name = $('custName').value.trim();
  const wa = $('wa').value.trim();
  const dayStr = $('date').value;
  const timeStr = $('timeVal').value;

  if (!s || !name || !dayStr || !timeStr) { toast('Completa todos los campos requeridos', 'error'); return; }
  if (wa && !/^[0-9]{10}$/.test(wa)) { toast('El WhatsApp debe tener 10 dígitos', 'error'); return; }

  const payload = {
    owner_id: ownerId,
    customer_name: name,
    whatsapp: wa,
    service_id: s.id,
    service_name: s.name,
    price: s.price,
    duration_minutes: s.duration_min,
    app_date: dayStr,
    app_time: timeStr,
    notes: $('note').value.trim()
  };

  try {
    const { error: rpcErr } = await sb.rpc('create_public_appointment', payload);
    
    if (rpcErr) throw rpcErr;

    const fecha = new Date(`${dayStr}T00:00:00`);
    const fechaTexto = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    const [h, m] = timeStr.split(':');
    const hora12h = new Date(0, 0, 0, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    
    $('confirmDate').textContent = `Día: ${fechaTexto}`;
    $('confirmTime').textContent = `Hora: ${hora12h}`;
    $('confirmService').textContent = `Servicio: ${s.name}`;
    
    $('confirmBackdrop').style.display = 'flex';

    ev.target.reset();
    // AQUÍ ESTÁ LA CORRECCIÓN:
    updateSvcInfo();
    renderSlots();
    
  } catch (e) {
    console.error("Error al registrar la cita:", e);
    toast('No pudimos registrar la cita. ' + e.message, 'error');
  }
   });



   // ===== 5. MANEJO DE LA VENTANA DE CONFIRMACIÓN =====
const confirmBackdrop = $('confirmBackdrop');

// Función para cerrar la ventana modal
function closeModal() {
  confirmBackdrop.style.display = 'none';
}

// Cuando se hace clic en el botón "¡Listo!"
$('confirmOk').addEventListener('click', closeModal);

// Opcional pero recomendado: cerrar la ventana si se hace clic fuera de ella
confirmBackdrop.addEventListener('click', (e) => {
  if (e.target === confirmBackdrop) {
    closeModal();
  }
});
document.getElementById('loader').classList.add('hidden');
  })();