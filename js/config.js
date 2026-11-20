/* ============================================================
   CONFIGURACIÓN — Diagnóstico Confío Pagos
   Archivo: js/config.js — se carga ANTES que js/app.js.
   Todo lo editable está aquí: conexión al CRM, agenda, preguntas,
   la fórmula del diagnóstico y sus textos. En los textos, **así** se
   pone en negrilla. Las rutas de imágenes son relativas a index.html.
   ============================================================ */

/* ---- Conexión y enlaces ---- */
const AJUSTES = {
  // Webhook del CRM que entrega TI. Mientras esté vacío, la app funciona
  // igual pero no envía nada (en la consola del navegador se ve el JSON
  // que se habría enviado, para revisarlo).
  webhookUrl: '',

  // Enlace para agendar con el comercial (se abre en otra pestaña).
  agendaUrl: 'https://link.dropi.co/widget/bookings/hablemos-de-confo-30-minutos',

  // Política de tratamiento de datos. Si queda vacío, el texto de
  // autorización se muestra sin enlace.
  politicaDatosUrl: '',

  // Identificador que viaja al CRM para saber de dónde vino el contacto.
  fuente: 'diagnostico-confio-pagos',

  moneda: 'COP',
};

/* ---- Imágenes ----
   personaje*: ilustraciones del personaje de Confío. Mientras estén en
   null no se muestran; cuando lleguen los PNG, se ponen aquí. */
const IMG = {
  logo: 'media/Logo_Confio_Pagos.png',
  isotipo: 'media/Isotipo_Confio.png',
  personajeDatos: null,
  personajeInicio: null,
  personajeAnalizando: null,
  personajeResultado: null,
};

/* ---- Textos generales ---- */
const TEXTOS = {
  datosTitulo: 'Antes de empezar, queremos conocerte',
  autorizacion: 'Autorizo el tratamiento de mis datos personales para recibir el diagnóstico y ser contactado por un asesor.',
  inicioTexto: 'Vamos a hacerle un chequeo a tu negocio. Responde estas preguntas y al final te damos tu diagnóstico: **cuánto te está costando el contraentrega**, lo que ya tienes bajo control y dónde se te está escapando la plata en devoluciones, rechazos y pedidos que no se pagan.',
  inicioNota: 'Te toma menos de 3 minutos.',
  analizando: 'Calculando cuánto te cuesta el contraentrega…',
  solucionTitulo: 'Así te ayuda Confío Pagos',
  solucionTexto: 'Tu cliente paga por adelantado con PSE o tarjeta y su dinero **queda guardado seguro en Confío Pagos** hasta que recibe su pedido. Si no le llega, le devolvemos su dinero. Más confianza para pagar antes, menos pedidos contraentrega que se devuelven.',
  ctaTitulo: '¿Hablamos de tu caso?',
  ctaTexto: 'Agenda 30 minutos con un asesor de Confío Pagos y revisa cómo bajar este costo en tu operación.',
  ctaBoton: 'Agendar asesoría',
};

/* ---- Preguntas ----
   tipo:
   - 'numero'   campo numérico. formato: 'pesos' o 'cantidad'. valorInicial
                es el valor por defecto que la persona puede cambiar.
   - 'unica'    una sola opción; al tocarla avanza sola.
   - 'multiple' varias opciones. exclusiva: true deselecciona las demás
                (p. ej. "Ninguna"). conTexto: true pide escribir cuál.
   Cada opción tiene un id (lo que viaja al CRM) y un texto (lo que se ve).
   valor: número que usa la fórmula (proporción, 0.9 = 90%). */
const PREGUNTAS = [
  { id: 'pedidos_mes', tipo: 'numero', formato: 'cantidad', minimo: 1,
    texto: '¿Cuántos pedidos despachas al mes?',
    ayuda: 'Promedio de los últimos 3 meses.', sufijo: 'pedidos' },

  { id: 'contraentrega', tipo: 'unica',
    texto: 'De cada 10 pedidos, ¿cuántos cobras contraentrega?',
    opciones: [
      { id: '9_de_10',   texto: '9 de 10',        valor: 0.9 },
      { id: '5_a_8',     texto: 'Entre 5 y 8',    valor: 0.65 },
      { id: '4_o_menos', texto: '4 o menos',      valor: 0.3 },
    ] },

  { id: 'devoluciones', tipo: 'unica',
    texto: 'De cada 100 pedidos contraentrega, ¿cuántos te devuelven o rechazan?',
    opciones: [
      { id: 'no_se',     texto: 'No lo sé',        valor: 0.2, noSabe: true },
      { id: 'mas_25',    texto: 'Más de 25',       valor: 0.3 },
      { id: '15_a_25',   texto: 'Entre 15 y 25',   valor: 0.2 },
      { id: 'menos_15',  texto: 'Menos de 15',     valor: 0.1 },
    ] },

  { id: 'flete_devolucion', tipo: 'numero', formato: 'pesos', minimo: 0, valorInicial: 18000,
    texto: '¿Cuánto pagas de flete por un pedido devuelto?',
    ayuda: 'Dejamos un valor de referencia. Cámbialo por el tuyo si lo conoces.' },

  { id: 'publicidad_devolucion', tipo: 'numero', formato: 'pesos', minimo: 0, valorInicial: 12000,
    texto: '¿Cuánto te cuesta en publicidad conseguir un pedido que luego se devuelve?',
    ayuda: 'Si no pautas, escribe 0.' },

  { id: 'confirmacion', tipo: 'unica',
    texto: '¿Confirmas los pedidos antes de despacharlos?',
    opciones: [
      { id: 'no',     texto: 'No, despacho todo lo que entra' },
      { id: 'manual', texto: 'Sí, de forma manual' },
      { id: 'bots',   texto: 'Sí, lo hago con bots' },
    ] },

  { id: 'plataformas', tipo: 'multiple',
    texto: '¿Con qué plataformas vendes hoy?',
    ayuda: 'Puedes elegir varias.',
    opciones: [
      { id: 'whatsapp_redes', texto: 'Solo WhatsApp o redes sociales' },
      { id: 'wordpress',      texto: 'WordPress' },
      { id: 'chatea_pro',     texto: 'Chatea Pro' },
      { id: 'shopify',        texto: 'Shopify' },
      { id: 'lucidbot',       texto: 'LucidBot' },
      { id: 'tienda_fisica',  texto: 'Tienda física' },
      { id: 'marketplace',    texto: 'Marketplace (Mercado Libre, Falabella)' },
      { id: 'dropi',          texto: 'Dropi' },
      { id: 'otra',           texto: 'Otra plataforma', conTexto: true },
    ] },

  { id: 'tiempo_vendiendo', tipo: 'unica',
    texto: '¿Cuánto llevas vendiendo online?',
    opciones: [
      { id: 'menos_6m', texto: 'Menos de 6 meses' },
      { id: '6_12m',    texto: '6 a 12 meses' },
      { id: '1_2a',     texto: '1 a 2 años' },
      { id: 'mas_2a',   texto: 'Más de 2 años' },
    ] },

  { id: 'confianza', tipo: 'unica',
    texto: '¿Qué le muestras a tu cliente para que confíe en ti?',
    opciones: [
      { id: 'nada',    texto: 'Nada en particular' },
      { id: 'senales', texto: 'Redes activas, algunas reseñas y garantía escrita' },
    ] },

  { id: 'beneficio_prepago', tipo: 'multiple',
    texto: '¿Le das algún beneficio al cliente que paga antes?',
    ayuda: 'Puedes elegir varias.',
    opciones: [
      { id: 'envio_gratis', texto: 'Envío gratis' },
      { id: 'descuento',    texto: 'Descuento' },
      { id: 'regalo',       texto: 'Regalo' },
      { id: 'ninguno',      texto: 'No doy ningún beneficio', exclusiva: true },
    ] },

  { id: 'pasarelas', tipo: 'multiple',
    texto: '¿Qué pasarela de pago usas hoy?',
    ayuda: 'Puedes elegir varias.',
    opciones: [
      { id: 'ninguna',      texto: 'Ninguna', exclusiva: true },
      { id: 'wompi',        texto: 'Wompi' },
      { id: 'mercado_pago', texto: 'Mercado Pago' },
      { id: 'bold',         texto: 'Bold' },
      { id: 'epayco',       texto: 'ePayco' },
      { id: 'payu',         texto: 'PayU' },
      { id: 'otra',         texto: 'Otra', conTexto: true },
    ] },
];

/* ---- Diagnóstico ----
   Pérdida mensual = pedidos al mes × % contraentrega × % devolución
                     × (flete del devuelto + publicidad del devuelto)
   Los porcentajes salen del "valor" de cada opción de arriba.

   Cada regla mira una respuesta y la manda a "bajo control" o a
   "dónde se te escapa la plata". {lista} se reemplaza por las opciones
   elegidas. Las preguntas sin regla (plataformas, tiempo vendiendo)
   solo viajan al CRM. */
const REGLAS = {
  contraentrega: {
    '9_de_10':   { tipo: 'fuga',    texto: 'Casi todas tus ventas son contraentrega: **cada pedido que despachas es plata en riesgo**.' },
    '5_a_8':     { tipo: 'fuga',    texto: 'Más de la mitad de tus ventas siguen siendo contraentrega.' },
    '4_o_menos': { tipo: 'control', texto: 'La mayoría de tus clientes ya paga antes de recibir.' },
  },
  devoluciones: {
    no_se:    { tipo: 'fuga',    texto: 'No sabes cuántos pedidos te devuelven: **lo que no se mide no se puede bajar**.' },
    mas_25:   { tipo: 'fuga',    texto: 'Más de 25 de cada 100 pedidos contraentrega se te devuelven.' },
    '15_a_25':{ tipo: 'fuga',    texto: 'Entre 15 y 25 de cada 100 pedidos contraentrega se te devuelven.' },
    menos_15: { tipo: 'control', texto: 'Tus devoluciones están por debajo del 15%.' },
  },
  confirmacion: {
    no:     { tipo: 'fuga',    texto: 'Despachas sin confirmar: **pagas flete por pedidos que nadie iba a recibir**.' },
    manual: { tipo: 'control', texto: 'Confirmas tus pedidos antes de despacharlos.' },
    bots:   { tipo: 'control', texto: 'Confirmas tus pedidos de forma automática.' },
  },
  confianza: {
    nada:    { tipo: 'fuga',    texto: 'Tu cliente no ve señales para confiar en ti, y **sin confianza nadie paga por adelantado**.' },
    senales: { tipo: 'control', texto: 'Muestras señales de confianza: redes activas, reseñas y garantía.' },
  },
  beneficio_prepago: {
    ninguno:  { tipo: 'fuga',    texto: 'No le das a tu cliente **una razón para pagar antes**.' },
    _otras:   { tipo: 'control', texto: 'Premias al cliente que paga antes: {lista}.', minusculas: true },
  },
  pasarelas: {
    ninguna: { tipo: 'fuga',    texto: 'No tienes pasarela de pago: **a tu cliente solo le queda pagar contraentrega**.' },
    _otras:  { tipo: 'control', texto: 'Ya cobras en línea con {lista}.' },
  },
};

// Nota que aparece cuando la persona no conoce su tasa de devolución.
const NOTA_NO_SABE = 'Como no conoces tu tasa de devolución, usamos un **20% de referencia**.';
