# Diagnóstico Confío Pagos

App web estática (HTML, CSS y JavaScript): no necesita instalar nada ni compilar.

## Estructura
- `index.html`: punto de entrada.
- `css/estilos.css`: estilos con la identidad de Confío Pagos.
- `js/config.js`: **todo lo editable**: webhook del CRM, enlace de agenda, política de datos, preguntas, fórmula del diagnóstico y textos.
- `js/app.js`: lógica de las pantallas (datos, bienvenida, preguntas, cálculo, resultado y envío al CRM).
- `media/`: logo, isotipo y patrón de fondo (sacados del manual de marca).
- `fonts/`: aquí van Nekst, Commuters Sans y Blauer cuando lleguen.

## Pendientes para producción
1. **Webhook**: poner la URL en `AJUSTES.webhookUrl` (`js/config.js`). Mientras esté vacío no se envía nada y el JSON se ve en la consola del navegador.
2. **Fuentes**: copiar los archivos a `fonts/` y declararlos con `@font-face` al inicio de `css/estilos.css` (hay un ejemplo comentado).
3. **Personaje**: poner las rutas de los PNG en `IMG` (`js/config.js`).
4. **Política de datos**: poner el enlace en `AJUSTES.politicaDatosUrl`.

## Envío al CRM
Al terminar el diagnóstico se hace un POST al webhook con el contacto, las respuestas (id y texto) y el resultado.
Se envía como `text/plain` con el JSON en el cuerpo para evitar el bloqueo de CORS del navegador; el webhook debe leer el cuerpo como JSON.

## Probar en local
Abrir `index.html` en el navegador, o con servidor: `npx serve .` / `python3 -m http.server`.
