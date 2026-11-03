// Sesión de "Mi catálogo": se entra una sola vez con el PIN y queda guardada en el teléfono.
(function(){
  'use strict';
  const db = window.db;
  const EMAIL = 'taller@omnipotente.app';
  let perfilActual = null;

  async function sesionActual(){
    if(!db) return null;
    try{
      const { data } = await db.auth.getSession();
      return data && data.session ? data.session : null;
    } catch(e){ return null; }
  }
  async function perfil(){
    if(perfilActual) return perfilActual;
    const s = await sesionActual();
    if(!s) return null;
    const CLAVE = 'omni_perfil_' + s.user.id;
    let data = null;
    try{
      const r = await db.from('perfiles').select('*').eq('id', s.user.id).maybeSingle();
      if(!r.error) data = r.data || null;
    } catch(e){}
    if(data){ try{ localStorage.setItem(CLAVE, JSON.stringify(data)); } catch(e){} }
    else { try{ data = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch(e){ data = null; } }
    perfilActual = data || { nombre:'Indumetálicas', rol:'admin' };
    return perfilActual;
  }
  // Si no hay sesión, a la pantalla del PIN
  async function requerir(){
    const s = await sesionActual();
    if(!s){ location.replace('entrar.html'); return null; }
    return perfil();
  }
  async function entrar(pin){
    const { data, error } = await db.auth.signInWithPassword({ email: EMAIL, password: pin });
    if(error) throw error;
    perfilActual = null;
    return data.session;
  }
  async function salir(){
    perfilActual = null;
    try{ Object.keys(localStorage).filter(k => k.startsWith('omni_')).forEach(k => localStorage.removeItem(k)); } catch(e){}
    try{ await db.auth.signOut(); } catch(e){}
  }
  async function cambiarPin(pin){
    const { error } = await db.auth.updateUser({ password: pin });
    if(error) throw error;
  }

  window.Sesion = { sesionActual, perfil, requerir, entrar, salir, cambiarPin };
  if(document.body && document.body.dataset.requiereSesion === 'si') requerir();
})();
