const { chromium, devices } = require('playwright');
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const now=Math.floor(Date.now()/1000);
const H='http://127.0.0.1:8767/';const OUT=__dirname+'/';
const fs=require('fs');const P1='data:image/jpeg;base64,'+fs.readFileSync(OUT+'p1.jpg').toString('base64');const P2='data:image/jpeg;base64,'+fs.readFileSync(OUT+'p2.jpg').toString('base64');
const res=[];let fallas=0;const ok=(n,c,x)=>{res.push((c?'OK   ':'FALLA')+' '+n+(x!==undefined?'  → '+JSON.stringify(x):''));if(!c)fallas++;};
let modelos=[
 {id:1,nombre:'Multilock Rayas',tipo:'Puerta Multilock',fotos:{Blanco:P1},precio_base:420,badge:'Más vendido',especificaciones_base:{alto:2,ancho:1,vidrio_o_farquilla:'Vidrio',color_vidrio:'Azul',manillon:false,marco_decorativo:false,proteccion:false,vitral:false},caracteristicas:['Cerradura multipunto'],descripcion_publica:'Puerta de seguridad.'},
 {id:2,nombre:'Imperial con marco',tipo:'Puerta Multilock',fotos:{Blanco:P2},precio_base:1900,especificaciones_base:{alto:2.4,ancho:2,vidrio_o_farquilla:'Vidrio',color_vidrio:'Negro',manillon:false,marco_decorativo:true,vitral:true},caracteristicas:[]},
 {id:3,nombre:'Ventana clásica',tipo:'Ventana',fotos:{},precio_base:150,especificaciones_base:{alto:1,ancho:1,papel_ahumado:true,color_ahumado:'Espejo',proteccion:true}}
];
let piezas=[{id:11,catalogo_id:1,color:'Blanco',precio:480,cantidad:2,sede_id:1,estado:'disponible',foto:null,especificaciones:{alto:2,ancho:1,vidrio_o_farquilla:'Vidrio',color_vidrio:'Azul',manillon:false,sentido:'Derecha',posicion:'Afuera',bloque:'15'}}];
const sedes=[{id:1,nombre:'Taller El Omnipotente',orden:1,activa:true,mapa_url:'https://maps.app.goo.gl/fcwNQRbUE5FQgKDe6'}];
const st={writes:[],err:[],pins:[]};
async function ctx(b){
  const jwt=b64({alg:'HS256',typ:'JWT'})+'.'+b64({sub:'u1',exp:now+3600,role:'authenticated',aud:'authenticated'})+'.sig';
  const user={id:'u1',aud:'authenticated',role:'authenticated',email:'taller@omnipotente.app',user_metadata:{}};
  const sesion={access_token:jwt,token_type:'bearer',expires_in:3600,expires_at:now+3600,refresh_token:'r1',user};
  const c=await b.newContext({...devices['iPhone 13'],permissions:['clipboard-read','clipboard-write']});
  await c.route('**/*.supabase.co/**',async r=>{const req=r.request();const u=decodeURIComponent(req.url());const m=req.method();
    const j=(x,s=200)=>r.fulfill({status:s,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*','access-control-expose-headers':'content-range','content-range':'0-1/1'},body:JSON.stringify(x)});
    if(m==='OPTIONS')return j({});
    if(!u.includes('jawqbrzarexwpgggnlxc'))return j({message:'otro proyecto'},500);
    if(u.includes('/auth/v1/token')){const a=JSON.parse(req.postData()||'{}');if(a.password){st.pins.push(a.password);if(a.password!=='551472'||a.email!=='taller@omnipotente.app')return j({error:'invalid_grant',error_description:'Invalid login credentials'},400);}return j(sesion);}
    if(u.includes('/auth/v1/user'))return j(user);
    if(u.includes('/storage/v1/object')){st.writes.push(['foto',u.split('/object/')[1]]);return j({Key:'x'});}
    if(u.includes('/rpc/'))return j([]);
    if(u.includes('/rest/v1/catalogo')){
      if(m==='POST'){const a=JSON.parse(req.postData());st.writes.push(['catalogo+',a]);const n={...a,id:50};modelos.unshift(n);return j(n,201);}
      if(m==='PATCH'){st.writes.push(['catalogo~',JSON.parse(req.postData())]);return j(modelos[0]);}
      if(m==='DELETE'){st.writes.push(['catalogo-',u]);return j(null,204);}
      return j(modelos);}
    if(u.includes('/rest/v1/disponibles')){
      if(m==='POST'){const a=JSON.parse(req.postData());st.writes.push(['pieza+',a]);const n={...a,id:60};return j(n,201);}
      if(m==='PATCH'){const a=JSON.parse(req.postData());st.writes.push(['pieza~',a]);return j({...piezas[0],...a});}
      return j(piezas);}
    if(u.includes('/rest/v1/sedes'))return j(sedes);
    if(u.includes('/rest/v1/perfiles'))return j({id:'u1',usuario:'taller',nombre:'Indumetálicas',rol:'admin',activo:true});
    return j([]);});
  const p=await c.newPage();p.on('pageerror',e=>st.err.push(e.message));p.on('dialog',d=>d.accept());
  return p;
}
const shot=(p,n)=>p.screenshot({path:OUT+n+'.png'});
(async()=>{const b=await chromium.launch();try{
 // ===== Cliente =====
 let p=await ctx(b);const w=ms=>p.waitForTimeout(ms||500);
 await p.goto(H);await w(1200);await shot(p,'c1-inicio');
 ok('Inicio: entrega inmediata con 2',(await p.textContent('.om-entrega')).includes('2 listas'));
 ok('Inicio: categorías Puertas, Ventanas y Combos (Portón solo si hay), sin madera',(await p.$$('.om-cat')).length===3&&!(await p.content()).includes('Madera'));
 ok('Inicio: botón WhatsApp al número de ella',(await p.getAttribute('#btnPregunta','href')).includes('wa.me/584246050504'));
 ok('Inicio: cómo llegar con el mapa',(await p.getAttribute('#btnLlegar','href'))==='https://maps.app.goo.gl/fcwNQRbUE5FQgKDe6');
 ok('Inicio: aviso de abierto/cerrado',/Abierto|Cerrado/.test(await p.textContent('#omAbierto')));
 await p.click('.om-entrega');await w(800);await shot(p,'c2-entrega');
 await p.click('.om-card');await w(800);
 await p.click('.linea');await w(800);
 const det=await p.textContent('#detalleBody');
 ok('Ficha de la pieza con detalles',det.includes('2 × 1 m')&&det.includes('Azul')&&det.includes('Derecha · Afuera')&&det.includes('Bloque'),det.slice(0,200));
 ok('No dice "Está en" con un solo taller',!det.includes('Está en'));
 const wa=decodeURIComponent(await p.getAttribute('#detalleFoot a.btn-wa','href'));
 ok('Me interesa: WhatsApp con nombre, medidas y precio',wa.includes('584246050504')&&wa.includes('Multilock Rayas')&&wa.includes('$480')&&wa.includes('Indumetálicas'),wa.slice(0,160));
 await p.evaluate(()=>document.getElementById('detalleBody').scrollTop=9999);await w(300);await shot(p,'c3-pieza');
 await p.goto(H+'#ver=Puerta%20Multilock');await w(1000);
 const cards=await p.$$('.om-card');await cards[1].click();await w(800);
 const det2=await p.textContent('#detalleBody');
 ok('Modelo por encargo: Marco decorativo y Vitral en "lo que trae"',det2.includes('Marco decorativo')&&det2.includes('Vitral'),det2.slice(0,200));
 ok('Errores JS (cliente)',!st.err.length,st.err);
 await p.context().close();
 // ===== Ella: entrar =====
 st.err=[];p=await ctx(b);
 await p.goto(H+'catalogo.html');await w(1200);
 ok('Sin sesión: Mi catálogo manda a entrar',p.url().includes('entrar.html'));
 await shot(p,'e1-entrar');
 for(const d of '111111') await p.click(`#teclado [data-t="${d}"]`);await w(800);
 ok('PIN malo: avisa y no entra',(await p.textContent('#msg')).includes('PIN incorrecto')&&p.url().includes('entrar.html'));
 for(const d of '551472') await p.click(`#teclado [data-t="${d}"]`);await w(1800);
 ok('PIN bueno: entra a Mi catálogo',p.url().includes('catalogo.html'));
 await shot(p,'e2-mi-catalogo');
 ok('Arriba: Ver catálogo, Copiar link y Ayuda con su texto',await p.$('#btnVer')&&await p.$('#btnCopiar')&&(await p.textContent('.topbar')).includes('Ver catálogo')&&(await p.textContent('.topbar')).includes('Copiar link')&&(await p.textContent('.topbar')).includes('Ayuda'));
 await p.click('#btnCopiar');await w(400);
 const clip=await p.evaluate(()=>navigator.clipboard.readText()).catch(()=>'');
 ok('Copiar link copia el catálogo público',clip==='http://127.0.0.1:8767/',clip);
 ok('Ver catálogo lleva al público',(await p.getAttribute('#btnVer','href'))==='index.html');
 // Sesión guardada: volver a entrar no pide PIN
 await p.goto(H+'entrar.html');await w(1200);
 ok('Ya con sesión, entrar.html la manda directo',p.url().includes('catalogo.html'));
 // Nuevo modelo
 await p.click('#btnNuevo');await w(600);
 const tipos=await p.$$eval('[data-elegir]',x=>x.map(y=>y.dataset.elegir));
 ok('Tipos: Puerta, Ventana, Portón, Combo (sin madera)',JSON.stringify(tipos)==='["Puerta Multilock","Ventana","Portón","Combo"]',tipos);
 await p.click('[data-elegir="Puerta Multilock"]');await w(700);
 const extras=await p.$$eval('#specs .tchip',x=>x.map(y=>y.textContent.trim()));
 ok('Extras de la puerta: Marco decorativo, Protección, Vitral',JSON.stringify(extras)==='["Marco decorativo","Protección","Vitral"]',extras);
 ok('No pide categoría de pago',!(await p.isVisible('#campoCategoria')));
 await p.fill('#fNombre','Puerta Prueba');await p.fill('#fPrecio','350');
 await p.click('#specs .tchip[data-k="vitral"]');
 await p.click('#specs [data-g="manillon"][data-v="H"]');
 await shot(p,'e3-nuevo');
 await p.click('#btnGuardar');await w(1500);
 const nm=st.writes.find(x=>x[0]==='catalogo+');
 ok('Guarda el modelo con vitral y manillón H',nm&&nm[1].especificaciones_base.vitral===true&&nm[1].especificaciones_base.manillon_tipo==='H'&&nm[1].precio_base===350&&nm[1].tipo==='Puerta Multilock',nm&&nm[1]);
 // Entrega inmediata desde un modelo
 await p.click('[data-cat="Todos"]').catch(()=>{});await w(500);
 const card=await p.$('.card[data-id="3"]');await card.click();await w(800);
 await p.click('[data-accion="marcar"]');await w(800);
 ok('Pieza: no pregunta la sede (un solo taller)',!(await p.isVisible('#campoSede')));
 const campos=await p.$$eval('#specs .field-label',x=>x.map(y=>y.textContent.trim()));
 ok('Pieza de ventana pide aluminio y ahumado',campos.some(c=>/Aluminio/.test(c))&&campos.some(c=>/ahumado/i.test(c)),campos);
 await p.click('#specs [data-g="aluminio"][data-v="Panorámica"]');
 await p.fill('#fPrecio','170');
 await p.click('#btnGuardar');await w(1500);
 const np=st.writes.find(x=>x[0]==='pieza+');
 ok('Guarda la pieza con sede del taller, aluminio y precio',np&&np[1].sede_id===1&&np[1].especificaciones.aluminio==='Panorámica'&&np[1].precio===170&&np[1].catalogo_id===3,np&&np[1]);
 // Ya no está
 await p.goto(H+'catalogo.html');await w(1500);
 await p.click('.card[data-id="1"]');await w(800);
 await p.click('[data-pieza="11"]').catch(()=>{});await w(700);
 await shot(p,'e4-pieza');
 await p.click('[data-accion="quitar-pieza"]');await w(900);
 const qp=st.writes.find(x=>x[0]==='pieza~');
 ok('Ya no está: quita una (quedan 1)',qp&&qp[1].cantidad===1,qp&&qp[1]);
 // Ayuda
 await p.goto(H+'catalogo.html');await w(1500);
 await p.click('.topbar .ayuda-btn');await w(1200);
 ok('Ayuda abre con texto de ella',(await p.textContent('#ayudaBody')).includes('Copiar link'));
 await shot(p,'e5-ayuda');
 ok('Errores JS (ella)',!st.err.length,st.err);
}catch(e){ok('Excepción',false,e.message);}finally{await b.close();console.log(res.join('\n'));console.log(fallas?`\n${fallas} FALLAS`:'\nTODO OK');}})();
