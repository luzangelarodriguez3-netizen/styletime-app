(async () => {


            


    // ===== Sesión =====
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) { location.href = 'login.html'; return; }
    const userId = u.user.id;

    // ===== Helpers =====
    const daysGrid = document.getElementById('daysGrid');
    const apptList = document.getElementById('apptList');
    const dayTitle = document.getElementById('dayTitle');

    function hexToRgb(hex){
      const n = hex.replace('#','');
      const big = parseInt(n.length===3 ? n.split('').map(c=>c+c).join('') : n.slice(0,6), 16);
      return { r:(big>>16)&255, g:(big>>8)&255, b:big&255 };
    }
    function showToast(msg, type='info', ms=2200){
      const t=document.getElementById('toast'); if(!t) return;
      t.textContent=msg;
      t.className=`toast toast--${type} is-visible`;
      t.hidden=false;
      clearTimeout(window._toastTimer);
      window._toastTimer=setTimeout(()=>{ t.classList.remove('is-visible'); t.hidden=true; }, ms);
    }
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




    const fmtMoney = n => Number(n||0).toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0});
    const addMinutes = (hhmm, mins) => {
      const [h,m] = (hhmm||'00:00').split(':').map(Number);
      const d = new Date(0,0,0,h||0,m||0,0);
      d.setMinutes(d.getMinutes() + (mins||0));
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    };
    const to12h = hhmm => {
      const [h,m] = (hhmm||'00:00').split(':').map(Number);
      return new Date(0,0,0,h||0,m||0).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}).toUpperCase();
    };

    // ===== Tema / negocio =====
    const { data: biz, error: bizErr } = await sb
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (bizErr) { console.error(bizErr); return; }
    if (!biz) { location.href = 'personalizacion.html'; return; }

    const nameEl = document.getElementById('bizName');
    nameEl.textContent = biz.business_name || 'Mi negocio';
    document.title = `${nameEl.textContent} · Citas canceladas`;

    const root = document.documentElement;
    const brand = (biz.brand || '#DD338B').toUpperCase();
    const { r,g,b } = hexToRgb(brand);
    root.style.setProperty('--brand', brand);
    root.style.setProperty('--brand-rgb', `${r} ${g} ${b}`);
    root.style.setProperty('--bg', biz.bg_pastel || '#FAE9F2');

    const logoEl = document.getElementById('bizLogo');
    logoEl.src = biz.logo_url || './assets/logo.svg';
    logoEl.onerror = () => { logoEl.src = './assets/logo.svg'; };

    const banner = document.getElementById('banner');
    const pageCover = document.getElementById('pageCover');
    if (biz.cover_url){
      pageCover.style.backgroundImage = `url('${biz.cover_url}')`;
      banner.style.setProperty('--cover-url', `url('${biz.cover_url}')`);
      banner.classList.add('banner--with-cover');
    }

    document.querySelector('main.phone').style.opacity = '1';

    // ===== Menú (3 punticos) =====
    const menuBtn = document.getElementById('menuBtn');
    const menuPanel = document.getElementById('menuPanel');
    function closeMenu(){ if(menuPanel.hidden) return; menuPanel.hidden = true; menuBtn.setAttribute('aria-expanded','false'); }
    menuBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const open = menuPanel.hidden; menuPanel.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('click', (e)=>{ if(!menuPanel.hidden && !menuPanel.contains(e.target) && e.target !== menuBtn){ closeMenu(); }});
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeMenu(); });
    menuPanel.addEventListener('click', async (e)=>{ if(e.target?.dataset?.action === 'logout'){ try{ await sb.auth.signOut(); location.href='login.html'; } catch(err){ console.error(err); }}});


    

    // ===== Calendario =====
    const monthName = document.getElementById('monthName');
    const yearNum = document.getElementById('yearNum');
    const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth()+1).padStart(2,'0')}-${String(todayObj.getDate()).padStart(2,'0')}`;

    let current = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);

    function renderMonth(d){
      monthName.textContent = MONTHS[d.getMonth()];
      yearNum.textContent   = d.getFullYear();
      daysGrid.innerHTML = '';

      const firstDow = (new Date(d.getFullYear(), d.getMonth(), 1).getDay() + 6) % 7;
      const lastDate = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();

      for (let i=0;i<firstDow;i++){
        const e = document.createElement('div');
        e.className = 'day is-empty';
        daysGrid.appendChild(e);
      }
      for (let day=1; day<=lastDate; day++){
        const e = document.createElement('div');
        e.className = 'day';
        e.textContent = day;
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        const dayStr = `${y}-${m}-${String(day).padStart(2,'0')}`;
        e.dataset.date = dayStr;
        daysGrid.appendChild(e);
      }
    }

    // ===== Cargar citas canceladas de un día =====
    async function loadCancelledAppointments(dayISO){
      apptList.innerHTML = '<div class="card empty">Cargando citas...</div>';

      const { data, error } = await sb
        .from('appointments')
        .select('customer_name, service_name, price, time, duration_minutes')
        .eq('user_id', userId)
        .eq('date', dayISO)
        .eq('status','cancelled')
        .order('time', { ascending: true });

      apptList.innerHTML = '';
      if (error){
        console.error(error);
        apptList.innerHTML = '<div class="card empty">Error al cargar las citas.</div>';
        return;
      }
      if (!data || !data.length){
        apptList.innerHTML = '<div class="card empty">No hay citas canceladas para este día.</div>';
        return;
      }

      for (const a of data){
        const start = a.time;
        const end   = addMinutes(start, a.duration_minutes || 0);
        const timeRange = `${to12h(start)}–${to12h(end)}`;

        const card = document.createElement('div');
        card.className = 'card appt appt--cancelled'; // ¡AÑADIMOS LA CLASE AQUÍ!
        const left = document.createElement('div');
        left.innerHTML = `
          <div class="appt__name">${a.customer_name || ''}</div>
          <div class="appt__meta">
            <span>${a.service_name || ''}</span>
            <span class="appt__price">${fmtMoney(a.price)}</span>
          </div>
        `;

        const right = document.createElement('div');
        right.className = 'appt__time';
        right.textContent = timeRange;

        card.appendChild(left);
        card.appendChild(right);
        apptList.appendChild(card);
      }
    }

    // Navegación del mes
    document.getElementById('prevMonth').onclick = async () => {
      current = new Date(current.getFullYear(), current.getMonth()-1, 1);
      renderMonth(current);
    };
    document.getElementById('nextMonth').onclick = async () => {
      current = new Date(current.getFullYear(), current.getMonth()+1, 1);
      renderMonth(current);
    };

    // Click día (marca seleccionado y carga canceladas)
    daysGrid.addEventListener('click', async (e)=>{
      const box = e.target.closest('.day');
      if (!box || box.classList.contains('is-empty')) return;

      daysGrid.querySelectorAll('.day.is-selected').forEach(d=>d.classList.remove('is-selected'));
      box.classList.add('is-selected');

      const dateStr = box.dataset.date;
      const d = new Date(`${dateStr}T00:00:00`);
      const fmt = d.toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' });
      dayTitle.textContent = `Citas canceladas del ${fmt}`;

      await loadCancelledAppointments(dateStr);
    });

    // PEGA ESTE NUEVO BLOQUE EN SU LUGAR:

// ===== Carga inicial (Versión Progresiva) =====
// 1. Dibuja la estructura del calendario INMEDIATAMENTE.
renderMonth(current);

// 2. Selecciona el día de hoy en el calendario.
const todayEl = daysGrid.querySelector(`[data-date="${todayStr}"]`);
if (todayEl){
  todayEl.classList.add('is-selected');
  dayTitle.textContent = `Citas canceladas de hoy (${todayObj.toLocaleDateString('es-ES', {day:'numeric', month:'long'})})`;
}

// 3. Ahora, pide los datos "pesados" (citas canceladas del día)
//    y deja que se carguen en segundo plano sin bloquear la página.
loadCancelledAppointments(todayStr);


    
  })();