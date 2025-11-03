(async () => {


  const loader = manageLoader(); // <<--- AÑADE ESTA LÍNEA
    loader.show();                 // <<--- AÑADE ESTA LÍNEA


    /* ===== Funciones de Ayuda (Helpers) ===== */
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




    const groupThousands = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    /* ===== Sesión y Autenticación ===== */
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) { location.href = 'login.html'; return; }
    const userId = u.user.id;

    /* ===== Carga de datos del negocio para tema y portada ===== */
    const { data: biz, error: bizErr } = await sb
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bizErr) { console.error(bizErr); showToast('Error cargando negocio','error'); return; }
    if (!biz) { location.href = 'personalizacion.html'; return; }

    // Aplicar tema (colores, etc.)
    const root = document.documentElement;
    const brand = (biz.brand || '#DD338B').toUpperCase();
    root.style.setProperty('--brand', brand);
    const {r,g,b} = hexToRgb(brand);
    root.style.setProperty('--brand-rgb', `${r} ${g} ${b}`);
    root.style.setProperty('--bg', biz.bg_pastel || '#FAE9F2');

    // Configurar Header y fondo
    document.getElementById('bizName').textContent = biz.business_name || 'Mi negocio';
    const logoEl = document.getElementById('bizLogo');
    const defaultLogo = './assets/logo.svg';
    logoEl.src = biz.logo_url || defaultLogo;
    logoEl.onerror = () => { logoEl.src = defaultLogo; };

    const pageCover = document.getElementById('pageCover');
    const banner    = document.getElementById('banner');
    if (biz.cover_url) {
      pageCover.style.backgroundImage = `url('${biz.cover_url}')`;
      banner.style.setProperty('--cover-url', `url('${biz.cover_url}')`);
      banner.classList.add('banner--with-cover');
    }


    document.querySelector('main.phone').style.opacity = '1';

    /* ===== Menú Desplegable (3 puntos) ===== */
    const menuBtn   = document.getElementById('menuBtn');
    const menuPanel = document.getElementById('menuPanel');
    function closeMenu() {
      if (menuPanel.hidden) return;
      menuPanel.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menuPanel.hidden;
      menuPanel.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!menuPanel.hidden && !menuPanel.contains(e.target) && e.target !== menuBtn) closeMenu();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    menuPanel.addEventListener('click', async (e) => {
      if (e.target?.dataset?.action === 'logout') {
        try { await sb.auth.signOut(); location.href = 'login.html'; }
        catch(err){ console.error(err); }
      }
    });

    /* ===== Lógica CRUD para Servicios ===== */
    const listEl   = document.getElementById('svcList');
    const nameEl   = document.getElementById('svcName');
    const priceEl  = document.getElementById('svcPrice');
    const minEl    = document.getElementById('svcMin');
    const btnSave  = document.getElementById('btnSave');
    const btnCancel= document.getElementById('btnCancel');
    let editingId = null;

    // Formateo de miles en el campo de Precio
    function formatPriceInput() {
      const digits = priceEl.value.replace(/\D/g, '');
      if (!digits) { priceEl.value = ''; return; }
      priceEl.value = groupThousands(digits);
    }
    priceEl.addEventListener('input', formatPriceInput);
    priceEl.addEventListener('blur', formatPriceInput);

    async function loadServices(){
      const { data, error } = await sb
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) { console.error(error); showToast('No se pudieron cargar los servicios', 'error'); return; }
      renderList(data || []);
    }

    function renderList(items){
      listEl.innerHTML = '';
      if (!items.length){
        const empty = document.createElement('div');
        empty.className = 'card empty';
        empty.textContent = 'Aún no tienes servicios. Añade el primero arriba.';
        listEl.appendChild(empty);
        return;
      }
      for (const it of items){
        const row = document.createElement('div');
        row.className = 'svc-item';
        const name = document.createElement('div');
        name.className = 'svc-name';
        name.textContent = it.name;
        const price = document.createElement('div');
        price.className = 'svc-price';
        price.textContent = `$ ${groupThousands(Math.round(Number(it.price)||0))}`;
        const dur = document.createElement('div');
        dur.className = 'svc-min';
        dur.textContent = `${it.duration_min} min`;
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.justifyContent = 'flex-end';
        const editBtn = document.createElement('button');
        editBtn.className = 'small-btn';
        editBtn.textContent = '✏️ Editar';
        editBtn.onclick = () => startEdit(it);
        const delBtn = document.createElement('button');
        delBtn.className = 'small-btn danger';
        delBtn.textContent = '🗑️ Borrar';
        delBtn.onclick = () => removeService(it.id);
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        row.appendChild(name);
        row.appendChild(price);
        row.appendChild(dur);
        row.appendChild(actions);
        listEl.appendChild(row);
      }
    }

    function startEdit(it){
      editingId = it.id;
      nameEl.value = it.name;
      priceEl.value = groupThousands(Math.round(Number(it.price)||0));
      minEl.value = it.duration_min;
      btnSave.textContent = 'Guardar cambios';
      btnCancel.hidden = false;
      nameEl.focus();
    }

    function resetForm(){
      editingId = null;
      nameEl.value = '';
      priceEl.value = '';
      minEl.value = '';
      btnSave.textContent = 'Añadir servicio';
      btnCancel.hidden = true;
    }
    btnCancel.onclick = resetForm;

    btnSave.onclick = async () => {
      const name = nameEl.value.trim();
      const raw = priceEl.value.replace(/\./g,'').replace(/\D/g,'');
      const price = raw ? Number(raw) : 0;
      const mins  = parseInt(minEl.value || '0', 10);

      if (!name){ showToast('Escribe el nombre del servicio','error'); nameEl.focus(); return; }
      if (!mins || mins < 1){ showToast('Duración inválida','error'); minEl.focus(); return; }

      const payload = {
        user_id: userId,
        name,
        price,
        duration_min: mins,
      };

      if (editingId){
        const { error } = await sb.from('services').update(payload).eq('id', editingId);
        if (error){ console.error(error); showToast('No se pudo actualizar','error'); return; }
        showToast('Servicio actualizado','success');
      } else {
        const { error } = await sb.from('services').insert(payload);
        if (error){ console.error(error); showToast('No se pudo guardar','error'); return; }
        showToast('Servicio añadido','success');
      }
      resetForm();
      loadServices();
    };

    async function removeService(id){
      if (!confirm('¿Eliminar este servicio?')) return;
      const { error } = await sb.from('services').delete().eq('id', id);
      if (error){ console.error(error); showToast('No se pudo eliminar','error'); return; }
      showToast('Servicio eliminado','success');
      loadServices();
    }

    // Carga inicial de los servicios
    await loadServices();
    document.getElementById('loader').classList.add('hidden');

    loader.hide();
  })();