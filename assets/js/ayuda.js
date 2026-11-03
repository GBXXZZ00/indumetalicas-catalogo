// Ayuda de la app: un botón "Ayuda" (con su palabra) en cada pantalla y en cada hoja.
// Al tocarlo sube una hoja con SOLO la parte del manual de esa pantalla, filtrada por
// quien entró (vendedora, administrador o trabajador). El contenido vive en
// assets/ayuda/<modulo>.html (una <section data-b="..."> por parte) y se genera con
// pruebas/manual/construir.py desde los manuales. Nada se descarga hasta que se toca Ayuda.
(function(){
  'use strict';
  const src = (document.currentScript && document.currentScript.src) || '';
  const V = (src && new URL(src).searchParams.get('v')) || '1';
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const MODULOS = { catalogo:'Mi catálogo' };
  const ICONO = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7M9 11.5h5"/></svg>';

  // ---------------------------------------------------------------------------
  // Qué parte del manual sale en cada lugar. "mod:bloque" toma el bloque de otro manual.
  // b puede ser una función: se decide al tocar (según el tipo de producto, la acción, etc.).
  // ---------------------------------------------------------------------------
  const txt = (sel) => ((document.querySelector(sel) || {}).textContent || '').trim();
  const slug = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const PAGINAS = {
    'catalogo.html': [
      { ref:'#btnCopiar', etiqueta:'Copiar link', mod:'catalogo', t:'Tu catálogo',
        b:['intro', 'registrar-un-modelo', 'entrega-inmediata', 'despues-de-registrar'] },
      { ref:'#sheetForm [data-cerrar="sheetForm"]', etiqueta:'Cerrar', mod:'catalogo', t: () => txt('#formTitulo'),
        b: () => /pieza|inmediata/i.test(txt('#formTitulo')) ? ['entrega-inmediata'] : ['registrar-un-modelo'] },
      { ref:'#sheetDetalle .sheet-x', flotante:true, mod:'catalogo', t:'Lo que puedes hacer aquí',
        b:['despues-de-registrar', 'entrega-inmediata'] }
    ]
  };


  // ---------------------------------------------------------------------------
  // Quién entró: 'a' administrador, 'v' vendedora, 't' trabajador
  // ---------------------------------------------------------------------------
  let rol = 'v';
  let confirmaPagos = false;   // quien confirma pagos (Ray) ve esa parte aunque no sea administrador
  async function leerRol(){
    try{
      const p = window.Sesion ? await window.Sesion.perfil() : null;
      rol = p && p.rol === 'admin' ? 'a' : p && p.rol === 'trabajador' ? 't' : 'v';
      confirmaPagos = !!(p && p.confirma_abonos);
    } catch(e){}
    return rol;
  }

  // ---------------------------------------------------------------------------
  // Contenido: se baja la primera vez que se abre y queda guardado (el teléfono lo guarda con ?v=)
  // ---------------------------------------------------------------------------
  const cache = {};
  function cargar(mod){
    if(!cache[mod]){
      cache[mod] = fetch(`assets/ayuda/${mod}.html?v=${V}`).then(r => {
        if(!r.ok) throw new Error('No se pudo cargar la ayuda');
        return r.text();
      }).then(h => {
        const t = document.createElement('template');
        t.innerHTML = h;
        return t.content;
      }).catch(e => { delete cache[mod]; throw e; });
    }
    return cache[mod];
  }
  function cssListo(){
    if(document.getElementById('ayudaCss')) return;
    const l = document.createElement('link');
    l.id = 'ayudaCss'; l.rel = 'stylesheet'; l.href = `assets/css/ayuda.css?v=${V}`;
    document.head.appendChild(l);
  }
  // Una sección se ve si le toca a quien entró
  function leToca(s){
    const c = s.classList;
    if(c.contains('solo-admin') && rol !== 'a' && !(confirmaPagos && s.dataset.b === 'confirmar-un-pago-admin')) return false;
    if(c.contains('solo-vend') && rol === 'a') return false;
    return true;
  }
  // Copia las secciones pedidas (en ese orden) con las fotos apuntando a assets/ayuda/img
  async function secciones(mod, bloques){
    const out = [];
    for(const b0 of bloques){
      const [m, b] = b0.includes(':') ? b0.split(':') : [mod, b0];
      const frag = await cargar(m);
      const s = frag.querySelector(`section[data-b="${CSS.escape(b)}"]`);
      if(!s || !leToca(s)) continue;
      const c = s.cloneNode(true);
      c.querySelectorAll('img').forEach(i => {
        const r = i.getAttribute('src') || '';
        if(r.startsWith('img/')) i.setAttribute('src', `assets/ayuda/${r}?v=${V}`);
        i.setAttribute('loading', 'lazy');
      });
      out.push(c);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // La hoja de ayuda (una sola, arriba de todo)
  // ---------------------------------------------------------------------------
  function asegurarHoja(){
    if(document.getElementById('sheetAyuda')) return;
    const sc = document.createElement('div');
    sc.className = 'sheet-scrim ayuda-scrim'; sc.id = 'scrimAyuda'; sc.dataset.cerrar = 'sheetAyuda';
    const h = document.createElement('section');
    h.className = 'sheet ayuda-hoja'; h.id = 'sheetAyuda';
    h.setAttribute('role', 'dialog'); h.setAttribute('aria-modal', 'true'); h.setAttribute('aria-labelledby', 'ayudaTitulo');
    h.innerHTML = `<div class="sheet-handle"></div>
      <div class="sheet-head"><div class="ayuda-cab"><span class="ayuda-mod" id="ayudaMod"></span><h2 class="sheet-title" id="ayudaTitulo">Ayuda</h2></div>
        <button class="icon-btn" type="button" data-cerrar="sheetAyuda" aria-label="Cerrar la ayuda"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="sheet-body"><div class="ayuda-c" id="ayudaBody"></div></div>
      <div class="sheet-foot hidden"><a class="btn-secondary ayuda-todo" id="ayudaTodo" href="#">Ver el manual completo</a></div>`;
    document.body.appendChild(sc);
    document.body.appendChild(h);
    if(window.AH && window.AH.activarDeslizar) window.AH.activarDeslizar(h);
  }
  let turno = 0;   // si se abre otra ayuda antes de que llegue la anterior, la vieja no pisa a la nueva
  async function abrir(lugar){
    const mio = ++turno;
    asegurarHoja();
    cssListo();
    await leerRol();
    const val = (x) => typeof x === 'function' ? x() : x;
    const mod = val(lugar.mod);
    const bloques = (val(lugar.b) || []).filter(Boolean);
    const cuerpo = document.getElementById('ayudaBody');
    cuerpo.className = 'ayuda-c ' + rol;
    document.getElementById('ayudaMod').textContent = 'Ayuda · ' + (MODULOS[mod] || '');
    document.getElementById('ayudaTitulo').textContent = val(lugar.t) || 'Ayuda';
    document.getElementById('ayudaTodo').setAttribute('href', 'ayuda.html?m=' + encodeURIComponent(mod));
    document.getElementById('ayudaTodo').textContent = 'Ver el manual completo';
    // Desde un formulario abierto no se sale de la pantalla: se perdería lo escrito
    document.querySelector('#sheetAyuda .sheet-foot').classList.toggle('hidden', !!lugar.enHoja);
    cuerpo.innerHTML = '<div class="ayuda-cargando"><div class="sk-linea"></div><div class="sk-linea"></div><div class="sk-linea corta"></div></div>';
    const body = document.querySelector('#sheetAyuda .sheet-body');
    body.scrollTop = 0;
    window.AH.abrirHoja('sheetAyuda');
    try{
      const ss = await secciones(mod, bloques);
      if(mio !== turno) return;
      cuerpo.innerHTML = '';
      if(!ss.length) cuerpo.innerHTML = '<p class="sub">Todavía no hay ayuda para esta pantalla. Mira el manual completo.</p>';
      ss.forEach(s => cuerpo.appendChild(s));
    } catch(e){
      if(mio !== turno) return;
      cuerpo.innerHTML = `<div class="ayuda-error"><b>No se pudo abrir la ayuda.</b><span>Revisa tu internet y toca otra vez.</span><button type="button" class="btn-secondary" data-ayuda-reintentar>Reintentar</button></div>`;
      cuerpo.querySelector('[data-ayuda-reintentar]').addEventListener('click', () => abrir(lugar));
    }
  }

  // ---------------------------------------------------------------------------
  // Botón "Ayuda" con su palabra. El botón de al lado también lleva la suya (Actualizar, Cerrar…).
  // ---------------------------------------------------------------------------
  function botonAyuda(flotante){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = flotante ? 'ayuda-flota' : 'ayuda-btn';
    b.setAttribute('aria-label', 'Ayuda de esta pantalla');
    b.innerHTML = flotante ? `${ICONO}<span>Ayuda</span>` : `<span class="ayuda-caja">${ICONO}</span><span class="ayuda-pal">Ayuda</span>`;
    return b;
  }
  function poner(lugar){
    const b = botonAyuda(!!lugar.flotante);
    b.addEventListener('click', (e) => { e.stopPropagation(); abrir(lugar); });
    if(lugar.alFinal){
      const cont = document.querySelector(lugar.alFinal);
      if(!cont || cont.querySelector('.ayuda-btn')) return;
      cont.appendChild(b);
      return;
    }
    const ref = document.querySelector(lugar.ref);
    if(!ref || ref.parentElement.querySelector(':scope > .ayuda-btn, :scope > .ayuda-flota, :scope > .ayuda-par')) return;
    const hoja = ref.closest('.sheet');
    lugar.enHoja = !!hoja;
    if(lugar.flotante){
      ref.parentElement.insertBefore(b, ref);
      if(hoja) hoja.classList.add('con-ayuda-flota');
      return;
    }
    // Los dos botones juntos, cada uno con su palabra debajo
    const par = document.createElement('div');
    par.className = 'ayuda-par';
    ref.parentElement.insertBefore(par, ref);
    const col = document.createElement('span');
    col.className = 'ayuda-col';
    col.appendChild(ref);
    const pal = document.createElement('span');
    pal.className = 'ayuda-pal gris';
    pal.textContent = lugar.etiqueta || '';
    pal.setAttribute('aria-hidden', 'true');
    col.appendChild(pal);
    par.appendChild(b);
    par.appendChild(col);
  }
  function iniciar(){
    const pagina = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    (PAGINAS[pagina] || []).forEach(poner);
    leerRol();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

  // ---------------------------------------------------------------------------
  // Manual completo (ayuda.html): todas las partes de un manual, o la lista de manuales
  // ---------------------------------------------------------------------------
  async function manualCompleto(mod, cont){
    cssListo();
    await leerRol();
    const frag = await cargar(mod);
    const bloques = [...frag.querySelectorAll('section[data-b]')].filter(s => !s.dataset.solo).map(s => s.dataset.b);
    const ss = await secciones(mod, bloques);
    cont.classList.remove('a', 'v', 't');
    cont.classList.add('ayuda-c', rol);
    cont.innerHTML = '';
    ss.forEach(s => cont.appendChild(s));
  }
  function manualesDe(r){
    if(r === 't') return ['taller'];
    const v = ['inicio', 'catalogo', 'venta', 'cotizaciones', 'ventas', 'produccion', 'deposito'];
    return r === 'a' ? [...v, 'nomina', 'admin', 'taller'] : v;
  }
  window.Ayuda = { abrir, manualCompleto, manualesDe, leerRol, MODULOS, esc };
})();
