(async () => {
  // Principio de bajo acoplamiento: este archivo no depende de ningún otro archivo JS de la app,
  // solo de las librerías (Supabase) y la configuración (supabaseClient).

  // ===== 1. VERIFICACIÓN DE SESIÓN Y CONFIGURACIÓN INICIAL =====
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    location.href = 'login.html'; // Si no hay sesión, no se puede continuar
    return;
  }
  const userId = user.id;

  // ===== 2. REFERENCIAS A ELEMENTOS DEL DOM =====
  // Guardamos las referencias a los elementos HTML para no buscarlos repetidamente.
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const generateReportBtn = document.getElementById('generateReportBtn');
  const reportResult = document.getElementById('reportResult');
  
  // Referencias para el menú y personalización (código reutilizable)
  const menuBtn = document.getElementById('menuBtn');
  const menuPanel = document.getElementById('menuPanel');
  const bizNameEl = document.getElementById('bizName');
  const bizLogoEl = document.getElementById('bizLogo');

  // ===== 3. FUNCIONES HELPER (Ayudantes) =====
  // Funciones pequeñas y reutilizables específicas para este módulo.
  const fmtMoney = n => Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const fmtDate = isoStr => new Date(isoStr + 'T00:00:00').toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

// ...después de la función fmtDate
function hexToRgb(hex){ const n=hex.replace('#',''); const big=parseInt(n.length===3?n.split('').map(c=>c+c).join(''):n.slice(0,6),16); return{r:(big>>16)&255,g:(big>>8)&255,b:big&255};}







  // ===== 4. LÓGICA PRINCIPAL DEL REPORTE =====
  const generateReport = async () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    // Validación de entradas
    if (!startDate || !endDate) {
      alert('Por favor, selecciona una fecha de inicio y de fin.');
      return;
    }
    if (startDate > endDate) {
      alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    reportResult.innerHTML = '<div class="card empty">Generando reporte...</div>';

    try {
      // Consulta a Supabase: Traemos solo las citas "realizadas" en el rango de fechas.
      const { data: appointments, error } = await sb
        .from('appointments')
        .select('date, customer_name, service_name, price')
        .eq('user_id', userId)
        .eq('status', 'done') // La condición clave: solo citas completadas.
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error; // Si hay un error, lo lanzamos al catch.

      if (!appointments || appointments.length === 0) {
        reportResult.innerHTML = '<div class="card empty">No se encontraron citas realizadas en este período.</div>';
        return;
      }

      // Procesamiento de datos
      let grandTotal = 0;
      const dailyBreakdown = appointments.reduce((acc, appt) => {
        grandTotal += appt.price;
        const date = appt.date;
        if (!acc[date]) {
          acc[date] = { appointments: [], total: 0 };
        }
        acc[date].appointments.push(appt);
        acc[date].total += appt.price;
        return acc;
      }, {});

      // Renderizado del HTML con los resultados
      let html = `
        <div class="card total-summary">
          <h2>Total del Período</h2>
          <p class="grand-total">${fmtMoney(grandTotal)}</p>
          <small>Desde ${fmtDate(startDate)} hasta ${fmtDate(endDate)}</small>
        </div>
        <h3 class="breakdown-title">Desglose por Día</h3>
      `;

      for (const date in dailyBreakdown) {
        const dayData = dailyBreakdown[date];
        html += `
          <div class="card day-card">
            <div class="day-header">
              <span class="day-date">${fmtDate(date)}</span>
              <span class="day-total">${fmtMoney(dayData.total)}</span>
            </div>
            <ul class="day-appointments-list">
              ${dayData.appointments.map(appt => `
                <li>
                  <span>${appt.customer_name} (${appt.service_name || 'Servicio'})</span>
                  <span>${fmtMoney(appt.price)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
      reportResult.innerHTML = html;

    } catch (err) {
      console.error("Error generando el reporte:", err);
      reportResult.innerHTML = '<div class="card empty error">Ocurrió un error al generar el reporte.</div>';
    }
  };

  generateReportBtn.addEventListener('click', generateReport);

  // ===== 5. CÓDIGO DE INICIALIZACIÓN DE LA PÁGINA =====
  // Se ejecuta una sola vez cuando la página carga.
  
  // Poner la fecha de hoy por defecto en los selectores
  const today = new Date().toISOString().split('T')[0];
  startDateInput.value = today;
  endDateInput.value = today;
  
  // Lógica del menú (puedes mover esto a un archivo main.js si se repite mucho)
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menuPanel.hidden;
    menuPanel.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!menuPanel.hidden && !menuPanel.contains(e.target)) {
      menuPanel.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });
  menuPanel.querySelector('[data-action="logout"]').addEventListener('click', async () => {
      await sb.auth.signOut();
      location.href = 'login.html';
  });
  
// ===== LÓGICA CORREGIDA PARA RESALTAR LA PÁGINA ACTIVA EN EL MENÚ =====
const highlightActiveMenuItem = () => {
  // Obtiene la URL completa de la página actual. Ej: "http://.../ganancias.html"
  const currentPageUrl = window.location.href;

  // Busca todos los enlaces dentro del panel del menú
  const menuLinks = menuPanel.querySelectorAll('a[role="menuitem"]');

  menuLinks.forEach(link => {
    // Obtenemos el href del enlace. Ej: "./ganancias.html"
    const linkHref = link.getAttribute('href');

    // Comparamos si la URL actual TERMINA con el nombre del archivo del enlace.
    // Esto es mucho más fiable que comparar las rutas completas.
    // Ej: "http://.../ganancias.html".endsWith("ganancias.html") -> true
    if (currentPageUrl.endsWith(linkHref.replace('./', ''))) {
      link.classList.add('is-active');
    }
  });
};








  
  // REEMPLAZA el bloque "Cargar datos del negocio" con este:

// Cargar datos del negocio y aplicar tema de color
const { data: biz } = await sb.from('businesses').select('*').eq('user_id', userId).single();
if (biz) {
    // Actualizar UI
    bizNameEl.textContent = biz.business_name || 'Mi negocio';
    bizLogoEl.src = biz.logo_url || './assets/logo.svg';
    document.title = `${biz.business_name} · Ganancias`;

    // Aplicar el tema de color dinámico
    const root = document.documentElement;
    const brandColor = biz.brand || '#DD338B'; // Color por defecto
    const { r, g, b } = hexToRgb(brandColor);

    root.style.setProperty('--brand', brandColor);
    root.style.setProperty('--brand-rgb', `${r} ${g} ${b}`);
    root.style.setProperty('--bg', biz.bg_pastel || '#FAE9F2');
}

document.querySelector('main.phone').style.opacity = '1';

})();