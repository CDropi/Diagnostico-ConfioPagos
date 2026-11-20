/* ============================================================
   LÓGICA — Diagnóstico Confío Pagos
   Archivo: js/app.js — usa AJUSTES, IMG, TEXTOS, PREGUNTAS, REGLAS y
   NOTA_NO_SABE, que vienen de js/config.js. Para cambiar textos o
   preguntas no hace falta tocar este archivo.
   ============================================================ */
const app = document.getElementById('app');
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Estado de la sesión: vive en memoria y se pierde al recargar.
const estado = {
  contacto: { nombre: '', tienda: '', link_tienda: '', whatsapp: '', correo: '', autoriza_datos: false },
  indice: 0,
  respuestas: {}, // id de pregunta -> número | id de opción | { ids: [], otro: '' }
  enviado: false,
};

/* ---- Utilidades ---- */
function escapar(t) {
  return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// **texto** -> <strong>texto</strong> (solo para textos de la configuración).
function conNegrillas(t) {
  return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
function primerNombre() {
  const p = estado.contacto.nombre.trim().split(/\s+/)[0] || '';
  return p.charAt(0).toLocaleUpperCase('es') + p.slice(1);
}
const formatoPesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: AJUSTES.moneda, maximumFractionDigits: 0 });
const formatoNumero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
// Sin espacio entre el símbolo y la cifra: $4.050.000
function pesos(n) { return formatoPesos.format(Math.round(n)).replace(/\s/g, ''); }
function soloDigitos(t) { return String(t).replace(/\D/g, ''); }
function imagen(src, clase) { return src ? `<img class="${clase}" src="${src}" alt="">` : ''; }

function mostrar(html) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
  const p = app.querySelector('.pantalla');
  if (p) p.scrollTop = 0;
}

/* ============ Pantalla 1: datos de contacto ============ */
function pantallaDatos() {
  const c = estado.contacto;
  const politica = AJUSTES.politicaDatosUrl
    ? ` <a href="${AJUSTES.politicaDatosUrl}" target="_blank" rel="noopener">Ver política de datos</a>.`
    : '';
  mostrar(`
    <section class="pantalla pantalla--datos">
      <div class="grupo-centrado">
        <img class="logo-grande" src="${IMG.logo}" alt="Confío Pagos">
        ${imagen(IMG.personajeDatos, 'personaje personaje--datos')}
        <h1 class="titulo titulo--datos">${escapar(TEXTOS.datosTitulo)}</h1>
        <form class="tarjeta formulario" novalidate>
          ${campo('nombre', 'Tu nombre', 'text', c.nombre, 'given-name', 'Ej. Laura Gómez')}
          ${campo('tienda', 'Tu tienda', 'text', c.tienda, 'organization', 'Nombre de tu tienda')}
          ${campo('link_tienda', 'Link de tu tienda', 'url', c.link_tienda, 'url', 'tutienda.com (opcional)')}
          ${campo('whatsapp', 'WhatsApp', 'tel', c.whatsapp, 'tel', '300 123 4567')}
          ${campo('correo', 'Correo', 'email', c.correo, 'email', 'tu@correo.com')}
          <label class="autoriza">
            <input type="checkbox" id="autoriza_datos" ${c.autoriza_datos ? 'checked' : ''}>
            <span>${escapar(TEXTOS.autorizacion)}${politica}</span>
          </label>
          <p class="error" id="error-autoriza" role="alert"></p>
          <button class="btn btn--principal" type="submit">Continuar</button>
        </form>
      </div>
    </section>`);

  const form = app.querySelector('form');
  form.addEventListener('input', e => {
    const err = app.querySelector(`#error-${e.target.id}`);
    if (err) err.textContent = '';
    e.target.removeAttribute('aria-invalid');
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = id => app.querySelector('#' + id).value.trim();
    const datos = {
      nombre: v('nombre'), tienda: v('tienda'), link_tienda: v('link_tienda'),
      whatsapp: v('whatsapp'), correo: v('correo'),
      autoriza_datos: app.querySelector('#autoriza_datos').checked,
    };
    const errores = {};
    if (!datos.nombre) errores.nombre = 'Escribe tu nombre.';
    if (!datos.tienda) errores.tienda = 'Escribe el nombre de tu tienda.';
    const tel = soloDigitos(datos.whatsapp);
    if (tel.length < 10 || tel.length > 13) errores.whatsapp = 'Escribe un número de WhatsApp válido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correo)) errores.correo = 'Escribe un correo válido.';
    if (!datos.autoriza_datos) errores.autoriza = 'Necesitamos tu autorización para continuar.';

    Object.entries(errores).forEach(([id, msg]) => {
      app.querySelector(`#error-${id}`).textContent = msg;
      const inp = app.querySelector('#' + (id === 'autoriza' ? 'autoriza_datos' : id));
      if (inp && id !== 'autoriza') inp.setAttribute('aria-invalid', 'true');
    });
    if (Object.keys(errores).length) {
      const primero = Object.keys(errores)[0];
      app.querySelector('#' + (primero === 'autoriza' ? 'autoriza_datos' : primero)).focus();
      return;
    }
    estado.contacto = datos;
    pantallaInicio();
  });
}

function campo(id, etiqueta, tipo, valor, autocompletar, ejemplo) {
  return `
    <div class="campo">
      <label for="${id}">${etiqueta}</label>
      <input id="${id}" name="${id}" type="${tipo}" value="${escapar(valor)}" autocomplete="${autocompletar}"
        placeholder="${escapar(ejemplo)}" ${tipo === 'tel' ? 'inputmode="tel"' : ''} maxlength="120">
      <p class="error" id="error-${id}" role="alert"></p>
    </div>`;
}

/* ============ Pantalla 2: bienvenida ============ */
function pantallaInicio() {
  mostrar(`
    <section class="pantalla pantalla--inicio">
      <div class="barra">
        <img class="logo-barra" src="${IMG.logo}" alt="Confío Pagos">
        <button class="btn-circulo" type="button" id="atras" aria-label="Volver a tus datos">${flecha()}</button>
      </div>
      <h1 class="titulo titulo--saludo">Hola, <span class="verde">${escapar(primerNombre())}</span></h1>
      <p class="inicio-texto">${conNegrillas(TEXTOS.inicioTexto)}</p>
      <div class="inicio-escena">
        ${IMG.personajeInicio ? imagen(IMG.personajeInicio, 'personaje personaje--inicio') : `<img class="isotipo-grande" src="${IMG.isotipo}" alt="">`}
      </div>
      <p class="nota">${escapar(TEXTOS.inicioNota)}</p>
      <button class="btn btn--principal" type="button" id="comenzar">Comenzar diagnóstico</button>
    </section>`);
  app.querySelector('#atras').addEventListener('click', pantallaDatos);
  app.querySelector('#comenzar').addEventListener('click', () => { estado.indice = 0; pantallaPregunta(); });
}

function flecha() {
  return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/* ============ Pantalla 3: preguntas ============ */
let avanzando = false;

function pantallaPregunta() {
  const total = PREGUNTAS.length;
  const i = estado.indice;
  const p = PREGUNTAS[i];
  const avance = (i / total) * 100;

  let cuerpo = '';
  if (p.tipo === 'numero') cuerpo = cuerpoNumero(p);
  if (p.tipo === 'unica') cuerpo = cuerpoUnica(p);
  if (p.tipo === 'multiple') cuerpo = cuerpoMultiple(p);

  mostrar(`
    <section class="pantalla pantalla--pregunta">
      <div class="barra">
        <img class="logo-barra" src="${IMG.logo}" alt="Confío Pagos">
        <button class="btn-circulo" type="button" id="atras" aria-label="${i === 0 ? 'Volver al inicio' : 'Volver a la pregunta anterior'}">${flecha()}</button>
      </div>
      <p class="contador">Pregunta ${i + 1} de ${total}</p>
      <div class="progreso" role="progressbar" aria-label="Avance del diagnóstico" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${i}">
        <div class="progreso-barra" id="barra" style="width:${avance}%"></div>
      </div>
      <div class="tarjeta tarjeta--pregunta anima-entrada">
        <h1 class="pregunta-texto">${escapar(p.texto)}</h1>
        ${p.ayuda ? `<p class="pregunta-ayuda">${escapar(p.ayuda)}</p>` : ''}
        ${cuerpo}
      </div>
    </section>`);

  avanzando = false;
  app.querySelector('#atras').addEventListener('click', () => {
    if (avanzando) return;
    if (i === 0) pantallaInicio();
    else { estado.indice = i - 1; pantallaPregunta(); }
  });
  if (p.tipo === 'numero') activarNumero(p);
  if (p.tipo === 'unica') activarUnica(p);
  if (p.tipo === 'multiple') activarMultiple(p);
}

function siguiente() {
  const total = PREGUNTAS.length;
  app.querySelector('#barra').style.width = `${((estado.indice + 1) / total) * 100}%`;
  setTimeout(() => {
    if (estado.indice + 1 < total) { estado.indice++; pantallaPregunta(); }
    else pantallaAnalizando();
  }, reducirMovimiento ? 120 : 320);
}

/* -- Número -- */
function cuerpoNumero(p) {
  const guardado = estado.respuestas[p.id];
  const valor = guardado != null ? guardado : (p.valorInicial != null ? p.valorInicial : '');
  const texto = valor === '' ? '' : formatoNumero.format(valor);
  return `
    <div class="numero ${p.formato === 'pesos' ? 'numero--pesos' : ''}">
      ${p.formato === 'pesos' ? '<span class="numero-prefijo" aria-hidden="true">$</span>' : ''}
      <input id="valor" type="text" inputmode="numeric" autocomplete="off" value="${texto}"
        aria-label="${escapar(p.texto)}" placeholder="0">
      ${p.sufijo ? `<span class="numero-sufijo">${escapar(p.sufijo)}</span>` : ''}
    </div>
    <p class="error" id="error-valor" role="alert"></p>
    <button class="btn btn--principal btn--bloque" type="button" id="continuar">Continuar</button>`;
}
function activarNumero(p) {
  const input = app.querySelector('#valor');
  const error = app.querySelector('#error-valor');
  // Separador de miles mientras se escribe.
  input.addEventListener('input', () => {
    const d = soloDigitos(input.value).slice(0, 12);
    input.value = d ? formatoNumero.format(Number(d)) : '';
    error.textContent = '';
  });
  const enviar = () => {
    if (avanzando) return;
    const d = soloDigitos(input.value);
    if (d === '') { error.textContent = 'Escribe un número para continuar.'; input.focus(); return; }
    const n = Number(d);
    if (p.minimo != null && n < p.minimo) { error.textContent = `El valor debe ser mayor o igual a ${p.minimo}.`; input.focus(); return; }
    avanzando = true;
    estado.respuestas[p.id] = n;
    siguiente();
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') enviar(); });
  app.querySelector('#continuar').addEventListener('click', enviar);
  if (!('ontouchstart' in window)) input.focus();
}

/* -- Única -- */
function cuerpoUnica(p) {
  const actual = estado.respuestas[p.id];
  return `<div class="opciones">${p.opciones.map(o => `
    <button class="opcion" type="button" data-id="${o.id}" aria-pressed="${actual === o.id}">
      <span class="opcion-marca" aria-hidden="true"></span><span>${escapar(o.texto)}</span>
    </button>`).join('')}</div>`;
}
function activarUnica(p) {
  app.querySelectorAll('.opcion').forEach(btn => btn.addEventListener('click', () => {
    if (avanzando) return;
    avanzando = true;
    estado.respuestas[p.id] = btn.dataset.id;
    app.querySelectorAll('.opcion').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    siguiente();
  }));
}

/* -- Múltiple -- */
function cuerpoMultiple(p) {
  const actual = estado.respuestas[p.id] || { ids: [], otro: '' };
  const conTexto = p.opciones.find(o => o.conTexto);
  return `
    <div class="opciones">${p.opciones.map(o => `
      <button class="opcion opcion--multiple" type="button" data-id="${o.id}" aria-pressed="${actual.ids.includes(o.id)}">
        <span class="opcion-marca" aria-hidden="true"></span><span>${escapar(o.texto)}</span>
      </button>`).join('')}</div>
    ${conTexto ? `<div class="campo campo--otro" id="caja-otro" ${actual.ids.includes(conTexto.id) ? '' : 'hidden'}>
      <label for="otro">¿Cuál?</label>
      <input id="otro" type="text" maxlength="80" value="${escapar(actual.otro || '')}" placeholder="Escríbela aquí">
    </div>` : ''}
    <p class="error" id="error-multiple" role="alert"></p>
    <button class="btn btn--principal btn--bloque" type="button" id="continuar">Continuar</button>`;
}
function activarMultiple(p) {
  const seleccion = new Set((estado.respuestas[p.id] || { ids: [] }).ids);
  const conTexto = p.opciones.find(o => o.conTexto);
  const caja = app.querySelector('#caja-otro');
  const pintar = () => {
    app.querySelectorAll('.opcion').forEach(b => b.setAttribute('aria-pressed', String(seleccion.has(b.dataset.id))));
    if (caja) caja.hidden = !seleccion.has(conTexto.id);
    app.querySelector('#error-multiple').textContent = '';
  };
  app.querySelectorAll('.opcion').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    const op = p.opciones.find(o => o.id === id);
    if (seleccion.has(id)) seleccion.delete(id);
    else {
      // Una opción exclusiva ("Ninguna") quita las demás, y viceversa.
      if (op.exclusiva) seleccion.clear();
      else p.opciones.filter(o => o.exclusiva).forEach(o => seleccion.delete(o.id));
      seleccion.add(id);
    }
    pintar();
    if (caja && !caja.hidden && seleccion.has(conTexto.id) && id === conTexto.id) app.querySelector('#otro').focus();
  }));
  app.querySelector('#continuar').addEventListener('click', () => {
    if (avanzando) return;
    if (!seleccion.size) { app.querySelector('#error-multiple').textContent = 'Elige al menos una opción.'; return; }
    const otro = caja && !caja.hidden ? app.querySelector('#otro').value.trim() : '';
    avanzando = true;
    estado.respuestas[p.id] = { ids: p.opciones.filter(o => seleccion.has(o.id)).map(o => o.id), otro };
    siguiente();
  });
}

/* ============ Pantalla 4: analizando ============ */
function pantallaAnalizando() {
  mostrar(`
    <section class="pantalla pantalla--analizando">
      ${IMG.personajeAnalizando ? imagen(IMG.personajeAnalizando, 'personaje personaje--analizando') : `<img class="isotipo-gira" src="${IMG.isotipo}" alt="">`}
      <p class="analizando-texto">${escapar(TEXTOS.analizando)}</p>
      <div class="analizando-barra" aria-hidden="true"><span></span></div>
    </section>`);
  const resultado = calcular();
  enviarAlCrm(resultado);
  setTimeout(() => pantallaResultado(resultado), reducirMovimiento ? 500 : 2000);
}

/* ============ Cálculo ============ */
function opcion(idPregunta) {
  const p = PREGUNTAS.find(q => q.id === idPregunta);
  return p.opciones.find(o => o.id === estado.respuestas[idPregunta]);
}
function textosDe(idPregunta) {
  const p = PREGUNTAS.find(q => q.id === idPregunta);
  const r = estado.respuestas[idPregunta];
  return r.ids.map(id => {
    const o = p.opciones.find(x => x.id === id);
    return o.conTexto && r.otro ? r.otro : o.texto;
  });
}
function unirLista(items) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
}

function calcular() {
  const r = estado.respuestas;
  const pctContra = opcion('contraentrega').valor;
  const opDev = opcion('devoluciones');
  const pctDev = opDev.valor;
  const pedidosContra = r.pedidos_mes * pctContra;
  const devueltos = pedidosContra * pctDev;
  const costoUnitario = r.flete_devolucion + r.publicidad_devolucion;
  const perdidaMes = devueltos * costoUnitario;

  const control = [];
  const fugas = [];
  Object.entries(REGLAS).forEach(([idPregunta, reglas]) => {
    const resp = r[idPregunta];
    if (resp == null) return;
    let regla, lista = '';
    if (typeof resp === 'string') regla = reglas[resp];
    else {
      const exclusiva = resp.ids.find(id => reglas[id]);
      if (exclusiva) regla = reglas[exclusiva];
      else {
        regla = reglas._otras;
        const textos = textosDe(idPregunta);
        lista = unirLista(regla && regla.minusculas ? textos.map(t => t.toLocaleLowerCase('es')) : textos);
      }
    }
    if (!regla) return;
    const texto = regla.texto.replace('{lista}', escapar(lista));
    (regla.tipo === 'control' ? control : fugas).push(texto);
  });

  return {
    pedidos_mes: r.pedidos_mes,
    porcentaje_contraentrega: pctContra,
    porcentaje_devolucion: pctDev,
    devolucion_estimada: !!opDev.noSabe,
    pedidos_contraentrega_mes: Math.round(pedidosContra),
    devoluciones_mes: Math.round(devueltos),
    costo_por_devolucion: costoUnitario,
    perdida_mensual: Math.round(perdidaMes),
    perdida_anual: Math.round(perdidaMes * 12),
    bajo_control: control,
    fugas,
  };
}

/* ============ Envío al CRM ============ */
function textoPlano(t) { return t.replace(/\*\*/g, ''); }

function enviarAlCrm(resultado) {
  if (estado.enviado) return;
  // Respuestas legibles: id de la opción y su texto, para que el CRM no
  // dependa de esta configuración.
  const respuestas = {};
  PREGUNTAS.forEach(p => {
    const r = estado.respuestas[p.id];
    if (p.tipo === 'numero') respuestas[p.id] = r;
    else if (p.tipo === 'unica') respuestas[p.id] = { id: r, texto: opcion(p.id).texto };
    else respuestas[p.id] = { ids: r.ids, textos: textosDe(p.id) };
  });
  const datos = {
    fuente: AJUSTES.fuente,
    fecha: new Date().toISOString(),
    contacto: estado.contacto,
    respuestas,
    resultado: { ...resultado, bajo_control: resultado.bajo_control.map(textoPlano), fugas: resultado.fugas.map(textoPlano) },
  };
  estado.enviado = true;
  if (!AJUSTES.webhookUrl) {
    console.info('[Diagnóstico Confío] Sin webhook configurado. Datos que se enviarían:', datos);
    return;
  }
  // text/plain evita la verificación previa de CORS del navegador; el
  // webhook recibe el JSON igual en el cuerpo de la petición.
  fetch(AJUSTES.webhookUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(datos),
    keepalive: true,
  }).catch(err => console.warn('[Diagnóstico Confío] No se pudo enviar al CRM:', err));
}

/* ============ Pantalla 5: resultado ============ */
function pantallaResultado(res) {
  const lista = (items, clase) => `<ul class="lista ${clase}">${items.map(t => `<li>${conNegrillas(t)}</li>`).join('')}</ul>`;
  const porc = n => `${Math.round(n * 100)}%`;

  mostrar(`
    <section class="pantalla pantalla--resultado">
      <div class="barra">
        <img class="logo-barra" src="${IMG.logo}" alt="Confío Pagos">
      </div>

      <div class="resultado-hero anima-entrada">
        <p class="resultado-intro">${escapar(primerNombre())}, el contraentrega te está costando</p>
        <p class="resultado-cifra">${pesos(res.perdida_mensual)}</p>
        <p class="resultado-periodo">al mes</p>
        <p class="resultado-anual">Eso es <strong>${pesos(res.perdida_anual)}</strong> al año en devoluciones y rechazos.</p>
        ${imagen(IMG.personajeResultado, 'personaje personaje--resultado')}
      </div>

      <div class="tarjeta tarjeta--resultado">
        <h2 class="subtitulo">Así lo calculamos</h2>
        <dl class="calculo">
          <div><dt>Pedidos al mes</dt><dd>${formatoNumero.format(res.pedidos_mes)}</dd></div>
          <div><dt>Contraentrega (${porc(res.porcentaje_contraentrega)})</dt><dd>${formatoNumero.format(res.pedidos_contraentrega_mes)}</dd></div>
          <div><dt>Devueltos o rechazados (${porc(res.porcentaje_devolucion)})</dt><dd>${formatoNumero.format(res.devoluciones_mes)}</dd></div>
          <div><dt>Costo por pedido devuelto</dt><dd>${pesos(res.costo_por_devolucion)}</dd></div>
          <div class="calculo-total"><dt>Pérdida mensual</dt><dd>${pesos(res.perdida_mensual)}</dd></div>
        </dl>
        ${res.devolucion_estimada ? `<p class="calculo-nota">${conNegrillas(NOTA_NO_SABE)}</p>` : ''}

        ${res.fugas.length ? `<h2 class="subtitulo subtitulo--fuga">Dónde se te está escapando la plata</h2>${lista(res.fugas, 'lista--fuga')}` : ''}
        ${res.bajo_control.length ? `<h2 class="subtitulo subtitulo--control">Lo que ya tienes bajo control</h2>${lista(res.bajo_control, 'lista--control')}` : ''}

        <div class="solucion">
          <img class="solucion-iso" src="${IMG.isotipo}" alt="">
          <div>
            <h2 class="subtitulo">${escapar(TEXTOS.solucionTitulo)}</h2>
            <p>${conNegrillas(TEXTOS.solucionTexto)}</p>
          </div>
        </div>

        <div class="cta">
          <h2 class="cta-titulo">${escapar(TEXTOS.ctaTitulo)}</h2>
          <p>${escapar(TEXTOS.ctaTexto)}</p>
          <a class="btn btn--principal btn--bloque" href="${AJUSTES.agendaUrl}" target="_blank" rel="noopener">${escapar(TEXTOS.ctaBoton)}</a>
        </div>
      </div>
    </section>`);
}

pantallaDatos();
