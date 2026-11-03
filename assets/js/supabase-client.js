// Conexión con Supabase (proyecto de Indumetálicas El Omnipotente).
// La clave publicable es pública por diseño: la seguridad la da RLS en la base.
(function () {
  var URL = 'https://jawqbrzarexwpgggnlxc.supabase.co';
  var KEY = 'sb_publishable_9gDhLwOI_dr7WgI6at4f4w_Jbib1sEx';
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    // La sesión queda guardada en el teléfono y se renueva sola: no hay que volver a poner el PIN
    window.db = window.supabase.createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'omni-sesion' } });
  } else {
    window.db = null;
  }
})();
