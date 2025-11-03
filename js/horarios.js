(async function () {

  const loader = manageLoader(); // <<--- AÑADE ESTA LÍNEA
    loader.show();                 // <<--- AÑADE ESTA LÍNEA


    // Helpers
    function showToast(msg, type='info', ms=2200){
      const t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg;
      t.className = `toast toast--${type} is-visible`;
      t.hidden = false;
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(()=>{ t.classList.remove('is-visible'); t.hidden = true; }, ms);
    }
    function hexToRgb(hex){
      const n = hex.replace('#','');
      const big = parseInt(n.length===3 ? n.split('').map(c=>c+c).join('') : n.slice(0,6), 16);
      return { r:(big>>16)&255, g:(big>>8)&255, b:big&255 };
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
    const DOWS = [null,'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

    const pad = n => String(n).padStart(2,'0');
    const timeToMin = v => { const p=v.split(':'); const h=+(p[0]||0), m=+(p[1]||0); return (h*60+m)|0; }
    const minToTime = m => `${pad(Math.floor(m/60))}:${pad(m%60)}`;

    // Sesión
    const { data: userData } = await sb.auth.getUser();
    if (!userData || !userData.user){ location.href = 'login.html'; return; }
    const userId = userData.user.id;

    // Tema + portada
    const bizResp = await sb
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const biz = bizResp.data, bizErr = bizResp.error;
    if (bizErr){ console.error(bizErr); showToast('Error cargando negocio','error'); return; }
    if (!biz){ location.href = 'personalizacion.html'; return; }

    const root = document.documentElement;
    const brand = (biz.brand || '#DD338B').toUpperCase();
    root.style.setProperty('--brand', brand);
    const rgb = hexToRgb(brand);
    root.style.setProperty('--brand-rgb', `${rgb.r} ${rgb.g} ${rgb.b}`);
    root.style.setProperty('--bg', biz.bg_pastel || '#FAE9F2');

    // banner
    const logoEl = document.getElementById('bizLogo');
    const pageCover = document.getElementById('pageCover');
    const bannerEl = document.getElementById('banner');
    document.getElementById('bizName').textContent = biz.business_name || 'Mi negocio';
    logoEl.src = biz.logo_url || './assets/logo.svg';
    logoEl.onerror = ()=>{ logoEl.src = './assets/logo.svg'; };
    if (biz.cover_url){
      pageCover.style.backgroundImage = `url('${biz.cover_url}')`;
      bannerEl.style.setProperty('--cover-url', `url('${biz.cover_url}')`);
      bannerEl.classList.add('banner--with-cover');
    }


    document.querySelector('main.phone.fade-in-content').style.opacity = '1';

    // Menú
    const menuBtn   = document.getElementById('menuBtn');
    const menuPanel = document.getElementById('menuPanel');
    function closeMenu(){
      if (menuPanel.hidden) return;
      menuPanel.hidden = true;
      menuBtn.setAttribute('aria-expanded','false');
    }
    menuBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const open = menuPanel.hidden;
      menuPanel.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e)=>{
      if (!menuPanel.hidden && !menuPanel.contains(e.target) && e.target !== menuBtn) closeMenu();
    });
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeMenu(); });
    menuPanel.addEventListener('click', async (e)=>{
      if (e?.target?.dataset?.action === 'logout'){
        try{ await sb.auth.signOut(); location.href='login.html'; }catch(err){ console.error(err); }
      }
    });

    // UI: Horarios
    const hoursEl = document.getElementById('hours');
    function makeRow(dow, enabled=true, start_min=480, end_min=1080){
      const row = document.createElement('div');
      row.className = 'row';
      if(!enabled) row.classList.add('disabled');

      const lab = document.createElement('label');
      const cb  = document.createElement('input');
      cb.type='checkbox'; cb.checked = enabled; cb.addEventListener('change', ()=> row.classList.toggle('disabled', !cb.checked));
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(DOWS[dow]));

      const iStart = document.createElement('input'); iStart.type='time'; iStart.value = minToTime(start_min);
      const iEnd   = document.createElement('input'); iEnd.type='time';   iEnd.value   = minToTime(end_min);

      row.dataset.dow = dow;
      row.appendChild(lab);
      row.appendChild(iStart);
      row.appendChild(iEnd);
      return row;
    }

    async function loadHours(){
      const resp = await sb
        .from('working_hours')
        .select('*')
        .eq('user_id', userId)
        .order('dow', { ascending:true });

      hoursEl.innerHTML = '';
      if (resp.error){ console.error(resp.error); showToast('No se pudieron cargar horarios','error'); return; }

      const data = resp.data || [];
      if (!data.length){
        for(let dow=1; dow<=7; dow++){
          const enabled = dow !== 7; // Domingo cerrado por defecto
          hoursEl.appendChild(makeRow(dow, enabled, 480, 1080));
        }
      }else{
        data.forEach(it => hoursEl.appendChild(makeRow(it.dow, it.enabled, it.start_min, it.end_min)));
      }
    }

    document.getElementById('btnSaveHours').addEventListener('click', async ()=>{
      const rows = Array.from(hoursEl.querySelectorAll('.row'));
      const payload = rows.map(r=>{
        const dow = Number(r.dataset.dow);
        const enabled = r.querySelector('input[type="checkbox"]').checked;
        const [iStart, iEnd] = r.querySelectorAll('input[type="time"]');
        const start_min = timeToMin(iStart.value || '08:00');
        const end_min   = timeToMin(iEnd.value   || '18:00');
        return { user_id: userId, dow, enabled, start_min, end_min, updated_at: new Date().toISOString() };
      });

      const up = await sb.from('working_hours').upsert(payload, { onConflict:'user_id,dow' });
      if (up.error){ console.error(up.error); showToast('No se pudo guardar','error'); return; }
      showToast('Horarios guardados','success');
      await loadHours();
    });

    // ====== BLOQUEOS: sin desfase ======
    const blockDateEl = document.getElementById('blockDate');
    const chipsEl     = document.getElementById('chips');

    // Formatea "aaaa-mm-dd" a una etiqueta agradable SIN cambiar el día
    function labelFromISO(iso){
      const [y,m,d] = iso.split('-').map(Number);
      const dt = new Date(y, m-1, d); // sólo para mostrar
      return dt.toLocaleDateString('es-ES',{ weekday:'short', day:'2-digit', month:'short', year:'numeric' });
    }

    function renderBlocks(items){
      chipsEl.innerHTML = '';
      if (!items?.length) return;
      items.forEach(it=>{
        const chip = document.createElement('div'); chip.className='chip';
        const span = document.createElement('span');
        span.textContent = labelFromISO(it.date); // <- NO new Date(it.date)
        const btn  = document.createElement('button'); btn.textContent='Quitar';
        btn.addEventListener('click', async ()=>{
          const del = await sb.from('day_blocks').delete().eq('user_id', userId).eq('date', it.date);
          if (del.error){ console.error(del.error); showToast('No se pudo quitar','error'); return; }
          showToast('Bloqueo eliminado','success'); await loadBlocks();
        });
        chip.appendChild(span); chip.appendChild(btn); chipsEl.appendChild(chip);
      });
    }

    async function loadBlocks(){
      const resp = await sb
        .from('day_blocks')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending:true });

      if (resp.error){ console.error(resp.error); showToast('No se pudieron cargar bloqueos','error'); return; }
      renderBlocks(resp.data || []);
    }

    document.getElementById('btnAddBlock').addEventListener('click', async ()=>{
      const d = (blockDateEl.value || '').trim(); // <input type="date"> ya trae YYYY-MM-DD
      if (!d){ showToast('Selecciona una fecha','error'); return; }
      const ins = await sb.from('day_blocks').insert({ user_id:userId, date:d }); // <- guardar cadena exacta
      if (ins.error){ console.error(ins.error); showToast('No se pudo añadir bloqueo','error'); return; }
      blockDateEl.value = '';
      showToast('Bloqueo añadido','success');
      await loadBlocks();
    });

    // Init
    await loadHours();
    await loadBlocks();
    document.getElementById('loader').classList.add('hidden');

    loader.hide();
  })();