window.SB_API = 'https://styletime-proxy.luzangelarodriguez3.workers.dev';

// El cliente ya no necesita las claves directamente,
// ahora todas las peticiones pasarán por el Worker
window.sb = {
  async from(table) {
    return {
      select: async (query = '*') => {
        const res = await fetch(`${window.SB_API}/rest/v1/${table}?select=${query}`);
        const data = await res.json();
        return { data, error: null };
      }
    };
  }
};


